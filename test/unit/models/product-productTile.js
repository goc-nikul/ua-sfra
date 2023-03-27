'use strict';

/* eslint-disable */

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

var stubSearchModel = sinon.stub();
stubSearchModel.returns({
    setSearchPhrase: function () {},
    search: function () {},
    getProductSearchHit: function () {},
    getProductSearchHits: function () {
        return {
            next: function () {
                return { firstRepresentedProductID: 'someID' };
            }
        };
    },
    count: 1
});

var object = {};

var productMock = {
    attributeModel: {},
    minOrderQuantity: { value: 'someValue' },
    availabilityModel: {},
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
    optionModel: {},
    quantity: 1,
    variationModel: {},
    promotions: [],
    variables: []
};

describe('Product Tile Model', function () {
    var decorators = require('../../mocks/scripts/product-decorators-index');

    var productTile = proxyquire('../../../cartridges/app_ua_core/cartridge/models/product/productTile', {
        '~/cartridge/models/product/decorators/index': decorators.mocks,
        '*/cartridge/scripts/util/promotionCache': {
            promotions: []
        },
        '~/cartridge/scripts/helpers/ProductHelper': {
            getProductSearchHit: function() {}
        }
    });

    afterEach(function () {
        decorators.stubs.stubBase.reset();
        decorators.stubs.stubPrice.reset();
        decorators.stubs.stubImages.reset();
        decorators.stubs.stubAvailability.reset();
        decorators.stubs.stubDescription.reset();
        decorators.stubs.stubSearchPrice.reset();
        decorators.stubs.stubPromotions.reset();
        decorators.stubs.stubQuantity.reset();
        decorators.stubs.stubQuantitySelector.reset();
        decorators.stubs.stubRatings.reset();
        decorators.stubs.stubSizeChart.reset();
        decorators.stubs.stubVariationAttributes.reset();
        decorators.stubs.stubSearchVariationAttributes.reset();
        decorators.stubs.stubAttributes.reset();
        decorators.stubs.stubOptions.reset();
        decorators.stubs.stubCurrentUrl.reset();
        decorators.stubs.stubReadyToOrder.reset();
        decorators.stubs.stubSetReadyToOrder.reset();
        decorators.stubs.stubBundleReadyToOrder.reset();
        decorators.stubs.stubSetIndividualProducts.reset();
        decorators.stubs.stubBundledProducts.reset();
    });

    it('should call base for product tile', function () {
        productTile(object, productMock, {}, optionsMock);
        assert.isTrue(decorators.stubs.stubBase.calledOnce);
    });

    it('should call searchPrice for product tile', function () {
        productTile(object, productMock, {}, optionsMock);
        assert.isTrue(decorators.stubs.stubSearchPrice.calledOnce);
    });

    it('3productTile extended decorators calls', function() {
        productTile(object, productMock, {}, optionsMock);
        assert.isTrue(decorators.stubs.stubTileSwatches.called);
    });

    it('5productTile extended decorators calls', function() {
        productTile(object, productMock, {}, optionsMock);
        assert.isTrue(decorators.stubs.stubSearchPrice.calledOnce);
    });

});
