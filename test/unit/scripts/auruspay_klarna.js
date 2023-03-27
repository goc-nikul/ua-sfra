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

describe('Aurus: hooks/payment/processor/auruspay_klarna test', () => {

    var Forms = function () {
        var formData = {
            klarna: {
                AuruspayKlarnaOtt: {
                    htmlValue: '40000000000000000000000020097286'
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
    
    var auruspay_klarna = proxyquire(pathToLinkScripts + 'hooks/payment/processor/auruspay_klarna', {
        'dw/system/Site': require(pathToCoreMock + 'dw/dw_system_Site'),
        'dw/system/Transaction': require(pathToCoreMock + 'dw/dw_system_Transaction'),
        'dw/system/Logger': require(pathToCoreMock + 'dw/dw_system_Logger'),
        'dw/web/Resource': require(pathToCoreMock + 'dw/dw_web_Resource'),
        'dw/order/OrderMgr': require(pathToCoreMock + 'dw/dw_order_OrderMgr'),
        'dw/web/URLUtils': require(pathToCoreMock + 'dw/dw_web_URLUtils'),
        'dw/order/Order': require(pathToCoreMock + 'dw/dw_order_Order'),
        'dw/util/StringUtils': require(pathToCoreMock + 'dw/dw_util_StringUtils'),
        'dw/util/Calendar': Calendar,
        'server': server,
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
                                text: require(pathToCoreMock + 'scripts/auruspay_credit').getMochAuthServiceResult()
                            }
                        }
                    }
                }
            },
            getSessionTokenService: function() {
                return {
                    call : function() {
                        return {
                            ok: true,
                            object: {
                                text: require(pathToCoreMock + 'scripts/auruspay_credit').getMockSessionTokenResult()
                            }
                        }
                    }
                }
            }
        },
    });

    it('Testing method: processForm', () => {
        // Prepare payment Form
        var paymentForm = {
            paymentMethod: {
                value: 'KLARNA_PAYMENTS'
            }
        }
        // Handle process form
        var result = auruspay_klarna.processForm({}, paymentForm, {});

        // Check handle response
        assert.equal(false, result.error);
        assert.equal(paymentForm.paymentMethod.value, result.viewData.paymentMethod.value);
    });

    it('Testing method: Handle', () => {
        // Prepare Basket
        var Basket = require(pathToCoreMock + 'dw/dw_order_Basket');
        var basket = new Basket();

        // Handle process form
        var result = auruspay_klarna.Handle(basket);

        // Check handle response
        assert.equal(true, result.success);
    });

    it('Testing method: Authorize', () => {
        // Prepare payment Instrument
        var PaymentInstrument = require(pathToCoreMock + 'dw/dw_order_PaymentInstrument');
        var paymentInstrument = new PaymentInstrument();

        // Prepare payment processor
        var paymentProcessor = paymentInstrument.getPaymentProcessor();
        global.session = {
            privacy: {
                apResponseCode: ''
            }
        };

        // Call Authorize method
        var result = auruspay_klarna.Authorize('',paymentInstrument, paymentProcessor);

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
        paymentInstrument.custom.klarnaPaymentsAuthorizationToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjgyMzA1ZWJjLWI4MTEtMzYzNy1hYTRjLTY2ZWNhMTg3NGYzZCJ9.eyJzZXNzaW9uX2lkIjoiMjNiYzE1YzgtZWM5MC00ZGJkLTkyNDYtNWMwNTcxYzdhODlhIiwiYmFzZV91cmwiOiJodHRwczovL2pzLnBsYXlncm91bmQua2xhcm5hLmNvbS9uYS9rcCIsImRlc2lnbiI6ImtsYXJuYSIsImxhbmd1YWdlIjoiZW4iLCJwdXJjaGFzZV9jb3VudHJ5IjoiVVMiLCJlbnZpcm9ubWVudCI6InBsYXlncm91bmQiLCJtZXJjaGFudF9uYW1lIjoiVW5kZXIgQXJtb3VyLCBJbmMiLCJzZXNzaW9uX3R5cGUiOiJQQVlNRU5UUyIsImNsaWVudF9ldmVudF9iYXNlX3VybCI6Imh0dHBzOi8vbmEucGxheWdyb3VuZC5rbGFybmFldnQuY29tIiwic2NoZW1lIjp0cnVlLCJleHBlcmltZW50cyI6W3sibmFtZSI6ImtwLWNsaWVudC11dG9waWEtcG9wdXAtcmV0cmlhYmxlIiwidmFyaWF0ZSI6InZhcmlhdGUtMSJ9LHsibmFtZSI6ImtwLWNsaWVudC1vcGYtc2FmYXJpLXNwbGFzaC1zY3JlZW4tcHNlbC0yODE4IiwidmFyaWF0ZSI6InZhcmlhdGUifSx7Im5hbWUiOiJrcC1jbGllbnQtdXRvcGlhLXN0YXRpYy13aWRnZXQiLCJ2YXJpYXRlIjoiaW5kZXgifSx7Im5hbWUiOiJpbi1hcHAtc2RrLW5ldy1pbnRlcm5hbC1icm93c2VyIiwidmFyaWF0ZSI6Im5ldy1pbnRlcm5hbC1icm93c2VyLWVuYWJsZSIsInBhcmFtZXRlcnMiOnsidmFyaWF0ZV9pZCI6Im5ldy1pbnRlcm5hbC1icm93c2VyLWVuYWJsZSJ9fSx7Im5hbWUiOiJrcC1jbGllbnQtdXRvcGlhLXNkay1mbG93IiwidmFyaWF0ZSI6InZhcmlhdGUtMSJ9LHsibmFtZSI6ImtwLWNsaWVudC11dG9waWEtd2Vidmlldy1mbG93IiwidmFyaWF0ZSI6InZhcmlhdGUtMSJ9LHsibmFtZSI6ImluLWFwcC1zZGstY2FyZC1zY2FubmluZyIsInZhcmlhdGUiOiJjYXJkLXNjYW5uaW5nLWVuYWJsZSIsInBhcmFtZXRlcnMiOnsidmFyaWF0ZV9pZCI6ImNhcmQtc2Nhbm5pbmctZW5hYmxlIn19XSwicmVnaW9uIjoidXMiLCJ1YV9lbmFibGVkX2FuZF9vbmVfcG0iOnRydWV9.IegofHD3AzNZiu7pyKgkoij9sReQeX61avuHwx_iqZFG4OlQSEt10H7y9ZooF0kI073MXjVyvLcV9A3V-e1A_yjgLCJDEJ9_hn3de8ZOFamB2JRlyeaUsu6dnIeVR4ZlmVoeGfHadqqSZ1GiBuSmg313lQiBHwPwlfK6vm25H-QtUurAVxLfAJ2eJUG-9mdE-yAKLlKvx107NvZO4TQYLaGtL4gQlrUE1ReH0fynVjW_HqgIwK77C0FkwA4poY5_b22OD6I72dV4LQGjvaJvFmlvy8XX8Gvq_1RBrHy8VynaMcgkVBch0pDEkxr_2YtqpWLtufonwKwKUyj_S95a3g';

        // Call Authorize method
        var result = auruspay_klarna.Authorize('',paymentInstrument, paymentProcessor, 'OCAPI');

        // Check Authorize response
        assert.equal(true, result.authorized);
    });

});