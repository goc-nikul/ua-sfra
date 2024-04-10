'use strict';

var Transaction = require('dw/system/Transaction');
var server = require('server');
var Site = require('dw/system/Site');
var errorLogger = require('dw/system/Logger').getLogger('OrderFail', 'OrderFail');
var Logger = require('dw/system/Logger').getLogger('AurusPayHelper', 'AurusPayHelper');
var aurusPayHelper = require('*/cartridge/scripts/util/aurusPayHelper');
var LogHelper = require('*/cartridge/scripts/util/loggerHelper');

/**
 * Updates basket address from aurus response
 * @param {dw.order.Basket} basket - customer's basket
 * @param {Object} address - address response from aurus
 */
function updateShippingAddress(basket, address) {
    Transaction.wrap(function () {
        var shippingAddress = basket.getDefaultShipment() && basket.getDefaultShipment().getShippingAddress() ? basket.getDefaultShipment().getShippingAddress() : null;
        if (!shippingAddress) {
            shippingAddress = basket.getDefaultShipment().createShippingAddress();
        }
        shippingAddress.setFirstName(address.ShippingFirstName);
        shippingAddress.setLastName(address.ShippingLastName);
        shippingAddress.setAddress1(address.ShippingAddressLine1);
        shippingAddress.setAddress2(address.ShippingAddressLine2);
        shippingAddress.setCity(address.ShippingCity);
        shippingAddress.setPostalCode(address.ShippingZip);
        shippingAddress.setStateCode(address.ShippingState);
        shippingAddress.setCountryCode(address.ShippingCountry);
    });
}

/**
 * Updates basket address from aurus response
 * @param {dw.order.Basket} basket - customer's basket
 * @param {Object} address - address response from aurus
 */
function updateBillingAddress(basket, address) {
    // EPMD-10122 : removing basket.getBillingAddress()
    Transaction.wrap(function () {
        // EPMD-10122 : removing billingAddress check
        var billingAddress = basket.createBillingAddress();
        billingAddress.setFirstName(address.BillingFirstName);
        billingAddress.setLastName(address.BillingLastName);
        billingAddress.setAddress1(address.BillingAddressLine1);
        billingAddress.setAddress2(address.BillingAddressLine2);
        billingAddress.setCity(address.BillingCity);
        billingAddress.setPostalCode(address.BillingZip);
        billingAddress.setStateCode(address.BillingState);
        billingAddress.setCountryCode(address.BillingCountry);
        billingAddress.setPhone(address.BillingMobileNumber);
    });
}

/* global session:true */
/**
 * Verifies that entered credit card information is a valid card. If the information is valid a
 * credit card payment instrument is created
 * @param {dw.order.Basket} basket Current users's basket
 * @param {boolean} isFromCart - true if from cart or PDP
 * @return {Object} returns an error object
 */
function Handle(basket, isFromCart) {
    var currentBasket = basket;
    var billingAddress = currentBasket.getBillingAddress();

    try {
        Transaction.wrap(function () {
            var paymentInstruments = currentBasket.getPaymentInstruments();
            var iterator = paymentInstruments.iterator();
            var paymentInstrument = null;

            while (iterator.hasNext()) {
                paymentInstrument = iterator.next();
                currentBasket.removePaymentInstrument(paymentInstrument);
            }

            currentBasket.createPaymentInstrument('PayPal', currentBasket.totalGrossPrice);

            // Create a billing address
            if (!billingAddress && !isFromCart) {
                billingAddress = currentBasket.createBillingAddress();
                server.forms.getFrom('billing.billingAddress.addressFields').copyTo(billingAddress);
                server.forms.getFrom('billing.billingAddress.addressFields.states').copyTo(billingAddress);
            }
        });
    } catch (error) {
        errorLogger.error('Handle {0} : {1}', JSON.stringify(error), LogHelper.getLoggingObject());
        Logger.error('Handle : {0}', JSON.stringify(error));
    }

    return { success: true };
}

/**
* This function handles the auth call
* @param {Object} params contains shipping, billing, and OTT
* @param {dw.order} order - the current order
* @returns {Object} Pre auth object from service call
*/
function aurusPayPalPreAuth(params, order) {
    // Custom Scripts for Auth call
    var aurusPaySvc = require('*/cartridge/scripts/services/aurusPayServices');
    var auth = null;
    try {
        var reqBody = aurusPayHelper.createPaypalAuthReqBody(params);
        auth = aurusPaySvc.getAuthService().call(reqBody);

        if (auth.ok) {
            auth = JSON.parse(auth.object.text);
        } else {
            if (auth && auth.errorMessage && order) {
                Transaction.wrap(function () {
                    order.trackOrderChange('Paypal Authorization Issue: ' + auth.errorMessage);
                });
            }
            auth = null;
        }
    } catch (error) {
        errorLogger.error('aurusPayPalPreAuth {0} : {1}', JSON.stringify(error), LogHelper.getLoggingObject());
        Logger.error('ERROR: Error while executing pre auth for Paypal :: {0}', JSON.stringify(error));
        if (order) {
            Transaction.wrap(function () {
                order.addNote('Authorization Issue', JSON.stringify(error).substring(0, 4000));
            });
        }
    }

    return auth;
}

/**
 * This function makes the Aurus Session Token Service Call
 * @param {string} sessionId - Aurus session id
 * @param {string} baToken - PayPal Billing Agreement Token
 * @return {Object} returns an error object
 */
function getSessionToken(sessionId, baToken) {
    // Custom Scripts for Auth call
    var aurusPaySvc = require('*/cartridge/scripts/services/aurusPayServices');
    var sessionTokenRes;
    try {
        var reqBody = aurusPayHelper.getSessionTokenReqBody(sessionId, baToken);

        sessionTokenRes = aurusPaySvc.getSessionTokenService().call(reqBody);

        if (sessionTokenRes.ok) {
            sessionTokenRes = JSON.parse(sessionTokenRes.object.text);
        } else {
            sessionTokenRes = null;
        }
    } catch (error) {
        errorLogger.error('getSessionToken {0} : {1}', JSON.stringify(error), LogHelper.getLoggingObject());
        Logger.error('ERROR: Error while executing pre auth.', JSON.stringify(error));
    }

    return sessionTokenRes;
}

/**
 * Authorizes a payment using AurusPay Paypal.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current payment method
 * @param {string} scope -  scope of authorization
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor, scope) {
    // Models for Auth call
    var BillingAddressModel = require('*/cartridge/models/billingAddressPayPal');
    var ShippingAddressModel = require('*/cartridge/models/shippingAddress');
    var EcommInfoModel = require('*/cartridge/models/ecommInfo');
    var TransAmountDetails = require('*/cartridge/models/transactionDetails');
    var Level3Products = require('*/cartridge/models/aurusLevelThreeProduct');
    var OrderMgr = require('dw/order/OrderMgr');

    var order = OrderMgr.getOrder(orderNumber);

    var ott;
    var payWallet;
    var emailId = '';
    try {
        if (scope && scope === 'OCAPI') {
            ott = paymentInstrument.custom.ott;
            emailId = order.customerEmail;
        } else {
            ott = session.privacy.ott;
            payWallet = JSON.parse(session.privacy.payWallet);
            if (payWallet.payer) {
                emailId = payWallet.payer.email_address || payWallet.payer.payer_info.email || '';
            }
        }
    } catch (e) {
        errorLogger.error('Authorize 1 {0} : {1}', JSON.stringify(e), LogHelper.getLoggingObject(order));
        Logger.error('{0} :: customer browser details : {1} :: customer authenticated : {2} :: order No : {3} :: paymentType : {4}', JSON.stringify(e), request.httpUserAgent, session.customerAuthenticated, orderNumber, 'PayPal');
    }

    if (!ott) {
        errorLogger.error('OTT or Session ID missing : {0}', LogHelper.getLoggingObject(order));
        Logger.error('OTT or Session ID missing :: customer browser details : {0} :: customer authenticated : {1} :: order No : {2} :: paymentType : {3}', request.httpUserAgent, session.customerAuthenticated, orderNumber, 'PayPal');
        return {
            error: true
        };
    }

    // Prepare request body for auth call
    var aurusShippingAddress = new ShippingAddressModel({
        shipping: order.defaultShipment.shippingAddress,
        email: order.customerEmail,
        phone: order.defaultShipment.shippingAddress.phone
    });

    var aurusEcommInfo = new EcommInfoModel({
        storeId: Site.current.getCustomPreferenceValue('Aurus_storeId'),
        oneTimeToken: ott,
        merchantId: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier'),
        terminalId: aurusPayHelper.getTerminalID(order),
        cardId: '',
        oneOrderToken: ''
    });

    var aurusBillingAddress = new BillingAddressModel({
        billing: order.billingAddress,
        email: emailId,
        phone: order.billingAddress.phone
    });

    var aurusTransAmountDetails = new TransAmountDetails(order);
    var aurusProducts = new Level3Products(order);
    var aurusInvoiceNumber = orderNumber;

    // Aurus PreAuth Call
    var authResult = aurusPayPalPreAuth({
        ShippingAddress: aurusShippingAddress,
        ECOMMInfo: aurusEcommInfo,
        BillingAddress: aurusBillingAddress,
        TransAmountDetails: aurusTransAmountDetails,
        orderNo: aurusInvoiceNumber,
        currencyCode: order.currencyCode,
        Level3ProductsData: aurusProducts
    }, order);

    if (empty(authResult) || empty(authResult.TransResponse) || empty(authResult.TransResponse.TransDetailsData) || empty(authResult.TransResponse.TransDetailsData.TransDetailData)) {
        errorLogger.error('TransResponse : {0}', LogHelper.getLoggingObject(order));
        Logger.error('ERROR: Error in Paypal Pre-Auth response object :: customer browser details : {0} :: customer authenticated : {1} :: order No : {2} :: paymentType : {3}', request.httpUserAgent, session.customerAuthenticated, orderNumber, 'Paypal');
        return {
            error: true
        };
    }

    // Auth Success
    var aurusPayResponseCode = Number(authResult.TransResponse.TransDetailsData.TransDetailData.ResponseCode);

    if (scope && scope === 'OCAPI') {
        var aurusPayProcessorResponseCode = authResult.TransResponse.TransDetailsData.TransDetailData.ProcessorResponseCode;

        try {
            Transaction.wrap(function () {
                /* eslint-disable no-param-reassign */
                order.custom.aurusResponseCode = aurusPayResponseCode.toString();
                order.custom.aurusProcessorResponseCode = aurusPayProcessorResponseCode;
                /* eslint-enable no-param-reassign */
            });
        } catch (e) {
            errorLogger.error('aurusProcessorResponseCode {0} : {1}', JSON.stringify(e), LogHelper.getLoggingObject(order));
            Logger.error('ERROR: Error in executing Pre-Auth OCAPI call for Paypal :: {0}', JSON.stringify(e));
        }
    }
    if (aurusPayResponseCode > 0) {
        errorLogger.error('aurusPayResponseCode : {0}', LogHelper.getLoggingObject(order));
        // Response code not 0000
        session.privacy.apResponseCode = aurusPayResponseCode;
        return {
            error: true,
            errorCode: aurusPayResponseCode
        };
    }

    var token = authResult.TransResponse.TransDetailsData.TransDetailData.ECOMMInfo !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.ECOMMInfo.OneOrderToken : '';
    var cardIdentifier = authResult.TransResponse.TransDetailsData.TransDetailData.CardIdentifier !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.CardIdentifier : '';
    var processorToken = authResult.TransResponse.TransDetailsData.TransDetailData.ProcessorToken !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.ProcessorToken : '';
    var processorReferenceNumber = authResult.TransResponse.TransDetailsData.TransDetailData.ProcessorReferenceNumber !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.ProcessorReferenceNumber : '';

    try {
        aurusPayHelper.setPaymentInstrumentAttributes(paymentInstrument, {
            order: order,
            token: token,
            authResult: authResult,
            aurusTransAmountDetails: aurusTransAmountDetails,
            scope: 'paypal',
            processorToken: processorToken,
            processorReferenceNumber: processorReferenceNumber,
            paymentProcessor: paymentProcessor
        });
    } catch (e) {
        session.privacy.apResponseCode = aurusPayResponseCode;
        errorLogger.error('Authorize 2 {0} : {1}', JSON.stringify(e), LogHelper.getLoggingObject(order));
        Logger.error('ERROR: Error while setting payment Instruments custom attributes :: {0}', JSON.stringify(e));
    }

    return {
        authorized: true,
        token: token,
        cardIdentifier: cardIdentifier
    };
}

/**
 * Get session token for paypal, stores in payment instrument and gets shipping/billing address from paypal and update basket
 * @param {dw.order.Basket} basket Current users's basket
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {Object} paymentInstrumentRequest - Payment instrument request
 * @return {Object} returns an error object
 */
function OOTAuthorize(basket, paymentInstrument, paymentInstrumentRequest) { // eslint-disable-line no-unused-vars
    var serverErrors = [];
    var error = false;

    // Models for Auth call
    var aurusPayPalSession = basket.custom.paypalSessionID || session.privacy.aurusPPSession;
    var aurusPayPalBATokenSession = paymentInstrument.custom.paypalToken || session.privacy.ba_token;

    // Next get Aurus OTT
    var sessionTokenResponse = getSessionToken(aurusPayPalSession, aurusPayPalBATokenSession);

    // Handle Session Token Respnse Errors
    const sessionErrorMsg = 'ERROR: Error while executing getSessionToken for Paypal';
    if (sessionTokenResponse == null) {
        errorLogger.error('sessionTokenResponse = null {0}', LogHelper.getLoggingObject());
        Logger.error(sessionErrorMsg);
        return {
            serverErrors: serverErrors.concat(sessionErrorMsg),
            error: true
        };
    } else if (sessionTokenResponse.GetSessionTokenResponse.ResponseText === 'INVALID SESSION ID') {
        errorLogger.error('sessionTokenResponse.GetSessionTokenResponse.ResponseText {0} : {1}', sessionTokenResponse.GetSessionTokenResponse.ResponseText, LogHelper.getLoggingObject());
        Logger.error(sessionErrorMsg);
        return {
            serverErrors: serverErrors.concat(sessionErrorMsg),
            error: true
        };
    }

    try {
        var ott;
        var billingAddress;
        var shippingAddress;
        if (sessionTokenResponse.GetSessionTokenResponse.ECOMMInfo) {
            ott = sessionTokenResponse.GetSessionTokenResponse.ECOMMInfo.OneTimeToken;
        }

        if (!ott) {
            errorLogger.error('OTT is missing: {0}', LogHelper.getLoggingObject());
            serverErrors.push('OTT is missing');

            return {
                serverErrors: serverErrors,
                error: true
            };
        }

        Transaction.wrap(function () {
            paymentInstrument.custom.ott = ott; // eslint-disable-line no-param-reassign
        });

        var addressFieldsToVerify = ['firstName', 'lastName', 'address1', 'address2', 'city', 'stateCode', 'postalCode', 'countryCode'];
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        if (sessionTokenResponse.GetSessionTokenResponse.BillingAddress) {
            billingAddress = sessionTokenResponse.GetSessionTokenResponse.BillingAddress;
            updateBillingAddress(basket, billingAddress);
            try {
                if (basket) {
                    var basketBillingAddress = basket.billingAddress;
                    if (basketBillingAddress) {
                        var countryCodeBilling = basketBillingAddress.countryCode.value;
                        var billingAddressErrors = COHelpers.checkEmptyEmojiNonLatinChars(basketBillingAddress, addressFieldsToVerify, countryCodeBilling);
                        if (Object.keys(billingAddressErrors).length > 0) {
                            error = true;
                            serverErrors = serverErrors.concat({ billing: billingAddressErrors });
                        }
                    }
                }
            } catch (e) {
                errorLogger.error('OOTAuthorize 1 {0} : {1}', JSON.stringify(e), LogHelper.getLoggingObject());
                Logger.error(JSON.stringify(e));
            }
        }

        if (sessionTokenResponse.GetSessionTokenResponse.ShippingAddress) {
            shippingAddress = sessionTokenResponse.GetSessionTokenResponse.ShippingAddress;
            updateShippingAddress(basket, shippingAddress);
            try {
                if (basket) {
                    var basketShippingAddress = basket.defaultShipment.shippingAddress;
                    if (basketShippingAddress) {
                        var countryCode = basketShippingAddress.countryCode.value;
                        var shippingAddressErrors = COHelpers.checkEmptyEmojiNonLatinChars(basketShippingAddress, addressFieldsToVerify, countryCode);
                        if (Object.keys(shippingAddressErrors).length > 0) {
                            error = true;
                            serverErrors = serverErrors.concat({ shipping: shippingAddressErrors });
                        }
                    }
                }
            } catch (e) {
                errorLogger.error('OOTAuthorize 2 {0} : {1}', JSON.stringify(e), LogHelper.getLoggingObject());
                Logger.error(JSON.stringify(e));
            }
        }

        if (error) {
            errorLogger.error('OOTAuthorize 3 {0} : {1}', error, LogHelper.getLoggingObject());
            return {
                error: true,
                serverErrors: serverErrors
            };
        }

        var emailId;
        if (sessionTokenResponse.GetSessionTokenResponse.Pay_Wallet) {
            var payWallet = JSON.parse(sessionTokenResponse.GetSessionTokenResponse.Pay_Wallet);
            if (payWallet.payer) {
                emailId = payWallet.payer.email_address || payWallet.payer.payer_info.email || '';
            }
        }
        if (emailId) {
            Transaction.wrap(function () {
                basket.setCustomerEmail(emailId); // eslint-disable-line no-param-reassign
                paymentInstrument.custom.paypalEmail = emailId; // eslint-disable-line no-param-reassign
            });
        }
    } catch (e) {
        errorLogger.error('OOTAuthorize 4 {0} : {1}', JSON.stringify(e), LogHelper.getLoggingObject());
        Logger.error(JSON.stringify(e));
        error = true;
        serverErrors.push(e.message);
    }

    return { serverErrors: serverErrors, error: error };
}

exports.getSessionToken = getSessionToken;
exports.Authorize = Authorize;
exports.Handle = Handle;
exports.OOTAuthorize = OOTAuthorize;
