'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var ArrayList = require('../../mocks/dw/CustomList');
var productListItem = require('../../../cartridges/lib_productlist/test/mocks/models/productListItem');
var ProductListModel;
var productList;

class CustomArrayList extends Array {
    constructor(items) {
        super(items);
        this.items = items || [];
    }
    getLength() {
        return this.items.length;
    }
};

var config = {
    pageSize: 1,
    pageNumber: -2,
    publicView: 'view',
    sortRule: 'OldestAdded',
    pageType: 'cart'
};

var productListItemObjectMock = {
    productID: 'some pid',
    UUID: 'some UUID',
    product: {
        name: 'some productName',
        master: 'some productMaster',
        bundle: false,
        minOrderQuantity: {
            value: 'product minOrderQuantity'
        },
        availabilityModel: {
            inventoryRecord: {
                ATS: {
                    value: 10
                }
            }
        },
        custom : {
            availableForLocale : {
                value : 'Yes'
            }
        }
    },
    quantityValue: 2,
    public: 'some PublicItem',
    getLastModified: function () {
        return {
            getTime: function () {
                return '1527213625';
            }
        };
    },
    getCreationDate: function () {
        return {
            getTime: function () {
                return '1527213655';
            }
        };
    }
};

var productListObject = {
    owner: {
        profile: {
            firstName: 'ABC',
            lastName: 'XYZ'
        }
    },
    public: 'XY',
    UUID: '3245',
    type: 'IC',
    items: new CustomArrayList(productListItemObjectMock)
};

function property() {
    return this;
}

describe('app_ua_core/cartridge/models/productList.js', () => {
    ProductListModel = proxyquire('../../../cartridges/app_ua_core/cartridge/models/productList.js', {
        '*/cartridge/models/productListItem': productListItem,
        'dw/util/PropertyComparator': property,
        'dw/util/ArrayList': ArrayList,
        '*/cartridge/scripts/helpers/ProductHelper': {
            'enableAvailablePerLocale': () => {
                return true;
            }
        }
    });

    it('Testing for productList model is not null', () => {
        productList = new ProductListModel(productListObject, config);

        assert.isDefined(productList, 'productList should not exists');
        assert.isNotNull(productList, 'productList should null');
    });

    it('Testing for sortRule is old', () => {
        config.sortRule = 'old';
        productList = new ProductListModel(productListObject, config);

        assert.isDefined(productList, 'productList should not exists');
        assert.isNotNull(productList, 'productList should null');
    });

    it('Testing for pageType is null', () => {
        config.pageType = null;
        productList = new ProductListModel(productListObject, config);

        assert.isDefined(productList, 'productList should not exists');
        assert.isNotNull(productList, 'productList should null');
    });

    it('Testing for productListObject owner is null', () => {
        productListObject.owner = null;
        productList = new ProductListModel(productListObject, config);

        assert.isDefined(productList, 'productList should not exists');
        assert.isNotNull(productList, 'productList should null');
    });

    it('Testing for publicView is null', () => {
        config.publicView = null;
        productList = new ProductListModel(productListObject, config);

        assert.isDefined(productList, 'productList should not exists');
        assert.isNotNull(productList, 'productList should null');
    });

    it('Testing for pageNumber and  pageSize is more than totalNumber', () => {
        config.pageNumber = 10;
        config.pageSize = 2;
        productList = new ProductListModel(productListObject, config);

        assert.isDefined(productList, 'productList should not exists');
        assert.isNotNull(productList, 'productList should null');
    });

    it('Testing for availableForLocale value is No', () => {
        productListItemObjectMock.product.custom.availableForLocale.value = 'No';
        productListObject.items = new CustomArrayList(productListItemObjectMock);
        productList = new ProductListModel(productListObject, config);

        assert.isDefined(productList, 'productList should not exists');
        assert.isNotNull(productList, 'productList should null');
    });

    it('Testing for config object is null', () => {
        config.pageSize = null;
        config.pageNumber = null;
        config.sortRule = null;
        productListObject = null;
        productList = new ProductListModel(productListObject, config);

        assert.isDefined(productList, 'productList should not exists');
        assert.isNotNull(productList, 'productList should null');
    });
});
