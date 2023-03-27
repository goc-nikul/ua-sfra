'use strict';
/* eslint-disable */

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var ArrayList = require('../../../cartridges/storefront-reference-architecture/test/mocks/dw.util.Collection');
var Money = require('../../mocks/dw/dw_value_Money');
// Path to scripts
var pathToCartridges = '../../../cartridges/';
var pathToCoreMock = '../../mocks/';
var pathToLinkScripts = pathToCartridges + 'app_ua_core/cartridge/scripts/';
var Logger = require('../../mocks/dw/dw_system_Logger');
const LineItemCtnr = require('../../mocks/dw/dw_order_LineItemCtnr');

var sinon = require('sinon');

var svc = {
    setRequestMethod: () => null,
    addHeader: () => null
};

var params = {
    url: null
};

var LocalServiceRegistryStub = sinon.stub().returns({
    createService: (svcId, callback) => {
        callback.createRequest(svc, params);
        return callback.parseResponse();
    }
});

var session = {
    custom: {
        applepaysession: 'yes'
    },
    privacy: {
        activeOrder: 'yes',
        applepayerror_emoji: true
    },
    currency: {
        currencyCode: 'USD',
        defaultFractionDigits: 10,
        name: 'US Dollars',
        symbol: '$'
    }
};

var PLIS = new ArrayList(
            [{
                bonusProductLineItem: false,
                gift: false,
                UUID: 'some UUID',
                adjustedPrice: {
                    value: 'some value',
                    currencyCode: 'US'
                },
                quantity: {
                    value: 1
                },
                getAdjustedPrice: function () {
                    return {
                        valueOrNull: 4
                    };
                },
                product: {
                    custom: {
                        isPreOrder: true
                    }
                }
            }]
          )

class AddressTypeProvider {
    constructor() {
        this.shippingAddress = {};
    }

    get(type, shippingAddress) {
        this.shippingAddress = shippingAddress;
        return this;
    }

    addressType() {
        this.shippingAddress.custom = { addressType: 'BUSINESS' };
        return;
    }
}

class ApplePayHookResult {
    static setHookConstants() {
        this.STATUS_REASON_DETAIL_KEY = 'STATUS_REASON_DETAIL_KEY';
        this.REASON_FAILURE = 'REASON_FAILURE';
        this.EXPORT_STATUS_READY = 'order export status is ready'
    };
};

ApplePayHookResult.setHookConstants();

class Status {
    static setClassConstants() {
        this.ERROR = 1;
        this.OK = 2;
    }
    getCode() {
        return 'EMOJI_VALIDATION_FAILED';
    }
    addDetail(key, value) {
    }
}
Status.setClassConstants();

var Transaction = {
    wrap: function (callBack) {
        return callBack.call();
    },
    begin: function () { },
    commit: function () { }
};

var createApiBasket = function () {
    var basket = {
        allProductLineItems: new ArrayList([{
            bonusProductLineItem: false,
            gift: false,
            UUID: 'some UUID',
            adjustedPrice: {
                value: 'some value',
                currencyCode: 'US'
            },
            quantity: {
                value: 1
            },
            getAdjustedPrice: function () {
                return this.adjustedPrice;
            }
        }]),
        totalGrossPrice: new Money(0, session.currency.currencyCode),
        totalTax: new Money(0, session.currency.currencyCode),
        shippingTotalPrice: new Money(0, session.currency.currencyCode)
    };

    basket.shipments = [{
        shippingMethod: {
            ID: '005'
        },
        shippingAddress: {
            address1: '1 Drury Lane',
            address2: null,
            countryCode: {
                displayValue: 'United States',
                value: 'US'
            },
            firstName: 'The Muffin',
            lastName: 'Man',
            city: 'Far Far Away',
            phone: '333-333-3333',
            postalCode: '04330',
            stateCode: 'ME',
            setPhone: function (phoneNumber) { },
            setCountryCode: function (countryCode) { }
        },
        getShippingAddress() {
            return this.shippingAddress;
        }
    }];

    basket.defaultShipment = basket.shipments[0];

    basket.getDefaultShipment = function () {
        return basket.shipments[0];
    };
    basket.getShipments = function () {
        return basket.shipments;
    };
    basket.getAllProductLineItems = function () {
        return basket.allProductLineItems;
    };
    basket.getAdjustedMerchandizeTotalPrice = function () {
        return new Money(0, session.currency.currencyCode);
    };
    basket.getAdjustedShippingTotalPrice = function () {
        return new Money(0, session.currency.currencyCode);
    };
    return basket;
};

describe('ApplePay: app_ua_core/cartridge/scripts/hooks/applePay/applePay test', () => {
    var emojiRegex = "(?:[\\u2700-\\u27bf]|(?:\\ud83c[\\udde6-\\uddff]){2}|[\\ud800-\\udbff][\\udc00-\\udfff]|[\\u0023-\\u0039]\\ufe0f?\\u20e3|\\u3299|\\u3297|\\u303d|\\u3030|\\u24c2|\\ud83c[\\udd70-\\udd71]|\\ud83c[\\udd7e-\\udd7f]|\\ud83c\\udd8e|\\ud83c[\\udd91-\\udd9a]|\\ud83c[\\udde6-\\uddff]|[\\ud83c[\\ude01-\\ude02]|\\ud83c\\ude1a|\\ud83c\\ude2f|[\\ud83c[\\ude32-\\ude3a]|[\\ud83c[\\ude50-\\ude51]|\\u203c|\\u2049|[\\u25aa-\\u25ab]|\\u25b6|\\u25c0|[\\u25fb-\\u25fe]|\\u00a9|\\u00ae|\\u2122|\\u2139|\\ud83c\\udc04|[\\u2600-\\u26FF]|\\u2b05|\\u2b06|\\u2b07|\\u2b1b|\\u2b1c|\\u2b50|\\u2b55|\\u231a|\\u231b|\\u2328|\\u23cf|[\\u23e9-\\u23f3]|[\\u23f8-\\u23fa]|\\ud83c\\udccf|\\u2934|\\u2935|[\\u2190-\\u21ff])";
    let Resource = {
        msg: function (regExType) {
            if (regExType === 'postalcode.regexp') {
                return '^[0-9]{5}(?:-[0-9]{4})?$';
            }
            return emojiRegex;
        }
    };
    global.empty = (data) => {
        return !data;
    };
    global.session = session;

    var applePayHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/applePayHelper', {
        '*/cartridge/scripts/util/collections': require('../../../cartridges/lib_productlist/test/mocks/util/collections'),
        'dw/web/Resource': Resource,
        'dw/system/Logger': Logger,
        'dw/order/BasketMgr': {
                getCurrentBasket: function () {
                    return {
                        custom: {
                            isCommercialPickup: false
                        },
                        defaultShipment: {
                            shippingAddress: {
                                countryCode: {}
                            }
                        },
                        productLineItems: PLIS
                    };
                }
            },
        'ApplePayLogger': Logger.getLogger(),
        'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
        'dw/order/ShippingMgr': require('../../mocks/dw/dw_order_ShippingMgr'),
        'dw/value/Money': require('../../mocks/dw/dw_value_Money'),
        'dw/util/StringUtils': require('../../mocks/dw/dw_util_StringUtils'),
        'dw/svc/LocalServiceRegistry': {
                createService: function (serviceId, configObj) {
                    return {
                        call: function (data) {
                            applyPayServiceHandler.configObj = configObj;
                            applyPayServiceHandler.data = data;
                            var isOk = true;
                            var statusCheck = true;
                            return {
                                ok: isOk,
                                object: {
                                    status: isOk && statusCheck ? 'SUCCESS' : 'ERROR'
                                },
                                error: isOk ? 200 : 400,
                                getRequestData: function () {
                                    applyPayServiceHandler.request = applyPayServiceHandler.configObj.createRequest(service);
                                    return applyPayServiceHandler.request;
                                },
                                getResponse: function () {
                                    return applyPayServiceHandler.mock
                                        ? applyPayServiceHandler.configObj.mockCall(svc)
                                        : applyPayServiceHandler.configObj.parseResponse(service, applyPayServiceHandler.client);
                                },
                            };
                        },
                        getRequestData: function () {
                            applyPayServiceHandler.request = applyPayServiceHandler.configObj.createRequest(service);
                            return applyPayServiceHandler.request;
                        },
                        getResponse: function () {
                            return applyPayServiceHandler.mock
                                ? applyPayServiceHandler.configObj.mockCall(svc)
                                : applyPayServiceHandler.configObj.parseResponse(service, applyPayServiceHandler.client);
                        },
                        getCredentialID: function () {
                            return serviceId;
                        },
                        getMessage: function (response) {
                            return {
                                requestData: applyPayServiceHandler.configObj.getRequestLogMessage(applyPayServiceHandler.request),
                                logResponse: applyPayServiceHandler.configObj.getResponseLogMessage(response)
                            };
                        },
                        getErrorMessage: function (response) {
                            var obj = {};
                            obj.a = { b: obj };
                            return {
                                requestData: applyPayServiceHandler.configObj.getRequestLogMessage(obj),
                                logResponse: applyPayServiceHandler.configObj.getResponseLogMessage(response)
                            };
                        }
                    };
                }
            },
        'dw/order/Shipment': require('../../mocks/dw/dw_order_Shipment'),
        'dw/util/ArrayList': require('../../mocks/scripts/util/dw.util.Collection')
    });

    var applePay = proxyquire(pathToLinkScripts + 'hooks/applePay/applePay', {
        'dw/system/Status': require('../../mocks/dw/dw_system_Status'),
        '*/cartridge/scripts/checkout/checkoutHelpers': {
            updateStateCode: function() {
                return '';
            },
            updatePostalCode: function() {
                return '';
            },
            autoCorrectPhonenumber: function() {
                return '';
            }
        },
        '*/cartridge/scripts/util/aurusAuthorizeApplepay': {
            aurusAuthorizeApplepay: function() {
                return {
					error : false
				};
            }
        },
        '*/cartridge/scripts/helpers/basketCalculationHelpers': { calculateTotals: function () { } },
        '*/cartridge/scripts/helpers/applePayHelper': applePayHelper,
        'dw/extensions/applepay/ApplePayHookResult': ApplePayHookResult,
        'dw/system/Transaction': Transaction,
        'dw/system/Logger': Logger,
        'ApplePayLogger': Logger.getLogger(),
        'dw/order/OrderMgr': require('../../mocks/dw/dw_order_OrderMgr'),
        'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
        '*/cartridge/modules/providers': new AddressTypeProvider(),
        session: session,
        'dw/system/HookMgr': require('../../mocks/dw/dw_system_HookMgr'),
        'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
        'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
        'dw/order/ShippingMgr': require('../../mocks/dw/dw_order_ShippingMgr'),
        '*/cartridge/scripts/util/collections': require('../../../cartridges/lib_productlist/test/mocks/util/collections'),
        '*/cartridge/scripts/util/SetOrderStatus': {
            setCustomerName(order) {
                order.customerName = 'Test';
            }
        },
        '*/cartridge/scripts/checkout/checkoutHelpers': require('../../mocks/scripts/checkout/checkoutHelpers'),
        '*/cartridge/scripts/helpers/sitePreferencesHelper': {
            isAurusEnabled: function() {
                return true;
            }
        },
        '*/cartridge/scripts/utils/PreferencesUtil': require('../../mocks/scripts/PreferencesUtil')
    });

    var shippingAndPaymentMethodSelected = proxyquire(pathToLinkScripts + 'hooks/applePay/shippingAndPaymentMethodSelected', {
        'dw/system/Status': require('../../mocks/dw/dw_system_Status'),
        '*/cartridge/scripts/helpers/applePayHelper': applePayHelper,
        'dw/extensions/applepay/ApplePayHookResult': ApplePayHookResult,
        'dw/system/Logger': Logger,
        'ApplePayLogger': Logger.getLogger()
    });

    var shippingContactSelected = proxyquire(pathToLinkScripts + 'hooks/applePay/shippingContactSelected', {
        'dw/system/Status': require('../../mocks/dw/dw_system_Status'),
        '*/cartridge/scripts/helpers/applePayHelper': {
                getApplicableShippingMethods: () => {
                    return { 
						applicableShippingMethodsObject : 'Methods'
					 };
                }
            },
        'dw/extensions/applepay/ApplePayHookResult': ApplePayHookResult,
        'dw/system/Logger': Logger,
        'ApplePayLogger': Logger.getLogger(),
        'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
        'dw/web/Resource': require('../../mocks/dw/dw_web_Resource')
    });
    
    var applePayHooks = proxyquire(pathToLinkScripts + 'hooks/applePay/applePayHooks', {
        'dw/system/Logger': Logger,
         'dw/system/Transaction': Transaction,
         'dw/order/OrderMgr': require('../../mocks/dw/dw_order_OrderMgr'),
         '*/cartridge/scripts/helpers/applePayHelper': {
            authorize: function () {
			var isOk = true;
				return {
             		ok : isOk,
             		status: 'OK',
             		object: {
                		statusCode: 200,
                		text: JSON.stringify({
                   		 resultCode  :'Authorised'
                })
                 }
                };
            }
        },
         'dw/order/PaymentMgr': require('../../mocks/dw/dw_order_PaymentMgr'),
        'dw/system/Logger': Logger,
        'ApplePayLogger': Logger.getLogger(),
    });
    
    it('Testing method: handle', () => {
		let basket = new LineItemCtnr();
		var PaymentInstrument = require('../../mocks/dw/dw_order_PaymentInstrument');
        var paymentInstrument = new PaymentInstrument('testID', new Money(10));
        var orderNo = 'ORDER1';
        var result = applePayHooks.Handle(orderNo, paymentInstrument);
    });
    
    it('Testing method: authorize', () => {
		let basket = new LineItemCtnr();
		var PaymentInstrument = require('../../mocks/dw/dw_order_PaymentInstrument');
        var paymentInstrument = new PaymentInstrument('DW_APPLE_PAY', new Money(10));
        var result = applePayHooks.Authorize(basket, paymentInstrument);
    });
    
    var applePayHooksN = proxyquire(pathToLinkScripts + 'hooks/applePay/applePayHooks', {
        'dw/system/Logger': Logger,
         'dw/system/Transaction': Transaction,
         'dw/order/OrderMgr': require('../../mocks/dw/dw_order_OrderMgr'),
         '*/cartridge/scripts/helpers/applePayHelper': {
            authorize: function () {
			var isOk = true;
				return {
             		ok : isOk,
             		status: 'OK',
             		object: {
                		statusCode: 200,
                		text: JSON.stringify({
                   		 resultCode  :'asa',
                   		 refusalReasonCode  :'asa',
                   		 refusalReason  :'asa'
                })
                 }
                };
            }
        },
         'dw/order/PaymentMgr': require('../../mocks/dw/dw_order_PaymentMgr'),
        'dw/system/Logger': Logger,
        'ApplePayLogger': Logger.getLogger(),
    });
    
    it('Testing method: authorize', () => {
		let basket = new LineItemCtnr();
		var PaymentInstrument = require('../../mocks/dw/dw_order_PaymentInstrument');
        var paymentInstrument = new PaymentInstrument('DW_APPLE_PAY', new Money(10));
        var result = applePayHooksN.Authorize(basket, paymentInstrument);
    });

    var Order = require('../../mocks/dw/dw_order_Order');
    var order = new Order();
    var basketmgr = require('../../mocks/dw/dw_order_BasketMgr');
    var basket = basketmgr.getCurrentBasket();

    it('Testing method: authorizeOrderPayment', () => {
        var defaultShipment = {
            UUID: '1234-1234-1234-1235',
            setShippingMethod: function (shippingMethod) {
                return shippingMethod;
            },
            shippingAddress: {
                address1: '1 Drury Lane',
                address2: null,
                countryCode: {
                    displayValue: 'United States',
                    value: 'AU'
                },
                firstName: 'The Muffin',
                lastName: 'Man',
                city: 'Far Far Away',
                phone: '333-333-3333',
                postalCode: '04330',
                stateCode: 'ME',
                setPhone: function (phoneNumber) { },
                setCountryCode: function (countryCode) { },
                getCountryCode: function () { return { value: this.countryCode }; },
                custom: {
                    addressType: 'BUSINESS'
                }
            },
            getShippingAddress: function () {
                return this.shippingAddress;
            }
        };
        
        var paymentInstruments = [
				{
					getPaymentMethod: function () {
			                return 'Credit Card';
			            }
				},
				{
					getPaymentMethod: function () {
			                return 'PayPal';
			            }
				}
			];
        
        order.getPaymentInstruments = function () {
            return paymentInstruments;
        };

        order.getDefaultShipment = function () {
            return defaultShipment;
        };

        var event = {
            payment: {
                shippingContact: {
                    phoneNumber: '9234567890',
                    emailAddress: 'abcd@xyz.com',
                    countryCode: 'US'
                },
                billingContact: {
                    countryCode: 'US'
                }
            }
        };
        var result = applePay.authorizeOrderPayment(order, event);
        assert.equal(order.getDefaultShipment().getShippingAddress().custom.addressType, 'BUSINESS');
    });
	
	it('Testing method: authorizeOrderPayment', () => {
        var defaultShipment = {
            UUID: '1234-1234-1234-1235',
            setShippingMethod: function (shippingMethod) {
                return shippingMethod;
            },
            shippingAddress: {
                address1: '1 Drury Lane',
                address2: null,
                countryCode: {
                    displayValue: 'United States',
                    value: 'US'
                },
                firstName: 'The Muffin',
                lastName: 'Man',
                city: 'Far Far Away',
                phone: '333-333-3333',
                postalCode: '04330',
                stateCode: 'ME',
                setPhone: function (phoneNumber) { },
                setCountryCode: function (countryCode) { },
                getCountryCode: function () { return { value: this.countryCode }; },
                custom: {
                    addressType: 'BUSINESS'
                }
            },
            getShippingAddress: function () {
                return this.shippingAddress;
            }
        };
        
        var paymentInstruments = [
				{
					getPaymentMethod: function () {
			                return 'Credit Card';
			            }
				},
				{
					getPaymentMethod: function () {
			                return 'PayPal';
			            }
				}
			];
        
        order.getPaymentInstruments = function () {
            return paymentInstruments;
        };
        
        var defaultShipment = {
            UUID: '1234-1234-1234-1235',
            setShippingMethod: function (shippingMethod) {
                return shippingMethod;
            },
            shippingAddress: {
                address1: '1 Drury Lane',
                address2: null,
                countryCode: {
                    displayValue: 'United States',
                    value: 'US'
                },
                firstName: 'The Muffin',
                lastName: 'Man',
                city: 'Far Far Away',
                phone: '333-333-3333',
                postalCode: '04330',
                stateCode: 'ME',
                setPhone: function (phoneNumber) { },
                setCountryCode: function (countryCode) { },
                getCountryCode: function () { return { value: this.countryCode }; },
                custom: {
                    addressType: 'BUSINESS'
                }
            },
            getShippingAddress: function () {
                return this.shippingAddress;
            }
        };
        
        order.getPaymentInstruments = function () {
            return paymentInstruments;
        };

        order.getDefaultShipment = function () {
            return defaultShipment;
        };

        var event = {
            payment: {
                shippingContact: {
                    phoneNumber: '9234567890',
                    emailAddress: 'abcd@xyz.com',
                    countryCode: 'US'
                },
                billingContact: {
                    countryCode: 'US'
                }
            }
        };
        var result = applePay.authorizeOrderPayment(order, event);
        assert.equal(order.getDefaultShipment().getShippingAddress().custom.addressType, 'BUSINESS');
    });
    
    it('Testing method: getRequest', () => {
        global.session.custom = { applepaysession: 'yes' }
        let basket = new LineItemCtnr();
        basket.customer.authenticated = true;
        var result = applePay.getRequest(basket, {});
        assert.deepEqual(new ApplePayHookResult(new Status(Status.OK), null), result);
    });

    it('Testing method: prepareBasket', () => {
        var result = applePay.prepareBasket(basket, {});
        assert.deepEqual(result, new ApplePayHookResult(new Status(Status.OK), null));
    });

    it('Testing method: failOrder', () => {
        var result = applePay.failOrder(order, new Status(Status.ERROR));
        assert.equal(order.status.value, 8);
        assert.equal(session.privacy.applepayerror_emoji, true);
        assert.deepEqual(result, new ApplePayHookResult(new Status(Status.OK), null));
    });
    
    it('Testing method: failOrder NAME_FIELDS_VALIDATION_FAILED', () => {
			class Status {
			    static setClassConstants() {
			        this.ERROR = 1;
			        this.OK = 2;
			    }
			    getCode() {
			        return 'NAME_FIELDS_VALIDATION_FAILED';
			    }
			    addDetail(key, value) {
			    }
		}
        var result = applePay.failOrder(order, new Status(Status.ERROR));
        assert.equal(order.status.value, 8);
        assert.equal(session.privacy.applepayerror_emoji, true);
        assert.deepEqual(result, new ApplePayHookResult(new Status(Status.OK), null));
    });
    
    it('Testing method: failOrder POSTALCODE_VALIDATION_FAILED', () => {
			class Status {
			    static setClassConstants() {
			        this.ERROR = 1;
			        this.OK = 2;
			    }
			    getCode() {
			        return 'POSTALCODE_VALIDATION_FAILED';
			    }
			    addDetail(key, value) {
			    }
		}
        var result = applePay.failOrder(order, new Status(Status.ERROR));
        assert.equal(order.status.value, 8);
        assert.equal(session.privacy.applepayerror_emoji, true);
        assert.deepEqual(result, new ApplePayHookResult(new Status(Status.OK), null));
    });
    
    it('Testing method: failOrder CITY_FIELD_VALIDATION_FAILED', () => {
			class Status {
			    static setClassConstants() {
			        this.ERROR = 1;
			        this.OK = 2;
			    }
			    getCode() {
			        return 'CITY_FIELD_VALIDATION_FAILED';
			    }
			    addDetail(key, value) {
			    }
		}
        var result = applePay.failOrder(order, new Status(Status.ERROR));
        assert.equal(order.status.value, 8);
        assert.equal(session.privacy.applepayerror_emoji, true);
        assert.deepEqual(result, new ApplePayHookResult(new Status(Status.OK), null));
    });
    
    it('Testing method: failOrder COUNTRY_CODE_VALIDATION_FAILED', () => {
			class Status {
			    static setClassConstants() {
			        this.ERROR = 1;
			        this.OK = 2;
			    }
			    getCode() {
			        return 'COUNTRY_CODE_VALIDATION_FAILED';
			    }
			    addDetail(key, value) {
			    }
		}
        var result = applePay.failOrder(order, new Status(Status.ERROR));
        assert.equal(order.status.value, 8);
        assert.equal(session.privacy.applepayerror_emoji, true);
        assert.deepEqual(result, new ApplePayHookResult(new Status(Status.OK), null));
    });

    it('Testing method: shippingMethodSelected', () => {
        var cart = createApiBasket();
        var response = {};
        var expectedStr = '{"orderTotal":{"currencyCode":"USD","value":0},"lineItems":[{"type":"final","label":"Subtotal","amount":0},{"type":"final","amount":0},{"type":"final","label":"Estimated Tax","amount":0}],"total":{"label":"Under Armour","amount":0}}';
        var expected = JSON.parse(expectedStr);
        var result = shippingAndPaymentMethodSelected.shippingMethodSelected(cart, {}, {}, response);
        response = JSON.stringify(response);
        //assert.deepEqual(expectedObject, JSON.parse(response));
        assert.deepEqual(result, new ApplePayHookResult(new Status(Status.OK), null));
    });

    it('Testing method: paymentMethodSelected', () => {
        var cart = createApiBasket();
        var response = {};
        var expectedStr = '{"orderTotal":{"currencyCode":"USD","value":0},"lineItems":[{"type":"final","label":"Subtotal","amount":0},{"type":"final","amount":0},{"type":"final","label":"Estimated Tax","amount":0}],"total":{"label":"Under Armour","amount":0}}';
        var expected = JSON.parse(expectedStr);
        var result = shippingAndPaymentMethodSelected.paymentMethodSelected(cart, {}, response);
        response = JSON.stringify(response);
        //assert.deepEqual(expectedObject, JSON.parse(response));
        assert.deepEqual(result, new ApplePayHookResult(new Status(Status.OK), null));
    });

    it('Testing method: shippingContactSelected country is AU', () => {
        var basket = {
            defaultShipment: {
                shippingAddress: {
					custom : {
						suburb : ''
					},
					city : ''
				}
            }
        };
        var event = {
            shippingContact: {
                countryCode: 'AU',
                locality : 'AU'
            }
        };
        var result = shippingContactSelected.shippingContactSelected(basket, event, {});
        assert.deepEqual(result, new ApplePayHookResult(new Status(Status.OK), null));
    });
    
    it('Testing method: shippingContactSelected country is other then AU', () => {
        var basket = {
            defaultShipment: {
                shippingAddress: {
					custom : {
						suburb : ''
					},
					city : ''
				}
            }
        };
        var event = {
            shippingContact: {
                countryCode: 'TH',
                locality : 'TH'
            }
        };
        var result = shippingContactSelected.shippingContactSelected(basket, event, {});
        assert.deepEqual(result, new ApplePayHookResult(new Status(Status.OK), null));
    });
    
    it('Testing method: shippingContactSelected country With logger', () => {
        var basket = {
            defaultShipment: {
                shippingAddress: {}
            }
        };
        var event = {
            shippingContact: {
                countryCode: 'AU',
                locality : 'AU'
            }
        };
        var result = shippingContactSelected.shippingContactSelected(basket, event, {});
        assert.deepEqual(result, new ApplePayHookResult(new Status(Status.OK), null));
    });
    
    it('Testing method: authorizeOrderPayment with removeEmojis', () => {
		applePay = proxyquire(pathToLinkScripts + 'hooks/applePay/applePay', {
        'dw/system/Status': require('../../mocks/dw/dw_system_Status'),
        '*/cartridge/scripts/checkout/checkoutHelpers': {
            updateStateCode: function() {
                return '';
            },
            updatePostalCode: function() {
                return '';
            },
            autoCorrectPhonenumber: function() {
                return '';
            }
        },
        '*/cartridge/scripts/util/aurusAuthorizeApplepay': {
            aurusAuthorizeApplepay: function() {
                return {
					error : false
				};
            }
        },
        '*/cartridge/scripts/helpers/basketCalculationHelpers': { calculateTotals: function () { } },
        '*/cartridge/scripts/helpers/applePayHelper': {
			removeEmojis: function() {
                return false;
            },
		},
        'dw/extensions/applepay/ApplePayHookResult': ApplePayHookResult,
        'dw/system/Transaction': Transaction,
        'dw/system/Logger': Logger,
        'ApplePayLogger': Logger.getLogger(),
        'dw/order/OrderMgr': require('../../mocks/dw/dw_order_OrderMgr'),
        'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
        '*/cartridge/modules/providers': new AddressTypeProvider(),
        session: session,
        'dw/system/HookMgr': require('../../mocks/dw/dw_system_HookMgr'),
        'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
        'dw/order/ShippingMgr': require('../../mocks/dw/dw_order_ShippingMgr'),
        '*/cartridge/scripts/util/collections': require('../../../cartridges/lib_productlist/test/mocks/util/collections'),
        '*/cartridge/scripts/util/SetOrderStatus': {
            setCustomerName(order) {
                order.customerName = 'Test';
            }
        },
        '*/cartridge/scripts/checkout/checkoutHelpers': require('../../mocks/scripts/checkout/checkoutHelpers'),
        '*/cartridge/scripts/helpers/sitePreferencesHelper': {
            isAurusEnabled: function() {
                return true;
            }
        } 
    });
        var event = {
            payment: {
                shippingContact: {
                    phoneNumber: '9234567890',
                    emailAddress: 'abcd@xyz.com',
                    countryCode: 'US'
                },
                billingContact: {
                    countryCode: 'US'
                }
            }
        };
        var result = applePay.authorizeOrderPayment(order, event);
        assert.equal(order.getDefaultShipment().getShippingAddress().custom.addressType, 'BUSINESS');
    });
    
    it('Testing method: authorizeOrderPayment with isEmptyFieldPassed', () => {
		applePay = proxyquire(pathToLinkScripts + 'hooks/applePay/applePay', {
        'dw/system/Status': require('../../mocks/dw/dw_system_Status'),
        '*/cartridge/scripts/checkout/checkoutHelpers': {
            updateStateCode: function() {
                return '';
            },
            updatePostalCode: function() {
                return '';
            },
            autoCorrectPhonenumber: function() {
                return '';
            }
        },
        '*/cartridge/scripts/util/aurusAuthorizeApplepay': {
            aurusAuthorizeApplepay: function() {
                return {
					error : false
				};
            }
        },
        '*/cartridge/scripts/helpers/basketCalculationHelpers': { calculateTotals: function () { } },
        '*/cartridge/scripts/helpers/applePayHelper': {
			removeEmojis: function() {
                return true;
            },
            isEmptyFieldPassed: function() {
                return true;
            },
		},
        'dw/extensions/applepay/ApplePayHookResult': ApplePayHookResult,
        'dw/system/Transaction': Transaction,
        'dw/system/Logger': Logger,
        'ApplePayLogger': Logger.getLogger(),
        'dw/order/OrderMgr': require('../../mocks/dw/dw_order_OrderMgr'),
        'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
        '*/cartridge/modules/providers': new AddressTypeProvider(),
        session: session,
        'dw/system/HookMgr': require('../../mocks/dw/dw_system_HookMgr'),
        'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
        'dw/order/ShippingMgr': require('../../mocks/dw/dw_order_ShippingMgr'),
        '*/cartridge/scripts/util/collections': require('../../../cartridges/lib_productlist/test/mocks/util/collections'),
        '*/cartridge/scripts/util/SetOrderStatus': {
            setCustomerName(order) {
                order.customerName = 'Test';
            }
        },
        '*/cartridge/scripts/checkout/checkoutHelpers': require('../../mocks/scripts/checkout/checkoutHelpers'),
        '*/cartridge/scripts/helpers/sitePreferencesHelper': {
            isAurusEnabled: function() {
                return true;
            }
        } 
    });
        var event = {
            payment: {
                shippingContact: {
                    phoneNumber: '9234567890',
                    emailAddress: 'abcd@xyz.com',
                    countryCode: 'US'
                },
                billingContact: {
                    countryCode: 'US'
                }
            }
        };
        var result = applePay.authorizeOrderPayment(order, event);
        assert.equal(order.getDefaultShipment().getShippingAddress().custom.addressType, 'BUSINESS');
    });
    
    it('Testing method: authorizeOrderPayment with validatePostal', () => {
		applePay = proxyquire(pathToLinkScripts + 'hooks/applePay/applePay', {
        'dw/system/Status': require('../../mocks/dw/dw_system_Status'),
        '*/cartridge/scripts/checkout/checkoutHelpers': {
            updateStateCode: function() {
                return '';
            },
            updatePostalCode: function() {
                return '';
            },
            autoCorrectPhonenumber: function() {
                return '';
            }
        },
        '*/cartridge/scripts/util/aurusAuthorizeApplepay': {
            aurusAuthorizeApplepay: function() {
                return {
					error : false
				};
            }
        },
        '*/cartridge/scripts/helpers/basketCalculationHelpers': { calculateTotals: function () { } },
        '*/cartridge/scripts/helpers/applePayHelper': {
			removeEmojis: function() {
                return true;
            },
            isEmptyFieldPassed: function() {
                return false;
            },
            validatePostal: function() {
                return true;
            },
		},
        'dw/extensions/applepay/ApplePayHookResult': ApplePayHookResult,
        'dw/system/Transaction': Transaction,
        'dw/system/Logger': Logger,
        'ApplePayLogger': Logger.getLogger(),
        'dw/order/OrderMgr': require('../../mocks/dw/dw_order_OrderMgr'),
        'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
        '*/cartridge/modules/providers': new AddressTypeProvider(),
        session: session,
        'dw/system/HookMgr': require('../../mocks/dw/dw_system_HookMgr'),
        'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
        'dw/order/ShippingMgr': require('../../mocks/dw/dw_order_ShippingMgr'),
        '*/cartridge/scripts/util/collections': require('../../../cartridges/lib_productlist/test/mocks/util/collections'),
        '*/cartridge/scripts/util/SetOrderStatus': {
            setCustomerName(order) {
                order.customerName = 'Test';
            }
        },
        '*/cartridge/scripts/checkout/checkoutHelpers': require('../../mocks/scripts/checkout/checkoutHelpers'),
        '*/cartridge/scripts/helpers/sitePreferencesHelper': {
            isAurusEnabled: function() {
                return true;
            }
        } 
    });
        var event = {
            payment: {
                shippingContact: {
                    phoneNumber: '9234567890',
                    emailAddress: 'abcd@xyz.com',
                    countryCode: 'US'
                },
                billingContact: {
                    countryCode: 'US'
                }
            }
        };
        var result = applePay.authorizeOrderPayment(order, event);
        assert.equal(order.getDefaultShipment().getShippingAddress().custom.addressType, 'BUSINESS');
    });
    
});
