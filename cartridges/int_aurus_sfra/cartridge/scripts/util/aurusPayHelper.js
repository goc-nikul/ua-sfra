'use strict';

var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var Logger = require('dw/system/Logger');

/* global dw, session, request, result:true */

var tDate = dw.util.StringUtils.formatCalendar(new dw.util.Calendar(), 'MMddyyyy');
var tTime = dw.util.StringUtils.formatCalendar(new dw.util.Calendar(), 'HHmmss');

/**
* Retrieves Auruspay Currency Code
* @param {String} currencyCode Currency code set in the Site configurations
* @returns {String} - Return Aurus currency Code
*/
function getAurusCurrencyCode(currencyCode) {
    var aurusCurrencyCodeObj = {
        'CAD': '124',
        'USD': '840'
    }
    return aurusCurrencyCodeObj[currencyCode];
}

/**
* This function gets the card
* @param {Object} req -request
* @param {string} uuid - uuid of card
* @returns {Object} card - users card
*/
function getCard(req, uuid) {
    var card = null;

    if (req.currentCustomer.raw.authenticated && req.currentCustomer.raw.registered) {
        // Collection: A collection of all payment instruments associated with the related customer.
        var wallet = req.currentCustomer.wallet.paymentInstruments;
        for (var i = 0; i < wallet.length; i++) {
            if (uuid.length === 0) {
                card = wallet[i];
                break;
            }
            if (uuid === wallet[i].UUID) {
                card = wallet[i];
                break;
            }
            if (uuid === 'newCard') {
                break;
            }
        }
    }

    return card;
}

/**
* Creates the request object for Aurus Pay Session ID web call
* @param {Object} req middleware request object
* @param {string} uuid internal stored payment method id
* @returns {JSON} - Session Id request JSON object
*/
function createSessionReqBody(req, uuid) {
    var card = getCard(req, uuid);
    var jsBody = {
        SessionRequest: {
            CardExpiryDate: card !== null ? card.creditCardExpirationMonth + '' + card.creditCardExpirationYear : '',
            CardIdentifier: card !== null ? card.raw.creditCardToken : '',
            CardNumber: card !== null ? card.creditCardNumber : '',
            CardType: card !== null ? card.creditCardType : '',
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier') || '', // custom pref
            DomainId: Site.current.getCustomPreferenceValue('Aurus_domainId') || '', // custom pref
            KI: '',
            MerchantIdentifier: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier') || '',
            StoreId: Site.current.getCustomPreferenceValue('Aurus_storeId') || '', // custom pref
            TemplateId: card !== null ? '2' : '1', // determines which CC form is retrieved
            TerminalId: Site.current.getCustomPreferenceValue('Aurus_terminalId') || '', // custom pref
            URLType: Site.current.getCustomPreferenceValue('Aurus_urlType') || '', // custom pref
            CardTypeSupport: '1111111000000000',
            TokenType: '102',
            ECOMMFingerPrintInfo: {
                BrowserDetails: '',
                BrowserLanguage: '',
                City: '',
                CountryCode: '',
                DeviceOS: '',
                DeviceScreenResolution: '',
                DeviceType: '',
                IPAddress: '',
                NetworkDownloadSpeed: '',
                NetworkMaxDownloadSpeed: '',
                NetworkSubType: '',
                NetworkType: '',
                ReferralURL: '',
                StateName: '',
                WebsiteSessionID: ''
            }
        }
    };
    var jsonbody = JSON.stringify(jsBody);
    return jsonbody;
}


/**
* Creates the request object for Aurus Pay Session ID web call
* @param {Object} req middleware request object
* @param {string} uuid internal stored payment method id
* @returns {JSON} - Session Id request JSON object
*/
function createPayPalSessionReqBody() {
    var jsBody = {
        SessionRequest: {
            CardExpiryDate: '',
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier') || '', // custom pref
            DomainId: Site.current.getCustomPreferenceValue('Aurus_domainId') || '', // custom pref
            KI: '',
            MerchantIdentifier: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier') || '',
            StoreId: Site.current.getCustomPreferenceValue('Aurus_storeId') || '', // custom pref
            TemplateId: '1', // determines which CC form is retrieved
            TerminalId: Site.current.getCustomPreferenceValue('Aurus_terminalId') || '', // custom pref
            TokenType: '102',
            URLType: '4'
        }
    };
    var jsonbody = JSON.stringify(jsBody);
    return jsonbody;
}
/**
* Creates the request object for Aurus Pay Session ID web call
* @returns {JSON} - Session Id request JSON object
*/
function createGooglePaySessionReqBody() {
    var jsBody = {
        SessionRequest: {
            TokenType: '102',
            DomainId: '2',
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier') || '', // custom pref
            StoreId: Site.current.getCustomPreferenceValue('Aurus_storeId') || '', // custom pref
            MerchantIdentifier: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier') || '',
            TerminalId: Site.current.getCustomPreferenceValue('Aurus_terminalId') || '', // custom pref
            CardExpiry: '',
            TemplateId: '1', // determines which CC form is retrieved
            KI: '',
            URLType: '4'
        }
    };
    var jsonbody = JSON.stringify(jsBody);
    return jsonbody;
}

/**
* Creates the request object for Aurus Pay Session ID web call
* @returns {JSON} - Session Id request JSON object
*/
function createApplePaySessionReqBody() {
    var jsBody = {
        SessionRequest: {
            TokenType: '102',
            DomainId: '2',
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier') || '', // custom pref
            StoreId: Site.current.getCustomPreferenceValue('Aurus_storeId') || '', // custom pref
            MerchantIdentifier: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier') || '',
            TerminalId: Site.current.getCustomPreferenceValue('Aurus_terminalId') || '', // custom pref
            CardExpiry: '',
            KI: ''
        }
    };
    var jsonbody = JSON.stringify(jsBody);
    return jsonbody;
}


/**
* Creates the request object for Aurus Pay Auth web call
* @param {Object} params used to pass down custom prefs
* @returns {JSON} - Auth request JSON object
*/
function createAuthReqBody(params) {
    var jsBody = {
        TransRequest: {
            ApprovalCode: '',
            AurusPayTicketNum: '000000000000000000',
            PostAuthCount: '00',
            EcommerceIndicator: 'Y',
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier') || '', // custom pref
            ShippingAddress: params.ShippingAddress,
            ReferenceNumber: '',
            ThirdPartyURL: '',
            TransactionDate: tDate,
            ProcessorToken: '',
            TransactionTime: tTime,
            PONumber: '',
            SettlementInfo: {
                MerchantTransactionCode: '',
                SalesCheckNumber: '',
                CreditPlan: '',
                TransactionDescription: '',
                PromotionCode: '',
                InCircleAmount: ''
            },
            PostAuthSequenceNo: '00',
            OrigTransactionIdentifier: '',
            LanguageIndicator: '00',
            CardExpiryDate: '',
            OrigAurusPayTicketNum: '',
            CurrencyCode: getAurusCurrencyCode(params.currencyCode),
            ECOMMInfo: params.ECOMMInfo,
            ClerkID: '',
            SubTransType: '0',
            WalletIdentifier: '',
            PODate: '',
            TransactionType: '04',
            KI: '',
            CardType: params.cardType,
            BillingAddress: params.BillingAddress,
            TransAmountDetails: params.TransAmountDetails,
            Level3ProductsData: params.Level3ProductsData,
            InvoiceNumber: params.orderNo
        }
    };
    var jsonbody = JSON.stringify(jsBody);
    return jsonbody;
}

/**
* Creates request object for Aurus Pay Session Token Request web call
* @param {string} sessionId The session id from the getSession service call
* @param {string} baToken Billing Agreement token from the paypal response returned as a quesrystring
* @returns {JSON} - SessionTokenRequest Body
*/
function createSessionTokenReqBody(sessionId, baToken) {
    /* eslint-disable no-param-reassign */
    baToken = session.privacy.ba_token;
    /* eslint-enable no-param-reassign */
    var jsBody = {
        GetSessionTokenRequest: {
            CartId: '',
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier'),
            ECOMMInfo: {
                StoreId: Site.current.getCustomPreferenceValue('Aurus_storeId') || '',
                MerchantIdentifier: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier') || '',
                TerminalId: Site.current.getCustomPreferenceValue('Aurus_terminalId') || ''
            },
            MerchantSessionId: '',
            ProfileId: '',
            SessionId: sessionId,
            TransactionTime: tTime,
            TransactionDate: tDate,
            WalletIdentifier: '4',
            WalletToken: baToken
        }
    };
    var jsonbody = JSON.stringify(jsBody);
    return jsonbody;
}
/**
* This function creates the GooglePay Session Token Request Body
* @param {string} sessionId - session ID
* @param {string} gp_token - google pay session token
* @returns {JSON} jsonbody - returns request body
*/
function createGooglePaySessionTokenReqBody(sessionId) {
    var gpToken = JSON.parse(session.privacy.gp_token);

    var jsBody = {
        GetSessionTokenRequest: {
            MerchantSessionId: '',
            CartId: '',
            WalletIdentifier: '11',
            PaymentToken: gpToken,
            WalletToken: gpToken,
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier'),
            ECOMMInfo: {
                StoreId: Site.current.getCustomPreferenceValue('Aurus_storeId') || '',
                MerchantIdentifier: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier') || '',
                TerminalId: Site.current.getCustomPreferenceValue('Aurus_terminalId') || ''
            },
            ProfileId: '',
            SessionId: sessionId,
            TransactionTime: tTime,
            TransactionDate: tDate
        }
    };
    var jsonbody = JSON.stringify(jsBody);
    return jsonbody;
}
/**
* This function creates the ApplePay Session Token Request Body
* @param {string} sessionId - session ID
* @param {string} ap_token - ApplePay session token
* @returns {JSON} jsonbody - returns request body
*/
function createApplePaySessionTokenReqBody(sessionId) {
    var apToken = session.privacy.ap_token;

    var jsBody = {
        GetSessionTokenRequest: {
            MerchantSessionId: '',
            CartId: '',
            WalletIdentifier: '7',
            WalletToken: apToken,
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier'),
            ECOMMInfo: {
                StoreId: Site.current.getCustomPreferenceValue('Aurus_storeId') || '',
                MerchantIdentifier: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier') || '',
                TerminalId: Site.current.getCustomPreferenceValue('Aurus_terminalId') || ''
            },
            ProfileId: '',
            SessionId: sessionId,
            TransactionTime: tTime,
            TransactionDate: tDate
        }
    };
    var jsonbody = JSON.stringify(jsBody);
    return jsonbody;
}

/**
* Creates request object for Aurus Pay Biller Token web call
* @param {*} shippingAddress - contains shipping address1, shpping address2, etc
* @returns {JSON} - jsonbody - body of request
*/
function createBillerTokenReqBody(shippingAddress) {
    var jsBody = {
        GetBillerTokenRequest: {
            TransactionType: '80',
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier') || '',
            WalletIdentifier: '4',
            WalletObject: {
                experience_profile_id: Site.current.getCustomPreferenceValue('Aurus_experienceProfileId') || '',
                payer: {
                    payment_method: 'PAYPAL'
                },
                plan: {
                    type: 'MERCHANT_INITIATED_BILLING',
                    merchant_preferences: {
                        return_url: URLUtils.url('AurusPay-ReturnFromPayPal').toString(),
                        cancel_url: URLUtils.url('Cart-Show').toString(),
                        accepted_pymt_type: 'INSTANT',
                        skip_shipping_address: false,
                        immutable_shipping_address: true
                    }
                },
                shipping_address: {
                    line1: shippingAddress.address,
                    line2: shippingAddress.address2,
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    postal_code: shippingAddress.postal,
                    country_code: shippingAddress.country,
                    recipient_name: shippingAddress.firstName + ' ' + shippingAddress.lastName
                }
            },
            ECOMMInfo: {
                StoreId: Site.current.getCustomPreferenceValue('Aurus_storeId') || '',
                MerchantIdentifier: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier') || '',
                TerminalId: Site.current.getCustomPreferenceValue('Aurus_terminalId') || ''
            },
            TransactionTime: tTime,
            TransactionDate: tDate
        }
    };
    var jsonbody = JSON.stringify(jsBody);
    return jsonbody;
}

/**
* Creates the request object for Aurus Pay - PayPal Auth call
* @param {Object} params used to pass down custom prefs
* @returns {JSON} - Auth request JSON object
*/
function createPayPalAuthReqBody(params) {
    var jsBody = {
        TransRequest: {
            AurusPayTicketNum: '000000000000000000',
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier') || '', // custom pref
            PostAuthCount: '01',
            EcommerceIndicator: 'Y',
            ShippingAddress: params.ShippingAddress,
            TransactionDate: tDate,
            ProcessorToken: params.pToken,
            TransactionTime: tTime,
            PostAuthSequenceNo: '01',
            OrigTransactionIdentifier: '',
            LanguageIndicator: '00',
            OrigAurusPayTicketNum: '',
            CurrencyCode: currencyCode,
            ECOMMInfo: params.ECOMMInfo,
            WalletIdentifier: params.walletId,
            TransactionType: '04',
            KI: '',
            CardType: '',
            BillingAddress: params.BillingAddress,
            TransAmountDetails: params.TransAmountDetails,
            Level3ProductsData: params.Level3ProductsData,
            InvoiceNumber: params.orderNo
        }
    };
    var jsonbody = JSON.stringify(jsBody);
    return jsonbody;
}

/**
* Creates the request object for Aurus Pay - PayPal Auth call
* @param {Object} params used to pass down custom prefs
* @returns {JSON} - Auth request JSON object
*/
function createGooglePayAuthReqBody(params) {
    var jsBody = {
        TransRequest: {
            AurusPayTicketNum: '000000000000000000',
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier') || '', // custom pref
            PostAuthCount: '01',
            EcommerceIndicator: 'Y',
            ShippingAddress: params.ShippingAddress,
            TransactionDate: tDate,
            ProcessorToken: params.pToken,
            TransactionTime: tTime,
            PostAuthSequenceNo: '01',
            OrigTransactionIdentifier: '',
            LanguageIndicator: '00',
            OrigAurusPayTicketNum: '',
            CurrencyCode: currencyCode,
            ECOMMInfo: params.ECOMMInfo,
            WalletIdentifier: '11',
            TransactionType: '04',
            KI: '',
            CardType: '',
            BillingAddress: params.BillingAddress,
            TransAmountDetails: params.TransAmountDetails,
            Level3ProductsData: params.Level3ProductsData,
            InvoiceNumber: params.orderNo
        }
    };
    var jsonbody = JSON.stringify(jsBody);
    return jsonbody;
}

/**
 * CreatePaymentInstrument
 *
 * @param {Object} basket - Basket
 * @param {string} paymentType - Name of the payment method.
 * @returns {Object} Payment instrument
 */
function createPaymentInstrument(basket, paymentType) {
    var paymentInstr = null;

    if (basket == null) {
        return null;
    }

    var iter = basket.getPaymentInstruments(paymentType).iterator();
    Transaction.wrap(function () {
        while (iter.hasNext()) {
            var existingPI = iter.next();
            basket.removePaymentInstrument(existingPI);
        }
    });

    var amount = COHelpers.calculateNonGiftCertificateAmount(basket);

    Transaction.wrap(function () {
        paymentInstr = basket.createPaymentInstrument(paymentType, amount);
    });

    return paymentInstr;
}
/**
 * Return From Paypal Function
 * @param {Object} basket - Basket
 * @returns {string} redirectURL - url redirect for return from paypal
 * @returns {string} ba_token - ba_token value
 * @returns {string} token - token value
 */
function returnFromPaypal(basket) {
    var PaymentMgr = require('dw/order/PaymentMgr');
    var token = request.httpParameterMap.token.value;
    var baToken = request.httpParameterMap.ba_token.value;
    var HookMgr = require('dw/system/HookMgr');

    if (!basket) {
        return {
            redirectUrl: URLUtils.url('Cart-Show').toString()
        };
    }

    var processor = PaymentMgr.getPaymentMethod('PayPal').getPaymentProcessor();

    if (HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
        result = HookMgr.callHook('app.payment.processor.' + processor.ID.toLowerCase(),
            'Handle',
            basket
        );
    } else {
        result = HookMgr.callHook('app.payment.processor.default', 'Handle');
    }

    return {
        redirectUrl: URLUtils.https('Checkout-Begin', 'stage', 'placeOrder'),
        ba_token: baToken,
        token: token
    };
}

/**
 * Return From GooglePay Function
 * @param {Object} basket - Basket
 * @returns {string} redirectURL - url redirect for return from GooglePay
 * @returns {string} ga_token - ga_token value
 * @returns {Object} paymentData - payment data from GooglePay
 * @returns {string} contactEmail - contact email from GooglePay
 */
function returnFromGooglePay(basket) {
    var PaymentMgr = require('dw/order/PaymentMgr');
    var gpinfo = request.httpParameterMap;
    var paymentData = gpinfo.getParameterMap('paymentData');

    var gptokenInfo = paymentData.get('[paymentMethodData][tokenizationData][token]');
    var contactEmail = gpinfo.emailAddress;

    var HookMgr = require('dw/system/HookMgr');

    if (!basket) {
        return {
            redirectUrl: URLUtils.url('Cart-Show').toString()
        };
    }

    var processor = PaymentMgr.getPaymentMethod('GooglePay').getPaymentProcessor();

    if (HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
        result = HookMgr.callHook('app.payment.processor.' + processor.ID.toLowerCase(),
            'Handle',
            basket
        );
    } else {
        result = HookMgr.callHook('app.payment.processor.default', 'Handle');
    }

    return {
        redirectUrl: URLUtils.https('Checkout-Begin', 'stage', 'placeOrder'),
        gp_token: gptokenInfo,
        paymentData: paymentData,
        contactEmail: contactEmail
    };
}

/**
* Creates the request object for Aurus Pay Auth web call
* @param {Object} params - used to pass down custom prefs
* @returns {JSON} - Auth request JSON object
*/
function createAuthReqBodyApplePay(params) {
    var jsBody = {
        TransRequest: {
            AurusPayTicketNum: '',
            BillingAddress: params.BillingAddress,
            CardType: '',
            CurrencyCode: currencyCode,
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier'), // custom pref
            EcommerceIndicator: 'Y',
            ECOMMInfo: params.ECOMMInfo,
            InvoiceNumber: params.orderNo,
            KI: '',
            LanguageIndicator: '00',
            Level3ProductsData: params.Level3ProductsData,
            OrigAurusPayTicketNum: '',
            OrigTransactionIdentifier: '',
            PostAuthCount: '99',
            PostAuthSequenceNo: '00',
            ProcessorToken: '',
            ShippingAddress: params.ShippingAddress,
            SubTransType: '',
            TransactionDate: tDate,
            TransactionTime: tTime,
            TransactionType: '04',
            TransAmountDetails: params.TransAmountDetails,
            WalletIdentifier: '7'
        }
    };
    var jsonbody = JSON.stringify(jsBody);
    return jsonbody;
}
/**
* Creates request object for Aurus Pay Session Request web call
* @returns {JSON} - SessionTokenRequest Body
*/
function getSessionApplePay() {
    var jsBody = {
        SessionRequest: {
            DomainId: Site.current.getCustomPreferenceValue('Aurus_domainId') || '', // custom pref
            KI: '',
            MerchantIdentifier: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier') || '', // custom pref
            StoreId: Site.current.getCustomPreferenceValue('Aurus_storeId') || '', // custom pref
            TemplateId: '1',
            TerminalId: Site.current.getCustomPreferenceValue('Aurus_terminalId') || '', // custom pref
            TokenType: '102',
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier'),
            URLType: '4'
        }
    };
    var jsonbody = JSON.stringify(jsBody);
    return jsonbody;
}
/**
* Creates request object for Aurus Pay Session Token Request web call
* @param {Object} params - params used to pass down custom prefs
* @returns {JSON} - SessionTokenRequest Body
*/
function getSessionTokenApplePay(params) {
    try {
        var jsBody = {
            GetSessionTokenRequest: {
                CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier') || '', // custom pref
                ProfileId: '',
                TransactionTime: tTime,
                WalletToken: '',
                MerchantSessionId: '',
                CartId: '',
                PaymentToken: {
                    billingContact: {
                        country: params.order.billingAddress.countryCode.displayValue,
                        countryCode: params.order.billingAddress.countryCode.value.toUpperCase(),
                        postalCode: params.order.billingAddress.postalCode,
                        familyName: params.order.billingAddress.lastName,
                        givenName: params.order.billingAddress.firstName,
                        locality: params.order.billingAddress.city,
                        addressLines: [params.order.billingAddress.address1],
                        administrativeArea: params.order.billingAddress.stateCode
                    },
                    shippingContact: {
                        country: params.order.defaultShipment.shippingAddress.countryCode.displayValue,
                        emailAddress: params.order.customerEmail,
                        phoneNumber: params.order.defaultShipment.shippingAddress.phone,
                        countryCode: params.order.defaultShipment.shippingAddress.countryCode.value.toUpperCase(),
                        postalCode: params.order.defaultShipment.shippingAddress.postalCode,
                        familyName: params.order.defaultShipment.shippingAddress.lastName,
                        givenName: params.order.defaultShipment.shippingAddress.firstName,
                        locality: params.order.defaultShipment.shippingAddress.city,
                        addressLines: [params.order.defaultShipment.shippingAddress.address1],
                        administrativeArea: params.order.defaultShipment.shippingAddress.stateCode
                    },
                    token: params.event.payment.token
                },
                ECOMMInfo: {
                    StoreId: Site.current.getCustomPreferenceValue('Aurus_storeId') || '', // custom pref
                    MerchantIdentifier: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier') || '', // custom pref
                    TerminalId: Site.current.getCustomPreferenceValue('Aurus_terminalId') || '' // custom pref
                },
                WalletIdentifier: '7',
                SessionId: params.sessionId,
                TransactionDate: tDate
            }
        };
        var jsonbody = JSON.stringify(jsBody);
        return jsonbody;
    } catch (err) {
        var error = err.toString();
        Logger.info(error);
        return false;
    }
}

module.exports = {
    getSessionReqBody: createSessionReqBody,
    createAuthReqBody: createAuthReqBody,
    getPayPalTokenReqBody: createBillerTokenReqBody,
    returnFromPaypal: returnFromPaypal,
    getSessionTokenReqBody: createSessionTokenReqBody,
    returnFromGooglePay: returnFromGooglePay,
    getGooglePaySessionTokenReqBody: createGooglePaySessionTokenReqBody,
    getSessionApplePay: getSessionApplePay,
    getApplePaySessionTokenReqBody: createApplePaySessionTokenReqBody,
    createAuthReqBodyApplePay: createAuthReqBodyApplePay,
    getSessionTokenApplePay: getSessionTokenApplePay,
    getPayPalReqBody: createPayPalSessionReqBody,
    getApplePayReqBody: createApplePaySessionReqBody,
    createPaypalAuthReqBody: createPayPalAuthReqBody,
    createPaymentInstrument: createPaymentInstrument,
    getGooglePayReqBody: createGooglePaySessionReqBody,
    createGooglePayAuthReqBody: createGooglePayAuthReqBody
};
