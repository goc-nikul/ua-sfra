'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var mockSuperModule = require('../../../../mockModuleSuperModule');

function BaseProductLineItem() {}

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

describe('int_borderfree_sfra/cartridge/models/productLineItem/productLineItem.js', () => {
    before(() => {
        mockSuperModule.create(BaseProductLineItem);
    });

    var ProductLineItemModel = proxyquire('../../../../../cartridges/int_borderfree_sfra/cartridge/models/productLineItem/productLineItem.js', {
        '*/cartridge/models/productLineItem/decorators/bfPriceTotal': () => {
            return 'bfPriceTotal';
        }
    });

    it('Testing product line item model', () => {
        var productLineItem = new ProductLineItemModel(productMock, {}, optionsMock);
        assert.isNotNull(productLineItem, 'productLineItem is null');
    });
});
