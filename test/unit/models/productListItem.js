'use strict';

/* eslint-disable */
var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon').stub();
var ArrayList = require('../../mocks/scripts/util/dw.util.Collection');

var prodctListItemModel;

var productListItemObjectMock = {
    productID: 'some pid',
    UUID: 'some UUID',
    custom: {
    },
    product: {
        name: 'some productName',
        master: 'some productMaster',
        bundle: true,
        minOrderQuantity: {
            value: ''
        },
        bundledProducts: new ArrayList([{ ID: 'bundlitemID1', name: 'bundlitemName2', master: true }, { ID: 'bundlitemID2', name: 'bundlitemName2', master: false }]),
        availabilityModel: {
            inventoryRecord: {
                ATS: {
                    value: 10
                }
            }
        },
        isMaster: () => true,
        getMasterProduct() {
            return {
                availabilityModel: {
                    availability: 2
                }
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
    },
    productOptionModel: {
        options: new ArrayList([{
            displayName: 'color name',
            ID: 'TestID'
        }]),
        getSelectedOptionValue() {
            return {
                displayName: 'color name',
                ID: 'TestID'
            }
        }
    }
};


describe('app_ua_core/cartridge/models/productListItem.js', () => {
    var productListItemObj;
    before(() => {
        prodctListItemModel = proxyquire('../../../cartridges/app_ua_core/cartridge/models/productListItem', {
            '*/cartridge/models/product/productImages': function () {
            },
            '*/cartridge/scripts/factories/price': {
                getPrice() {
                }
            },
            '*/cartridge/models/product/decorators/availability': (obj) => { obj.available = false },
            '*/cartridge/models/product/decorators/readyToOrder': (obj) => {
                obj.readyToOrder = true;
            },
            '~/cartridge/models/product/decorators/customAttributes': (obj) => {
                obj.custom = {};
            },
            '*/cartridge/config/preferences': {},
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant() {
                    return {
                        isMaster: () => true
                    };
                }
            },
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            '*/cartridge/models/product/decorators/variationAttributes': function (obj) {
            }
        });
    });

    it('should return productListItem  as null when product in when product in productListItem passed as null passed as null', () => {
        productListItemObj = new prodctListItemModel({ product: null });
        assert.isDefined(productListItemObj);
        assert.isNull(productListItemObj.productListItem);
    });

    it('should call getOptions, readyToOrder, availability and customAttributes when product is present in productListitem ', () => {
        productListItemObj = new prodctListItemModel(productListItemObjectMock);
        assert.isDefined(productListItemObj);
        assert.isNotNull(productListItemObj.productListItem);
        assert.isTrue(productListItemObj.productListItem.readyToOrder);
        assert.isFalse(productListItemObj.productListItem.available)
    });

    it('should return wishlistedFromCart value when wishlistedFromCart attribute present in productListItemObject', () => {
        productListItemObjectMock.custom.wishlistedFromCart = false
        productListItemObj = new prodctListItemModel(productListItemObjectMock);
        assert.isDefined(productListItemObj.productListItem.custom.wishlistedFromCart);
        assert.equal(productListItemObj.productListItem.custom.wishlistedFromCart, productListItemObjectMock.custom.wishlistedFromCart);

    });

    it('should return master product avaiability value when variation is not available', () => {
        productListItemObjectMock.product.isMaster = () => false;
        productListItemObjectMock.product.variant = true
        productListItemObj = new prodctListItemModel(productListItemObjectMock);
        assert.isDefined(productListItemObj.productListItem.custom.productAvailability);
        assert.isTrue(productListItemObj.productListItem.custom.productAvailability);

    });

    it('should return options as false when productOptionModel is null', () => {
        productListItemObjectMock.productOptionModel = null;
        productListItemObj = new prodctListItemModel(productListItemObjectMock);
        assert.isDefined(productListItemObj.productListItem.options);
        assert.isFalse(productListItemObj.productListItem.options);
        assert.isNull(productListItemObj.productListItem.selectedOptions);
    });

    it('should return default maxOrderQty when product inventory record is null', () => {
        productListItemObjectMock.product.availabilityModel.inventoryRecord = null;
        productListItemObj = new prodctListItemModel(productListItemObjectMock);
        assert.isDefined(productListItemObj.productListItem.maxOrderQuantity);
        assert.isNaN(productListItemObj.productListItem.maxOrderQuantity);

    });
    it('should return bundleItems as empty array when product is not a bundle', () => {
        productListItemObjectMock.product.getMasterProduct = () => {
            return {
                availabilityModel: {
                    availability: 0
                }
            }
        };
        productListItemObjectMock.product.bundle = false;
        productListItemObj = new prodctListItemModel(productListItemObjectMock);
        assert.equal(productListItemObj.productListItem.bundle, productListItemObjectMock.product.bundle);
        assert.isFalse(productListItemObj.productListItem.custom.productAvailability);


    });

});
