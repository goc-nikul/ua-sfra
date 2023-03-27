'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;
var sinon = require('sinon');
var ArrayList = require('../../../../mocks/scripts/util/dw.util.Collection');
var Basket = require('../../.././../mocks/dw/dw_order_Basket');
var Money = require('../../../../mocks/dw/dw_value_Money');
const { del } = require('request');

var getCustomPreferenceValueStub = sinon.stub();
var getPaazlStatusStub = sinon.stub();
var getJsonValueStub = sinon.stub();
var getApplicableShippingMethodsStub = sinon.stub();
var getCurrentBasketStub = sinon.stub();

var basketMock = new Basket();

var svc = {
    requestMethod: '',
    setRequestMethod: function (reqMethod) {
        this.requestMethod = reqMethod;
    },
    addHeader: function (key, val) {
        Object.defineProperty(svc, key, {
            enumerable: true,
            value: val
        });
        return svc;
    },
    mock: false
};

describe('app_ua_emea/cartridge/scripts/helpers/applePayHelper.js', () => {
    var result;
    var applePayHelper = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/helpers/applePayHelper.js', {
        '*/cartridge/scripts/util/collections': require('../../../../mocks/scripts/util/collections'),
        'dw/value/Money': Money,
        'app_ua_core/cartridge/scripts/helpers/applePayHelper': {
            getShippingMethodCost() {
                return { value: 10 };
            }
        },
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/order/ShippingMgr': {
            getShipmentShippingModel() {
                return {
                    getApplicableShippingMethods: getApplicableShippingMethodsStub
                };
            }
        },
        '*/cartridge/scripts/helpers/paazlHelper': { getPaazlStatus: getPaazlStatusStub },
        'dw/system/Site': {
            current: {
                preferences: {
                    custom: {
                        EnableMCFailedEmailQueue: true,
                        MarketingCloudCOLimit: true
                    }
                },
                getCustomPreferenceValue: getCustomPreferenceValueStub
            },
            getCurrent() {
                return { getCustomPreferenceValue: getCustomPreferenceValueStub };
            }
        },
        'dw/svc/LocalServiceRegistry': {
            createService: (svcId, callback) => {
                return {
                    call: () => {
                        callback.createRequest(svc, {});
                        if (svc.mock === true) {
                            return callback.mockCall(svc, {});
                        }
                        return callback.parseResponse(svc, {});
                    }
                };
            }
        },
        'dw/order/Shipment': require('../../../../mocks/dw/dw_order_Shipment'),
        'dw/order/BasketMgr': { getCurrentBasket: getCurrentBasketStub },
        'dw/util/ArrayList': ArrayList,
        '*/cartridge/scripts/utils/PreferencesUtil': { getJsonValue: getJsonValueStub }
    });

    describe('Testing method: getResponseObject', () => {
        it('Testing: when product line items and paazlDeliveryInfo are not present in the basket', () => {
            global.session = {
                currency: {
                    currencyCode: 'EUR'
                },
                custom: {

                }
            };
            result = applePayHelper.getResponseObject(basketMock);
            assert.isDefined(result);
        });

        it('Testing: when product line items and paazlDeliveryInfo are present in the basket', () => {
            var productLineItems = [{ getAdjustedPrice() { return { valueOrNull: null }; } }, { getAdjustedPrice() { return { valueOrNull: 123 }; } }];
            basketMock.productLineItems = productLineItems;
            getPaazlStatusStub.returns({ active: true });
            basketMock.defaultShipment.custom.paazlDeliveryInfo = JSON.stringify({ name: 'test name' });
            result = applePayHelper.getResponseObject(basketMock);
            assert.isDefined(result);
            assert.isNotNull(result);
        });

        it('Testing: when parsing error occurred in the function ', () => {
            basketMock.defaultShipment.custom.paazlDeliveryInfo = 'error string';
            result = applePayHelper.getResponseObject(basketMock);
            assert.isDefined(result);
            basketMock.defaultShipment.custom.paazlDeliveryInfo = JSON.stringify({});
            result = applePayHelper.getResponseObject(basketMock);
            assert.isDefined(result);
            assert.isNotNull(result);
        });


        it('Testing: when total tax and shipping price not available ', () => {
            getPaazlStatusStub.returns({});
            basketMock.totalTax = new Money(0);
            basketMock.totalTax.available = false;
            basketMock.totalTax.valueOrNull = null;
            basketMock.shippingTotalPrice = new Money(0);
            basketMock.shippingTotalPrice.available = false;
            basketMock.shippingTotalPrice.valueOrNull = null;
            basketMock.getAdjustedMerchandizeTotalPrice = (param) => {
                if (!param) {
                    return new Money(5);
                }
                return new Money(0);
            };

            result = applePayHelper.getResponseObject(basketMock);
            assert.isDefined(result);
        });
    });

    describe('Testing method: validatePostal', () => {
        it('should return true when empty value passed to the function', () => {
            result = applePayHelper.validatePostal('', '');
            assert.isTrue(result);
        });

        it('should return false for valid postal code of the country', () => {
            result = applePayHelper.validatePostal('99950', 'US');
            assert.isFalse(result);
            result = applePayHelper.validatePostal('A1A 1A1', 'CA');
            assert.isFalse(result);
            result = applePayHelper.validatePostal('PO16 7GZ', 'GB');
            assert.isFalse(result);
            result = applePayHelper.validatePostal('9995', 'CH');
            assert.isFalse(result);
        });

        it('should return true for valid postal code of the country', () => {
            result = applePayHelper.validatePostal('9995', 'US');
            assert.isTrue(result);
            result = applePayHelper.validatePostal('A1A/1A1', 'CA');
            assert.isTrue(result);
            result = applePayHelper.validatePostal('PO16*7GZ', 'GB');
            assert.isTrue(result);
            result = applePayHelper.validatePostal('99959.', 'CH');
            assert.isTrue(result);
        });
    });

    describe('testing method: authorize', () => {
        var order = new Basket();
        it('should not call service when no PaymentInstruments available', () => {
            order.getPaymentInstruments = () => {
                return {
                    get() { }
                };
            };
            result = applePayHelper.authorize(order);
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isObject(result);
        });

        it('should log the error message when order is null', () => {
            result = applePayHelper.authorize(null);
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isObject(result);
        });

        it('should return mock result when it\'s a mock call with diffrent first name', () => {
            order.getPaymentInstruments = () => {
                return {
                    get() {
                        return {
                            paymentTransaction: {
                                amount: {
                                    value: 10,
                                    currencyCode: 'GBP'
                                }
                            },
                            custom: {
                                paymentData: 'test data'
                            }
                        };
                    }
                };
            };
            global.request = { httpHeaders: {} };
            svc.mock = true;
            order.billingAddress.firstName = 'Accept';
            getCustomPreferenceValueStub.withArgs('allowMultipleMerchantIDs').returns('test_MerchantIDs');
            getJsonValueStub.returns({
                GBP: 'GBP'
            });

            result = applePayHelper.authorize(order);
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isObject(result);

            order.billingAddress.firstName = '';
            getJsonValueStub.returns('');
            result = applePayHelper.authorize(order);
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isObject(result);

            order.billingAddress.firstName = 'test';
            getCustomPreferenceValueStub.withArgs('allowMultipleMerchantIDs').returns('');
            result = applePayHelper.authorize(order);
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isObject(result);
        });

        it('should call service and return\'s response when it\'s a live call', () => {
            svc.mock = false;
            result = applePayHelper.authorize(order);
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isObject(result);
        });
    });

    describe('Testing method :getApplicableShippingMethods', () => {
        it('checking the behaviour when paazlDeliveryInfo present shipment', () => {
            result = applePayHelper.getApplicableShippingMethods(basketMock);
            assert.isDefined(result);
            assert.isDefined(result.applePayShippingMethods);
            assert.isDefined(result.applicableShippingMethodsObject);
        });

        it('checking the behaviour when productLineItems present in the basket', () => {
            basketMock.productLineItems = new ArrayList([{
                product: {
                    custom: {
                        isPreOrder: true
                    }

                }
            }, {
                product: {
                    custom: {
                        isPreOrder: true
                    }

                }
            }, {}]);
            result = applePayHelper.getApplicableShippingMethods(basketMock);
            assert.isDefined(result);
            assert.isDefined(result.applePayShippingMethods);
            assert.isDefined(result.applicableShippingMethodsObject);
        });

        it('Testing for shipping methods for same as defaul shipping', () => {
            basketMock.defaultShipment.custom.paazlDeliveryInfo = '';
            basketMock.defaultShipment.shippingMethod.ID = 'standard-pre-order-AK-HI';

            getApplicableShippingMethodsStub.returns(new ArrayList([{
                ID: 'standard-pre-order-AK-HI',
                displayName: ' Test name 1',
                custom: {
                    storePickupEnabled: false,
                    isHALshippingMethod: false
                }
            }, {
                ID: 'test_id',
                displayName: ' Test name 2',
                custom: {
                    storePickupEnabled: false,
                    isHALshippingMethod: false
                }
            }]));
            result = applePayHelper.getApplicableShippingMethods(basketMock);
            assert.isDefined(result);
            assert.isDefined(result.applePayShippingMethods);
            assert.isDefined(result.applicableShippingMethodsObject);
        });

        it('Testing for shipping methods not same as defaul shipping', () => {
            basketMock.defaultShipment.shippingMethod.ID = 'test_id';
            getApplicableShippingMethodsStub.returns(new ArrayList([{
                ID: 'standard-pre-order-AK-HI',
                displayName: ' Test name 1',
                custom: {
                    storePickupEnabled: true,
                    isHALshippingMethod: true
                }
            }, {
                ID: 'eGift_Card',
                displayName: ' Test name 2',
                custom: {
                    storePickupEnabled: true,
                    isHALshippingMethod: true
                }
            }, {
                ID: 'standard-pre-order-AK-HI',
                displayName: ' Test name 1',
                custom: {
                    storePickupEnabled: true,
                    isHALshippingMethod: false
                }
            }
            ]));
            getCurrentBasketStub.returns({
                custom: {
                    isCommercialPickup: true
                }
            });
            result = applePayHelper.getApplicableShippingMethods(basketMock);
            assert.isDefined(result);
            assert.isDefined(result.applePayShippingMethods);
            assert.isDefined(result.applicableShippingMethodsObject);
        });

        it('should return empty object when shippingAddress not available in defaultShipment', () => {
            delete basketMock.defaultShipment.shippingAddress;
            result = applePayHelper.getApplicableShippingMethods(basketMock);
            assert.isDefined(result);
            assert.deepEqual(result, {});
        });

        it('checking the behaviour when paazlDeliveryInfo present shipment --> method.ID !== standard-pre-order-AK-HI', () => {
            basketMock.defaultShipment.shippingMethod.ID = 'eGift_Card';
            basketMock.defaultShipment.shippingAddress = {
                countryCode: {}
            };
            result = applePayHelper.getApplicableShippingMethods(basketMock);
            assert.isDefined(result);
            assert.isDefined(result.applePayShippingMethods);
            assert.isDefined(result.applicableShippingMethodsObject);
        });
    });
});
