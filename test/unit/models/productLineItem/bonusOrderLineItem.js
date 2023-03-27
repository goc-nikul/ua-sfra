'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

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

var object = {};

describe('Bonus Order Line Item', function () {
    var productDecorators = require('../../../../cartridges/storefront-reference-architecture/test/mocks/productDecoratorsMock');
    var productLineItemDecorators = require('../../../../cartridges/storefront-reference-architecture/test/mocks/productLineItemDecoratorsMock');

    var bonusOrderLineItem = proxyquire('../../../../cartridges/app_ua_core/cartridge/models/productLineItem/bonusOrderLineItem', {
        '*/cartridge/models/product/decorators/index': productDecorators.mocks,
        '*/cartridge/models/productLineItem/decorators/index': productLineItemDecorators.mocks
    });

    afterEach(function () {
        productDecorators.stubs.stubBase.reset();
        productDecorators.stubs.stubImages.reset();
        productDecorators.stubs.stubVariationAttributes.reset();
        productDecorators.stubs.stubQuantity.reset();
        productLineItemDecorators.stubs.stubUuid.reset();
        productLineItemDecorators.stubs.stubOrderable.reset();
        productDecorators.stubs.stubPrice.reset();
        productLineItemDecorators.stubs.stubShipment.reset();
        productLineItemDecorators.stubs.stubPriceTotal.reset();
        productDecorators.stubs.stubOptions.reset();
        productLineItemDecorators.stubs.stubBonusProductLineItem.reset();
        productLineItemDecorators.stubs.stubPreOrderUUID.reset();
    });

    it('should call base for bonus line item model (order)', function () {
        bonusOrderLineItem(object, productMock, optionsMock);

        assert.isTrue(productDecorators.stubs.stubBase.calledOnce);
    });

    it('should call images for bonus line item model (order)', function () {
        bonusOrderLineItem(object, productMock, optionsMock);

        assert.isTrue(productDecorators.stubs.stubImages.calledOnce);
    });

    it('should call variationAttributes for bonus line item model (order)', function () {
        bonusOrderLineItem(object, productMock, optionsMock);

        assert.isTrue(productDecorators.stubs.stubVariationAttributes.calledOnce);
    });

    it('should not call price for bonus line item model  (order)', function () {
        bonusOrderLineItem(object, productMock, optionsMock);

        assert.isFalse(productDecorators.stubs.stubPrice.calledOnce);
    });

    it('should call quantity for bonus line item model (order)', function () {
        bonusOrderLineItem(object, productMock, optionsMock);

        assert.isFalse(productLineItemDecorators.stubs.stubQuantity.calledOnce);
    });

    it('should call uuid for bonus line item model (order)', function () {
        bonusOrderLineItem(object, productMock, optionsMock);

        assert.isTrue(productLineItemDecorators.stubs.stubUuid.calledOnce);
    });

    it('should call orderable for bonus line item model (order)', function () {
        bonusOrderLineItem(object, productMock, optionsMock);

        assert.isTrue(productLineItemDecorators.stubs.stubOrderable.calledOnce);
    });

    it('should not call price for bonus line item model  (order)', function () {
        bonusOrderLineItem(object, productMock, optionsMock);

        assert.isFalse(productDecorators.stubs.stubPrice.calledOnce);
    });

    it('should call shipment for bonus line item model (order)', function () {
        bonusOrderLineItem(object, productMock, optionsMock);

        assert.isTrue(productLineItemDecorators.stubs.stubShipment.calledOnce);
    });

    it('should call priceTotal for bonus line item model (order)', function () {
        bonusOrderLineItem(object, productMock, optionsMock);

        assert.isTrue(productLineItemDecorators.stubs.stubPriceTotal.calledOnce);
    });

    it('should call options for bonus line item model (order)', function () {
        bonusOrderLineItem(object, productMock, optionsMock);

        assert.isFalse(productLineItemDecorators.stubs.stubOptions.calledOnce);
    });

    it('should call bonusProductLineItemUUID for bonus line item model (order)', function () {
        bonusOrderLineItem(object, productMock, optionsMock);

        assert.isFalse(productLineItemDecorators.stubs.stubBonusProductLineItemUUID.calledOnce);
    });

    it('should call preOrderUUID for bonus line item model (order)', function () {
        bonusOrderLineItem(object, productMock, optionsMock);

        assert.isTrue(productLineItemDecorators.stubs.stubPreOrderUUID.calledOnce);
    });
});