'use strict';

var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');
var errorLogger = require('dw/system/Logger').getLogger('OrderFail', 'OrderFail');
var aurusPayHelper = require('*/cartridge/scripts/util/aurusPayHelper');
var Logger = require('dw/system/Logger').getLogger('AurusPayHelper', 'AurusPayHelper');
var LogHelper = require('*/cartridge/scripts/util/loggerHelper');

/**
 * Updates basket address from aurus response
 * @param {dw.order.Basket} basket - customer's basket
 * @param {Object} address - address response from aurus
 */
function updateShippingAddress(basket, address) {
    var shippingAddress = basket.getDefaultShipment() && basket.getDefaultShipment().getShippingAddress() ? basket.getDefaultShipment().getShippingAddress() : null;

    Transaction.wrap(function () {
        if (!shippingAddress) {
            shippingAddress = basket.getDefaultShipment().createShippingAddress();
        }
        shippingAddress.setFirstName(address.ShippingFirstName);
        shippingAddress.setLastName(address.ShippingLastName);
        shippingAddress.setAddress1(address.ShippingAddressLine1);
        shippingAddress.setAddress2(address.ShippingAddressLine2 !== 'null' ? address.ShippingAddressLine2 : '');
        shippingAddress.setCity(address.ShippingCity);
        shippingAddress.setPostalCode(address.ShippingZip);
        shippingAddress.setStateCode(address.ShippingState);
        shippingAddress.setCountryCode(address.ShippingCountry.toUpperCase());
    });
}

/**
 * Updates basket address from aurus response
 * @param {dw.order.Basket} basket - customer's basket
 * @param {Object} address - address response from aurus
 */
function updateBillingAddress(basket, address) {
    var billingAddress = basket.getBillingAddress();

    Transaction.wrap(function () {
        if (!billingAddress) {
            billingAddress = basket.createBillingAddress();
        }
        billingAddress.setFirstName(address.BillingFirstName);
        billingAddress.setLastName(address.BillingLastName);
        billingAddress.setAddress1(address.BillingAddressLine1);
        billingAddress.setAddress2(address.BillingAddressLine2 !== 'null' ? address.BillingAddressLine2 : '');
        billingAddress.setCity(address.BillingCity);
        billingAddress.setPostalCode(address.BillingZip);
        billingAddress.setStateCode(address.BillingState);
        billingAddress.setCountryCode(address.BillingCountry.toUpperCase());
        billingAddress.setPhone(address.BillingMobileNumber);
    });
}

/**
 * Handle entry point for Apple Pay
 * @param {Object} basket Basket
 * @returns {Object} processor result
 */
function Handle(basket) {
    return {
        basket: basket,
        success: true
    };
}

/**
 * Authorizes a payment using AurusPay ApplePay.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current payment method
 * @param {string} scope -  scope of authorization
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor, scope) {
    // Models for Auth call
    var BillingAddressModel = require('*/cartridge/models/billingAddress');
    var ShippingAddressModel = require('*/cartridge/models/shippingAddress');
    var EcommInfoModel = require('*/cartridge/models/ecommInfo');
    var TransAmountDetails = require('*/cartridge/models/transactionDetails');
    var Level3Products = require('*/cartridge/models/aurusLevelThreeProduct');
    var error = false;

    var token;
    if (scope && scope === 'OCAPI') {
        var OrderMgr = require('dw/order/OrderMgr');
        var order = OrderMgr.getOrder(orderNumber);

        var ott;
        try {
            ott = paymentInstrument.custom.ott;

            if (!ott) {
                Logger.error('OTT is missing');
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
                terminalId: aurusPayHelper.getTerminalID(order)
            });

            var aurusBillingAddress = new BillingAddressModel({
                billing: order.billingAddress,
                email: order.customerEmail,
                phone: order.billingAddress.phone
            });

            var aurusTransAmountDetails = new TransAmountDetails(order);
            var aurusProducts = new Level3Products(order);
            var aurusInvoiceNumber = order.orderNo;

            var aurusAuthorizeApplepay = require('*/cartridge/scripts/util/aurusAuthorizeApplepay');
            var authResult = aurusAuthorizeApplepay.aurusPreAuth({
                ShippingAddress: aurusShippingAddress,
                ECOMMInfo: aurusEcommInfo,
                cardType: '',
                BillingAddress: aurusBillingAddress,
                TransAmountDetails: aurusTransAmountDetails,
                orderNo: aurusInvoiceNumber,
                Level3ProductsData: aurusProducts,
                currencyCode: order.currencyCode
            }, order);

            if (empty(authResult) || empty(authResult.TransResponse) || empty(authResult.TransResponse.TransDetailsData) || empty(authResult.TransResponse.TransDetailsData.TransDetailData)) {
                Logger.error('ERROR: Error in auruspay Applepay Pre-Auth response object');
                return {
                    error: true
                };
            }

            // Auth Success
            var aurusPayResponseCode = Number(authResult.TransResponse.TransDetailsData.TransDetailData.ResponseCode);
            Logger.info('ApplePay->order.orderNo: ' + order.orderNo + ' aurusPayResponseCode: ' + aurusPayResponseCode);
            Logger.info('ApplePay->order.orderNo: ' + order.orderNo + ' aurusPayProcessorResponseCode: ' + aurusPayResponseCode);
            if (aurusPayResponseCode > 0) {
                // Response code not 0000
                session.privacy.apResponseCode = aurusPayResponseCode;
                Logger.error('ERROR: Error in auruspay Applepay Pre-Auth response with response code: {0} :: customer browser details : {1} :: customer authenticated : {2} :: orderNo : {3} :: paymentType : {4}', aurusPayResponseCode, request.httpUserAgent, session.customerAuthenticated, order.orderNo, 'ApplePay');
                return {
                    error: true
                };
            }

            token = authResult.TransResponse.TransDetailsData.TransDetailData.ECOMMInfo !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.ECOMMInfo.OneOrderToken : '';

            Transaction.wrap(function () {
                paymentInstrument.creditCardExpirationMonth = authResult.TransResponse.TransDetailsData.TransDetailData.CardExpiryDate.substring(0, 2); // eslint-disable-line no-param-reassign
                paymentInstrument.creditCardExpirationYear = authResult.TransResponse.TransDetailsData.TransDetailData.CardExpiryDate.substring(2, 4); // eslint-disable-line no-param-reassign
                paymentInstrument.creditCardType = authResult.TransResponse.TransDetailsData.TransDetailData.CardType; // eslint-disable-line no-param-reassign
                paymentInstrument.creditCardHolder = authResult.TransResponse.TransDetailsData.TransDetailData.CustomerName; // eslint-disable-line no-param-reassign
            });

            aurusPayHelper.setPaymentInstrumentAttributes(paymentInstrument, {
                order: order,
                token: token,
                authResult: authResult,
                aurusTransAmountDetails: aurusTransAmountDetails,
                scope: 'applepay',
                paymentProcessor: paymentProcessor
            });
        } catch (e) {
            error = true;
            errorLogger.error('Authorize {0} : {1}', JSON.stringify(e), LogHelper.getLoggingObject(order));
            Logger.error('ERROR: Error while setting payment Instruments custom attributes :: {0}', JSON.stringify(e));
        }
    }

    return {
        error: error,
        authorized: !error,
        token: token
    };
}

/**
 * Get session token for applePay, stores in payment instrument and gets shipping/billing address from applepay and update basket
 * @param {dw.order.Basket} basket Current users's basket
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {Object} paymentInstrumentRequest - Payment instrument request
 * @return {Object} returns an error object
 */
function OOTAuthorize(basket, paymentInstrument, paymentInstrumentRequest) { // eslint-disable-line no-unused-vars
    var serverErrors = [];
    var error = false;

    var sessionId;
    var OneTimeToken;
    var billingAddress;
    var shippingAddress;

    var applePayEvent = JSON.parse(paymentInstrument.custom.paymentData);
    if (!applePayEvent) {
        serverErrors.push('applePayEvent is missing');

        return {
            serverErrors: serverErrors,
            error: true
        };
    }

    var aurusAuthorizeApplepay = require('*/cartridge/scripts/util/aurusAuthorizeApplepay');

    try {
        var sessionObj = aurusAuthorizeApplepay.getSession();
        Logger.info('sessionObj: ' + JSON.stringify(sessionObj));

        if (sessionObj && sessionObj.SessionResponse && sessionObj.SessionResponse.ResponseText === 'APPROVAL') {
            sessionId = sessionObj.SessionResponse.SessionId;
        } else {
            Logger.error('ERROR: Error in applePay getSession response');
            serverErrors.push('ERROR: Error in applePay getSession response');

            return {
                serverErrors: serverErrors,
                error: true
            };
        }

        var event = {
            payment: {
                token: {
                    paymentData: applePayEvent
                }
            }
        };
        Logger.info('event: ' + JSON.stringify(event));
        var tokenObject;
        if (sessionId !== '') {
            tokenObject = aurusAuthorizeApplepay.getSessionToken({ order: basket, event: event, templateId: '1', sessionId: sessionId });

            if (tokenObject && tokenObject.GetSessionTokenResponse && tokenObject.GetSessionTokenResponse.ResponseText === 'APPROVAL') {
                OneTimeToken = tokenObject.GetSessionTokenResponse.ECOMMInfo.OneTimeToken;
            } else {
                Logger.error('ERROR: Error in applePay getSessionToken response');
                serverErrors.push('ERROR: Error in applePay getSessionToken response');

                return {
                    serverErrors: serverErrors,
                    error: true
                };
            }
        }

        Logger.info('OOTAuthorize applePay: ' + JSON.stringify({
            sessionId: sessionId,
            OneTimeToken: OneTimeToken
        }));

        if (!OneTimeToken) {
            serverErrors.push('OneTimeToken is missing');
            errorLogger.error('OneTimeToken is missing : {0}', LogHelper.getLoggingObject());

            return {
                serverErrors: serverErrors,
                error: true
            };
        }

        Transaction.wrap(function () {
            paymentInstrument.custom.ott = OneTimeToken; // eslint-disable-line no-param-reassign
        });

        var addressFieldsToVerify = ['firstName', 'lastName', 'address1', 'address2', 'city', 'stateCode', 'postalCode', 'countryCode'];
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        if (tokenObject.GetSessionTokenResponse.BillingAddress) {
            billingAddress = tokenObject.GetSessionTokenResponse.BillingAddress;
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

        if (tokenObject.GetSessionTokenResponse.ShippingAddress) {
            shippingAddress = tokenObject.GetSessionTokenResponse.ShippingAddress;
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
            return {
                error: true,
                serverErrors: serverErrors
            };
        }

        var emailId;
        if (tokenObject.GetSessionTokenResponse.Pay_Wallet) {
            var payWallet = JSON.parse(tokenObject.GetSessionTokenResponse.Pay_Wallet);
            if (payWallet.payer) {
                emailId = payWallet.payer.email_address || payWallet.payer.payer_info.email || '';
            }
        }

        if (emailId) {
            Transaction.wrap(function () {
                basket.setCustomerEmail(emailId); // eslint-disable-line no-param-reassign
            });
        }
    } catch (e) {
        errorLogger.error('OOTAuthorize 3 {0} : {1}', JSON.stringify(e), LogHelper.getLoggingObject());
        Logger.error(JSON.stringify(e));
        error = true;
        serverErrors.push(e.message);
    }

    return { serverErrors: serverErrors, error: error };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
exports.OOTAuthorize = OOTAuthorize;
