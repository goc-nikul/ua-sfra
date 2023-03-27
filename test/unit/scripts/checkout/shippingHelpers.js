'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const Shipment = require('../../../mocks/dw/dw_order_Shipment');
const ShippingMgr = require('../../../mocks/dw/dw_order_ShippingMgr');
var LineItemCtnr = require('../../../mocks/dw/dw_order_LineItemCtnr');
var ArrayList = require('../../../mocks/scripts/util/dw.util.Collection');
describe('app_ua_core/cartridge/scripts/checkout/shippingHelpers test', () => {
    let shippingHelpers = require('../../../mocks/scripts/checkout/shippingHelpers');    

    it('Testing method: getApplicableShippingMethods', () => {
        var shipment = new Shipment();
        var baseAddress = shipment.shippingAddress;
        let result = shippingHelpers.getApplicableShippingMethods(shipment, baseAddress);
        let compareresult = {
                description: result[0].description,
                displayName: result[0].displayName,
                ID: result[0].ID,
                defaultMethod: result[0].default,
                shippingCost: result[0].shippingCost,
                custom: {
                    estimatedArrivalTime: result[0].estimatedArrivalTime,
                    storePickupEnabled: result[0].storePickupEnabled
                }
        }
        let applicableShippingMethod = ShippingMgr.getShipmentShippingModel().getApplicableShippingMethods().get(0);
        assert.deepEqual(applicableShippingMethod, compareresult, 'error in getApplicableShippingMethods');
    });

    it('Testing method: getShippingMethodByID', () => {
        var shippingMethodID = '001';
        let result = shippingHelpers.getShippingMethodByID(shippingMethodID);
        assert.equal(result.ID, shippingMethodID, 'error in getShippingMethodByID');
    });

    it('Testing method: getShipmentByUUID', () => {
        assert.doesNotThrow(() => shippingHelpers.getShipmentByUUID());
        assert.isNull(shippingHelpers.getShipmentByUUID());
        var basket = new LineItemCtnr();
        basket.createShipment('shipment1');
        basket.createShipment('shipment2');
        assert.isNotNull(shippingHelpers.getShipmentByUUID(basket));
    });

    it('Testing method: getAddressFromRequest', () => {
        var req = {
            querystring: { shipmentUUID: null },
            form: {
                firstName: 'fname',
                lastName: 'lname',
                address1: 'add1',
                address2: 'add2',
                city: 'city',
                stateCode: 'FL',
                postalCode: '12345',
                countryCode: 'US',
                phone: '2222222222'
            }
        };
        global.request = {
            getLocale: () => 'US'
        }
        assert.deepEqual(shippingHelpers.getAddressFromRequest(req), req.form);
    });

    it('Testing method: filterApplicableShippingMethods', () => {
        assert.isNull(shippingHelpers.filterApplicableShippingMethods(), 'Should be null for no shipment selected');
        var basket = new LineItemCtnr();
        var shipment = basket.createShipment('shipment1');
        assert.isAtLeast(shippingHelpers.filterApplicableShippingMethods(shipment).length, 1);
        shipment.shippingAddress = null;
        assert.isAtLeast(shippingHelpers.filterApplicableShippingMethods(shipment).length, 1);
    });

    it('Testing method: setShippingMethodPromotionalPrice', () => {
        var order = {
            shipping: [{
                selectedShippingMethod: {
                    ID: 'method1',
                    shippingCost: ''
                },
                applicableShippingMethods: [{
                    ID: 'method1',
                    shippingCost: ''
                }]
            }],
            totals: {
                shippingLevelDiscountTotal: { formatted: '$5' },
                totalShippingCost: '$5'
            },
            currencyCode: 'USD'
        };
        assert.doesNotThrow(() => shippingHelpers.setShippingMethodPromotionalPrice(order));
    });

    it('Testing method: selectShippingMethod', function () {
        var shipment = new (require('../../../mocks/dw/dw_order_Shipment'))();
        var address = { stateCode: 'FL', postalCode: '98051' };
        assert.doesNotThrow(() => shippingHelpers.selectShippingMethod(shipment, null, [], address));
        assert.doesNotThrow(() => shippingHelpers.selectShippingMethod(shipment, null, [], address));
        assert.doesNotThrow(() => shippingHelpers.selectShippingMethod(shipment, null, null, address));
    });

    it('Testing method: setShippingMethodPrice', () => {
        var basket = new LineItemCtnr();
        assert.doesNotThrow(() => shippingHelpers.setShippingMethodPrice(basket));
    });

    it('Testing method: getAddressFromRequest --> req.querystring.shipmentUUID is not null and isCommercialPickup basket', () => {
        var req = {
            querystring: {
                shipmentUUID: 'shipmentUUID'
            },
            form: {
                firstName: 'fname',
                lastName: 'lname',
                address1: 'add1',
                address2: 'add2',
                city: 'city',
                stateCode: 'FL',
                postalCode: '12345',
                countryCode: 'US',
                phone: '2222222222'
            },
            currentCustomer: {
                raw: {
                    profile: {}
                }
            }
        };
        global.request = {
            getLocale: () => 'US'
        }
        var basket = new LineItemCtnr();
        basket.custom.isCommercialPickup = true;
        basket.shipments = new ArrayList([
            {
                UUID: 'shipmentUUID',
                shippingAddress: {}
            }
        ]);
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        BasketMgr.setCurrentBasket(basket);
        var res = shippingHelpers.getAddressFromRequest(req);
    });

    it('Testing method: getApplicableShippingMethods', () => {
        shippingHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/shippingHelpers', {
            'dw/order/ShippingMgr': {
                getShipmentShippingModel: function () {
                    return {
                        getApplicableShippingMethods: function () {
                            return new ArrayList([
                                {
                                    ID: 'standard-usps-pob',
                                    custom: {
                                        storePickupEnabled: true
                                    },
                                    remove: function () {
                                        return {};
                                    }
                                },
                                {
                                    ID: 'standard-pre-order-AK-HI',
                                    custom: {
                                        storePickupEnabled: true
                                    },
                                    remove: function () {
                                        return {};
                                    }
                                }
                            ],
                            {
                                remove: function () {
                                    return {};
                                }
                            });
                        }
                    }
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            '*/cartridge/models/shipping/shippingMethod': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/shippingHelpers': {},
            'app_storefront_base/cartridge/scripts/checkout/shippingHelpers': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getID: function () {
                            return 'us';
                        }
                    }
                },
                current: {
                    getCustomPreferenceValue: function () {
                        return {};
                    }
                }
            },
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/util/Locale': require('../../../mocks/dw/dw_util_Locale'),
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: () => true,
                basketHasOnlyBOPISProducts: () => false
            }
        });
        var shipment = new Shipment();
        var baseAddress = shipment.shippingAddress;
        var basket = new LineItemCtnr();
        basket.getDefaultShipment = function () {
            return {
                getShippingMethod: function () {
                    return {
                        getID: function() {
                            return 'ID';
                        }
                    }
                }
            }
        }
        basket.productLineItems = new ArrayList ([
            {
                product: {
                    custom: {
                        isPreOrder: true
                    }
                }
            }
        ])
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        BasketMgr.setCurrentBasket(basket);
        let result = shippingHelpers.getApplicableShippingMethods(shipment, baseAddress);
    });

    it('Testing method: getApplicableShippingMethods', () => {
        shippingHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/shippingHelpers', {
            'dw/order/ShippingMgr': {
                getShipmentShippingModel: function () {
                    return {
                        getApplicableShippingMethods: function () {
                            return new ArrayList([
                                {
                                    ID: 'standard-usps-pob',
                                    custom: {
                                        storePickupEnabled: true,
                                        isHALshippingMethod: true
                                    },
                                    remove: function () {
                                        return {};
                                    }
                                },
                                {
                                    ID: 'standard-pre-order-AK-HI',
                                    custom: {
                                        storePickupEnabled: true
                                    },
                                    remove: function () {
                                        return {};
                                    }
                                }
                            ],
                            {
                                remove: function () {
                                    return {};
                                }
                            });
                        }
                    }
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            '*/cartridge/models/shipping/shippingMethod': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/shippingHelpers': {},
            'app_storefront_base/cartridge/scripts/checkout/shippingHelpers': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getID: function () {
                            return 'us';
                        }
                    }
                },
                current: {
                    getCustomPreferenceValue: function () {
                        return {};
                    }
                }
            },
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/util/Locale': require('../../../mocks/dw/dw_util_Locale'),
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: () => true,
                basketHasOnlyBOPISProducts: () => false
            }
        });
        var shipment = new Shipment();
        var baseAddress = shipment.shippingAddress;
        var basket = new LineItemCtnr();
        basket.getDefaultShipment = function () {
            return {
                getShippingMethod: function () {
                    return {
                        getID: function() {
                            return 'ID';
                        }
                    }
                }
            }
        }
        basket.productLineItems = new ArrayList ([
            {
                product: {
                    custom: {
                        isPreOrder: true
                    }
                }
            }
        ])
        basket.custom.isCommercialPickup = true
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        BasketMgr.setCurrentBasket(basket);
        let result = shippingHelpers.getApplicableShippingMethods(shipment, baseAddress);
    });

    it('Testing method: getApplicableShippingMethods --> pass address as null value', () => {
        shippingHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/shippingHelpers', {
            'dw/order/ShippingMgr': {
                getShipmentShippingModel: function () {
                    return {
                        getApplicableShippingMethods: function () {
                            return new ArrayList([
                                {
                                    ID: 'standard-usps-pob',
                                    custom: {
                                        storePickupEnabled: true,
                                        isHALshippingMethod: true
                                    },
                                    remove: function () {
                                        return {};
                                    }
                                },
                                {
                                    ID: 'standard-pre-order-AK-HI',
                                    custom: {
                                        storePickupEnabled: true
                                    },
                                    remove: function () {
                                        return {};
                                    }
                                }
                            ],
                            {
                                remove: function () {
                                    return {};
                                }
                            });
                        }
                    }
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            '*/cartridge/models/shipping/shippingMethod': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/shippingHelpers': {},
            'app_storefront_base/cartridge/scripts/checkout/shippingHelpers': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getID: function () {
                            return 'us';
                        }
                    }
                },
                current: {
                    getCustomPreferenceValue: function () {
                        return {};
                    }
                }
            },
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/util/Locale': require('../../../mocks/dw/dw_util_Locale'),
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: () => true,
                basketHasOnlyBOPISProducts: () => false
            }
        });
        var shipment = new Shipment();
        var baseAddress = shipment.shippingAddress;
        var basket = new LineItemCtnr();
        basket.getDefaultShipment = function () {
            return {
                getShippingMethod: function () {
                    return {
                        getID: function() {
                            return 'ID';
                        }
                    }
                }
            }
        }
        basket.productLineItems = new ArrayList ([
            {
                product: {
                    custom: {
                        isPreOrder: true
                    }
                }
            }
        ])
        basket.custom.isCommercialPickup = true
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        BasketMgr.setCurrentBasket(basket);
        shipment.shippingAddress =  null;
        let result = shippingHelpers.getApplicableShippingMethods(shipment, null);
        assert.isNotNull(result);
    });

    it('Testing method: getApplicableShippingMethods --> pass shipment as null value', () => {
        shippingHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/shippingHelpers', {
            'dw/order/ShippingMgr': {
                getShipmentShippingModel: function () {
                    return {
                        getApplicableShippingMethods: function () {
                            return new ArrayList([
                                {
                                    ID: 'standard-usps-pob',
                                    custom: {
                                        storePickupEnabled: true,
                                        isHALshippingMethod: true
                                    },
                                    remove: function () {
                                        return {};
                                    }
                                },
                                {
                                    ID: 'standard-pre-order-AK-HI',
                                    custom: {
                                        storePickupEnabled: true
                                    },
                                    remove: function () {
                                        return {};
                                    }
                                }
                            ],
                            {
                                remove: function () {
                                    return {};
                                }
                            });
                        }
                    }
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            '*/cartridge/models/shipping/shippingMethod': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/shippingHelpers': {},
            'app_storefront_base/cartridge/scripts/checkout/shippingHelpers': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getID: function () {
                            return 'us';
                        }
                    }
                },
                current: {
                    getCustomPreferenceValue: function () {
                        return {};
                    }
                }
            },
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/util/Locale': require('../../../mocks/dw/dw_util_Locale'),
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: () => true,
                basketHasOnlyBOPISProducts: () => false
            }
        });
        var shipment = new Shipment();
        var baseAddress = shipment.shippingAddress;
        var basket = new LineItemCtnr();
        basket.getDefaultShipment = function () {
            return {
                getShippingMethod: function () {
                    return {
                        getID: function() {
                            return 'ID';
                        }
                    }
                }
            }
        }
        basket.productLineItems = new ArrayList ([
            {
                product: {
                    custom: {
                        isPreOrder: true
                    }
                }
            }
        ])
        basket.custom.isCommercialPickup = true
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        BasketMgr.setCurrentBasket(basket);
        shipment =  null;
        let result = shippingHelpers.getApplicableShippingMethods(shipment, null);
        assert.isNull(result);
    });

    it('Testing method: getApplicableShippingMethods --> pass address as null value and shipment.shippingAddress has a value', () => {
        shippingHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/shippingHelpers', {
            'dw/order/ShippingMgr': {
                getShipmentShippingModel: function () {
                    return {
                        getApplicableShippingMethods: function () {
                            return new ArrayList([
                                {
                                    ID: 'standard-usps-pob',
                                    custom: {
                                        storePickupEnabled: true,
                                        isHALshippingMethod: true
                                    },
                                    remove: function () {
                                        return {};
                                    }
                                },
                                {
                                    ID: 'standard-pre-order-AK-HI',
                                    custom: {
                                        storePickupEnabled: true
                                    },
                                    remove: function () {
                                        return {};
                                    }
                                }
                            ],
                            {
                                remove: function () {
                                    return {};
                                }
                            });
                        }
                    }
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            '*/cartridge/models/shipping/shippingMethod': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/shippingHelpers': {},
            'app_storefront_base/cartridge/scripts/checkout/shippingHelpers': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getID: function () {
                            return 'us';
                        }
                    }
                },
                current: {
                    getCustomPreferenceValue: function () {
                        return {};
                    }
                }
            },
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/util/Locale': require('../../../mocks/dw/dw_util_Locale'),
            'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: () => true,
                basketHasOnlyBOPISProducts: () => false
            }
        });
        var shipment = new Shipment();
        var baseAddress = shipment.shippingAddress;
        var basket = new LineItemCtnr();
        basket.getDefaultShipment = function () {
            return {
                getShippingMethod: function () {
                    return {
                        getID: function() {
                            return 'ID';
                        }
                    }
                }
            }
        }
        basket.productLineItems = new ArrayList ([
            {
                product: {
                    custom: {
                        isPreOrder: true
                    }
                }
            }
        ])
        basket.custom.isCommercialPickup = true
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        BasketMgr.setCurrentBasket(basket);
        shipment.shippingAddress = {};
        let result = shippingHelpers.getApplicableShippingMethods(shipment, null);
    });

    it('Testing method: filterApplicableShippingMethods', () => {
        assert.isNull(shippingHelpers.filterApplicableShippingMethods(), 'Should be null for no shipment selected');
        var basket = new LineItemCtnr();
        var shipment = basket.createShipment('shipment1');
        assert.isAtLeast(shippingHelpers.filterApplicableShippingMethods(shipment).length, 1);
        shipment.shippingAddress = null;
        assert.isAtLeast(shippingHelpers.filterApplicableShippingMethods(shipment).length, 1);
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        basket.productLineItems = new ArrayList ([
            {
                product: {
                    custom: {
                        isPreOrder: true
                    }
                }
            }
        ])
        BasketMgr.setCurrentBasket(basket);
        basket.custom.isCommercialPickup = false;
        assert.isAtLeast(shippingHelpers.filterApplicableShippingMethods(shipment).length, 1);
    });

    it('Testing method: selectShippingMethod --> shippingMethodID && !shipment.custom.fromStoreId', function () {
        shippingHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/shippingHelpers', {
            'dw/order/ShippingMgr': {
                getDefaultShippingMethod: function () {

                },
                getShipmentShippingModel: function () {
                    return {
                        getApplicableShippingMethods: function () {
                            return new ArrayList([
                                {
                                    ID: 'standard-usps-pob',
                                    custom: {
                                        storePickupEnabled: true
                                    },
                                    remove: function () {
                                        return {};
                                    }
                                },
                                {
                                    ID: 'standard-pre-order-AK-HI',
                                    custom: {
                                        storePickupEnabled: true
                                    },
                                    remove: function () {
                                        return {};
                                    }
                                }
                            ],
                            {
                                remove: function () {
                                    return {};
                                }
                            });
                        }
                    }
                },
                getAllShippingMethods: function () {
                    return new ArrayList([
                        {
                            description: 'Order received within 7-10 business days',
                            displayName: 'Ground',
                            ID: 'standard-pre-order-AK-HI',
                            defaultMethod: false,
                            shippingCost: '$0.00',
                            custom: {
                                estimatedArrivalTime: '7-10 Business Days',
                                storePickupEnabled: false
                            }
                        },
                        {
                            description: 'Order received in 2 business days',
                            displayName: 'eGift_Card',
                            ID: 'eGift_Card',
                            shippingCost: '$0.00',
                            defaultMethod: false,
                            custom: {
                                estimatedArrivalTime: '2 Business Days',
                                storePickupEnabled: false
                            }
                        }
                    ]);
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            '*/cartridge/models/shipping/shippingMethod': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/shippingHelpers': {},
            'app_storefront_base/cartridge/scripts/checkout/shippingHelpers': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getID: function () {
                            return 'us';
                        },
                        getCustomPreferenceValue: function () {
                            return {};
                        }
                    }
                },
                current: {
                    getCustomPreferenceValue: function () {
                        return {};
                    }
                }
            },
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/util/Locale': require('../../../mocks/dw/dw_util_Locale'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: () => true,
                basketHasOnlyBOPISProducts: () => false
            }
        });
        var shipment = new (require('../../../mocks/dw/dw_order_Shipment'))();
        var address = { stateCode: 'FL', postalCode: '98051' };
        shipment.shippingAddress = {
            countryCode: {}
        };
        var basket = new LineItemCtnr();
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        BasketMgr.setCurrentBasket(basket);
        basket.custom.isCommercialPickup = true;
        shipment.custom.fromStoreId = null;
       var res =  shippingHelpers.selectShippingMethod(shipment, 'standard-usps-pob', null, address);
    });

    it('Testing method: selectShippingMethod --> !isShipmentSet and !shipment.custom.fromStoreId', function () {
        shippingHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/shippingHelpers', {
            'dw/order/ShippingMgr': {
                getDefaultShippingMethod: function () {
                    return {
                        ID: 'standard-usps-pob'
                    }
                },
                getShipmentShippingModel: function () {
                    return {
                        getApplicableShippingMethods: function () {
                            return new ArrayList([
                                {
                                    ID: 'standard-usps-pob',
                                    custom: {
                                        storePickupEnabled: true
                                    },
                                    remove: function () {
                                        return {};
                                    }
                                },
                                {
                                    ID: 'standard-pre-order-AK-HI',
                                    custom: {
                                        storePickupEnabled: true
                                    },
                                    remove: function () {
                                        return {};
                                    }
                                }
                            ],
                            {
                                remove: function () {
                                    return {};
                                }
                            });
                        }
                    }
                },
                getAllShippingMethods: function () {
                    return new ArrayList([
                        {
                            description: 'Order received within 7-10 business days',
                            displayName: 'Ground',
                            ID: 'testaa',
                            defaultMethod: false,
                            shippingCost: '$0.00',
                            custom: {
                                estimatedArrivalTime: '7-10 Business Days',
                                storePickupEnabled: false
                            }
                        },
                        {
                            description: 'Order received in 2 business days',
                            displayName: 'eGift_Card',
                            ID: 'eGift_Card',
                            shippingCost: '$0.00',
                            defaultMethod: false,
                            custom: {
                                estimatedArrivalTime: '2 Business Days',
                                storePickupEnabled: false
                            }
                        }
                    ]);
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            '*/cartridge/models/shipping/shippingMethod': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/shippingHelpers': {},
            'app_storefront_base/cartridge/scripts/checkout/shippingHelpers': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getID: function () {
                            return 'us';
                        },
                        getCustomPreferenceValue: function () {
                            return {};
                        }
                    }
                },
                current: {
                    getCustomPreferenceValue: function () {
                        return {};
                    },
                    preferences: {
                        custom: {
                            totalShipmentCostThreshold: 'totalShipmentCostThreshold'
                        }
                    }
                }
            },
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/util/Locale': require('../../../mocks/dw/dw_util_Locale'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: () => true,
                basketHasOnlyBOPISProducts: () => false
            }
        });
        var shipment = new (require('../../../mocks/dw/dw_order_Shipment'))();
        var address = { stateCode: 'FL', postalCode: '98051' };
        shipment.shippingAddress = {
            countryCode: {}
        };
        var basket = new LineItemCtnr();
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        BasketMgr.setCurrentBasket(basket);
        basket.custom.isCommercialPickup = true;
        shipment.custom.fromStoreId = null;
       var res =  shippingHelpers.selectShippingMethod(shipment, 'testabc', null, address);
    });

    it('Testing method: selectShippingMethod --> isShipmentSet equal false and !shipment.custom.fromStoreId --> Test getFirstApplicableShippingMethod', function () {
        shippingHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/shippingHelpers', {
            'dw/order/ShippingMgr': {
                getDefaultShippingMethod: function () {
                    return 'aaa'
                },
                getShipmentShippingModel: function () {
                    return {
                        getApplicableShippingMethods: function () {
                            return new ArrayList([
                                {
                                    ID: 'standard-usps-pob',
                                    custom: {
                                        storePickupEnabled: false
                                    },
                                    remove: function () {
                                        return {};
                                    }
                                },
                                {
                                    ID: 'standard-pre-order-AK-HI',
                                    custom: {
                                        storePickupEnabled: true
                                    },
                                    remove: function () {
                                        return {};
                                    }
                                }
                            ],
                            {
                                remove: function () {
                                    return {};
                                }
                            });
                        }
                    }
                },
                getAllShippingMethods: function () {
                    return new ArrayList([
                        {
                            description: 'Order received within 7-10 business days',
                            displayName: 'Ground',
                            ID: 'testaa',
                            defaultMethod: false,
                            shippingCost: '$0.00',
                            custom: {
                                estimatedArrivalTime: '7-10 Business Days',
                                storePickupEnabled: false
                            }
                        },
                        {
                            description: 'Order received in 2 business days',
                            displayName: 'eGift_Card',
                            ID: 'eGift_Card',
                            shippingCost: '$0.00',
                            defaultMethod: false,
                            custom: {
                                estimatedArrivalTime: '2 Business Days',
                                storePickupEnabled: false
                            }
                        }
                    ]);
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            '*/cartridge/models/shipping/shippingMethod': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/shippingHelpers': {},
            'app_storefront_base/cartridge/scripts/checkout/shippingHelpers': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getID: function () {
                            return 'us';
                        },
                        getCustomPreferenceValue: function () {
                            return {};
                        }
                    }
                },
                current: {
                    getCustomPreferenceValue: function () {
                        return {};
                    },
                    preferences: {
                        custom: {
                            totalShipmentCostThreshold: 'totalShipmentCostThreshold'
                        }
                    }
                }
            },
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/util/Locale': require('../../../mocks/dw/dw_util_Locale'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: () => true,
                basketHasOnlyBOPISProducts: () => false
            }
        });
        var shipment = new (require('../../../mocks/dw/dw_order_Shipment'))();
        var address = { stateCode: 'FL', postalCode: '98051' };
        shipment.shippingAddress = {
            countryCode: {}
        };
        var basket = new LineItemCtnr();
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        BasketMgr.setCurrentBasket(basket);
        basket.custom.isCommercialPickup = true;
        shipment.custom.fromStoreId = null;
        var res =  shippingHelpers.selectShippingMethod(shipment, 'testabc', null, address);
    });

    it('Testing method: selectShippingMethod --> getApplicableShippingMethods length is 0', function () {
        shippingHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/shippingHelpers', {
            'dw/order/ShippingMgr': {
                getDefaultShippingMethod: function () {
                    return 'aaa'
                },
                getShipmentShippingModel: function () {
                    return {
                        getApplicableShippingMethods: function () {
                            return new ArrayList([
                            ],
                            {
                                remove: function () {
                                    return {};
                                }
                            });
                        }
                    }
                },
                getAllShippingMethods: function () {
                    return new ArrayList([
                        {
                            description: 'Order received within 7-10 business days',
                            displayName: 'Ground',
                            ID: 'testaa',
                            defaultMethod: false,
                            shippingCost: '$0.00',
                            custom: {
                                estimatedArrivalTime: '7-10 Business Days',
                                storePickupEnabled: false
                            }
                        },
                        {
                            description: 'Order received in 2 business days',
                            displayName: 'eGift_Card',
                            ID: 'eGift_Card',
                            shippingCost: '$0.00',
                            defaultMethod: false,
                            custom: {
                                estimatedArrivalTime: '2 Business Days',
                                storePickupEnabled: false
                            }
                        }
                    ]);
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            '*/cartridge/models/shipping/shippingMethod': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/shippingHelpers': {},
            'app_storefront_base/cartridge/scripts/checkout/shippingHelpers': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getID: function () {
                            return 'us';
                        },
                        getCustomPreferenceValue: function () {
                            return {};
                        }
                    }
                },
                current: {
                    getCustomPreferenceValue: function () {
                        return {};
                    },
                    preferences: {
                        custom: {
                            totalShipmentCostThreshold: 'totalShipmentCostThreshold'
                        }
                    }
                }
            },
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/util/Locale': require('../../../mocks/dw/dw_util_Locale'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: () => true,
                basketHasOnlyBOPISProducts: () => false
            }
        });
        var shipment = new (require('../../../mocks/dw/dw_order_Shipment'))();
        var address = { stateCode: 'FL', postalCode: '98051' };
        shipment.shippingAddress = {
            countryCode: {}
        };
        var basket = new LineItemCtnr();
        var BasketMgr = require('../../../../test/mocks/dw/dw_order_BasketMgr');
        BasketMgr.setCurrentBasket(basket);
        basket.custom.isCommercialPickup = true;
        shipment.custom.fromStoreId = null;
        var res =  shippingHelpers.selectShippingMethod(shipment, 'testabc', null, address);
    });

    it('Testing method: setShippingMethodPrice -->  shipMethod.custom.storePickupEnabled and shipmentCost !== 0 && shipmentCost >= totalShipmentCostThreshold', () => {
        shippingHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/shippingHelpers', {
            'dw/order/ShippingMgr': {
                getDefaultShippingMethod: function () {
                    return 'aaa'
                },
                getShipmentShippingModel: function () {
                    return {
                        getApplicableShippingMethods: function () {
                            return new ArrayList([
                                {
                                    ID: 'standard-usps-pob',
                                    custom: {
                                        storePickupEnabled: true
                                    },
                                    remove: function () {
                                        return {};
                                    }
                                },
                                {
                                    ID: 'standard-pre-order-AK-HI',
                                    custom: {
                                        storePickupEnabled: true
                                    },
                                    remove: function () {
                                        return {};
                                    }
                                }
                            ],
                            {
                                remove: function () {
                                    return {};
                                }
                            });
                        },
                        getShippingCost: function () {
                            return {
                                getAmount: function () {
                                    return {
                                        value: 1
                                    }
                                }
                            };
                        }
                    }
                },
                getAllShippingMethods: function () {
                    return new ArrayList([
                        {
                            description: 'Order received within 7-10 business days',
                            displayName: 'Ground',
                            ID: 'testaa',
                            defaultMethod: false,
                            shippingCost: '$0.00',
                            custom: {
                                estimatedArrivalTime: '7-10 Business Days',
                                storePickupEnabled: false
                            }
                        },
                        {
                            description: 'Order received in 2 business days',
                            displayName: 'eGift_Card',
                            ID: 'eGift_Card',
                            shippingCost: '$0.00',
                            defaultMethod: false,
                            custom: {
                                estimatedArrivalTime: '2 Business Days',
                                storePickupEnabled: false
                            }
                        }
                    ]);
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            '*/cartridge/models/shipping/shippingMethod': function () {},
            'plugin_instorepickup/cartridge/scripts/checkout/shippingHelpers': {},
            'app_storefront_base/cartridge/scripts/checkout/shippingHelpers': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getID: function () {
                            return 'us';
                        },
                        getCustomPreferenceValue: function () {
                            return 1;
                        }
                    }
                },
                current: {
                    getCustomPreferenceValue: function () {
                        return {};
                    },
                    preferences: {
                        custom: {
                            totalShipmentCostThreshold: 'totalShipmentCostThreshold'
                        }
                    }
                }
            },
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            'dw/util/Locale': require('../../../mocks/dw/dw_util_Locale'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: () => true,
                basketHasOnlyBOPISProducts: () => false
            }
        });
        var basket = new LineItemCtnr();
        basket.getShipments = function () {
            return  new ArrayList([
                {
                    adjustedMerchandizeTotalPrice: {
                        value: 1
                    },
                    getShippingMethod: function () {
                        return {
                            custom: {
                                isIncludeBopisShipmentCost: 'isIncludeBopisShipmentCost'
                            },
                        }
                    }
                }
            ]);
        }
        var ships = new ArrayList([
            {
                custom: {

                },
                adjustedMerchandizeTotalPrice: {
                    value: 1
                },
                getShippingLineItems: function () {
                    return [
                        {
                            setPriceValue: function () {
                                return {};
                            }
                        }
                    ];
                },
                getShippingMethod: function () {
                    return {
                        custom: {
                            isIncludeBopisShipmentCost: 'isIncludeBopisShipmentCost'
                        },
                    }
                }
            }
        ]);
        basket.shipments = ships;
        var res = shippingHelpers.setShippingMethodPrice(basket);
    })

});
