'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var mockSuperModule = require('../../../mockModuleSuperModule');

function BaseProductLineItem() {}

var Site = {
    current: {
        preferences: {
            custom: {
                'isBOPISEnabled': true
            }
        },
        getCustomPreferenceValue() {
            return 'isBOPISEnabled';
        }
    },
    getCurrent() {
        return {
            getDefaultLocale() {
                return 'US';
            },
            getDefaultCurrency() {
                return 'USA';
            }
        };
    }
};

var productMock = {
    attributeModel: {},
    minOrderQuantity: { value: 'someValue' },
    availabilityModel: {},
    custom: {},
    stepQuantity: { value: 'someOtherValue' },
    getPrimaryCategory: function () { return { custom: { sizeChartID: 'someID' } }; },
    getMasterProduct: function () {
        return {
            getPrimaryCategory: function () { return { custom: { sizeChartID: 'someID' } }; }
        };
    },
    ID: 'someID'
};

var optionsMock = {
    productType: 'someProductType',
    custom: {},
    optionModel: {},
    quantity: 1,
    variationModel: {},
    promotions: [],
    variables: [],
    lineItem: { UUID: '123' }
};

var object = {};

describe('plugin_productpersonalize/cartridge/models/productLineItem/productLineItem.js', () => {

    before(() => {
        mockSuperModule.create(BaseProductLineItem);
    });

    var ProductLineItemModel = proxyquire('../../../../cartridges/app_ua_core/cartridge/models/productLineItem/productLineItem.js', {
        '*/cartridge/models/product/decorators/index': {
            customAttributes: () => {},
            images: () => {},
            bfPriceTotal: () => {}
        },
        'app_storefront_base/cartridge/models/productLineItem/productLineItem': {
            call: () => {
                return 'base';
            }
        },
        '*/cartridge/models/productLineItem/decorators/index': {
            customAttributes: () => {},
            isOnline: () => {
                return true;
            }
        },
        '*/cartridge/models/productLineItem/decorators/bfPriceTotal': () => {
            return 'bfPriceTotal';
        },
        '*/cartridge/models/productLineItem/decorators/fromStoreId': () => {
            return 'fromStoreId';
        },
        'dw/system/Site': Site
    });

    it('Testing product line item model without options', () => {
        var productLineItem = new ProductLineItemModel(productMock, null, optionsMock);
        assert.isNotNull(productLineItem, 'productLineItem is null');
    });

    it('Testing product line item model with options', () => {

        var options = {
            productType: 'someProductType',
            custom: {},
            optionModel: {},
            quantity: 1,
            promotions: [],
            variables: [],
            lineItem: { UUID: '123' }
        };
        var productLineItem = new ProductLineItemModel(productMock, null, options);
        assert.isNotNull(productLineItem, 'productLineItem is null');
    });

});