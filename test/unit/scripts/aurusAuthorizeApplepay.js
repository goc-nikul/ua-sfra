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

describe('Aurus: util/aurusPayHelper test', () => {

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
    
    var aurusAuthorizeApplepay = proxyquire(pathToLinkScripts + 'util/aurusAuthorizeApplepay', {
        'dw/system/Site': require(pathToCoreMock + 'dw/dw_system_Site'),
        'dw/system/Transaction': require(pathToCoreMock + 'dw/dw_system_Transaction'),
        'dw/system/Logger': require(pathToCoreMock + 'dw/dw_system_Logger'),
        'dw/web/Resource': require(pathToCoreMock + 'dw/dw_web_Resource'),
        'dw/order/OrderMgr': require(pathToCoreMock + 'dw/dw_order_OrderMgr'),
        'dw/web/URLUtils': require(pathToCoreMock + 'dw/dw_web_URLUtils'),
        'dw/order/Order': require(pathToCoreMock + 'dw/dw_order_Order'),
        'dw/order/PaymentMgr': require(pathToCoreMock + 'dw/dw_order_PaymentMgr'),
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
            getSessionService: function() {
                return {
                    call : function() {
                        return {
                            ok: true,
                            object: {
                                text: require(pathToCoreMock + 'scripts/aurusAuthorizeApplepay').getApplepaySession()
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
                                text: require(pathToCoreMock + 'scripts/aurusAuthorizeApplepay').getApplepaySessionToken()
                            }
                        }
                    }
                }
            }
        },
    });

    it('Testing method: aurusAuthorizeApplepay', () => {
        // Prepare Order
        var Order = require(pathToCoreMock + 'dw/dw_order_Order');
        var order = new Order();
        // Create applepay Instrument
        var Money = require(pathToCoreMock + 'dw/dw_value_Money');
        order.createPaymentInstrument('DW_APPLE_PAY', new Money(5));

        // Prepare mock applepay event data
        var event = require(pathToCoreMock + 'scripts/aurusAuthorizeApplepay').getApplepayEventData();

        global.session = {
            privacy: {
                apResponseCode: ''
            }
        };

        // Handle payment form
        var result = aurusAuthorizeApplepay.aurusAuthorizeApplepay(order, event);

        // Check handle response
        assert.equal(false, result.error);
        
    });

});