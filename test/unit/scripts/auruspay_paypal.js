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

describe('Aurus: hooks/payment/processor/auruspay_paypal test', () => {

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
    global.session = {
        privacy: {
            ott: ''
        }
    };
    
    var auruspay_paypal = proxyquire(pathToLinkScripts + 'hooks/payment/processor/auruspay_paypal', {
        'dw/system/Site': require(pathToCoreMock + 'dw/dw_system_Site'),
        'dw/system/Transaction': require(pathToCoreMock + 'dw/dw_system_Transaction'),
        'dw/system/Logger': require(pathToCoreMock + 'dw/dw_system_Logger'),
        'dw/web/Resource': require(pathToCoreMock + 'dw/dw_web_Resource'),
        'dw/order/OrderMgr': require(pathToCoreMock + 'dw/dw_order_OrderMgr'),
        'dw/web/URLUtils': require(pathToCoreMock + 'dw/dw_web_URLUtils'),
        'dw/order/Order': require(pathToCoreMock + 'dw/dw_order_Order'),
        'dw/util/StringUtils': require(pathToCoreMock + 'dw/dw_util_StringUtils'),
        'dw/util/Calendar': Calendar,
        'server': {},
        '*/cartridge/models/billingAddressPayPal': require(pathToCartridges + 'int_aurus_custom/cartridge/models/billingAddressPayPal'),
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
                                text: require(pathToCoreMock + 'scripts/auruspay_paypal').getMochAuthServiceResult()
                            }
                        }
                    }
                }
            }
        },
    });

    it('Testing method: Handle', () => {
        // Prepare basket
        var Basket = require(pathToCoreMock + 'dw/dw_order_Basket');
        var basket = new Basket();

        // Handle payment form
        var result = auruspay_paypal.Handle(basket, false);

        // Check handle response
        assert.equal(true, result.success);
    });

    it('Testing method: Authorize', () => {
        // Prepare payment Instrument
        var PaymentInstrument = require(pathToCoreMock + 'dw/dw_order_PaymentInstrument');
        var paymentInstrument = new PaymentInstrument();

        // Prepare payment processor
        var paymentProcessor = paymentInstrument.getPaymentProcessor();

        // Set mock data in session
        global.session.privacy = {
            ott: '40000000000000000000000020097286',
            payWallet: '{ "payer": { "email_address": "test@test.com"}}'
        };

        // Call Authorize method
        var result = auruspay_paypal.Authorize('',paymentInstrument, paymentProcessor);

        // Check Authorize response
        assert.equal(true, result.authorized);

    });

    it('Testing method: Authorize OCAPI', () => {
        // Prepare payment Instrument
        var PaymentInstrument = require(pathToCoreMock + 'dw/dw_order_PaymentInstrument');
        var paymentInstrument = new PaymentInstrument();

        // Prepare payment processor
        var paymentProcessor = paymentInstrument.getPaymentProcessor();

        // Set mock data in paymentInstrument custom attribute
        paymentInstrument.custom.ott = '40000000000000000000000020097286';

        // Call Authorize method
        var result = auruspay_paypal.Authorize('', paymentInstrument, paymentProcessor, 'OCAPI');

        console.log('result: {0}', JSON.stringify(result));
        // Check Authorize response
        assert.equal(true, result.authorized);

    });
});