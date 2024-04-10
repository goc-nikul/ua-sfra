'use strict';

var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var server = require('server');
var Site = require('dw/system/Site');
var errorLogger = require('dw/system/Logger').getLogger('OrderFail', 'OrderFail');
var aurusPayHelper = require('*/cartridge/scripts/util/aurusPayHelper');
var Logger = require('dw/system/Logger').getLogger('AurusPayHelper', 'AurusPayHelper');
var LogHelper = require('*/cartridge/scripts/util/loggerHelper');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

// Const Variables
const paymetricCardTokenPrefix = '-E803';

/**
* This function handles the auth call
* @param {Object} params contains shipping, billing, and OTT
* @param {dw.order} order - the current order
* @returns {Object|null} Pre auth object from service call
*/
function aurusPreAuth(params, order) {
    // Custom Scripts for Auth call
    var aurusPaySvc = require('*/cartridge/scripts/services/aurusPayServices');
    var auth = null;
    try {
        var reqBody;

        if (params.ott) {
            reqBody = aurusPayHelper.createCreditAuthReqBody(params);
        } else {
            reqBody = aurusPayHelper.createAuthReqBody(params);
        }

        auth = aurusPaySvc.getAuthService().call(reqBody);

        if (auth.ok) {
            auth = JSON.parse(auth.object.text);
        } else {
            if (auth && auth.errorMessage && order) {
                Transaction.wrap(function () {
                    order.trackOrderChange('Credit Card Authorization Issue: ' + auth.errorMessage);
                });
            }
            auth = null;
        }
    } catch (error) {
        errorLogger.error('aurusPreAuth {0} : {1}', JSON.stringify(error), LogHelper.getLoggingObject());
        Logger.error('ERROR: Error while executing pre auth.', JSON.stringify(error));
        if (order) {
            Transaction.wrap(function () {
                order.addNote('Authorization Issue', JSON.stringify(error).substring(0, 4000));
            });
        }
    }

    return auth;
}

/**
 * Checks if creditCardToken is valid or not
 * @param {string} creditCardToken - the credit card token
 * @returns {boolean} - return true if it's valid paymetric/Aurus token
 */
function isValidCreditCardToken(creditCardToken) {
    var valid = false;
    try {
        if (creditCardToken.startsWith(paymetricCardTokenPrefix) || !isNaN(creditCardToken)) {
            valid = true;
        }
    } catch (e) {
        errorLogger.error('isValidCreditCardToken {0} : {1}', JSON.stringify(e), LogHelper.getLoggingObject());
        Logger.error(JSON.stringify(e));
    }
    return valid;
}

/**
 * Checks the card type information and returns valid card type for payment validation
 * @param {string} paymentCardType - the credit card type coming from the billing form
 * @returns {string} Valid Card Type
 */
function getCardType(paymentCardType) {
    var cardType = '';
    try {
        var paymetricToAurusMapping = {
            VISA: 'VIC',
            MC: 'MCC',
            DISC: 'NVC',
            AMEX: 'AXC'
        };
        cardType = (paymentCardType && paymentCardType in paymetricToAurusMapping) ? paymetricToAurusMapping[paymentCardType] : paymentCardType;
    } catch (e) {
        errorLogger.error('getCardType {0} : {1}', JSON.stringify(e), LogHelper.getLoggingObject());
        Logger.error(JSON.stringify(e));
    }
    return cardType;
}

/**
 * Verifies that entered credit card information is a valid card. If the information is valid a
 * credit card payment instrument is created
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @return {Object} returns an error object
 */
function Handle(basket, paymentInformation) {
    var currentBasket = basket;
    var cardErrors = {};
    var cardNumber = paymentInformation.cardNumber.value;
    var expirationMonth = paymentInformation.expirationMonth.value;
    var expirationYear = paymentInformation.expirationYear.value;
    var serverErrors = [];
    var cardType = paymentInformation.cardType.value;
    var paymentMethodID = paymentInformation.paymentMethodID.value;
    var vipDataHelpers;
    if (Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && Site.getCurrent().getCustomPreferenceValue('enableGiftCardPaymentForVIP')) {
        vipDataHelpers = require('*/cartridge/scripts/vipDataHelpers');
    }
    Transaction.wrap(function () {
        var iterator = currentBasket.getPaymentInstruments().iterator();
        while (iterator.hasNext()) {
            var pi = iterator.next();
            var isVipPartialPointsApplied = false;
            if (vipDataHelpers && pi) {
                isVipPartialPointsApplied = vipDataHelpers.vipPartialPointsApplied(pi);
            }
            if (pi && pi.paymentMethod !== 'GIFT_CARD' && !isVipPartialPointsApplied) {
                currentBasket.removePaymentInstrument(pi);
            }
        }
        var paymentInstrument = currentBasket.createPaymentInstrument(
            paymentMethodID, COHelpers.calculateNonGiftCertificateAmount(currentBasket)
        );

        paymentInstrument.setCreditCardHolder(currentBasket.billingAddress.fullName);
        paymentInstrument.setCreditCardNumber(cardNumber);
        paymentInstrument.setCreditCardType(getCardType(cardType));
        paymentInstrument.setCreditCardExpirationMonth(expirationMonth);
        paymentInstrument.setCreditCardExpirationYear(expirationYear);
        if (paymentInformation.creditCardToken) {
            paymentInstrument.setCreditCardToken(paymentInformation.creditCardToken);
        }
        paymentInstrument.custom.defaultPaymentCard = paymentInformation.defaultCard;
    });

    return { fieldErrors: cardErrors, serverErrors: serverErrors, error: false };
}

/**
 * Function returns error message based on Processor Response Code
 * @param {string} processorResponseCode - Processor Response Code
 * @returns {string} Error Message
 */
function getErrorMessage(processorResponseCode) {
    var errorMessage = Resource.msg('error.handlePayment.msg', 'checkout', null);
    var clientType = request.getHttpHeaders().get('x-uacapi-client-type');
    var prefix = (clientType && (clientType === 'ANDROID' || clientType === 'IOS')) ? 'shopApp.' : '';
    switch (processorResponseCode) {
        // Error Cause : Invalid CC number
        case '131':
        case '213':
        case '506':
            errorMessage = Resource.msg(prefix + 'error.handlePayment.invalidcardnumber', 'checkout', null);
            break;
        // Error Cause : Invalid expiration date
        case '132':
        case '345':
            errorMessage = Resource.msg(prefix + 'error.handlePayment.invalidexpirationdate', 'checkout', null);
            break;
        // Error Cause : Invalid Security code
        case '517':
        case '954':
        case '958':
            errorMessage = Resource.msg(prefix + 'error.handlePayment.invalidsecuritycode', 'checkout', null);
            break;
        // Error Cause : Invalid Billing Address (Bad address)
        case '502':
        case '721':
        case '808':
            errorMessage = Resource.msg(prefix + 'error.handlePayment.invalidbillingaddress', 'checkout', null);
            break;
        // Error Cause : Insufficient funds
        case '116':
            errorMessage = Resource.msg(prefix + 'error.handlePayment.insufficientfunds', 'checkout', null);
            break;
        // Error Cause : Saved Card Expired
        case '101':
        case '509':
        case '510':
        case '511':
            errorMessage = Resource.msg(prefix + 'error.handlePayment.savedexpiredcard', 'checkout', null);
            break;
        // Error Cause : Fraud alert
        case '102':
        case '224':
            errorMessage = Resource.msg(prefix + 'error.handlePayment.fraudalert', 'checkout', null);
            break;
        // Error Cause : Credit cards saved before July 2022 have an old token and aren't able to be processed
        case '001':
            errorMessage = Resource.msg(prefix + 'error.handlePayment.creditcardoldtoken', 'checkout', null);
            break;
        // Error Cause : Aurus is down
        case '909':
        case '944':
            errorMessage = Resource.msg(prefix + 'error.handlePayment.aurusdown', 'checkout', null);
            break;
        default:
            errorMessage = Resource.msg(prefix + 'error.handlePayment.msg', 'checkout', null);
            break;
    }
    return errorMessage;
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom logic to authorize credit card payment.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current payment method
 * @param {string} scope - Ocapi or not
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor, scope) {
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;

    // Models for Auth call
    var BillingAddressModel = require('*/cartridge/models/billingAddress');
    var ShippingAddressModel = require('*/cartridge/models/shippingAddress');
    var EcommInfoModel = require('*/cartridge/models/ecommInfo');
    var TransAmountDetails = require('*/cartridge/models/transactionDetails');
    var Level3Products = require('*/cartridge/models/aurusLevelThreeProduct');

    var order = OrderMgr.getOrder(orderNumber);

    try {
        // Next get Aurus OTT
        var paymentForm = server.forms.getForm('billing');
        var ott = '';
        var CardIdentifier = paymentInstrument.creditCardToken ? paymentInstrument.creditCardToken : '';
        if (CardIdentifier && !isValidCreditCardToken(CardIdentifier)) {
            // Fail Order
            Transaction.wrap(function () {
                order.addNote('Order Failed Reason', 'Not a valid credit card token');
            });

            return ({
                error: true,
                errorMessage: Resource.msg('error.handlePayment.creditcardoldtoken', 'checkout', null)
            });
        }
        var isPaymetricCard = CardIdentifier.startsWith(paymetricCardTokenPrefix);
        var crmToken = isPaymetricCard ? CardIdentifier : '';
        var OneOrderToken = '';
        if (scope && scope === 'OCAPI') {
            var aurusPayOOT = paymentInstrument.paymentTransaction.custom.aurusPayOOT ? JSON.parse(paymentInstrument.paymentTransaction.custom.aurusPayOOT) : {};
            OneOrderToken = 'OneOrderToken' in aurusPayOOT ? aurusPayOOT.OneOrderToken : '';
            if (!CardIdentifier) {
                CardIdentifier = 'CardIdentifier' in aurusPayOOT ? aurusPayOOT.CardIdentifier : '';
            }
        } else {
            ott = { value: paymentForm.creditCardFields.ott.value };
            if (Object.prototype.hasOwnProperty.call(ott, 'value')) {
                ott = ott.value;
            }
        }
        var cardType = paymentForm.creditCardFields.cardType.value;
        var aurusCardType = cardType;

        var terminalID = aurusPayHelper.getTerminalID(order);
        // Test for Custom Aurus site prefs
        if (Site.current.getCustomPreferenceValue('Aurus_storeId') === null && Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier') === null && terminalID === null) {
            return ({
                error: true,
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
        }

        // Prepare request body for auth call
        var aurusShippingAddress = new ShippingAddressModel({ shipping: order.defaultShipment.shippingAddress, email: order.customerEmail, phone: order.defaultShipment.shippingAddress.phone });
        var aurusEcommInfo = new EcommInfoModel(
            {
                storeId: Site.current.getCustomPreferenceValue('Aurus_storeId'),
                oneTimeToken: ott,
                merchantId: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier'),
                terminalId: terminalID,
                cardId: isPaymetricCard ? '' : CardIdentifier,
                oneOrderToken: OneOrderToken
            }
        );

        var aurusBillingAddress = new BillingAddressModel({ billing: order.billingAddress, email: order.customerEmail, phone: order.billingAddress.phone });
        var aurusTransAmountDetails = new TransAmountDetails(order);
        var aurusProducts = new Level3Products(order);
        var aurusInvoiceNumber = order.orderNo;

        // Missing Card Identifier
        if (!ott && !CardIdentifier && !crmToken) {
            // Response code not 0000
            // Fail Order
            errorLogger.error('!ott && !CardIdentifier && !crmToken {0} ', LogHelper.getLoggingObject(order));
            Transaction.wrap(function () {
                order.addNote('Order Failed Reason', 'Missing Card Identifier');
                OrderMgr.failOrder(order, true);
            });

            return ({
                error: true,
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
        }

        // Aurus PreAuth Call
        var authResult = aurusPreAuth({ ShippingAddress: aurusShippingAddress, ECOMMInfo: aurusEcommInfo, cardType: aurusCardType, BillingAddress: aurusBillingAddress, TransAmountDetails: aurusTransAmountDetails, orderNo: aurusInvoiceNumber, Level3ProductsData: aurusProducts, currencyCode: order.currencyCode, CRMToken: crmToken }, order);

        // Auth Success
        var aurusPayResponseCode = authResult && typeof authResult.TransResponse.TransDetailsData.TransDetailData.ResponseCode !== 'undefined' ? Number(authResult.TransResponse.TransDetailsData.TransDetailData.ResponseCode) : null;

        if (empty(authResult) || (authResult && aurusPayResponseCode > 0)) {
            // Response code not 0000
            errorLogger.error('aurusPayResponseCode error {0} ', LogHelper.getLoggingObject(order));
            if (scope && scope === 'OCAPI') {
                try {
                    Transaction.wrap(function () {
                        paymentInstrument.paymentTransaction.custom.aurusPayOOT = null; // eslint-disable-line no-param-reassign
                    });
                } catch (e) {
                    Logger.error(JSON.stringify(e));
                }
            }
            // Fail Order
            Transaction.wrap(function () {
                OrderMgr.failOrder(order, true);
            });
        }
        if (empty(authResult)) {
            return ({
                error: true,
                errorMessage: getErrorMessage(null)
            });
        } else if (authResult && aurusPayResponseCode > 0) {
            var authResultErrorMessage = getErrorMessage(authResult.TransResponse.TransDetailsData.TransDetailData.ProcessorResponseCode);
            Transaction.wrap(function () {
                order.trackOrderChange('Credit Card Authorization Issue: ' + authResultErrorMessage);
            });
            return ({
                error: true,
                AurusPayResponseCode: authResult.TransResponse.TransDetailsData.TransDetailData.ResponseCode,
                AurusPayResponseText: authResult.TransResponse.TransDetailsData.TransDetailData.ResponseText,
                errorMessage: authResultErrorMessage
            });
        }
        var aurusTokens = {
            cardIdentifier: authResult.TransResponse.TransDetailsData.TransDetailData.CardIdentifier != null ? authResult.TransResponse.TransDetailsData.TransDetailData.CardIdentifier : '',
            aurusPayOOT: authResult.TransResponse.TransDetailsData.TransDetailData.ECOMMInfo !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.ECOMMInfo.OneOrderToken : '',
            cvvResult: authResult.TransResponse.TransDetailsData.TransDetailData.ECOMMInfo !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.ECOMMInfo.CVVResult : '',
            receiptToken: authResult.TransResponse.TransDetailsData.TransDetailData.ReceiptToken !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.ReceiptToken.substring(0, 6) : '',
            authAVSResult: authResult.TransResponse.TransDetailsData.TransDetailData.AuthAVSResult !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.AuthAVSResult : '',
            aurusPayAPTN: authResult.TransResponse.AurusPayTicketNum !== null ? authResult.TransResponse.AurusPayTicketNum : '',
            cardIndicator: authResult.TransResponse.TransDetailsData !== null && authResult.TransResponse.TransDetailsData.TransDetailData !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.CardIndicator : 'D',
            aurusPayAPTID: authResult.TransResponse.TransDetailsData.TransDetailData.AuruspayTransactionId !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.AuruspayTransactionId : '',
            isEmpty: (authResult.TransResponse.TransDetailsData.TransDetailData.ECOMMInfo.OneOrderToken + authResult.TransResponse.AurusPayTicketNum + authResult.TransResponse.TransDetailsData.TransDetailData.AuruspayTransactionId).length === 0
        };

        // Save credit card information for a registered Customer
        if (customer.registered && customer.authenticated && !empty(customer.profile) && isValidCreditCardToken(aurusTokens.cardIdentifier)) {
            aurusPayHelper.saveCustomerCreditCard(authResult, paymentForm.creditCardFields, scope, paymentInstrument);
        }

        aurusPayHelper.setPaymentInstrumentAttributes(paymentInstrument, {
            order: order,
            orderNumber: orderNumber,
            aurusTokens: aurusTokens,
            authResult: authResult,
            aurusTransAmountDetails: aurusTransAmountDetails,
            scope: 'credit',
            paymentProcessor: paymentProcessor
        });
    } catch (e) {
        error = true;
        serverErrors.push(
            Resource.msg('error.technical', 'checkout', null)
        );
        errorLogger.error('Authorize {0} : {1}', JSON.stringify(e), LogHelper.getLoggingObject(order));
        Logger.error(JSON.stringify(e));
    }

    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom logic to authorize credit card payment.
 * @param {dw.order} order - the current order
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {BasketPaymentInstrumentRequest} paymentInstrumentRequest - Payment instrument request
 * @return {Object} returns an error object
 */
function OOTAuthorize(order, paymentInstrument, paymentInstrumentRequest) {
    var serverErrors = [];
    var error = false;

    // Models for Auth call
    var BillingAddressModel = require('*/cartridge/models/billingAddress');
    var EcommInfoModel = require('*/cartridge/models/ecommInfo');
    var TransAmountDetails = require('*/cartridge/models/transactionDetails');

    try {
        var ott = paymentInstrumentRequest['c_ott'] || ''; // eslint-disable-line
        var aurusCardType = 'paymentCard' in paymentInstrumentRequest && 'cardType' in paymentInstrumentRequest['paymentCard'] && paymentInstrumentRequest['paymentCard']['cardType'] ? paymentInstrumentRequest['paymentCard']['cardType'] : ''; // eslint-disable-line
        var expirationMonth = 'paymentCard' in paymentInstrumentRequest && 'expirationMonth' in paymentInstrumentRequest['paymentCard'] && paymentInstrumentRequest['paymentCard']['expirationMonth'] ? paymentInstrumentRequest['paymentCard']['expirationMonth'] : ''; // eslint-disable-line
        var expirationYear = 'paymentCard' in paymentInstrumentRequest && 'expirationYear' in paymentInstrumentRequest['paymentCard'] && paymentInstrumentRequest['paymentCard']['expirationYear'] ? paymentInstrumentRequest['paymentCard']['expirationYear'] : ''; // eslint-disable-line

        if (expirationMonth < 10) {
            expirationMonth = '0' + expirationMonth;
        }

        var cardExpiryDate = expirationMonth.toString() + expirationYear.toString();

        if (!ott || !aurusCardType || !cardExpiryDate) {
            errorLogger.error('!ott || !aurusCardType || !cardExpiryDate 2 {0} ', LogHelper.getLoggingObject(order));
            serverErrors.push('OTT, Card Type or Card Expiry missing');

            return {
                serverErrors: serverErrors,
                error: true
            };
        }

        var terminalID = aurusPayHelper.getTerminalID(order);
        // Test for Custom Aurus site prefs
        if (Site.current.getCustomPreferenceValue('Aurus_storeId') === null && Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier') === null && terminalID === null) {
            return ({
                error: true,
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
        }

        // Prepare request body for auth call
        var aurusEcommInfo = new EcommInfoModel(
            {
                storeId: Site.current.getCustomPreferenceValue('Aurus_storeId'),
                oneTimeToken: ott,
                merchantId: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier'),
                terminalId: terminalID,
                cardId: '',
                oneOrderToken: ''
            }
        );

        var phone = (order && order.billingAddress) ? order.billingAddress.phone : '';
        var aurusBillingAddress = (order && order.billingAddress) ? new BillingAddressModel({ billing: order.billingAddress, email: order.customerEmail, phone: phone }) : {};
        var aurusTransAmountDetails = new TransAmountDetails(order, true);

        // Aurus PreAuth Call
        var authResult = aurusPreAuth({
            ECOMMInfo: aurusEcommInfo,
            BillingAddress: aurusBillingAddress,
            TransAmountDetails: aurusTransAmountDetails,
            orderNo: '',
            cardType: aurusCardType,
            cardExpiryDate: cardExpiryDate,
            ott: true
        }, order);

        var aurusTokens = {};
        var customerName = '';
        if (authResult && authResult.TransResponse &&
            authResult.TransResponse.TransDetailsData &&
            authResult.TransResponse.TransDetailsData.TransDetailData &&
            authResult.TransResponse.TransDetailsData.TransDetailData.ResponseText === 'APPROVAL') {
            aurusTokens.CardIdentifier = authResult.TransResponse.TransDetailsData.TransDetailData.CardIdentifier;
            if (authResult.TransResponse.TransDetailsData.TransDetailData.ECOMMInfo) {
                aurusTokens.aurusPayOOT = authResult.TransResponse.TransDetailsData.TransDetailData.ECOMMInfo.OneOrderToken;
                customerName = authResult.TransResponse.TransDetailsData.TransDetailData.CustomerName;
            }
        }


        if (aurusTokens && (aurusTokens.aurusPayOOT || aurusTokens.CardIdentifier)) {
            Transaction.wrap(function () {
                /* eslint-disable no-param-reassign */
                paymentInstrument.paymentTransaction.custom.aurusPayOOT = JSON.stringify(aurusTokens);
                if (!paymentInstrument.creditCardHolder) {
                    paymentInstrument.creditCardHolder = customerName;
                }
                if (!paymentInstrument.creditCardToken) {
                    paymentInstrument.creditCardToken = aurusTokens.CardIdentifier;
                }
                /* eslint-enable no-param-reassign */
            });
        } else {
            error = true;
            let aurusResponseError = {};

            if (authResult && authResult.TransResponse && authResult.TransResponse.TransDetailsData && authResult.TransResponse.TransDetailsData.TransDetailData) {
                let transDetailData = authResult.TransResponse.TransDetailsData.TransDetailData;
                aurusResponseError = {
                    responseCode: 'ResponseCode' in transDetailData && transDetailData.ResponseCode ? transDetailData.ResponseCode : null,
                    responseText: 'ResponseText' in transDetailData && transDetailData.ResponseText ? transDetailData.ResponseText : null
                };
            }
            let orderLogData = JSON.parse(LogHelper.getLoggingObject(order));
            orderLogData.aurusResponseError = aurusResponseError;
            errorLogger.error('!aurusTokens {0} ', JSON.stringify(orderLogData));
            Logger.error('aurusPayOOT not available in the response.');
            serverErrors.push('CC_AUTH_ERROR');
        }
    } catch (e) {
        errorLogger.error('OOTAuthorize {0} : {1}', JSON.stringify(e), LogHelper.getLoggingObject(order));
        Logger.error(JSON.stringify(e));
        error = true;
        serverErrors.push(
            Resource.msg('error.technical', 'checkout', null)
        );
    }

    return { serverErrors: serverErrors, error: error };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
exports.OOTAuthorize = OOTAuthorize;
