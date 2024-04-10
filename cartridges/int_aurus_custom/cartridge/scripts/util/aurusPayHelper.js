'use strict';

// API Includes
var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var errorLogger = require('dw/system/Logger').getLogger('OrderFail', 'OrderFail');
var Logger = require('dw/system/Logger').getLogger('AurusPayHelper', 'AurusPayHelper');
var LogHelper = require('*/cartridge/scripts/util/loggerHelper');
var LoggerHelper = require('*/cartridge/scripts/util/loggerHelper.js');
var Order = require('dw/order/Order');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');

var base = module.superModule;

// Const variables
const intent = 'AUTHORIZE';
const softDescriptor = 'ECHI5786786';
const auruspayPaypal = 'AURUSPAY_PAYPAL';

/* global dw, session, request, result:true */

var tDate = StringUtils.formatCalendar(new Calendar(), 'MMddyyyy');
var tTime = StringUtils.formatCalendar(new Calendar(), 'HHmmss');
const ANDROID_TERMINAL_ID = 'ANDROID';
const IOS_TERMINAL_ID = 'IOS';

/**
* Retrieves Auruspay Currency Code
* @param {string} siteCurrency Currency code set in the Site configurations
* @returns {string} - Return Aurus currency Code
*/
function getAurusCurrencyCode(siteCurrency) {
    var aurusCurrencyCodeObj = {
        CAD: '124',
        USD: '840',
        MXN: '484'
    };
    return aurusCurrencyCodeObj[siteCurrency];
}

/**
* Sets terminal ID based on device type
* @param {Object} basket - customer basket
*/
function setTerminalIDSession(basket) {
    try {
        var value = request.getHttpHeaders().get('x-uacapi-client-type');
        Transaction.wrap(function () {
            if (value) {
                // eslint-disable-next-line no-param-reassign
                basket.custom.aurusTerminalID = value;
            }
        });
    } catch (error) {
        errorLogger.error('setTerminalIDSession updateResponse {0} : {1}', JSON.stringify(error), LogHelper.getLoggingObject());
        Logger.error('setTerminalIDSession updateResponse {0}', JSON.stringify(error));
    }
}

/**
* Retrieves terminal ID based on device type
* @param {Object} lineItemCtnr - customer basket
* @returns {string|null} terminalID - terminal ID
*/
function getTerminalID(lineItemCtnr) {
    var terminalID = Site.current.getCustomPreferenceValue('Aurus_terminalId');
    try {
        if (!lineItemCtnr) {
            var BasketMgr = require('dw/order/BasketMgr');
            // eslint-disable-next-line no-param-reassign
            lineItemCtnr = BasketMgr.getCurrentBasket();
        }
        Logger.info('getTerminalID lineItemCtnr {0}', lineItemCtnr);
        if (lineItemCtnr && lineItemCtnr.custom.aurusTerminalID === ANDROID_TERMINAL_ID) {
            terminalID = Site.current.getCustomPreferenceValue('Aurus_terminalId_Android');
        } else if (lineItemCtnr && lineItemCtnr.custom.aurusTerminalID === IOS_TERMINAL_ID) {
            terminalID = Site.current.getCustomPreferenceValue('Aurus_terminalId_IOS');
        }
    } catch (error) {
        errorLogger.error('getTerminalID {0} : {1}', JSON.stringify(error), LogHelper.getLoggingObject());
        Logger.error('getTerminalID updateResponse {0} :: customer browser details : {1} :: customer authenticated : {2}', JSON.stringify(error), request.httpUserAgent, session.customerAuthenticated);
    }

    Logger.info('getTerminalID terminalID {0}', terminalID);
    return terminalID;
}

/**
* Retrieves Auruspay Currency Code
* @param {Object} authResult - authorization Result object
* @returns {Object} transData - transaction data
*/
function getTransData(authResult) {
    var transData;
    try {
        transData = authResult.TransResponse.TransDetailsData.TransDetailData;
    } catch (e) {
        errorLogger.error('getTransData {0} : {1}', JSON.stringify(e), LogHelper.getLoggingObject());
        Logger.error('ERROR: Error in getTransData method :: {0}', e.message);
    }
    return transData || {};
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
* @returns {JSON} - Session Id request JSON object
*/
function createSessionReqBody() {
    var jsBody = {
        SessionRequest: {
            CardExpiryDate: '',
            CardIdentifier: '',
            CardNumber: '',
            CardType: '',
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier') || '', // custom pref
            DomainId: Site.current.getCustomPreferenceValue('Aurus_domainId') || '', // custom pref
            KI: '',
            MerchantIdentifier: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier') || '',
            StoreId: Site.current.getCustomPreferenceValue('Aurus_storeId') || '', // custom pref
            TemplateId: '1', // determines which CC form is retrieved
            TerminalId: getTerminalID() || '', // custom pref
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
function createCreditSessionReqBody() {
    var jsBody = {
        SessionRequest: {
            CardExpiryDate: '',
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier') || '', // custom pref
            DomainId: Site.current.getCustomPreferenceValue('Aurus_domainId') || '', // custom pref
            KI: '',
            MerchantIdentifier: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier') || '',
            StoreId: Site.current.getCustomPreferenceValue('Aurus_storeId') || '', // custom pref
            TemplateId: '1', // determines which CC form is retrieved
            TerminalId: getTerminalID() || '', // custom pref
            TokenType: '102',
            URLType: '4'
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
            CRMToken: params.CRMToken,
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
* Creates the request object for Aurus Pay Session ID web call
* @param {Object} order - order object
* @returns {JSON} - Session Id request JSON object
*/
function createAltPaymentSessionReqBody(order) {
    var jsBody = {
        SessionRequest: {
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier') || '', // custom pref
            DomainId: Site.current.getCustomPreferenceValue('Aurus_domainId') || '', // custom pref
            MerchantIdentifier: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier') || '',
            StoreId: Site.current.getCustomPreferenceValue('Aurus_storeId') || '', // custom pref
            TemplateId: '1', // determines which CC form is retrieved
            TerminalId: getTerminalID(order) || '', // custom pref
            TokenType: '102',
            URLType: '4',
            AlternatePaymentMatrix: Site.current.getCustomPreferenceValue('Alternate_Payment_Matrix') || ''
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
function createCreditAuthReqBody(params) {
    var jsBody = {
        TransRequest: {
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier') || '', // custom pref
            TransactionDate: tDate,
            TransactionTime: tTime,
            CurrencyCode: getAurusCurrencyCode(params.currencyCode),
            CardType: params.cardType,
            SubCardType: '',
            ThirdPartyURL: 'www.aurus.com',
            CardExpiryDate: params.cardExpiryDate,
            ECOMMInfo: params.ECOMMInfo,
            TransactionType: '04',
            CRMToken: params.CRMToken,
            BillingAddress: params.BillingAddress,
            TransAmountDetails: params.TransAmountDetails,
            InvoiceNumber: params.orderNo
        }
    };
    var jsonbody = JSON.stringify(jsBody);
    return jsonbody;
}

/**
* Creates items object for alt payments consumer object
* @param {Object} basket product line items in the basket
* @returns {Array} - Array for all product line items in the basket
*/
function getItemsArray(basket) {
    var allLineItems = basket.getAllLineItems();
    var collections = require('*/cartridge/scripts/util/collections');
    var lineItems = [];
    var itemObject = {};
    collections.forEach(allLineItems, function (item) {
        if (item instanceof dw.order.ProductLineItem) {
            itemObject = {
                reference: item.productID,
                name: item.productName,
                quantity: item.quantity.value,
                totalAmount: item.price.value,
                type: 'physical',
                price: {
                    amount: item.price.value / item.quantity.value,
                    currency: item.price.currencyCode
                }
            };
            lineItems.push(itemObject);
        } else if (item instanceof dw.order.ShippingLineItem) {
            itemObject = {
                reference: item.ID,
                name: item.lineItemText,
                quantity: '1',
                totalAmount: item.price.value,
                type: 'physical',
                price: {
                    amount: item.price.value,
                    currency: item.price.currencyCode
                }
            };
            lineItems.push(itemObject);
        } else if (item instanceof dw.order.PriceAdjustment) {
            itemObject = {
                reference: item.promotionID,
                name: item.lineItemText,
                quantity: item.quantity,
                totalAmount: item.netPrice.value,
                type: 'discount',
                price: {
                    amount: item.netPrice.value / item.quantity,
                    currency: item.netPrice.currencyCode
                }
            };
            lineItems.push(itemObject);
        }
    });
    var taxObject = {
        reference: 'Total_Tax',
        name: 'Tax',
        quantity: '1',
        totalAmount: basket.totalTax.value,
        type: 'sales_tax',
        price: {
            amount: basket.totalTax.value,
            currency: basket.currencyCode
        }
    };
    lineItems.push(taxObject);
    return lineItems;
}

/**
* Validates and returns billing address phone
* @param {Object} req - current server request
* @param {Object} basket - current cutomer basket object
* @returns {string} - phone or empty string
*/
function getBillingPhone(req, basket) {
    var phone = basket.billingAddress && !empty(basket.billingAddress.phone) ? basket.billingAddress.phone : req.querystring.phone || '';
    if (phone.toString().length < 10) {
        phone = '';
    }
    return phone;
}

/**
* Creates Consumer object for Alt payment methods
* @param {Object} req current server request
* @param {Object} basket current cutomer basket object
* @param {string} orderNumber orderNumber
* @returns {Object} - Consumer Object for Aurus
*/
function getAltPaymentsConsumerObject(req, basket, orderNumber) {
    var calendar = new Calendar();
    var orderNo;
    if (req.querystring.orderNoNeeded) {
        var OrderMgr = require('dw/order/OrderMgr');
        if (empty(orderNumber)) {
            orderNo = OrderMgr.createOrderNo();
            session.custom.orderNumber = orderNo;
        } else {
            session.custom.orderNumber = orderNumber;
            orderNo = orderNumber;
        }
    }
    session.custom.sessionID = req.querystring.sessionID;

    var consumerObj = {
        sessionId: req.querystring.sessionID,
        apmMatrix: Site.current.getCustomPreferenceValue('Alternate_Payment_Matrix'),
        env: Site.getCurrent().getCustomPreferenceValue('Aurus_env'),
        aurusClientId: Site.getCurrent().getCustomPreferenceValue('Aurus_clientId'),
        customer: {
            skipShippingAddress: '0',
            billing_address: {
                firstName: basket.billingAddress && !empty(basket.billingAddress.firstName) ? basket.billingAddress.firstName : '',
                lastName: basket.billingAddress && !empty(basket.billingAddress.lastName) ? basket.billingAddress.lastName : '',
                emailAddress: basket.billingAddress && !empty(basket.customerEmail) ? basket.customerEmail : req.querystring.email || '',
                street: basket.billingAddress && !empty(basket.billingAddress.address1) ? basket.billingAddress.address1 : '',
                street2: basket.billingAddress && !empty(basket.billingAddress.address2) ? basket.billingAddress.address2 : '',
                city: basket.billingAddress && !empty(basket.billingAddress.city) ? basket.billingAddress.city : '',
                state: basket.billingAddress && !empty(basket.billingAddress.stateCode) ? basket.billingAddress.stateCode : '',
                postalCode: '', // Pass an empty string as sometimes the email address is passed in this field in Klarna "create_session" calls by Aurus that causes issues. The root cause is unknown.
                countryCode: basket.billingAddress && !empty(basket.billingAddress.countryCode.value.toUpperCase()) ? basket.billingAddress.countryCode.value.toUpperCase() : '',
                phoneNumber: getBillingPhone(req, basket)
            },
            shipping_address: {
                firstName: basket.defaultShipment.shippingAddress.firstName,
                lastName: basket.defaultShipment.shippingAddress.lastName,
                emailAddress: !empty(basket.customerEmail) ? basket.customerEmail : req.querystring.email || '',
                street: basket.defaultShipment.shippingAddress.address1,
                street2: basket.defaultShipment.shippingAddress.address2,
                city: basket.defaultShipment.shippingAddress.city,
                state: basket.defaultShipment.shippingAddress.stateCode,
                postalCode: basket.defaultShipment.shippingAddress.postalCode,
                countryCode: basket.defaultShipment.shippingAddress.countryCode.value.toUpperCase(),
                phoneNumber: !empty(basket.defaultShipment.shippingAddress.phone) ? basket.defaultShipment.shippingAddress.phone : req.querystring.phone || ''
            }
        },
        order: {
            purchaseCountry: basket.defaultShipment.shippingAddress.countryCode.value.toUpperCase(),
            purchaseCurrency: basket.currencyCode,
            locale: req.locale.id.replace('_', '-'),
            intent: intent,
            softDescriptor: softDescriptor,
            invoiceNumber: orderNo,
            client: ['desktop', 'mobile_browser'],
            request_datetime: StringUtils.formatCalendar(calendar, 'yyyy-MM-dd_HH-mm-ss-SSS'), // '2020-09-16T21:06:16.61',
            language_code: 'ES',
            merchant_currency_code: 'USD',
            items: getItemsArray(basket),
            tax_amount: {
                amount: basket.totalTax.value,
                currency: basket.currencyCode
            },
            order_amount: {
                amount: basket.totalGrossPrice.value,
                currency: basket.totalGrossPrice.currencyCode
            },
            merchant: {
                payment_error_url: URLUtils.abs('AurusPay-SafetyPayErrorCallback').toString(),
                payment_ok_url: URLUtils.abs('AurusPay-SafetyPayCallback').toString(),
                callBackUrl: '',
                merchant_set_pay_amount: true
            },
            shopper: {
                phone: {
                    phone_type: Site.current.getCustomPreferenceValue('shopperPhoneType') || 'mobile',
                    phone_country_code: Site.current.getCustomPreferenceValue('shopperPhoneCountryCode') || '+1',
                    phone_number: !empty(basket.billingAddress.phone) ? basket.billingAddress.phone : req.querystring.phone || '',
                    is_sms_enabled: false
                },
                shopper_type: Site.current.getCustomPreferenceValue('shopperType'),
                first_name: basket.defaultShipment.shippingAddress.firstName,
                last_name: basket.defaultShipment.shippingAddress.lastName
            }
        },
        paymentMethod: Site.getCurrent().getCustomPreferenceValue('Aurus_klarnaPaymentType')
    };

    if (consumerObj.order.purchaseCountry === 'UNITED STATES') {
        consumerObj.order.purchaseCountry = 'US';
    }
    if (consumerObj.customer.billing_address.countryCode === 'UNITED STATES') {
        consumerObj.customer.billing_address.countryCode = 'US';
    }
    if (consumerObj.customer.shipping_address.countryCode === 'UNITED STATES') {
        consumerObj.customer.shipping_address.countryCode = 'US';
    }
    Logger.info('consumerObj: {0}', LoggerHelper.maskPIIAuruspayInfo(JSON.stringify(consumerObj)));
    return consumerObj;
}

/**
* Creates Consumer object for Alt payment methods
* @param {Object} req current server request
* @param {Object} basket current cutomer basket object
* @returns {Object} - Consumer Object for Aurus
*/
function getPaypalConsumerObject(req, basket) {
    var consumerObj = {
        sessionId: req.querystring.sessionID,
        apmMatrix: Site.current.getCustomPreferenceValue('Alternate_Payment_Matrix'),
        env: Site.getCurrent().getCustomPreferenceValue('Aurus_env'),
        aurusClientId: Site.getCurrent().getCustomPreferenceValue('Aurus_clientId'),
        customer: {
            skipShippingAddress: '1',
            isPayPalPDP: '1'
        },
        order: {
            intent: intent,
            softDescriptor: softDescriptor,
            order_amount: {
                amount: basket.totalGrossPrice.value,
                currency: basket.currencyCode
            }
        }
    };
    if (basket.defaultShipment.shippingAddress && !empty(basket.defaultShipment.shippingAddress.postalCode)) {
        delete consumerObj.customer;
        consumerObj.customer = {
            skipShippingAddress: '0',
            billing_address: {
                firstName: basket.billingAddress && !empty(basket.billingAddress.firstName) ? basket.billingAddress.firstName : '',
                lastName: basket.billingAddress && !empty(basket.billingAddress.lastName) ? basket.billingAddress.lastName : '',
                emailAddress: basket.billingAddress && !empty(basket.customerEmail) ? basket.customerEmail : req.querystring.email || '',
                street: basket.billingAddress && !empty(basket.billingAddress.address1) ? basket.billingAddress.address1 : '',
                street2: basket.billingAddress && !empty(basket.billingAddress.address2) ? basket.billingAddress.address2 : '',
                city: basket.billingAddress && !empty(basket.billingAddress.city) ? basket.billingAddress.city : '',
                state: basket.billingAddress && !empty(basket.billingAddress.stateCode) ? basket.billingAddress.stateCode : '',
                postalCode: basket.billingAddress && !empty(basket.billingAddress.postalCode) ? basket.billingAddress.postalCode : '',
                countryCode: basket.billingAddress && !empty(basket.billingAddress.countryCode.value.toUpperCase()) ? basket.billingAddress.countryCode.value.toUpperCase() : '',
                phoneNumber: basket.billingAddress && !empty(basket.billingAddress.phone) ? basket.billingAddress.phone : req.querystring.phone || ''
            },
            shipping_address: {
                firstName: !empty(basket.defaultShipment.shippingAddress.firstName) ? basket.defaultShipment.shippingAddress.firstName : '',
                lastName: !empty(basket.defaultShipment.shippingAddress.lastName) ? basket.defaultShipment.shippingAddress.lastName : '',
                emailAddress: !empty(basket.customerEmail) ? basket.customerEmail : req.querystring.email || '',
                street: !empty(basket.defaultShipment.shippingAddress.address1) ? basket.defaultShipment.shippingAddress.address1 : '',
                street2: !empty(basket.defaultShipment.shippingAddress.address2) ? basket.defaultShipment.shippingAddress.address2 : '',
                city: !empty(basket.defaultShipment.shippingAddress.city) ? basket.defaultShipment.shippingAddress.city : '',
                state: !empty(basket.defaultShipment.shippingAddress.stateCode) ? basket.defaultShipment.shippingAddress.stateCode : '',
                postalCode: !empty(basket.defaultShipment.shippingAddress.postalCode) ? basket.defaultShipment.shippingAddress.postalCode : '',
                countryCode: !empty(basket.defaultShipment.shippingAddress.countryCode) ? basket.defaultShipment.shippingAddress.countryCode.value.toUpperCase() : '',
                phoneNumber: !empty(basket.defaultShipment.shippingAddress.phone) ? basket.defaultShipment.shippingAddress.phone : req.querystring.phone || ''
            },
            isPayPalPDP: '1'
        };
    }
    return consumerObj;
}

/**
* Creates request object for Aurus Pay Biller Token web call
* @param {Object} params - contains shipping address, shpping address2, etc
* @returns {JSON} - jsonbody - body of request
*/
function createBillerTokenReqBody(params) {
    var shippingAddress = params.shippingAddress;
    var jsBody = {
        GetBillerTokenRequest: {
            ADSDKSpecVer: '6.13.8',
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier') || '',
            SessionId: params.sessionId,
            TransactionType: '80',
            TransactionTime: tTime,
            TransactionDate: tDate,
            WalletIdentifier: '4',
            SubWalletIdentifier: '4',
            ECOMMInfo: {
                StoreId: Site.current.getCustomPreferenceValue('Aurus_storeId') || '',
                MerchantIdentifier: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier') || '',
                TerminalId: getTerminalID() || ''
            },
            WalletObject: {
                intent: 'AUTHORIZE',
                processing_instruction: 'ORDER_SAVED_EXPLICITLY',
                purchase_units: [{
                    amount: {
                        currency_code: params.currency,
                        value: params.amount
                    }
                }]
            }
        }
    };

    if (shippingAddress) {
        // eslint-disable-next-line
        jsBody.GetBillerTokenRequest.WalletObject['shipping_address'] = {
            line1: shippingAddress.address,
            line2: shippingAddress.address2,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postal_code: shippingAddress.postal,
            country_code: shippingAddress.country,
            recipient_name: shippingAddress.firstName + ' ' + shippingAddress.lastName
        };
    }

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
    /* eslint-enable no-param-reassign */
    var jsBody = {
        GetSessionTokenRequest: {
            CartId: '',
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier'),
            ECOMMInfo: {
                StoreId: Site.current.getCustomPreferenceValue('Aurus_storeId') || '',
                MerchantIdentifier: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier') || '',
                TerminalId: getTerminalID() || ''
            },
            MerchantSessionId: '',
            ProfileId: '',
            SessionId: sessionId,
            TransactionTime: tTime,
            TransactionDate: tDate,
            WalletIdentifier: '4',
            SubWalletIdentifier: '4',
            WalletToken: baToken
        }
    };
    var jsonbody = JSON.stringify(jsBody);
    return jsonbody;
}
/**
* Creates the request object for Aurus Pay - Klarna Auth call
* @param {Object} params used to pass down custom prefs
* @returns {JSON} - Auth request JSON object
*/
function createKlarnaAuthReqBody(params) {
    var jsBody = {
        TransRequest: {
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier') || '', // custom pref
            EcommerceIndicator: 'Y',
            ShippingAddress: params.ShippingAddress,
            TransactionDate: tDate,
            TransactionTime: tTime,
            OrigTransactionIdentifier: '',
            LanguageIndicator: '00',
            OrigAurusPayTicketNum: '',
            CurrencyCode: getAurusCurrencyCode(params.currencyCode),
            ECOMMInfo: params.ECOMMInfo,
            WalletIdentifier: '14',
            SubWalletIdentifier: '',
            TransactionType: '04',
            SubTransType: '33',
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
* Creates the request object for Aurus Pay Auth web call
* @param {Object} params - used to pass down custom prefs
* @returns {JSON} - Auth request JSON object
*/
function createAuthReqBodyApplePay(params) {
    var jsBody = {
        TransRequest: {
            TransactionType: '04',
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier') || '', // custom pref
            EcommerceIndicator: 'Y',
            Level3ProductsData: params.Level3ProductsData,
            LanguageIndicator: '00',
            BillingAddress: params.BillingAddress,
            CurrencyCode: getAurusCurrencyCode(params.currencyCode),
            InvoiceNumber: params.orderNo,
            TransactionDate: tDate,
            ProcessorToken: '',
            ECOMMInfo: params.ECOMMInfo,
            TransactionTime: tTime,
            TransAmountDetails: params.TransAmountDetails,
            ShippingAddress: params.ShippingAddress,
            SubWalletIdentifier: '',
            WalletIdentifier: '7'
        }
    };
    var jsonbody = JSON.stringify(jsBody);
    return jsonbody;
}

/**
 * Return From Paypal Function
 * @param {Object} basket - Basket
 * @param {Object} req - Current Request Object
 * @returns {string} redirectURL - url redirect for return from paypal
 * @returns {string} ba_token - ba_token value
 * @returns {string} token - token value
 */
function returnFromPaypal(basket, req) {
    var PaymentMgr = require('dw/order/PaymentMgr');
    var HookMgr = require('dw/system/HookMgr');
    var sessionTokenResponse = JSON.parse(req.querystring.sessionTokenResponse);
    var isFromCart = req.querystring.isFromCart === 'true';
    var ott = sessionTokenResponse.GetSessionTokenResponse.ECOMMInfo.OneTimeToken;
    var payWallet = sessionTokenResponse.GetSessionTokenResponse.Pay_Wallet;
    var payWalletObj = JSON.parse(payWallet);
    if (!basket) {
        return {
            redirectUrl: URLUtils.url('Cart-Show').toString()
        };
    }
    var processor = PaymentMgr.getPaymentMethod('PayPal').getPaymentProcessor();
    if (HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
        HookMgr.callHook('app.payment.processor.' + processor.ID.toLowerCase(),
            'Handle',
            basket,
            isFromCart
        );
    } else {
        HookMgr.callHook('app.payment.processor.default', 'Handle');
    }
    var paymentInstruments = basket.getPaymentInstruments();

    var iterator = paymentInstruments.iterator();
    var paypalPaymentInstrument = null;
    while (iterator.hasNext()) {
        var paymentInstrument = iterator.next();
        var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());
        if (paymentMethod) {
            var paymentProcessorId = paymentMethod.getPaymentProcessor().getID();
            if (paymentProcessorId === auruspayPaypal) {
                paypalPaymentInstrument = paymentInstrument;
            }
        }
    }

    Transaction.wrap(function () {
        if (customer.authenticated) {
            basket.setCustomerEmail(customer.getProfile().getEmail());
        } else {
            basket.setCustomerEmail(payWalletObj.payer.email_address);
        }

        var payerEmail;
        if (customer.authenticated) {
            payerEmail = customer.getProfile().getEmail();
        } else if (payWalletObj.payer && payWalletObj.payer.email_address) {
            payerEmail = payWalletObj.payer.email_address;
        } else if (payWalletObj.payee && payWalletObj.payee.email_address) {
            payerEmail = payWalletObj.payee.email_address;
        }

        paypalPaymentInstrument.custom.paypalPayerID = !empty(payWalletObj.payer.payer_id) ? payWalletObj.payer.payer_id : '';
        paypalPaymentInstrument.custom.paypalEmail = payerEmail;
        paypalPaymentInstrument.custom.paypalToken = ott;
        paypalPaymentInstrument.custom.paypalPaymentStatus = payWalletObj.status;

        basket.custom.paypalAlreadyHandledPayerID = !empty(payWalletObj.payer.payer_id) ? payWalletObj.payer.payer_id : ''; // eslint-disable-line
        basket.custom.paypalAlreadyHandledToken = ott; // eslint-disable-line
        basket.custom.paypalAlreadyHandledEmail = payWalletObj.payer.email_address; // eslint-disable-line

        var ppAPIShippingAddressOverride = Site.getCurrent().getCustomPreferenceValue('PP_API_ShippingAddressOverride');
        if (!ppAPIShippingAddressOverride || isFromCart) {
            // Set Shipping Address
            var shippingAddress = basket.getDefaultShipment().getShippingAddress();
            Transaction.wrap(function () {
                if (!shippingAddress) {
                    shippingAddress = basket.getDefaultShipment().createShippingAddress();
                }
            });
            shippingAddress.setFirstName(sessionTokenResponse.GetSessionTokenResponse.ShippingAddress.ShippingFirstName);
            if (!empty(sessionTokenResponse.GetSessionTokenResponse.ShippingAddress.ShippingLastName)) {
                shippingAddress.setLastName(sessionTokenResponse.GetSessionTokenResponse.ShippingAddress.ShippingLastName);
            }
            shippingAddress.setAddress1(sessionTokenResponse.GetSessionTokenResponse.ShippingAddress.ShippingAddressLine1);
            shippingAddress.setAddress2(sessionTokenResponse.GetSessionTokenResponse.ShippingAddress.ShippingAddressLine2);
            shippingAddress.setCity(sessionTokenResponse.GetSessionTokenResponse.ShippingAddress.ShippingCity);
            shippingAddress.setPhone(sessionTokenResponse.GetSessionTokenResponse.ShippingAddress.ShippingMobileNumber);
            shippingAddress.setPostalCode(sessionTokenResponse.GetSessionTokenResponse.ShippingAddress.ShippingZip);
            shippingAddress.setCountryCode(sessionTokenResponse.GetSessionTokenResponse.ShippingAddress.ShippingCountry);
            shippingAddress.setStateCode(sessionTokenResponse.GetSessionTokenResponse.ShippingAddress.ShippingState);
        }
        var billingAddress = basket.getBillingAddress();
        var requestBillingAddressFromPayPal = Site.getCurrent().getCustomPreferenceValue('PP_API_RequestBillingAddressFromPayPal');
        var billingAddressOverride = Site.getCurrent().getCustomPreferenceValue('PP_API_BillingAddressOverride');
        if (isFromCart || !billingAddress || (requestBillingAddressFromPayPal && billingAddressOverride)) {
            // Set Billing Address
            Transaction.wrap(function () {
                if (!billingAddress) {
                    billingAddress = basket.createBillingAddress();
                }
            });
            billingAddress.setFirstName(sessionTokenResponse.GetSessionTokenResponse.BillingAddress.BillingFirstName);
            if (!empty(sessionTokenResponse.GetSessionTokenResponse.BillingAddress.BillingLastName)) {
                billingAddress.setLastName(sessionTokenResponse.GetSessionTokenResponse.BillingAddress.BillingLastName);
            }
            billingAddress.setAddress1(sessionTokenResponse.GetSessionTokenResponse.BillingAddress.BillingAddressLine1);
            billingAddress.setCity(sessionTokenResponse.GetSessionTokenResponse.BillingAddress.BillingCity);
            billingAddress.setPostalCode(sessionTokenResponse.GetSessionTokenResponse.BillingAddress.BillingZip);
            billingAddress.setCountryCode(sessionTokenResponse.GetSessionTokenResponse.BillingAddress.BillingCountry);
            billingAddress.setStateCode(sessionTokenResponse.GetSessionTokenResponse.BillingAddress.BillingState);
            billingAddress.setPhone(sessionTokenResponse.GetSessionTokenResponse.BillingAddress.BillingMobileNumber);
        }
    });
    // Set Shipping Method
    var shippingAddress = basket.getDefaultShipment().getShippingAddress();
    var defaultShipment = basket.getDefaultShipment();
    var address = {};
    address.countryCode = shippingAddress.countryCode.value;
    address.stateCode = shippingAddress.stateCode;
    address.postalCode = shippingAddress.postalCode;
    address.city = shippingAddress.city;
    address.address1 = shippingAddress.address1;
    address.address2 = shippingAddress.address2;
    var shippingHelpers = require('app_ua_core/cartridge/scripts/checkout/shippingHelpers');
    var applicableShippingMethods = shippingHelpers.getApplicableShippingMethods(defaultShipment, address);
    if (applicableShippingMethods.length > 0) {
        var isApplicableShippingMethod = false;
        if (defaultShipment.getShippingMethod()) {
            for (var i = 0; i < applicableShippingMethods.length; i++) {
                if (defaultShipment.getShippingMethod().getID().equals(applicableShippingMethods[i].ID)) {
                    isApplicableShippingMethod = true;
                    break;
                }
            }
        }
        // set first applicable shipping method if the selected shipping method is not applicable or no shipping method is set to the shipment
        if (!isApplicableShippingMethod || !defaultShipment.getShippingMethod()) {
            Transaction.wrap(function () {
                defaultShipment.setShippingMethod(applicableShippingMethods[0].raw);
            });
        }
    }
    // Set Address Type
    if (shippingAddress && empty(shippingAddress.custom.addressType)) {
        require('*/cartridge/modules/providers').get('AddressType', shippingAddress).addressType();
    }

    return {
        redirectUrl: URLUtils.https('Checkout-Begin', 'stage', 'placeOrder'),
        ott: ott,
        payWallet: payWallet
    };
}

/**
* Creates the request object for Aurus Pay - PayPal Auth call
* @param {Object} params used to pass down custom prefs
* @returns {JSON} - Auth request JSON object
*/
function createPaypalAuthReqBody(params) {
    var jsBody = {
        TransRequest: {
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier') || '', // custom pref
            ShippingAddress: params.ShippingAddress,
            TransactionDate: tDate,
            TransactionTime: tTime,
            OrigTransactionIdentifier: '',
            LanguageIndicator: '00',
            OrigAurusPayTicketNum: '',
            CurrencyCode: getAurusCurrencyCode(params.currencyCode),
            ECOMMInfo: params.ECOMMInfo,
            WalletIdentifier: '4',
            SubWalletIdentifier: '4',
            TransactionType: '04',
            SubTransType: '33',
            BillingAddress: params.BillingAddress,
            TransAmountDetails: params.TransAmountDetails,
            InvoiceNumber: params.orderNo
        }
    };
    var jsonbody = JSON.stringify(jsBody);
    return jsonbody;
}

/**
* Creates request object for Aurus Pay Session Token Request web call
* @param {Object} params - sessionId, baToken
* @returns {JSON} - SessionTokenRequest Body
*/
function createKlarnaSessionTokenReqBody(params) {
    /* eslint-disable no-param-reassign */
    var baToken = params.baToken || session.privacy.ba_token;
    /* eslint-enable no-param-reassign */
    var jsBody = {
        GetSessionTokenRequest: {
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier'),
            ECOMMInfo: {
                StoreId: Site.current.getCustomPreferenceValue('Aurus_storeId') || '',
                MerchantIdentifier: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier') || '',
                TerminalId: getTerminalID() || ''
            },
            SessionId: params.sessionId,
            TransactionTime: tTime,
            TransactionDate: tDate,
            SubwalletIdentifier: '',
            WalletIdentifier: '14',
            WalletToken: baToken
        }
    };
    var jsonbody = JSON.stringify(jsBody);
    return jsonbody;
}

/**
* Creates request oject for Aurus Klarna Biller Token web call
* @param {Object[]} params - basket response, session id
* @returns {JSON} - Auth request JSON object
*/
function createKlarnaBillerTokenReqBody(params) {
    var basket = params.basketResponse;
    if (!basket) {
        var BasketMgr = require('dw/order/BasketMgr');
        basket = BasketMgr.getCurrentBasket();
    }

    var taxTotal;
    var orderTotal;
    var shippingTotal;
    var shippingDiscount = 0;
    var orderLines = [];
    var collections = require('*/cartridge/scripts/util/collections');

    try {
        var productItems;
        if (basket && basket instanceof dw.order.Basket) {
            productItems = basket.productLineItems;
            for (var j = 0; j < productItems.length; j++) {
                var productLineItem = productItems[j];

                var productLineItemPrice = productLineItem.getProratedPrice().getValue();
                orderLines.push({
                    reference: productLineItem.productID,
                    name: productLineItem.productName,
                    quantity: productLineItem.quantityValue.toString(),
                    unit_price: (productLineItemPrice / productLineItem.quantityValue).toString(),
                    tax_rate: productLineItem.taxRate.toString(),
                    total_amount: productLineItemPrice.toString(),
                    total_discount_amount: '0',
                    type: 'physical',
                    total_tax_amount: '0'
                });
            }
        } else if (basket && 'product_items' in basket) {
            productItems = basket.product_items;
            for (var i = 0; i < productItems.length; i++) {
                var productItem = productItems[i];

                var productPrice = productItem.price;
                var price = 0;
                if (productItem.price_adjustments && productItem.price_adjustments.length) {
                    // eslint-disable-next-line no-loop-func
                    collections.forEach(productItem.price_adjustments, function (priceAdjustment) {
                        price += priceAdjustment.price.value;
                    });
                }
                productPrice += price;
                orderLines.push({
                    reference: productItem.product_id,
                    name: productItem.product_name,
                    quantity: productItem.quantity.toString(),
                    unit_price: (productPrice / productItem.quantity).toString(),
                    tax_rate: productItem.tax_rate.toString(),
                    total_amount: productPrice.toString(),
                    total_discount_amount: '0',
                    type: 'physical',
                    total_tax_amount: '0'
                });
            }
        }

        if (basket && basket instanceof dw.order.Basket) {
            shippingTotal = basket.getShippingTotalPrice().getValue().toString();
            taxTotal = basket.totalTax.getValue().toString();
            orderTotal = basket.totalGrossPrice.getValue().toString();

            // eslint-disable-next-line no-loop-func
            collections.forEach(basket.allShippingPriceAdjustments, function (priceAdjustment) {
                shippingDiscount += priceAdjustment.price;
            });
        } else if (basket) {
            shippingTotal = basket.shipping_total.toString();
            taxTotal = basket.tax_total.toString();
            orderTotal = basket.order_total.toString();
        }

        if (shippingTotal) {
            orderLines.push({
                name: 'shipping',
                type: 'physical',
                quantity: '1',
                unit_price: shippingTotal,
                total_amount: shippingTotal
            });
        }

        if (!orderTotal || orderTotal === 0 || orderTotal === '0') {
            return null;
        }

        if (shippingDiscount) {
            orderLines.push({
                name: 'shippingDiscount',
                type: 'physical',
                quantity: '1',
                unit_price: shippingDiscount,
                total_amount: shippingDiscount
            });
        }

        orderLines.push({
            type: 'sales_tax',
            name: 'Tax',
            quantity: '1',
            unit_price: taxTotal,
            total_amount: taxTotal
        });

        Logger.info('orderLines: {0}', JSON.stringify(orderLines));
    } catch (error) {
        errorLogger.error('createKlarnaBillerTokenReqBody {0} : {1}', JSON.stringify(error), LogHelper.getLoggingObject());
        Logger.error('GetBillerTokenRequest' + JSON.stringify(error));
    }

    var jsBody = {
        GetBillerTokenRequest: {
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier') || '',
            ECOMMInfo: {
                StoreId: Site.current.getCustomPreferenceValue('Aurus_storeId') || '',
                MerchantIdentifier: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier') || '',
                TerminalId: getTerminalID(basket) || ''
            },
            TransactionTime: tTime,
            TransactionDate: tDate,
            SessionId: params.sessionId,
            TransactionType: '80',
            WalletIdentifier: '14',
            WalletObject: {
                purchase_country: basket.defaultShipment && basket.defaultShipment.shippingAddress ? basket.defaultShipment.shippingAddress.countryCode.value.toUpperCase() : '',
                purchase_currency: basket.currencyCode,
                locale: 'en-US',
                order_amount: orderTotal,
                order_tax_amount: taxTotal,
                order_lines: orderLines
            }
        }
    };

    if (jsBody.GetBillerTokenRequest.WalletObject.purchase_country === 'UNITED STATES') {
        jsBody.GetBillerTokenRequest.WalletObject.purchase_country = 'US';
    }

    if (!jsBody.GetBillerTokenRequest.WalletObject.purchase_country) {
        var siteId = Site.getCurrent().getID();
        if (siteId === 'US' || siteId === 'CA') {
            jsBody.GetBillerTokenRequest.WalletObject.purchase_country = siteId;
        }
    }

    var jsonbody = JSON.stringify(jsBody);
    return jsonbody;
}

/**
 * Save credit card data to user's wallet
 * @param {Object} authResult - API response
 * @param {Object} creditCardFields - form fields
 * @param {Object} scope - is OCAPI
 * @param {Object} paymentInstrument - payment instrument of basket
 */
function saveCustomerCreditCard(authResult, creditCardFields, scope, paymentInstrument) {
    if (customer.registered && customer.authenticated && !empty(customer.profile)) {
        var wallet = customer.profile.getWallet();
        var creditCards = wallet.getPaymentInstruments('AURUS_CREDIT_CARD').iterator();

        Transaction.wrap(function () {
            var newCreditCard = wallet.createPaymentInstrument('AURUS_CREDIT_CARD');

            if (scope && scope === 'OCAPI') {
                newCreditCard.creditCardHolder = paymentInstrument.creditCardHolder;
            } else {
                newCreditCard.creditCardHolder = authResult.TransResponse.TransDetailsData.TransDetailData.CustomerName;
            }
            newCreditCard.creditCardType = authResult.TransResponse.TransDetailsData.TransDetailData.CardType;
            newCreditCard.creditCardNumber = authResult.TransResponse.TransDetailsData.TransDetailData.CardNumber.replace(/X/g, '*');
            newCreditCard.creditCardExpirationMonth = authResult.TransResponse.TransDetailsData.TransDetailData.CardExpiryDate.substring(0, 2);
            newCreditCard.creditCardExpirationYear = authResult.TransResponse.TransDetailsData.TransDetailData.CardExpiryDate.substring(2, 4);
            newCreditCard.custom.defaultPaymentCard = paymentInstrument.custom.defaultPaymentCard;
            newCreditCard.creditCardToken = authResult.TransResponse.TransDetailsData.TransDetailData.CardIdentifier != null ? authResult.TransResponse.TransDetailsData.TransDetailData.CardIdentifier : '';

            while (creditCards.hasNext()) {
                var creditCard = creditCards.next();
                if (paymentInstrument.custom.defaultPaymentCard && creditCard.custom.defaultPaymentCard) {
                    creditCard.custom.defaultPaymentCard = false;
                }
                if (creditCard.creditCardNumberLastDigits === newCreditCard.creditCardNumberLastDigits &&
                    creditCard.creditCardType === newCreditCard.creditCardType) {
                    wallet.removePaymentInstrument(creditCard);
                }
            }
        });
    }
}

/**
* Gets billing token
* @param {Object} params - basket response, session id
* @returns {Object} - Billing token Response
*/
function getBillingToken(params) {
    var aurusPaySvc = require('*/cartridge/scripts/services/aurusPayServices');
    var reqBody;

    if (params.payment === 'paypal') {
        reqBody = createBillerTokenReqBody(params);
    } else {
        reqBody = createKlarnaBillerTokenReqBody(params);
    }

    var serviceResponse;
    if (reqBody) {
        serviceResponse = aurusPaySvc.getBillingToken().call(reqBody);
    }

    return serviceResponse;
}

/**
* Returns the session service based on paramter
* @returns {Object} - session service
*/
function getSessionService() {
    var aurusPaySvc = require('*/cartridge/scripts/services/aurusPayServices');
    var reqBody = createSessionReqBody();
    var aurSvc = aurusPaySvc.getSessionService();
    return aurSvc.call(reqBody);
}

/**
* Returns the session id
* @returns {string} - session id
*/
function getSessionID() {
    var aurusPaySvc = require('*/cartridge/scripts/services/aurusPayServices');
    var reqBody = createAltPaymentSessionReqBody();
    var aurSvc = aurusPaySvc.getSessionService();
    var session = aurSvc.call(reqBody);
    if (session.ok) {
        session = JSON.parse(session.object.text).SessionResponse;
    } else {
        session = null;
    }

    return session.SessionId;
}

/**
* Returns the session id
* @param {Object} params - contains flag
* @returns {string} - billing token
*/
function getBillerToken(params) {
    var billingToken = getBillingToken(params);

    if (billingToken && billingToken.ok) {
        var tokenObject = JSON.parse(billingToken.object.text).GetBillerTokenResponse;

        if (params.payment === 'paypal' && tokenObject && tokenObject.ResponseText === 'APPROVAL') {
            billingToken = tokenObject && tokenObject.EcomToken ? tokenObject.EcomToken : '';
        } else if (params.payment === 'klarna' && tokenObject && tokenObject.ResponseText === 'APPROVAL') {
            billingToken = tokenObject && tokenObject.WalletObject ? tokenObject.WalletObject.client_token : '';
        } else {
            billingToken = tokenObject.ResponseText;
        }
    }

    return billingToken;
}

/**
 * This method gets the session ID and sends back in response
 *
 * @param {Object} attributes - attributes related to payments, hooks
 * @param {string} sessionID - session ID
 */
function setSession(attributes, sessionID) {
    if (attributes.payment === 'paypal') {
        session.privacy.aurusPPSession = sessionID;
    } else if (attributes.payment === 'klarna') {
        session.privacy.aurusKSession = sessionID;
    }
}

/**
 * This method gets the session ID and sends back in response
 *
 * @param {Object} basket - Current basket
 * @returns {JSON} - session object
 */
function getSession(basket) {
    var sessionId = '';
    var clientToken = '';
    var attributes = {
        payment: 'klarna'
    };

    try {
        // sessionId = klarnaPaymentInstrument && 'custom' in klarnaPaymentInstrument && 'KlarnaPaymentsSessionID' in klarnaPaymentInstrument.custom ? klarnaPaymentInstrument.custom.KlarnaPaymentsSessionID : '';
        if (!sessionId) {
            sessionId = getSessionID();
        }

        if (sessionId) {
            setSession(attributes, sessionId);
        }

        var params = {
            payment: attributes.payment,
            basketResponse: basket,
            sessionId: sessionId
        };

        // eslint-disable-next-line
        clientToken = getBillerToken(params) || '';
    } catch (e) {
        errorLogger.error('getSession {0} : {1}', JSON.stringify(e), LogHelper.getLoggingObject());
        Logger.error('ERROR: Error in getSession Method : {0}', JSON.stringify(e));
    }

    Logger.info('getSession klarna: ' + JSON.stringify({
        session_id: sessionId,
        client_token: clientToken
    }));

    return {
        session_id: sessionId,
        client_token: clientToken
    };
}

/**
 * This method gets the session ID and sends back in response
 *
 * @param {Object} basket - Current basket
 * @returns {Object} token of paypal, session id
 */
function getTokenID(basket) {
    var tokenID = '';
    var sessionID = '';
    try {
        sessionID = getSessionID();
        var attributes = {
            payment: 'paypal'
        };

        setSession(attributes, sessionID);

        var params = {
            payment: 'paypal',
            amount: basket.totalGrossPrice.value,
            currency: basket.currencyCode,
            sessionId: sessionID
        };

        // eslint-disable-next-line
        tokenID = getBillerToken(params);
    } catch (e) {
        errorLogger.error('getTokenID {0} : {1}', JSON.stringify(e), LogHelper.getLoggingObject());
        Logger.error('ERROR: Error in getSession Method :: {0}', e.message);
    }

    Logger.info('getSession paypal: ' + JSON.stringify({
        tokenID: tokenID,
        sessionID: sessionID
    }));

    return {
        tokenID: tokenID,
        sessionID: sessionID
    };
}

/**
 * This method gets the session ID and sends back in response
 *
 * @param {Object} paymentInstrument - payment instrument of basket
 * @param {Object} params - parameters to set in payment instrument
 */
function setPaymentInstrumentAttributes(paymentInstrument, params) {
    var transData = getTransData(params.authResult);
    var aurusPayTicketNum = params.authResult && params.authResult.TransResponse ? params.authResult.TransResponse.AurusPayTicketNum : '';

    Transaction.wrap(function () {
        if (params.scope === 'credit') {
            paymentInstrument.paymentTransaction.setTransactionID(params.orderNumber);

            // Here is where we set the one time order token
            /* eslint-disable no-param-reassign */
            paymentInstrument.paymentTransaction.custom.aurusPayOOT = params.aurusTokens.aurusPayOOT;
            paymentInstrument.paymentTransaction.custom.aurusPayAPTN = params.aurusTokens.aurusPayAPTN;
            paymentInstrument.paymentTransaction.custom.aurusPayAPTID = params.aurusTokens.aurusPayAPTID;
            params.order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
            /* eslint-enable no-param-reassign */
        }

        if (params.scope === 'klarna' || params.scope === 'paypal' || params.scope === 'applepay') {
            if (transData && transData.AuruspayTransactionId) {
                paymentInstrument.paymentTransaction.setTransactionID(transData.AuruspayTransactionId);
            }

            //  Here is where we set the one time order token
            /* eslint-disable no-param-reassign */
            paymentInstrument.custom.AurusProcessorToken = params.processorToken ? params.processorToken : '';
            paymentInstrument.custom.processorReferenceNumber = params.processorReferenceNumber ? params.processorReferenceNumber : '';
            paymentInstrument.paymentTransaction.custom.aurusPayOOT = params.token;
            paymentInstrument.paymentTransaction.custom.aurusPayAPTN = aurusPayTicketNum;
            paymentInstrument.paymentTransaction.custom.aurusPayAPTID = transData ? transData.AuruspayTransactionId : '';
            params.order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);

            // paymentInstrument.paymentTransaction.custom.aurusPayCID = transData ? transData.CardIdentifier : '';
            /* eslint-enable no-param-reassign */
        }

        paymentInstrument.paymentTransaction.setPaymentProcessor(params.paymentProcessor);

        /* eslint-disable no-param-reassign */
        if (params.aurusTokens && params.aurusTokens.cardIndicator) {
            paymentInstrument.custom.CardIndicator = params.aurusTokens.cardIndicator;
        }
        if (params.aurusTokens && params.aurusTokens.cvvResult) {
            paymentInstrument.custom.cvvResult = params.aurusTokens.cvvResult;
        }
        if (params.aurusTokens && params.aurusTokens.receiptToken) {
            paymentInstrument.custom.receiptToken = params.aurusTokens.receiptToken;
        }
        if (params.aurusTokens && params.aurusTokens.authAVSResult) {
            paymentInstrument.custom.authAVSResult = params.aurusTokens.authAVSResult;
        }
        paymentInstrument.custom.AccountDisplayNumber = transData ? transData.CardNumber : '';
        paymentInstrument.custom.AccountNumber = transData ? transData.ECOMMInfo.OneTimeToken : '';
        paymentInstrument.custom.CardToken = transData ? transData.CardIdentifier : '';
        paymentInstrument.custom.OneOrderToken = transData ? transData.ECOMMInfo.OneOrderToken : '';
        paymentInstrument.custom.AurusWalletIdentifier = transData ? transData.WalletIdentifier : '';
        paymentInstrument.custom.ExternalResponseId = transData ? transData.ResponseCode : '';
        paymentInstrument.custom.PaymentTransactionId = transData ? transData.AuruspayTransactionId : '';
        paymentInstrument.custom.RequestId = aurusPayTicketNum;
        paymentInstrument.custom.RequestToken = transData ? transData.TransactionIdentifier : '';
        paymentInstrument.custom.RequestedAmount = params.aurusTransAmountDetails ? params.aurusTransAmountDetails.TransactionTotal : '';
        /* eslint-enable no-param-reassign */
    });
}

/**
 * This method gets the session ID and sends back in response
 *
 * @param {dw.order.Basket} basket - SFCC Basket object
 * @param {BasketPaymentInstrumentRequest} paymentInstrumentRequest - Payment instrument request
 * @returns {Object} response - response of OOT authorize
 */
function setAurusCreditAttributes(basket, paymentInstrumentRequest) {
    var response = {
        error: false
    };
    try {
        var PaymentMgr = require('dw/order/PaymentMgr');
        var HookMgr = require('dw/system/HookMgr');
        var paymentInstruments = basket.getPaymentInstruments();
        for (var i = 0; i < paymentInstruments.length; i++) {
            var paymentInstrument = paymentInstruments[i];
            var isGiftcard = !empty(paymentInstrumentRequest) && typeof paymentInstrumentRequest === 'object' && 'paymentMethodId' in paymentInstrumentRequest && paymentInstrumentRequest.paymentMethodId === 'GIFT_CARD';
            if (!isGiftcard && (paymentInstrument.custom.ott || paymentInstrument.custom.paypalToken || paymentInstrument.custom.paymentData)) {
                var paymentProcessor = PaymentMgr
                    .getPaymentMethod(paymentInstrument.paymentMethod)
                    .paymentProcessor;
                if (HookMgr.hasHook('app.payment.processor.' +
                    paymentProcessor.ID.toLowerCase()) && (paymentProcessor.ID.toLowerCase() === 'auruspay_credit' || paymentProcessor.ID.toLowerCase() === 'auruspay_paypal' || paymentProcessor.ID.toLowerCase() === 'auruspay_applepay')) {
                    Logger.info('setAurusCreditAttributes: ' + JSON.stringify({
                        pi: paymentInstrument.paymentMethod,
                        paymentData: paymentInstrument.custom.paymentData,
                        pp: paymentProcessor.ID.toLowerCase()
                    }));
                    var authorizationResult = HookMgr.callHook(
                        'app.payment.processor.' + paymentProcessor.ID.toLowerCase(),
                        'OOTAuthorize',
                        basket,
                        paymentInstrument,
                        paymentInstrumentRequest
                    );

                    if (authorizationResult.error) {
                        response.error = true;
                        response.errorMessage = authorizationResult.serverErrors && authorizationResult.serverErrors.length ? authorizationResult.serverErrors : [];
                    }
                }
            }
        }
    } catch (error) {
        errorLogger.error('setAurusCreditAttributes {0} : {1}', JSON.stringify(error), LogHelper.getLoggingObject());
        Logger.error(JSON.stringify(error));
        response.error = true;
    }

    return response;
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
                        addressLines: [params.order.billingAddress.address1, params.order.billingAddress.address2],
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
                        addressLines: [params.order.defaultShipment.shippingAddress.address1, params.order.defaultShipment.shippingAddress.address2],
                        administrativeArea: params.order.defaultShipment.shippingAddress.stateCode
                    },
                    token: params.event.payment.token
                },
                ECOMMInfo: {
                    StoreId: Site.current.getCustomPreferenceValue('Aurus_storeId') || '', // custom pref
                    MerchantIdentifier: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier') || '', // custom pref
                    TerminalId: getTerminalID() || '' // custom pref
                },
                WalletIdentifier: '7',
                SessionId: params.sessionId,
                TransactionDate: tDate
            }
        };
        var jsonbody = JSON.stringify(jsBody);
        return jsonbody;
    } catch (err) {
        errorLogger.error('getSessionTokenApplePay {0} : {1}', JSON.stringify(err), LogHelper.getLoggingObject());
        Logger.info(JSON.stringify(err));
        return false;
    }
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
            TerminalId: getTerminalID() || '', // custom pref
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
            TerminalId: getTerminalID() || '', // custom pref
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
            TerminalId: getTerminalID() || '', // custom pref
            CardExpiry: '',
            KI: ''
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
                TerminalId: getTerminalID() || ''
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
                TerminalId: getTerminalID() || ''
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
            TerminalId: getTerminalID() || '', // custom pref
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
function createSafetyPayAuthReqBody(params) {
    var jsBody = {
        TransRequest: {
            TransactionType: '01',
            SubTransType: '33',
            CorpID: Site.current.getCustomPreferenceValue('Aurus_corporateIdentifier') || '', // custom pref
            LanguageIndicator: '00',
            BillingAddress: params.BillingAddress,
            CurrencyCode: getAurusCurrencyCode(params.currencyCode),
            InvoiceNumber: params.orderNo,
            ECOMMInfo: params.ECOMMInfo,
            TransactionDate: tDate,
            TransactionTime: tTime,
            TransAmountDetails: params.TransAmountDetails,
            SubWalletIdentifier: '',
            WalletIdentifier: '24'
        }
    };
    var jsonbody = JSON.stringify(jsBody);
    return jsonbody;
}

/**
*Takes expiry time from aurus and returns if it is expired or not
* @param {number} expiryTimeInMilliseconds - params used to check expiry time
* @returns {boolean} - returns true or false
*/
function aurusSessionExpired(expiryTimeInMilliseconds) {
    if (expiryTimeInMilliseconds && expiryTimeInMilliseconds > Date.now()) {
        return false;
    }
    return true;
}

/**
* Checks for a valid aurus session and creates a new sessiong if invalid
*/
function validateAurusSession() {
    let aurusPaySvc = require('*/cartridge/scripts/services/aurusPayServices');
    let sessionResponse;
    let sessionId = (typeof session !== 'undefined' && typeof session.privacy !== 'undefined' && typeof session.privacy.aurusSessionID !== 'undefined' ? session.privacy.aurusSessionID : null);
    // Set session expiration based custom preference setting.
    // Don't reset expire until failed.... 10 minutes = 600000 milliseconds
    let isAurusSessionExpired = (typeof session !== 'undefined' && typeof session.privacy !== 'undefined' && typeof session.privacy.aurusSessionExpirationTime !== 'undefined' ? aurusSessionExpired(session.privacy.aurusSessionExpirationTime) : false);
    let sessionValidity = 0;
    try {
        if (isAurusSessionExpired || !sessionId) {
            let reqBody = createAltPaymentSessionReqBody();
            sessionResponse = aurusPaySvc.getSessionService().call(reqBody);
            if (!empty(sessionResponse) && sessionResponse.ok) {
                let result = JSON.parse(sessionResponse.object.text);
                // Set a custom session variable
                if (result.SessionResponse && result.SessionResponse.SessionId) {
                    sessionId = result.SessionResponse.SessionId;
                    session.privacy.aurusSessionID = sessionId;
                    // Response: session_validity: Attributes 1-10N, Fixed, Conditional
                    // This field identifies the time in minutes up to which the given session id will be valid for the next transaction
                    // This parameter is used in SessionResponse API.
                    // Place 5 minute buffer for expirations
                    sessionValidity = (result.SessionResponse.SessionValidity > 5 ? ((result.SessionResponse.SessionValidity - 5) * 60000) : (result.SessionResponse.SessionValidity * 60000));
                    if (sessionValidity < 0) {
                        Logger.error('ERROR: Error while checking SessionValidity AurusPay-GetAltPaymentSession :: {0}', result.SessionResponse.SessionValidity);
                    }
                    session.privacy.aurusSessionExpirationTime = new Date(Date.now() + sessionValidity);
                }
            } else {
                sessionId = null;
                session.privacy.aurusSessionID = null;
                session.privacy.aurusSessionExpirationTime = null;
            }
        } else {
            Logger.info('INFO: AurusPay-GetAltPaymentSession isAurusSessionExpired :: {0} :: aurusSessionExpirationTime :: {1}', isAurusSessionExpired, session.privacy.aurusSessionExpirationTime);
        }
    } catch (error) {
        errorLogger.error('validateAurusSession {0} : {1}', JSON.stringify(error), LogHelper.getLoggingObject());
        Logger.error('ERROR: Error while executing validateAurusSession :: {0}', JSON.stringify(error));
    }
}

base.getPayPalTokenReqBody = createBillerTokenReqBody;
base.getGooglePayReqBody = createGooglePaySessionReqBody;
base.getApplePayReqBody = createApplePaySessionReqBody;
base.getSessionApplePay = getSessionApplePay;
base.getGooglePaySessionTokenReqBody = createGooglePaySessionTokenReqBody;
base.getApplePaySessionTokenReqBody = createApplePaySessionTokenReqBody;
base.getSessionTokenApplePay = getSessionTokenApplePay;
base.getSession = getSession;
base.getSessionID = getSessionID;
base.getBillerToken = getBillerToken;
base.getBillingToken = getBillingToken;
base.getSessionService = getSessionService;
base.getPayPalReqBody = createPayPalSessionReqBody;
base.createKlarnaAuthReqBody = createKlarnaAuthReqBody;
base.createCreditAuthReqBody = createCreditAuthReqBody;
base.createKlarnaSessionTokenReqBody = createKlarnaSessionTokenReqBody;
base.createCreditSessionReqBody = createCreditSessionReqBody;
base.getSessionReqBody = createSessionReqBody;
base.setAurusCreditAttributes = setAurusCreditAttributes;
base.saveCustomerCreditCard = saveCustomerCreditCard;
base.setTerminalIDSession = setTerminalIDSession;
base.getTerminalID = getTerminalID;
base.createAuthReqBody = createAuthReqBody;
base.createPaypalAuthReqBody = createPaypalAuthReqBody;
base.createAltPaymentSessionReqBody = createAltPaymentSessionReqBody;
base.getAltPaymentsConsumerObject = getAltPaymentsConsumerObject;
base.getPaypalConsumerObject = getPaypalConsumerObject;
base.returnFromPaypal = returnFromPaypal;
base.setPaymentInstrumentAttributes = setPaymentInstrumentAttributes;
base.createAuthReqBodyApplePay = createAuthReqBodyApplePay;
base.getTokenID = getTokenID;
base.getSessionTokenReqBody = createSessionTokenReqBody;
base.getSavedCreditCard = getCard;
base.createSafetyPayAuthReqBody = createSafetyPayAuthReqBody;
base.aurusSessionExpired = aurusSessionExpired;
base.validateAurusSession = validateAurusSession;

module.exports = base;
