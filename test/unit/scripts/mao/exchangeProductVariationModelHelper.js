'use strict';


const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var productMock = {};

describe('int_mao/cartridge/scripts/UACAPI/helpers/order/exchangeProductVariationModelHelper.js', () => {

    let exchangeProductVariationModelHelper = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers/order/exchangeProductVariationModelHelper.js', {
        '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
        'dw/catalog/ProductMgr': {
            getProduct: function () {
                return productMock;
            }
        }
    });
    
    beforeEach(function () {
        productMock = {
            optionModel: {
                options: []
            },
            custom: {
                color: 'color',
                size: 'size'
            },
            variationModel: {
                master: {
                    ID: '1330767'
                },
                selectedVariant: false,
                productVariationAttributes: [{
                    ID: 'color'
                }, {
                    ID: 'size'
                }],
                getAllValues: function () {
                    return [{
                        value: 'someValue',
                        ID: 'size'
                    }];
                },
                setSelectedAttributeValue: function () {},
                getSelectedVariant: function () {},
                getSelectedValue: function (sizeAttr) {
                    return sizeAttr;
                }
            },
            master: false,
            variant: false,
            variationGroup: false,
            productSet: false,
            bundle: false,
            optionProduct: false
        };
    });
    it('Test method: hasOrderableVariants - hasOrderableColor using attrID ->Size ans should return true', () => {
        const exchangeVariationModel = '1330766-color-size, 1330767-004-SM,1330768';
        var attr = {
            ID: 'size'
        };
        var value = {
            ID: 'size'
        };
        var attrLength = 1;
        var variationModel = productMock.variationModel;
        var result = exchangeProductVariationModelHelper.hasOrderableVariants(attr, value, variationModel, exchangeVariationModel, attrLength);
        assert.isNotNull(result);
        assert.isTrue(result);
    });

    it('Test method: hasOrderableVariants when attrID : color and productVariationAttributes: Size', () => {
        const exchangeVariationModel = '1330766-color-value, 1330767-004-SM,1330768';
        var attr = {
            ID: 'color'
        };
        var value = {
            ID: 'value'
        };
        var attrLength = 1;
        productMock.variationModel.productVariationAttributes = [{ ID: 'size' }];
        var variationModel = productMock.variationModel;

        var result = exchangeProductVariationModelHelper.hasOrderableVariants(attr, value, variationModel, exchangeVariationModel, attrLength);
        assert.isNotNull(result);
        assert.isFalse(result);
    });

    it('Test method: hasOrderableVariants when attrID : empty and productVariationAttributes: Size', () => {
        const exchangeVariationModel = '1330766-color-value, 1330767-004-SM,1330768';
        var attr = {
            ID: ''
        };
        var value = {
            ID: ''
        };
        var attrLength = 1;
        productMock.variationModel.productVariationAttributes = [{ ID: 'size' }];
        var variationModel = productMock.variationModel;

        // var Productvariation = variationModel.productVariationAttributes;
        var result = exchangeProductVariationModelHelper.hasOrderableVariants(attr, value, variationModel, exchangeVariationModel, attrLength);
        assert.isNotNull(result);
        assert.isFalse(result);
    });

    it('Test method: hasOrderableVariants when attrID : length should return true ', () => {
        const exchangeVariationModel = '1330766-color-value, 1330767-004-SM,1330768';
        var attr = {
            ID: 'length'
        };
        var value = {
            ID: 'value'
        };
        var attrLength = 1;
        var variationModel = productMock.variationModel;

        var result = exchangeProductVariationModelHelper.hasOrderableVariants(attr, value, variationModel, exchangeVariationModel, attrLength);
        assert.isNotNull(result);
        assert.isTrue(result);
    });

    it('Test method: hasOrderableVariants when attrLength : 3 and selected value null. should return true', () => {
        const exchangeVariationModel = '1330766-size-value, 1330767-004-SM,1330768';
        var attr = {
            ID: 'color'
        };
        var value = {
            ID: 'color'
        };
        var attrLength = 3;
        productMock.variationModel.getSelectedValue = function () {
            return null;
        };
        var variationModel = productMock.variationModel;
        var result = exchangeProductVariationModelHelper.hasOrderableVariants(attr, value, variationModel, exchangeVariationModel, attrLength);
        assert.isNotNull(result);
        assert.isTrue(result);
    });

    it('Test method: hasOrderableVariants when we pass getAllValues : size and getSelectedValue: size will forms SKU ID. should return true', () => {
        const exchangeVariationModel = '1330767-value-size, 1330767-004-SM,1330768';
        var attr = {
            ID: 'color'
        };
        var value = {
            ID: 'color'
        };
        var attrLength = 3;
        productMock.variationModel.getAllValues = function () {
            return [{
                value: 'someValue',
                ID: 'size'
            }];
        };
        productMock.variationModel.getSelectedValue = function () {
            return {
                value: 'someValue',
                ID: 'size'
            };
        };
        var variationModel = productMock.variationModel;
        var result = exchangeProductVariationModelHelper.hasOrderableVariants(attr, value, variationModel, exchangeVariationModel, attrLength);
        assert.isNotNull(result);
        assert.isTrue(result);
    });

    it('Test method:  hasOrderableVariants retuns true ', () => {
        const exchangeVariationModel = '1330767-value-size, 1330767-004-SM,1330768';
        var attr = {
            ID: 'color'
        };
        var value = {
            ID: 'color'
        };
        var attrLength = 3;
        productMock.variationModel.getAllValues = function () {
            return [{
                value: 'someValue',
                ID: 'size'
            }];
        };
        productMock.variationModel.getSelectedValue = function (sizeAttr) {
            return {
                value: 'someValue',
                ID: sizeAttr.ID
            };
        };
        var variationModel = productMock.variationModel;
        var result = exchangeProductVariationModelHelper.hasOrderableVariants(attr, value, variationModel, exchangeVariationModel, attrLength);
        assert.isNotNull(result);
        assert.isTrue(result);
    });

    it('Test method: hasOrderableVariants- exchangeItemSku matching with getAllValues(color) and should return true', () => {
        const exchangeVariationModel = '1330767-color-size, 1330767-004-SM,1330768';
        var attr = {
            ID: 'size'
        };
        var value = {
            ID: 'size'
        };
        var attrLength = 3;
        productMock.variationModel.getAllValues = function () {
            return [{
                value: 'someValue',
                ID: 'color'
            }];
        };
        productMock.variationModel.getSelectedValue = function () {
            return {
                value: 'someValue',
                ID: 'color'
            };
        };
        var variationModel = productMock.variationModel;
        var result = exchangeProductVariationModelHelper.hasOrderableVariants(attr, value, variationModel, exchangeVariationModel, attrLength);
        assert.isNotNull(result);
        assert.isTrue(result);
    });

    it('Test method: hasOrderableVariants- exchangeItemSku matching with getAllValues(size) and should return true', () => {
        const exchangeVariationModel = '1330767-color-size, 1330767-004-SM,1330768';
        var attr = {
            ID: 'color'
        };
        var value = {
            ID: 'color'
        };
        var attrLength = 3;
        productMock.variationModel.getAllValues = function () {
            return [{
                value: 'someValue',
                ID: 'size'
            }];
        };
        productMock.variationModel.getSelectedValue = function (sizeAttr) {
            return {
                value: 'someValue',
                ID: sizeAttr.ID
            };
        };
        var variationModel = productMock.variationModel;
        var result = exchangeProductVariationModelHelper.hasOrderableVariants(attr, value, variationModel, exchangeVariationModel, attrLength);
        assert.isNotNull(result);
        assert.isTrue(result);
    });
});
