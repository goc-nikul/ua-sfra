'use strict';

var Resource = require('dw/web/Resource');
var UUIDUtils = require('dw/util/UUIDUtils');
var Signature = require('dw/crypto/Signature');
var KeyRef = require('dw/crypto/KeyRef');
var StringUtils = require('dw/util/StringUtils');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var Order = require('dw/order/Order');

var checkoutUtils = require('app_ua_core/cartridge/scripts/checkout/checkoutHelpers');

/* eslint-disable no-param-reassign */
/* eslint-disable no-useless-escape */

/**
 * Create a new payment instrument
 * @param {dw.order.LineItemCtnr} basket - Current users's basket
 * @param {string} paymentMethodID - Payment Method ID
 * @param {string} payload - Encrypted payload
 */
function createPaymentInstrument(basket, paymentMethodID, payload) {
    Transaction.wrap(function () {
        var amount = checkoutUtils.calculateNonGiftCertificateAmount(basket);
        var paymentInstrument = basket.createPaymentInstrument(paymentMethodID, amount);
        paymentInstrument.getCustom().payload = payload;
    });
}

/**
 * Update payment transaction with data
 * @param {dw.order.PaymentInstrument} paymentInstrument - Current paymentInstrument
 * @param {string} orderNo - Current order number
 * @param {string} paymentProcessor - Payment Processor ID
 */
function updatePaymentTransaction(paymentInstrument, orderNo, paymentProcessor) {
    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.transactionID = orderNo;
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });
}

/**
 * Endpoint to decryption services
 * @param {string} payload - Payload
 * @returns {Object} decryptResponse - Service response
 */
function getAuthResult(payload) {
    var decryptResponse = null;

    if (payload) {
        try {
            var service = require('int_paymetric/cartridge/scripts/services/PaymetricService').createDecryptService();
            var result = service.call(payload);

            if (result && result.object && result.status === 'OK') {
                decryptResponse = JSON.parse(result.object);
            }
        } catch (e) {
            Logger.error(e);
        }
    }

    return decryptResponse;
}

/**
 * Check internal paymetric token
 * @param {string} token - Paymetric token
 * @returns {boolean} Information about token
 */
function isInternalToken(token) {
    return token.indexOf('INT') === 0;
}

/**
 * Paymetric API call
 * @param {Order} order - Current order
 * @param {Object} authResult - API response JSON
 */
function updatePaymentInfo(order, authResult) {
    var paymentInstrument = order.getPaymentInstruments('Paymetric').iterator().next();
    var payment = authResult.payment;
    var authorization = authResult.authorization;
    var formHandler = require('~/cartridge/scripts/hooks/payment/processor/formhandler');
    var cardTypeForm = {
        cardType: {
            value: payment.cardType
        }
    };
    var cardType = formHandler.getCardType(cardTypeForm);
    Transaction.wrap(function () {
        paymentInstrument.creditCardHolder = payment.nameOnCard;
        paymentInstrument.creditCardType = cardType;
        if (!empty(payment.ccBinRange) && !empty(payment.lastFour)) {
            paymentInstrument.creditCardNumber = payment.ccBinRange + '******' + payment.lastFour;
        }
        paymentInstrument.creditCardExpirationMonth = payment.expiresMonth;
        paymentInstrument.creditCardExpirationYear = payment.expiresYear;
        if (!empty(payment.ccBinRange)) {
            paymentInstrument.custom.creditCardBinRange = payment.ccBinRange;
        }
        // save payment transaction data
        paymentInstrument.paymentTransaction.transactionID = authorization.referenceNumber || '';
        paymentInstrument.paymentTransaction.custom.authCode = authorization.code || '';
        paymentInstrument.paymentTransaction.custom.authMessage = authorization.message || '';
        paymentInstrument.paymentTransaction.custom.avsCode = authorization.avsCode || '';
        paymentInstrument.paymentTransaction.custom.cvvResponseCode = authorization.cvvResponseCode || '';
        paymentInstrument.paymentTransaction.custom.authStatus = authorization.status || '';

        if (isInternalToken(payment.cardToken)) {
            paymentInstrument.custom.internalToken = payment.cardToken;
            order.custom.onHold = true;
        } else {
            paymentInstrument.creditCardToken = payment.cardToken;
            order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
        }
    });
}

/**
 * Provide iframe scripts URL
 * @returns {string} url path to the script
 */
function getPaymentFormURLs() {
    var domain = Site.getCurrent().getCustomPreferenceValue('Paymetric_iframeURL');
    var path = Site.getCurrent().getCustomPreferenceValue('Paymetric_clientPath');
    var fullPath = domain + (path.indexOf('/') === 0 ? path : '/' + path);

    return {
        domain: domain,
        script: path,
        fullPath: fullPath
    };
}

/**
 * Clean 64bit encodes string
 * @param {string} str - String
 * @returns {string} Clean  encoded string
 */
function toBase64Url(str) {
    return str
        .replace(/\=+$/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

/**
 * Encode string
 * @param {string} str - String
 * @returns {string} Encrypted string
 */
function encodeStr(str) {
    return toBase64Url(StringUtils.encodeBase64(str));
}

/**
 * Provide encrypted JWT
 * @param {string} claims - Type marker
 * @returns {string} encrypted JWT
 */
function getJwtToken(claims) {
    const KEY_ALIAS = Site.getCurrent().getCustomPreferenceValue('Paymetric_JWT_Token_Keyalias');

    var header = {
        alg: Resource.msg('paymetric.jwt.token.alg', '_preferences', null)
    };

    var payload = {
        iss: Site.getCurrent().getCustomPreferenceValue('Paymetric_JWT_Token_Issuer'),
        iat: Math.floor(new Date().getTime() / 1000),
        jti: UUIDUtils.createUUID(),
        claims: claims && claims.length ? claims.split() : ['authorization']
    };

    var headerJWT = encodeStr(JSON.stringify(header));
    var claimsetJWT = encodeStr(JSON.stringify(payload));
    var signature = new Signature();
    var keyRef = new KeyRef(KEY_ALIAS);
    var unsignedJWT = [headerJWT, claimsetJWT].join('.');
    var contentToSign = encodeStr(unsignedJWT);
    var signatureJWT = signature.sign(contentToSign, keyRef, 'SHA512withRSA');

    return unsignedJWT + '.' + toBase64Url(signatureJWT);
}

/**
 * Save credit card data to user's wallet
 * @param {Object} authResult - API response
 * @param {Object} paymentInstrument - Current Basket paymentInstrument
 */
function saveCustomerCreditCard(authResult, paymentInstrument) {
    if (customer.registered && customer.authenticated && !empty(customer.profile)) {
        var wallet = customer.profile.getWallet();
        var creditCards = wallet.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD).iterator();
        Transaction.wrap(function () {
            var newCreditCard = wallet.createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD);
            var payment = authResult.payment;

            newCreditCard.creditCardHolder = payment.nameOnCard;
            newCreditCard.creditCardType = payment.cardType;
            newCreditCard.creditCardNumber = (new Array(13)).join('*') + payment.lastFour;
            newCreditCard.creditCardExpirationMonth = payment.expiresMonth;
            newCreditCard.creditCardExpirationYear = payment.expiresYear;
            newCreditCard.custom.defaultPaymentCard = paymentInstrument.custom.defaultPaymentCard;
            if (!empty(payment.ccBinRange)) {
                newCreditCard.custom.creditCardBinRange = payment.ccBinRange;
            }

            if (isInternalToken(payment.cardToken)) {
                newCreditCard.custom.internalToken = payment.cardToken;
            } else {
                newCreditCard.creditCardToken = payment.cardToken;
            }

            while (creditCards.hasNext()) {
                var creditCard = creditCards.next();
                if (creditCard.creditCardNumberLastDigits === newCreditCard.creditCardNumberLastDigits && newCreditCard.creditCardType === newCreditCard.creditCardType) {
                    wallet.removePaymentInstrument(newCreditCard);
                }
                if ((creditCard.creditCardNumberLastDigits === paymentInstrument.creditCardNumberLastDigits && creditCard.creditCardType === paymentInstrument.creditCardType && paymentInstrument.custom.defaultPaymentCard) || (creditCard.custom.defaultPaymentCard && !paymentInstrument.custom.defaultPaymentCard)) {
                    creditCard.custom.defaultPaymentCard = true;
                } else {
                    creditCard.custom.defaultPaymentCard = false;
                }
            }
        });
    }
}

/**
 * Save external token to customer's payment instrument
 * @param {Object} profile - Customer profile
 * @param {string} extToken - External token
 * @param {string} intToken - Internal temporary token
 */
function updateCustomerToken(profile, extToken, intToken) {
    Transaction.wrap(function () {
        var wallet = profile.getWallet();
        var paymentInstruments = wallet.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD).iterator();

        while (paymentInstruments.hasNext()) {
            var paymentInstrument = paymentInstruments.next();
            if (paymentInstrument.custom.internalToken === intToken) {
                paymentInstrument.creditCardToken = extToken;
                paymentInstrument.custom.internalToken = null;
                break;
            }
        }
    });
}

/**
 * Save external token to the order
 * @param {Order} order - Current order
 * @param {string} extToken - External token
 */
function updateOrderToken(order, extToken) {
    var paymentInstrument = order.getPaymentInstruments('Paymetric').iterator().next();

    Transaction.wrap(function () {
        paymentInstrument.creditCardToken = extToken;
        order.custom.onHold = false;
        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
    });
}

/**
 * Call Paymetric API in order to get external token
 * @param {string} intToken - Internal temporary token
 * @returns {string} extToken - External token
 */
function exchangeInternalToken(intToken) {
    var extToken = null;
    var exchangeResponse = null;
    var tokenStatus = Site.getCurrent().getCustomPreferenceValue('ExchangeTokenAPIStatus');

    try {
        if (!intToken) {
            throw new Error('exchangeInternalToken: the "intToken" attribute is required');
        }

        var service = require('int_paymetric/cartridge/scripts/services/PaymetricService').exchangeTokenService();
        var result = service.call(intToken);
        var status = result.status;
        if (result && result.object && result.status === 'OK') {
            exchangeResponse = JSON.parse(result.object);
        } else if (result && tokenStatus && tokenStatus.includes(status)) {
            exchangeResponse = {
                external: result.status
            };
        } else {
            throw new Error('An error occurred while parsing exchangeInternalToken service response');
        }

        if (exchangeResponse.internal !== intToken && tokenStatus && !(tokenStatus.includes(result.status))) {
            throw new Error('Internal Token in service response does not match ');
        }

        extToken = exchangeResponse.external;
    } catch (e) {
        Logger.error('PaymetricHelper.js - exchangeInternalToken: ' + e.message);
        return null;
    }

    return extToken;
}
/**
 * @returns {Object} inactiveCardTypes - Inactive card types JSON if any, Else null
 * Example - {DISC:false}
 */
function getInactiveCardTypes() {
    try {
        var PaymentMgr = require('dw/order/PaymentMgr');
        var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
        // Fetch card type mapping from site preference
        var paymetricCardTypeMapping = PreferencesUtil.getJsonValue('paymetricCardTypeMapping');
        var cardTypeKeys = Object.keys(paymetricCardTypeMapping);
        var inactiveCardTypes = {};
        for (var i = 0; i < cardTypeKeys.length; i++) {
            // Get card type from JSON and check if it is enabled for the current site.
            // Sample site preference JSON
            // {
            //     "MAST" (Card Type - getting from Paymetric) :"MC", (Card Type - configured in SFCC)
            //     "DISC":"DISC"
            // }
            var cardType = PaymentMgr.getPaymentCard(paymetricCardTypeMapping[cardTypeKeys[i]]);
            if (cardType && !cardType.active) {
                // map false value for inactive cards
                // example {DISC:false}
                inactiveCardTypes[cardTypeKeys[i]] = false;
            }
        }
        return JSON.stringify(inactiveCardTypes);
    } catch (e) {
        Logger.error('PaymetricHelper.js - getInactiveCardTypes: ' + e.message);
    }
    return null;
}
module.exports = {
    createPaymentInstrument: createPaymentInstrument,
    updatePaymentTransaction: updatePaymentTransaction,
    getAuthResult: getAuthResult,
    isInternalToken: isInternalToken,
    getPaymentFormURLs: getPaymentFormURLs,
    updatePaymentInfo: updatePaymentInfo,
    getJwtToken: getJwtToken,
    saveCustomerCreditCard: saveCustomerCreditCard,
    exchangeInternalToken: exchangeInternalToken,
    updateOrderToken: updateOrderToken,
    updateCustomerToken: updateCustomerToken,
    getInactiveCardTypes: getInactiveCardTypes
};
