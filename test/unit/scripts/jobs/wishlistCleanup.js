'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;
var SeekableIterator = require('../../../mocks/dw/dw_util_SeekableIterator');
var Product = require('../../../mocks/dw/dw_catalog_Product');
var Collection = require('../../../mocks/scripts/util/dw.util.Collection');

global.empty = (data) => {
    return !data;
};

var wishlistMock = {
    ID: 'testWishlist',
    items: new Collection(),
    getProductItems: function () {
        return this.items;
    },
    removeItem: function () {
        return [];
    }
};
var productLists = new SeekableIterator([{ id: 'wishlist1' }]);

var productListMgr = {
    queryProductLists: function () {
        return productLists;
    },
    removeProductList: function () {
        return [];
    }
};
var productListItemMock1 = {
    productID: 'product1',
    product: null
};
var productListItemMock2 = {
    productID: 'product2',
    product: new Product('product2')
};

var productOOSMock = new Product('product3');
productOOSMock.availabilityModel.inventoryRecord.allocation = 0;

var productListItemMock3 = {
    productID: 'product3',
    product: productOOSMock
};

var ProductList = {
    TYPE_WISH_LIST: 10,
    TYPE_GIFT_REGISTRY: 11
};

describe('app_ua_core/cartridge/scripts/jobs/wishlistProductAvailability/wishlistCleanup.js', () => {
    var wishlistCleanup = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/jobs/wishlistProductAvailability/wishlistCleanup.js', {
        'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
        'dw/customer/ProductList': ProductList,
        'dw/customer/ProductListMgr': productListMgr,
        'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
        '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger')
    });
    var result;
    it('Testing method: beforeStep ', () => {
        result = wishlistCleanup.beforeStep({});
        assert.isUndefined(result);
    });

    it('Testing method: getTotalCount', () => {
        result = wishlistCleanup.getTotalCount();
        assert.isDefined(result);
        assert.equal(result, productLists.count);
    });

    it('Testing method: read', () => {
        result = wishlistCleanup.read();
        assert.isDefined(result);
        assert.isNotNull(result);

        result = wishlistCleanup.read();
        assert.isDefined(result);
        assert.isNull(result);
    });

    it('Testing method: afterStep', () => {
        result = wishlistCleanup.afterStep();
        assert.isDefined(result);
    });

    it('Testing method: afterChunk', () => {
        result = wishlistCleanup.afterChunk();
        assert.isUndefined(result);
    });

    it('Testing method: process', () => {
        result = wishlistCleanup.process(wishlistMock);
        assert.isUndefined(result);
        result = wishlistCleanup.process(wishlistMock);
        assert.isUndefined(result);

        wishlistMock.items.add(productListItemMock1);
        wishlistMock.items.add(productListItemMock2);
        wishlistMock.items.add(productListItemMock3);
        result = wishlistCleanup.process(wishlistMock);
        assert.isUndefined(result);
    });

    it('Testing method: write', () => {
        result = wishlistCleanup.write({}, {}, {});
        assert.isUndefined(result);
    });
});
