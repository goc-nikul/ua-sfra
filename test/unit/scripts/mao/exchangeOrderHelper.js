'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

class ProductMgr {
    static getProduct(productID) {
        if (!productID) {
            return null;
        } else {
        this.product = new Product(productID);
        return this.product;
        }
    }
    static setProduct(product) {
        this.product = product;
    }
}

class Product {
    constructor(productID) {
        this.master = true;
        this.ID = productID;
        this.name = 'test';
        this.image = {
            'small': {
                URL: 'testUrlSmall'
            },
            'medium': {
                URL: 'testUrlMedium'
            },
            'large': {
                URL: 'testUrlLarge'
            }
        };
        this.custom = {
            sku: '1330767-408-8',
            giftCard: {
                value: 'NONE'
            },
            customerLineItemQtyLimit: 5
        };
        this.optionModel = {};
        this.availabilityModel = {
            inventoryRecord: {
                perpetual: false,
                allocation: 10,
                ATS: {
                    value: 10
                },
                getATS() {
                    return {
                        value: 10,
                        getValue: function () {
                            return 10;
                        }
                    };
                },
                setAllocation: function (allocation) {
                    this.allocation = allocation;
                },
                getAllocation: function () {
                    return {
                        getValue: function () {
                            return 10;
                        }
                    };
                }
            }
        };
        this.isMaster = function () {
            return this.master;
        };
        this.variants = [{
                onlineFlag: true,
                availabilityModel: {
                    orderable: true
                },
                custom: {
                    color: '408',
                    size: 'SM'
                },
                masterProduct: {
                    ID: productID
                },
                ID : '1330767'
            },
            {
                onlineFlag: true,
                availabilityModel: {
                    orderable: true
                },
                custom: {
                    color: '004',
                    size: 'SM'
                },
                masterProduct: {
                    ID: productID
                },
                ID : '1330768'
            }
        ];
        this.getVariants = function () {
            var variants = {
                onlineFlag: true,
                availabilityModel: {
                    orderable: true
                },
                custom: {
                    color: '003',
                    size: 'SM'
                },
                masterProduct: {
                    ID: productID
                }
            };
            return [variants];
        };
        this.getVariationModel = function () {
            var variants = {
                onlineFlag: true,
                availabilityModel: {
                    orderable: true
                },
                custom: {
                    color: '003',
                    size: 'SM'
                },
                masterProduct: {
                    ID: productID 
                },
                master: false
            };
            return {
                getDefaultVariant: function () {
                    return variants;
                }
            };
        };
        this.variationModel = {
            onlineFlag: true,
            availabilityModel: {
                orderable: true
            },
            custom: {
                color: '003'
            },
            masterProduct: {
                ID: productID
            },
            master: false
        };
        this.raw = {
            custom: {
                outletColors: ''
            }
        };
    }
    getImage(size) {
        return this.image[size];
    }
}

describe('int_mao/cartridge/scripts/UACAPI/helpers/order/exchangeOrderHelper.js', () => {
    it('getExchangeProduct - Should be throw null if exchangeItemSKU is empty ', () => {
        let exchangeOrderHelper = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers/order/exchangeOrderHelper.js', {
            'dw/catalog/ProductMgr': ProductMgr,
            '*/cartridge/scripts/factories/product': {
                get: function() { }
            }
        });
        var exchangeItemSKU = '';
        var exchangeItems = '';
        var exchangeOrderHelpers = exchangeOrderHelper.getExchangeProduct(exchangeItemSKU, exchangeItems);
        assert.isObject(exchangeOrderHelpers, '{}');
    });

    it('Testing method: getExchangeProduct - should be return productobject when pass the exchangeItemSKU ', () => {
        let exchangeOrderHelper = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers/order/exchangeOrderHelper.js', {
            'dw/catalog/ProductMgr': ProductMgr,
            '*/cartridge/scripts/factories/product': {
                get: function(pliProduct) {
                    var pliProduct = {
                        pid: pliProduct,
                        quantity: 1,
                        options: 'options',
                        exchangeItem: 'true',
                        exchangeVariationModel: 'exchangeItem',
                        };
                    return pliProduct;
                }
            }
        });
        var exchangeItemSKU = '1330767-408-SM';
        var exchangeItems = 'exchange Items';
        var exchangeOrderHelpers = exchangeOrderHelper.getExchangeProduct(exchangeItemSKU, exchangeItems);
        assert.isNotNull(exchangeOrderHelpers, 'exchangeOrderHelpers is not null');
        assert.equal(exchangeOrderHelpers.pid.pid, '1330767');
        assert.equal(exchangeOrderHelpers.quantity, '1');
    });

    it('Testing method: getExchangeProductHits should be return item Array when exchangeItems passed to getExchangeProductHits method ', () => {
        let exchangeOrderHelper = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers/order/exchangeOrderHelper.js', {
            'dw/catalog/ProductMgr': ProductMgr,
            '*/cartridge/scripts/factories/product': {
                get: function(exchangeProductID) {
                    var pliProduct = {
                        pid: exchangeProductID,
                        quantity: 1,
                        options: '',
                        exchangeItem: 'true',
                        exchangeVariationModel: 'exchangeItems',
                        };
                    return pliProduct;
                }   
            }
        });
        var exchangeItems = [{productId: '1355109'}, {productId: '1355109'}];
        var exchangeProductsArrayStrings = 'exchangeProductsArrayStrings';
        var quantity =1;
        var getExchangeProductHits = exchangeOrderHelper.getExchangeProductHits(exchangeItems, quantity, exchangeProductsArrayStrings);
        assert.isNotNull(getExchangeProductHits, 'getExchangeProductHits returns defined values');
        assert.isDefined(getExchangeProductHits, 'getExchangeProductHits returns defined values');
        assert.equal(getExchangeProductHits[0].quantity, '1');
        assert.equal(getExchangeProductHits[0].pid.pid, '1355109');
    });

    it('Testing method: getExchangeProductList should return product item list', () => {
        let exchangeOrderHelper = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers/order/exchangeOrderHelper.js', {
            'dw/catalog/ProductMgr': ProductMgr,
            '*/cartridge/scripts/factories/product': {
                get: function() {
                    var pliProduct = {
                        pid: '8129382',
                        quantity: 1,
                        options: '',
                        exchangeItem: 'true',
                        exchangeVariationModel: exchangeItems,
                        };
                    return pliProduct;
                }
            }
        });
        var exchangeItems = [{productId: '1355109', length: 1 }, {productId: '1355109', length: 1}];
        var getExchangeProductList = exchangeOrderHelper.getExchangeProductList(exchangeItems);
        assert.isNotNull(getExchangeProductList, 'getExchangeProductList method should not return null')
        assert.equal(getExchangeProductList, '1355109,1355109');
    }); 

    it('Testing method: getExchangeProductList should return empty when exchangeItems variable having empty Array ', () => {
        let exchangeOrderHelper = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers/order/exchangeOrderHelper.js', {
            'dw/catalog/ProductMgr': ProductMgr,
            '*/cartridge/scripts/factories/product': {
                get: function() {
                    var pliProduct = {
                        pid: '8129382',
                        quantity: 1,
                        options: '',
                        exchangeItem: 'true',
                        exchangeVariationModel: exchangeItem,
                        };
                    return pliProduct;
                }
            }
        });
        var exchangeItems = [];;
        var getExchangeProductList = exchangeOrderHelper.getExchangeProductList(exchangeItems);
        assert.equal(getExchangeProductList, '', 'returns an empty value');
    }); 
});
