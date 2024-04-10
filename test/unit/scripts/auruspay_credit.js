'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../mockModuleSuperModule');
var baseAccountModelMock = require('./baseModel');

// Path to scripts
var pathToCartridges = '../../../cartridges/';
var pathToLinkScripts = pathToCartridges + 'int_aurus_custom/cartridge/scripts/';

// Path to test scripts
var pathToCoreMock = '../../mocks/';

describe('Aurus: hooks/payment/processor/auruspay_credit test', () => {

    var Forms = function () {
        var formData = {
            billing: {
                creditCardFields: {
                    ott: {
                        value: '40000000000000000000000020097286'
                    },
                    cardType: {
                        value: 'VIC'
                    }
                }
            }
        };

        this.getForm = function (id) {
            return formData[id];
        };
    };
    var server = {
        forms: new Forms()
    };

    class Calendar {
        constructor(date) {
            this.date = date;
            this.DATE = 5;
            this.DAY_OF_WEEK = 7;
            this.SATURDAY = 7;
            this.SUNDAY = 1;
        }
    
        add(field, value) {
            if (field === this.DATE) {
                this.date.setDate(this.date.getDate() + value);
            }
        }
    
        before() {
            return false;
        }
    
        toTimeString() {
            return this.date ? this.date.toDateString() : '';
        }
    
        get() {
            return 2;
        }
    }
    
    mockSuperModule.create(baseAccountModelMock);
    
    var auruspay_credit = proxyquire(pathToLinkScripts + 'hooks/payment/processor/auruspay_credit', {
        'dw/system/Site': require(pathToCoreMock + 'dw/dw_system_Site'),
        'dw/system/Transaction': require(pathToCoreMock + 'dw/dw_system_Transaction'),
        'dw/system/Logger': require(pathToCoreMock + 'dw/dw_system_Logger'),
        'dw/web/Resource': require(pathToCoreMock + 'dw/dw_web_Resource'),
        'dw/order/OrderMgr': require(pathToCoreMock + 'dw/dw_order_OrderMgr'),
        'dw/web/URLUtils': require(pathToCoreMock + 'dw/dw_web_URLUtils'),
        'dw/order/Order': require(pathToCoreMock + 'dw/dw_order_Order'),
        'dw/util/StringUtils': require(pathToCoreMock + 'dw/dw_util_StringUtils'),
        'dw/util/Calendar': Calendar,
        '*/cartridge/scripts/util/loggerHelper': {
            getLoggingObject: () => ''
        },
        'server': server,
        '*/cartridge/models/billingAddress': require(pathToCartridges + 'int_aurus_sfra/cartridge/models/billingAddress'),
        '*/cartridge/models/shippingAddress': require(pathToCartridges + 'int_aurus_sfra/cartridge/models/shippingAddress'),
        '*/cartridge/models/ecommInfo': require(pathToCartridges + 'int_aurus_custom/cartridge/models/ecommInfo'),
        '*/cartridge/models/transactionDetails': proxyquire(pathToCartridges + 'int_aurus_custom/cartridge/models/transactionDetails', {
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                calculateNonGiftCertificateAmount: function () {
                    return {
                        value: '10.99',
                        getDecimalValue: function () { return '10.99'; },
                        getCurrencyCode: function () { return 'USD'; },
                    };
                }
            }
        }),
        '*/cartridge/models/aurusLevelThreeProduct': function () {
            this.Level3Products = {
                Level3Product : {
                    "L3ProductDescription": "",
                    "L3UnitOfMeasure": "",
                    "L3FreightAmount": "",
                    "L3ProductTaxRate": "",
                    "L3OrderRefNumber": "",
                    "L3ClassID": "",
                    "L3ProductQuantity": "1",
                    "L3OtherAmount": "",
                    "L3ProductDiscount": "",
                    "L3ProductCode": "Product Code",
                    "L3ProductUnitPrice": "10.00",
                    "L3ProductTax": "",
                    "L3ProductTotalAmount": "10.00",
                    "L3ProductName": "Lancome Bienfait Multi-Vital Day Cream 24-Hour Antioxidant & Vitamin Enriched Broad Spectrum SPF 30 Sunscreen & Moisturizer  1.7 oz./ 50 mL",
                    "L3DepartmentID": "",
                    "L3TarriffAmount": "",
                    "L3ProductSeqNo": "",
                    "L3GiftWrapAmount": "",
                    "L3MonogramAmount": ""
                }
            };
            this.Level3ProductCount = "1";
        },
        '*/cartridge/scripts/util/aurusPayHelper': proxyquire(pathToLinkScripts + 'util/aurusPayHelper', {
            'dw/system/Site': require(pathToCoreMock + 'dw/dw_system_Site'),
            'dw/web/URLUtils': require(pathToCoreMock + 'dw/dw_web_URLUtils'),
            'dw/system/Transaction': require(pathToCoreMock + 'dw/dw_system_Transaction'),
            'dw/system/Logger': require(pathToCoreMock + 'dw/dw_system_Logger'),
            'dw/order/Order': require(pathToCoreMock + 'dw/dw_order_Order'),
            'dw/util/StringUtils': require(pathToCoreMock + 'dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/collections': require (pathToCoreMock + 'util/collections'),
            'dw/order/PaymentMgr': require(pathToCoreMock + 'dw/dw_order_PaymentMgr'),
            'dw/system/HookMgr': require(pathToCoreMock + 'dw/dw_system_HookMgr'),
            '*/cartridge/scripts/services/aurusPayServices': {
                getSessionService: function() {
                    return {
                        call : function() {
                            return {
                                ok: true,
                                object: {
                                    text: require(pathToCoreMock + 'scripts/aurusPayHelper').getSessionService()
                                }
                            }
                        }
                    }
                },
                getBillingToken: function() {
                    return {
                        call : function() {
                            return {
                                ok: true,
                                object: {
                                    text: require(pathToCoreMock + 'scripts/aurusPayHelper').getBillingToken()
                                }
                            }
                        }
                    }
                },
            },
            'app_ua_core/cartridge/scripts/checkout/shippingHelpers': {
                getApplicableShippingMethods: function() {
                    return {
                        length: 0
                    }
                }
            },
            'dw/util/Calendar': Calendar,
            '*/cartridge/scripts/util/loggerHelper': {
                getLoggingObject: () => ''
            },
            '*/cartridge/scripts/util/loggerHelper.js': {
                maskPIIAuruspayInfo: () => ''
            }
        }),
        '*/cartridge/scripts/services/aurusPayServices': {
            getAuthService: function() {
                return {
                    call : function() {
                        return {
                            ok: true,
                            object: {
                                text: require(pathToCoreMock + 'scripts/auruspay_credit').getMochAuthServiceResult()
                            }
                        }
                    }
                }
            }
        },
        '*/cartridge/scripts/checkout/checkoutHelpers': {
            calculateNonGiftCertificateAmount: function () {
                return {
                    value: '10.99',
                    getDecimalValue: function () { return '10.99'; },
                    getCurrencyCode: function () { return 'USD'; },
                };
            }
        }
    });

    it('Testing method: Handle', () => {
        // Prepare basket
        var Basket = require(pathToCoreMock + 'dw/dw_order_Basket');
        var basket = new Basket();

        // Prepare payment information
        var paymentInformation = {
            "paymentMethodID": {
                "value": "AURUS_CREDIT_CARD"
            },
            "cardType": {
                "value": "VIC",
                "htmlName": "dwfrm_billing_creditCardFields_cardType"
            },
            "cardNumber": {
                "value": "411111XXXXXX1111",
                "htmlName": "dwfrm_billing_creditCardFields_cardNumber"
            },
            "securityCode": {
                "value": null,
                "htmlName": "dwfrm_billing_creditCardFields_securityCode"
            },
            "expirationMonth": {
                "value": 3,
                "htmlName": "dwfrm_billing_creditCardFields_expirationMonth"
            },
            "expirationYear": {
                "value": 30,
                "htmlName": "dwfrm_billing_creditCardFields_expirationYear"
            },
            "oneTimeToken": {
                "value": "20000000000000000000000023536692",
                "htmlName": "one_time_token"
            }
        }
        // Handle payment form
        var result = auruspay_credit.Handle(basket, paymentInformation);

        // Check handle response
        assert.equal(false, result.error);
    });

    it('Testing method: Authorize for new Cards', () => {
        // Prepare payment Instrument
        var PaymentInstrument = require(pathToCoreMock + 'dw/dw_order_PaymentInstrument');
        var paymentInstrument = new PaymentInstrument();
        global.customer = {};
        global.customer.authenticated = false;

        // Prepare payment processor
        var paymentProcessor = paymentInstrument.getPaymentProcessor();

        // Call Authorize method
        var result = auruspay_credit.Authorize('',paymentInstrument, paymentProcessor);

        // Check Authorize response
        assert.equal(false, result.error);

    });

    it('Testing method: Authorize for New Card OCAPI', () => {
        // Prepare payment Instrument
        var PaymentInstrument = require(pathToCoreMock + 'dw/dw_order_PaymentInstrument');
        var paymentInstrument = new PaymentInstrument();

        // Prepare payment processor
        var paymentProcessor = paymentInstrument.getPaymentProcessor();

        paymentInstrument.paymentTransaction.custom.aurusPayOOT = JSON.stringify({
            CardIdentifier: '2000000000002615',
            aurusPayOOT: '20000000000008108493'
        });

        // Call Authorize method
        var result = auruspay_credit.Authorize('', paymentInstrument, paymentProcessor,  'OCAPI');

        // Check Authorize response
        assert.equal(false, result.error);
    });

    it('Testing method: Authorize for Saved Card', () => {
        // Prepare payment Instrument
        var PaymentInstrument = require(pathToCoreMock + 'dw/dw_order_PaymentInstrument');
        var paymentInstrument = new PaymentInstrument();

        // Prepare payment processor
        var paymentProcessor = paymentInstrument.getPaymentProcessor();

        // Set credit card token
        paymentInstrument.setCreditCardToken('20000000000000000000000023712590');

        // Call Authorize method
        var result = auruspay_credit.Authorize('',paymentInstrument, paymentProcessor);

        // Check Authorize response
        assert.equal(false, result.error);
    });

    it('Testing method: Authorize for Saved Card OCAPI', () => {
        // Prepare payment Instrument
        var PaymentInstrument = require(pathToCoreMock + 'dw/dw_order_PaymentInstrument');
        var paymentInstrument = new PaymentInstrument();

        // Prepare payment processor
        var paymentProcessor = paymentInstrument.getPaymentProcessor();

        // Set credit card token
        paymentInstrument.setCreditCardToken('20000000000000000000000023712590');
        paymentInstrument.paymentTransaction.custom.aurusPayOOT = JSON.stringify({
            CardIdentifier: '2000000000002615',
            aurusPayOOT: '20000000000008108493'
        });

        // Call Authorize method
        var result = auruspay_credit.Authorize('', paymentInstrument, paymentProcessor,  'OCAPI');

        // Check Authorize response
        assert.equal(false, result.error);
    });

});