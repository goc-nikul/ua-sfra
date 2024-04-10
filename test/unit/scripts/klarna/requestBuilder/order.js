'use strict';


const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const LineItemCtnr = require('../../../../mocks/dw/dw_order_LineItemCtnr');
const Shipment = require('../../../../mocks/dw/dw_order_Shipment');
var ArrayList = require('../../../../mocks/dw/dw_util_ArrayList');
var lineItemCtnr = new LineItemCtnr();

describe('int_klarna_payments_custom/cartridge/scripts/payments/requestBuilder/order.js file test cases', () => {
    it('Testing method: init', () => {
        let KlarnaOrder = proxyquire('../../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/payments/requestBuilder/order.js', {
            '*/cartridge/scripts/payments/model/request/order': proxyquire('../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/model/request/order.js', {
                '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                    basketHasOnlyBOPISProducts: function () {
                        return false;
                    }
                }
            }),
            '*/cartridge/scripts/util/klarnaHelper': {
                isTaxationPolicyNet: function () {
                    return false;
                },
                getDiscountsTaxation: function () {
                    return 'price';
                },
                isOMSEnabled: function () {
                    return false;
                },
                getShippment: function () {
                    return lineItemCtnr.getDefaultShipment();
                }
            }
        });

        let klarnaOrderConst = new KlarnaOrder();
        var Order = require('../../../../mocks/dw/dw_order_Order');
        var order = new Order();
        var result = klarnaOrderConst.init(order);
        assert.isDefined(result, 'result defined');
    });

    it('Testing method: buildShipping', () => {
        let KlarnaOrderShip = proxyquire('../../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/payments/requestBuilder/order.js', {
            '*/cartridge/scripts/payments/model/request/order': proxyquire('../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/model/request/order.js', {}),
            '*/cartridge/scripts/util/klarnaHelper': {
                isTaxationPolicyNet: function () {
                    return false;
                },
                getDiscountsTaxation: function () {
                    return 'price';
                },
                isOMSEnabled: function () {
                    return false;
                },
                getShippment: function () {
                    return lineItemCtnr.getDefaultShipment();
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasOnlyBOPISProducts: function () {
                    return false;
                }
            }
        });
        KlarnaOrderShip.prototype.getAddressRequestBuilder = function () {
            return {
                build: function () {
                    return {};
                }
            };
        };
        KlarnaOrderShip.prototype.context = {};
        var Order = require('../../../../mocks/dw/dw_order_Order');
        var order = new Order();
        order.custom.isCommercialPickup = false;
        let klarnaOrderShipObj = new KlarnaOrderShip();
        var result = klarnaOrderShipObj.buildShipping(order);
        assert.isDefined(result, 'result defined');
        assert.isDefined(result.context.shipping_address, 'context.shipping_address defined');
        assert.isDefined(result.context.shipping_address.email, 'context.shipping_address.email defined');
        assert.isDefined(result.context.shipping_address.given_name, 'context.shipping_address.given_name defined');
        assert.isDefined(result.context.shipping_address.family_name, 'context.shipping_address.family_name defined');
    });

    it('Testing method: buildShipments', () => {
        let KlarnaOrderShipment = proxyquire('../../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/payments/requestBuilder/order.js', {
            '*/cartridge/scripts/payments/model/request/order': proxyquire('../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/model/request/order.js', {}),
            '*/cartridge/scripts/util/klarnaHelper': {
                isTaxationPolicyNet: function () {
                    return false;
                },
                getDiscountsTaxation: function () {
                    return 'price';
                },
                isOMSEnabled: function () {
                    return false;
                },
                getShippment: function () {
                    return lineItemCtnr.getDefaultShipment();
                }
            },
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasOnlyBOPISProducts: function () {
                    return false;
                }
            }
        });
        var klarnaOrderShipmentObj = new KlarnaOrderShipment();
        KlarnaOrderShipment.prototype.getShipmentItemRequestBuilder = function () {
            return {
                build: function () {
                    return 'str1';
                }
            };
        };
        KlarnaOrderShipment.prototype.addPriceAdjustments = function () {
            return {};
        };
        var shipment = new ArrayList(new Shipment());
        shipment[0].productLineItems = new ArrayList({
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: 'NONE'
                }
            },
            ID: '12345',
            name: 'test'
        });
        shipment[0].shippingPriceAdjustments = {
            toArray: () => {
                return [];
            }
        };
        var context = {
            order_lines: []
        };
        klarnaOrderShipmentObj.buildShipments(shipment, context);
        assert.isDefined(context, 'result defined');
        assert.isDefined(context.order_lines, 'context.order_lines defined');
    });

    it('Test isValidLocaleObjectParams method localeObject defined', function () {
        let KlarnaOrder = proxyquire('../../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/payments/requestBuilder/order.js', {
            '*/cartridge/scripts/payments/model/request/order': proxyquire('../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/model/request/order.js', {
                '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                    basketHasOnlyBOPISProducts: function () {
                        return false;
                    }
                }
            }),
            '*/cartridge/scripts/util/klarnaHelper': {
                isTaxationPolicyNet: function () {
                    return false;
                },
                getDiscountsTaxation: function () {
                    return 'price';
                },
                isOMSEnabled: function () {
                    return false;
                },
                getShippment: function () {
                    return lineItemCtnr.getDefaultShipment();
                }
            }
        });

        let klarnaOrderConst = new KlarnaOrder();
        var localeObject = {
            custom: {
                country: 'US',
                klarnaLocale: 'en_us'
            }
        };
        var result = klarnaOrderConst.isValidLocaleObjectParams(localeObject);
        assert.isTrue(result);
    });

    it('Test isValidLocaleObjectParams method if localeObject null', function () {
        let KlarnaOrder = proxyquire('../../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/payments/requestBuilder/order.js', {
            '*/cartridge/scripts/payments/model/request/order': proxyquire('../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/model/request/order.js', {
                '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                    basketHasOnlyBOPISProducts: function () {
                        return false;
                    }
                }
            }),
            '*/cartridge/scripts/util/klarnaHelper': {
                isTaxationPolicyNet: function () {
                    return false;
                },
                getDiscountsTaxation: function () {
                    return 'price';
                },
                isOMSEnabled: function () {
                    return false;
                },
                getShippment: function () {
                    return lineItemCtnr.getDefaultShipment();
                }
            }
        });

        let klarnaOrderConst = new KlarnaOrder();
        var localeObject = {
            custom: ''
        };
        var result = klarnaOrderConst.isValidLocaleObjectParams(localeObject);
        assert.isFalse(result);
    });
});
