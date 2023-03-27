'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const Shipment = require('../../mocks/dw/dw_order_Shipment');
const ArrayList = require('../../mocks/scripts/util/dw.util.Collection');
const BasketMgr = require('../../../test/mocks/dw/dw_order_BasketMgr');

describe('app_ua_core/cartridge/scripts/helpers/instorePickupStoreHelpers', function() {
    let instorePickupStoreHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/instorePickupStoreHelpers', {
        'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),
        'plugin_instorepickup/cartridge/scripts/helpers/instorePickupStoreHelpers': {},
        'dw/util/UUIDUtils': require('../../mocks/dw/dw_util_UUIDUtils'),
        '*/cartridge/scripts/checkout/checkoutHelpers': {
            copyShippingAddressToShipment: function() {
                return true;
            },
            ensureNoEmptyShipments: function() {
                return true;
            },
            copyCustomerAddressToShipment: function () {
                return {};
            }
        },
        '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
        '*/cartridge/scripts/checkout/shippingHelpers': {
            selectShippingMethod: function() {
                return true;
            }
        },
        '*/cartridge/scripts/helpers/basketCalculationHelpers': {
            calculateTotals: function() {
                return 0;
            }
        },
        'dw/catalog/StoreMgr': {
            getStore: function () {
                return {
                    countryCode:{}
                };
            }
        },
        'dw/order/ShippingMgr': {
            getShipmentShippingModel: function () {
                return {
                    getApplicableShippingMethods: function () {
                        return new ArrayList([{custom: {storePickupEnabled: true}}]);;
                    }
                }
            }
        },
        'dw/system/Logger': {
            error: function () {
                return {};
            }
        }
    });

    it('Testing method: basketHasInStorePickUpShipment', () => {
        var shipment = new Shipment();
        var shipmentArray = new ArrayList([shipment]);
        var result = instorePickupStoreHelpers.basketHasInStorePickUpShipment(shipmentArray);
        assert.equal(false, result);
    });

    it('Testing method: basketHasInStorePickUpShipment --> basket contains InStore PickUp Shipment', () => {
        var shipment = {
            productLineItems: {
                length: 1,
            },
            custom: {
                fromStoreId: 'fromStoreId'
            }
        };
        var shipmentArray = new ArrayList([shipment]);
        var result = instorePickupStoreHelpers.basketHasInStorePickUpShipment(shipmentArray);
        assert.isTrue(result);
    });
    it('Testing method: basketHasOnlyBOPISProducts', () => {
        var shipment = {
            productLineItems: {
                length: 1,
            },
            custom: {
                fromStoreId: 'fromStoreId'
            }
        };
        var shipmentArray = new ArrayList([shipment]);
        var result = instorePickupStoreHelpers.basketHasOnlyBOPISProducts(shipmentArray);
        assert.equal(true, result);
    });

    it('Testing method: basketHasOnlyBOPISProducts', () => {
        var shipment = {
            productLineItems: {
                length: 1,
            },
            custom: {
                fromStoreId: ''
            }
        };
        var shipmentArray = new ArrayList([shipment]);
        var result = instorePickupStoreHelpers.basketHasOnlyBOPISProducts(shipmentArray);
        assert.equal(false, result);
    });

    // TODO: This testcase will be addressed with PHX-305
    /* it('Testing method: mergeShipmentsInBasket', () => {
        var basket = new BasketMgr();
        var result = instorePickupStoreHelpers.mergeShipmentsInBasket(basket.basket);
        assert.equal(false, result);
    }); */
    it('Testing method: splitShipmentsForBOPIS', () => {
        var basket = new BasketMgr();
        var result = instorePickupStoreHelpers.splitShipmentsForBOPIS(basket.basket);
        assert.equal(false, result);
    });
    it('Testing method: updateToShipToAddressShipment', () => {
        var basket = new BasketMgr();
        var req = {
            currentCustomer: {}
        };
        var product = {
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: 'NONE'
                }
            },
            ID: '12345',
            name: 'test'
        };

        basket.basket.shipments.get(0).productLineItems = [product];
        var result = instorePickupStoreHelpers.updateToShipToAddressShipment(basket.basket, req);
        assert.equal(basket.basket.defaultShipment.ID, basket.basket.shipments.get(0).ID);
    });

    it('Testing method: mergeShipmentsInBasket --> shipmentMerged is true', () => {

        var shipment = [
            {
                productLineItems: {
                    length: 1,
                    [0] : {
                        productID: 'productID',
                        quantity: {
                            value: {}
                        },
                        setQuantityValue: function () {
                            return {};
                        }
                    },
                    setQuantityValue: function () {
                        return {};
                    },
                },
                custom: {
                    fromStoreId: '',
                    storePickupEnabled: false
                },
                shippingMethod: {
                    ID: 'ID',
                    custom: {
                        storePickupEnabled: false
                    }
                },
                UUID: '1'
            },
            {
                productLineItems: {
                    length: 1,
                    [0] : {
                        productID: 'productID',
                        quantity: {
                            value: {}
                        },
                        setQuantityValue: function () {
                            return {};
                        }
                    },
                },
                custom: {
                    fromStoreId: '',
                    storePickupEnabled: false
                },
                shippingMethod: {
                    ID: 'ID',
                    custom: {
                        storePickupEnabled: false
                    }
                },
                UUID: '2'
            }
        ]
        var basket ={
            shipments:  shipment,
            removeProductLineItem: function () {
                return {};
            }
        };
        var result = instorePickupStoreHelpers.mergeShipmentsInBasket(basket);
        assert.equal(true, result);
    });

    it('Testing method: mergeShipmentsInBasket --> shipmentMerged is true product IDs not match from the two shipments', () => {

        var shipment = [
            {
                productLineItems: {
                    length: 1,
                    [0] : {
                        productID: 'productID',
                        quantity: {
                            value: {}
                        },
                        setQuantityValue: function () {
                            return {};
                        }
                    },
                    setQuantityValue: function () {
                        return {};
                    },
                    setShipment: function () {
                        return {};
                    }
                },
                custom: {
                    fromStoreId: '',
                    storePickupEnabled: false
                },
                shippingMethod: {
                    ID: 'ID',
                    custom: {
                        storePickupEnabled: false
                    }
                },
                UUID: '1'
            },
            {
                productLineItems: {
                    length: 1,
                    [0] : {
                        productID: 'productID1',
                        quantity: {
                            value: {}
                        },
                        setQuantityValue: function () {
                            return {};
                        },
                        setShipment: function () {
                            return {};
                        }
                    },
                },
                custom: {
                    fromStoreId: '',
                    storePickupEnabled: false
                },
                shippingMethod: {
                    ID: 'ID',
                    custom: {
                        storePickupEnabled: false
                    }
                },
                UUID: '2'
            }
        ]
        var basket ={
            shipments:  shipment,
            removeProductLineItem: function () {
                return {};
            }
        };
        var result = instorePickupStoreHelpers.mergeShipmentsInBasket(basket);
        assert.equal(true, result);
    });
    it('Testing method: mergeShipmentsInBasket --> shipmentMerged is true', () => {

        var shipment = [
            {
                productLineItems: {
                    length: 1,
                    [0] : {
                        productID: 'productID',
                        quantity: {
                            value: {}
                        },
                        setQuantityValue: function () {
                            return {};
                        },
                        custom: {
                            fromStoreId: 'fromStoreId'
                        }
                    },
                    setQuantityValue: function () {
                        return {};
                    },
                },
                custom: {
                    fromStoreId: '',
                    storePickupEnabled: false
                },
                shippingMethod: {
                    ID: 'ID',
                    custom: {
                        storePickupEnabled: true
                    }
                },
                UUID: '1'
            },
            {
                productLineItems: {
                    length: 1,
                    [0] : {
                        productID: 'productID',
                        quantity: {
                            value: {}
                        },
                        setQuantityValue: function () {
                            return {};
                        },
                        custom: {
                            fromStoreId: 'fromStoreId'
                        }
                    },
                },
                custom: {
                    fromStoreId: '',
                    storePickupEnabled: false
                },
                shippingMethod: {
                    ID: 'ID',
                    custom: {
                        storePickupEnabled: true
                    }
                },
                shippingMethodID: 'eGift_Card',
                UUID: '2'
            }
        ]
        var basket ={
            shipments:  shipment,
            removeProductLineItem: function () {
                return {};
            }
        };
        var result = instorePickupStoreHelpers.mergeShipmentsInBasket(basket);
        assert.equal(true, result);
    });

    it('Testing method: splitShipmentsForBOPIS --> shipments length more than 1', () => {
        var shipment = [
            {
                productLineItems: {
                    length:2,
                    [0] : {
                        productID: 'productID',
                        setShipment: function () {
                            return {};
                        },
                    },
                    [1] : {
                        productID: 'productID1',
                        setShipment: function () {
                            return {};
                        },
                    },
                },
                custom: {
                    storePickupEnabled: false
                },
                shippingMethod: {
                    ID: 'ID',
                    custom: {
                        storePickupEnabled: false
                    }
                },
                UUID: '1',
                shippingAddress: {}
            },
            {
                productLineItems: {
                    length: 1,
                    [0] : {
                        productID: 'productID',
                        setShipment: function () {
                            return {};
                        },
                    },
                },
                custom: {
                    storePickupEnabled: false
                },
                shippingMethod: {
                    ID: 'ID',
                    custom: {
                        storePickupEnabled: false
                    }
                },
                shippingMethodID: 'eGift_Card',
                UUID: '2'
            }
        ]
        var basket ={
            shipments:  shipment,
            createShipment: function () {
                return {
                    setShippingMethod: function () {
                        return {};
                    }
                };
            }
        };
        var result = instorePickupStoreHelpers.splitShipmentsForBOPIS(basket);
        assert.equal(true, result);
    });

    it('Testing method: updateToShipToAddressShipment', () => {
        var basket = new BasketMgr();
        var req = {
            currentCustomer: {}
        };
        var product = {
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: 'NONE',
                },
                fromStoreId: 'fromStoreId'
            },
            ID: '12345',
            name: 'test',
            productID: '12345',
            setShipment: function () {
                return {};
            },
            quantity: {}
        };
        var basket = basket.basket;
        basket.defaultShipment.custom.fromStoreId = 'fromStoreId';
        basket.defaultShipment.ID = 'ID';
        basket.defaultShipment.getProductLineItems = function () {
            return {
                length: 1,
                [0]: {
                    custom: {
                        sku: '1330767-408-8',
                        giftCard: {
                            value: 'NONE',
                        },
                        fromStoreId: 'fromStoreId'
                    },
                    ID: '12345',
                    productID: '12345',
                    name: 'test',
                    shipment: {
                        ID: 'ID'
                    },
                    quantity: {},
                    setQuantityValue: function () {
                        return {};
                    }
                }
            }
        }
        basket.shipments.get(0).default = false;
        basket.shipments.get(0).productLineItems = [product];
        basket.removeProductLineItem = function () {
            return {};
        }
        var result = instorePickupStoreHelpers.updateToShipToAddressShipment(basket, req);
    });

    it('Testing method: updateToShipToAddressShipment --> preferredAddress Exist', () => {
        var basket = new BasketMgr();
        var req = {
            currentCustomer: {
                addressBook: {
                    preferredAddress: {}
                }
            }
        };
        var product = {
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: 'NONE',
                },
                fromStoreId: 'fromStoreId'
            },
            ID: '12345',
            name: 'test',
            productID: '12345',
            setShipment: function () {
                return {};
            },
            quantity: {}
        };
        var basket = basket.basket;
        basket.defaultShipment.custom.fromStoreId = 'fromStoreId';
        basket.defaultShipment.ID = 'ID';
        basket.defaultShipment.getProductLineItems = function () {
            return {
                length: 1,
                [0]: {
                    custom: {
                        sku: '1330767-408-8',
                        giftCard: {
                            value: 'NONE',
                        },
                        fromStoreId: 'fromStoreId'
                    },
                    ID: '12345',
                    productID: '12345',
                    name: 'test',
                    shipment: {
                        ID: 'ID11'
                    },
                    quantity: {},
                    setQuantityValue: function () {
                        return {};
                    }
                }
            }
        }
        basket.shipments.get(0).default = false;
        basket.shipments.get(0).productLineItems = [product];
        basket.removeProductLineItem = function () {
            return {};
        }
        var result = instorePickupStoreHelpers.updateToShipToAddressShipment(basket,req);
    });

    it('Testing method: setInStorePickUpShippingAddress', () => {
        var basket = new BasketMgr();
        var product = {
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: 'NONE',
                },
                fromStoreId: 'fromStoreId'
            },
            ID: '12345',
            name: 'test',
            productID: '12345',
            setShipment: function () {
                return {};
            },
            quantity: {}
        };
        var basket = basket.basket;
        basket.defaultShipment.custom.fromStoreId = 'fromStoreId';
        basket.defaultShipment.ID = 'ID';
        basket.shipments.get(0).productLineItems = [product];
        var result = instorePickupStoreHelpers.setInStorePickUpShippingAddress(basket);
    });

    it('Testing method: getCountOfBopisItems', () => {
        var basket = new BasketMgr();
        var products = [
            {
                custom: {
                    sku: '1330767-408-8',
                    giftCard: {
                        value: 'NONE',
                    },
                    fromStoreId: 'fromStoreId'
                },
                ID: '12345',
                name: 'test',
                productID: '12345',
                shipment: {
                    custom: {
                        fromStoreId: 'fromStoreId'
                    }
                },
                quantity: {}
            },
            {
                custom: {
                    sku: '1330767-408-8',
                    giftCard: {
                        value: 'NONE',
                    },
                    fromStoreId: 'fromStoreId'
                },
                ID: '12345',
                name: 'test',
                productID: '12345',
                shipment: {
                    custom: {
                        fromStoreId: ''
                    }
                },
                quantity: {}
            }

        ]
        basket.basket.productLineItems =  new ArrayList(products)
        var result = instorePickupStoreHelpers.getCountOfBopisItems(basket.basket);
        assert.equal(result.numberOfBopisItems, 1);
    });

    it('Testing method: getCountOfBopisItems --> Test Custom Exception', () => {
        var basket = new BasketMgr();
        var products = [
            {
                custom: {
                    sku: '1330767-408-8',
                    giftCard: {
                        value: 'NONE',
                    },
                    fromStoreId: 'fromStoreId'
                },
                ID: '12345',
                name: 'test',
                productID: '12345',
                shipment: {
                    custom: {
                        fromStoreId: 'fromStoreId'
                    }
                },
                quantity: {}
            },
            {
                custom: {
                    sku: '1330767-408-8',
                    giftCard: {
                        value: 'NONE',
                    },
                    fromStoreId: 'fromStoreId'
                },
                ID: '12345',
                name: 'test',
                productID: '12345',
                shipment: {
                    custom: {
                        fromStoreId: ''
                    }
                },
                quantity: {}
            }

        ]
        basket.basket.productLineItems =  new ArrayList([products])
        var result = instorePickupStoreHelpers.getCountOfBopisItems(basket.basket);
        assert.isNotNull(result)
    });

    it('Testing method: getBopisShipment', () => {
        var shipment = new Shipment();
        shipment.custom.fromStoreId = 'fromStoreId';
        var shipmentArray = new ArrayList([shipment]);
        var result = instorePickupStoreHelpers.getBopisShipment(shipmentArray);
        assert.equal('me', result.ID);
    });
});