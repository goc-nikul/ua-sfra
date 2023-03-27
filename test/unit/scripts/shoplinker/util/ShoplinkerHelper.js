'use strict';


const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var Template = function () {
    return {
        render: function () {
            return {
                getText: function () {
                    return 'returning text';
                }
            };
        }
    };
};

describe('int_shoplinker/cartridge/scripts/util/ShoplinkerHelper', function () {
    let ShoplinkerHelper = proxyquire('../../../../../cartridges/int_shoplinker/cartridge/scripts/util/ShoplinkerHelper', {
        'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        'dw/util/ArrayList': require('../../../../mocks/dw/dw_util_ArrayListIterator'),
        '*/cartridge/scripts/util/collections': require('../../../../mocks/scripts/util/collections'),
        'dw/catalog/ProductMgr': require('../../../../mocks/shoplinker/dw_catalog_ProductMgr'),
        'dw/util/Template': Template,
        'dw/util/HashMap': require('../../../../mocks/dw/dw_util_HashMap'),
        'dw/system/System': require('../../../../mocks/dw/dw_system_System')
    });


    it('Testing method: getProductForMaterial', () => {
        var result = ShoplinkerHelper.getProductForMaterial('test-003');
        assert.isDefined(result);
    });

    it('Testing method: getColorNameForMaterial', () => {
        var result = ShoplinkerHelper.getColorNameForMaterial('test-003');
        assert.isDefined(result);
    });

    it('Testing method: getVariantsForMaterial', () => {
        var result = ShoplinkerHelper.getVariantsForMaterial('test-003');
        assert.isDefined(result);
    });

    it('Testing method: getSizesForMaterial', () => {
        var result = ShoplinkerHelper.getSizesForMaterial('test-003');
        assert.isDefined(result);
    });

    it('Testing method: getColorValue', () => {
        var product = require('../../../../mocks/shoplinker/dw_catalog_ProductMgr').getProduct('883814258849');
        var result = ShoplinkerHelper.getColorValue(product);
        assert.isDefined(result);
    });

    it('Testing method: getMaterialDescriptionText', () => {
        var product = require('../../../../mocks/shoplinker/dw_catalog_ProductMgr').getProduct('883814258849');
        var producImg = product.image;
        var result = ShoplinkerHelper.getMaterialDescriptionText(product, producImg);
        assert.isDefined(result);
    });

    it('Testing method: getImagesForMaterial', () => {
        var product = require('../../../../mocks/shoplinker/dw_catalog_ProductMgr').getProduct('883814258849');
        var variants = product.getVariants().iterator();
        var result = ShoplinkerHelper.getImagesForMaterial(variants);
        assert.isDefined(result);
    });
});

