'use strict';
const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

var itemExistsStub = sinon.stub();
var getCurrentOrNewListStub = sinon.stub();
var getProductStub = sinon.stub();
var setQuantityValueStub = sinon.stub();
var removeItemStub = sinon.stub();

var ArrayList = require('../../../mocks/scripts/util/dw.util.Collection');

var apiProduct = {
    variationGroup: [],
    optionProduct: {},
    getOptionModel: () => {
        return {
            getOption: () => {},
            setSelectedOptionValue: () => {},
            getOptionValue: () => {
                return 'color';
            }
        };
    },
    master: true,
    getOptionValue: () => {}
};

var ProductMgr = {
    getProduct: getProductStub
};

var pid = '87DGJYTG';

var productList = {
    createProductItem: function () {
        return {
            setQuantityValue: setQuantityValueStub,
            setPublic: function () {},
            setProductOptionModel: function () {}
        };
    },
    items: new ArrayList([{
        productID: '019283',
        optionProduct: true
    }]),
    removeItem: removeItemStub
};

class Collection {
    constructor(items) {
        this.items = items || [];
        this.empty = !!this.items.length;
        this.length = this.items.length;
    }
}

var Customer = {
    uuid: 0
};

var reqObject = {
    currentCustomer: {
        raw: Customer
    },
    session: {
        privacyCache: {
            set: function () {
                return 'something';
            }
        }
    }
};

var config = {
    type: 0,
    optionId: null,
    optionValue: null,
    qty: 0,
    req: reqObject
};

var productListMgr = {
    getProductLists: function (customer) {
        if (customer.uuid === 1) {
            return [{
                id: 'createdListID'
            }];
        }
        return [];
    },
    getProductList: function (id) {
        if (id === '') {
            return null;
        }
        if (id === 'TEST123') {
            return new Collection([{
                productID: '87DGJYTG'
            }, {
                productID: '87353YTR'
            }]);
        }
        return {};
    },
    removeProductList: sinon.stub()
};
var ProductList = {
    TYPE_WISH_LIST: 10,
    TYPE_GIFT_REGISTRY: 11
};

describe('app_ua_core/cartridge/scripts/productList/productListHelpers.js', () => {
    var productListHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/productList/productListHelpers.js', {
        'dw/customer/ProductList': ProductList,
        'lib_productlist/cartridge/scripts/productList/productListHelpers': {
            itemExists: itemExistsStub,
            getCurrentOrNewList: getCurrentOrNewListStub
        },
        'dw/customer/ProductListMgr': productListMgr,
        '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
        'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
        'dw/catalog/ProductMgr': ProductMgr,
        'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource')
    });

    describe('Testting method ==> getListNew', () => {
        var list;
        it('should return null config type is null', () => {
            config.type = null;
            list = productListHelpers.getListNew(Customer, config);
            assert.isDefined(list);
            assert.isNull(list);
        });
        it('should return whishlist product when config type is TYPE_WISH_LIS', () => {
            config.type = ProductList.TYPE_WISH_LIST;
            Customer.uuid = 0;
            list = productListHelpers.getListNew(Customer, config);
            assert.isDefined(list);
            Customer.uuid = 1;
            list = productListHelpers.getListNew(Customer, config);
            assert.isDefined(list);
            assert.isNotNull(list);
        });
        it('shold return gift productlist when config type is TYPE_GIFT_REGISTRY', () => {
            config.type = ProductList.TYPE_GIFT_REGISTRY;
            list = productListHelpers.getListNew(Customer, config);
            assert.isDefined(list);
        });
    });

    describe('Testting method ==> getProductIds', () => {
        var pids;
        it('should return pids string when list of product passed', () => {
            config.id = 'TEST123';
            pids = productListHelpers.getProductIds(Customer, config);
            assert.isDefined(pids);
            assert.notEqual(pids, '');
        });

        it('should returns empty string when empty list passed', () => {
            config.id = '';
            pids = productListHelpers.getProductIds(Customer, config);
            assert.isDefined(pids);
            assert.equal(pids, '');
        });
    });

    describe('Testing method ==> getProductIdsArray', () => {
        var pids;
        it('should return productIds array when list of products passed', () => {
            config.id = 'TEST123';
            pids = productListHelpers.getProductIdsArray(Customer, config);
            assert.isDefined(pids);
            assert.isArray(pids);
        });

        it('should return empty array when an empty list is passed', () => {
            config.id = '';
            pids = productListHelpers.getProductIdsArray(Customer, config);
            assert.isDefined(pids);
            assert.isArray(pids);
        });
    });

    describe('Testting method ==> addItem', () => {
        config.qty = 2;
        var result;
        it('should return false when empty list is passed', () => {
            result = productListHelpers.addItem('', pid, config);
            assert.isDefined(result);
            assert.isFalse(result);
            result = productListHelpers.addItem(null, pid, config);
            assert.isFalse(result);
        });

        it('should return true if itemExists in the list', () => {
            itemExistsStub.returns({
                setQuantityValue: () => {

                },
                quantityValue: 3
            });
            result = productListHelpers.addItem(productList, pid, config);
            assert.isTrue(result);
        });

        it('should return false if config.type is null', () => {
            config.type = null;
            result = productListHelpers.addItem(productList, pid, config);
            assert.isFalse(result);
            itemExistsStub.reset();
        });

        it('should return false if apiProduct contains variation group', () => {
            itemExistsStub.returns('');
            getProductStub.returns(apiProduct);
            result = productListHelpers.addItem(productList, pid, config);
            assert.isFalse(result);
            itemExistsStub.reset();
            getProductStub.reset();
        });

        it('should return false when unknown exeption occured', () => {
            itemExistsStub.returns('');
            getProductStub.returns(apiProduct);
            delete apiProduct.variationGroup;
            setQuantityValueStub.throws(new Error('unknown error'));
            result = productListHelpers.addItem(productList, pid, config);
            assert.isFalse(result);
            setQuantityValueStub.reset();
        });

        it('should return false if item was not added to wishlist', () => {
            config.qty = null;
            config.type = null;
            setQuantityValueStub.returns(true);
            result = productListHelpers.addItem(productList, pid, config);
            assert.isTrue(result);
        });

        it('should return true if item was added to wishlist', () => {
            config.qty = 4;
            config.type = ProductList.TYPE_WISH_LIST;
            result = productListHelpers.addItem(productList, pid, config);
            assert.isTrue(result);
            getProductStub.reset();
            apiProduct.optionProduct = false;
            apiProduct.master = false;
            result = productListHelpers.addItem(productList, pid, config);
            assert.isTrue(result);
            setQuantityValueStub.reset();
        });
    });

    describe('Testing Method ==> removeItem ', () => {
        var result;
        it('should return empty object when item was not removed from whishlist', () => {
            result = productListHelpers.removeItem(Customer, pid, config);
            assert.isDefined(result);
            assert.deepEqual(result, {});
        });

        it('should return object with error when unknown exeption occured', () => {
            getCurrentOrNewListStub.returns(productList);
            itemExistsStub.returns({
                productID: '019283',
                optionProduct: true
            });
            removeItemStub.throws(new Error('Unkown Error'));
            result = productListHelpers.removeItem(Customer, pid, config);
            assert.isDefined(result);
            assert.isTrue(result.error);
            assert.isDefined(result.msg);
            removeItemStub.reset();
        });

        it('should return object without error item was removed from whishlist ', () => {
            removeItemStub.returns(true);
            config.type = 10;
            getCurrentOrNewListStub.returns(productList);
            result = productListHelpers.removeItem(Customer, pid, config);
            assert.isFalse(result.error);
            assert.isDefined(result.prodList);
            assert.deepEqual(result.prodList, productList);
            config.type = 11;
            result = productListHelpers.removeItem(Customer, pid, config);
            assert.deepEqual(result.prodList, productList);
            getCurrentOrNewListStub.reset();
        });
    });

    describe('Testing method: updateWishlistPrivacyCache', () => {
        var spy = sinon.spy(reqObject.session.privacyCache, 'set');
        it('should call set method when list is not empty', () => {
            getCurrentOrNewListStub.returns(productList);
            var result = productListHelpers.updateWishlistPrivacyCache(Customer, reqObject, config);
            assert.isUndefined(result);
            assert.isTrue(spy.called);
            getCurrentOrNewListStub.reset();
            spy.reset();
        });

        it('should not call set method when list is empty ', () => {
            getCurrentOrNewListStub.returns('');
            var result = productListHelpers.updateWishlistPrivacyCache(Customer, reqObject, config);
            assert.isUndefined(result);
            assert.isFalse(spy.called);
            getCurrentOrNewListStub.reset();
        });
    });
});
