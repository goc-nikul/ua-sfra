'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

class cartModel {
    constructor() { }
}

describe('plugin_productpersonalize/cartridge/models/product/decorators/productPersonlization', () => {

    const ProductPersonlization = proxyquire('../../../../../cartridges/plugin_productpersonalize/cartridge/models/product/decorators/productPersonlization', {
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        '*/cartridge/scripts/helpers/productPersonlizationHelpers': proxyquire('../../../../../cartridges/plugin_productpersonalize/cartridge/scripts/helpers/productPersonlizationHelpers', {
            'dw/system/Transaction': {
                wrap: function (callback) {
                    callback.apply();
                }
            },
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/object/CustomObjectMgr': {
                getCustomObject: function () {
                    return {
                        custom: {
                            ID: 'personlize_product',
                            jerseyStyle: '1234',
                            frontImage: 'frontimg.jpg',
                            backImage: 'backimg.jpg',
                            enableSponsors: true,
                            frontImageSponsors: 'frontimg.jpg',
                            backImageSponsors: 'backimg.jpg',
                            nameLocation: 'above',
                            personalizationInfo: 'Personlization Info',
                            nopersonalizationsOption: 0,
                            nameOption: 10,
                            numberOption: 20,
                            namenumberOption: 10,
                            sponsorsOption: 10,
                            namesponsorsOption: 10,
                            numbersponsorsOption: 10,
                            namenumbersponsorsOption: 10,
                            defaultOption: true
                        }
                    };
                }
            },
            'dw/order/BasketMgr': require('../../../../mocks/dw/dw_order_BasketMgr'),
            '*/cartridge/scripts/util/collections': require('../../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/helpers/basketCalculationHelpers': { calculateTotals: function () { } },
            '*/cartridge/models/cart': cartModel
        }),
        '*/cartridge/config/peronslizePreferences': proxyquire('../../../../../cartridges/plugin_productpersonalize/cartridge/config/peronslizePreferences', {
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site')
        }),
        '*/cartridge/models/personalize': proxyquire('../../../../../cartridges/plugin_productpersonalize/cartridge/models/personalize', {
            '*/cartridge/config/peronslizePreferences': proxyquire('../../../../../cartridges/plugin_productpersonalize/cartridge/config/peronslizePreferences', {
                'dw/system/Site': require('../../../../mocks/dw/dw_system_Site')
            }),
            'dw/value/Money': require('../../../../mocks/dw/dw_value_Money'),
            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource')
        }),
        '*/cartridge/scripts/renderTemplateHelper': {
            getRenderedHtml: function () { return 'someString'; }
        }
    });

    var apiProduct = {
        optionModel: {
            getOption: function () {
                return {
                    id: 'personlize'
                };
            }
        },
    };
    global.empty = () => false;
    global.session = {
        currency: {
            currencyCode: 'AUD'
        }
    };
    var obj = {};
    var productPersonlization = new ProductPersonlization(obj, apiProduct);

    it('Testing productPersonlization Model', () => {
        assert.isNotNull(productPersonlization, 'productPersonlization Model is NULL');
    });

    it('Testing productPersonlization Model property isPersonalizationEligible not empty', () => {
        assert.isTrue(obj.isPersonalizationEligible, 'productPersonlization Model property is empty');
    });

    it('Testing productPersonlization Model property personalizationBadge not empty', () => {
        assert.isNotNull(obj.personalizationBadge, 'productPersonlization Model property is empty');
    });

    it('Testing productPersonlization Model property personalizationEditMessage not empty', () => {
        assert.isNotNull(obj.personalizationEditMessage, 'productPersonlization Model property is empty');
    });

    it('Testing productPersonlization Model property personalizationAddMessage not empty', () => {
        assert.isNotNull(obj.personalizationAddMessage, 'productPersonlization Model property is empty');
    });

    it('Testing productPersonlization Model property personalizationMaxName not empty', () => {
        assert.isNotNull(obj.personalizationMaxName, 'productPersonlization Model property is empty');
    });

    it('Testing productPersonlization Model property personalizationMaxNumber not empty', () => {
        assert.isNotNull(obj.personalizationMaxNumber, 'productPersonlization Model property is empty');
    });

    it('Testing productPersonlization Model property personalizationNegativeWords not empty', () => {
        assert.isNotNull(obj.personalizationNegativeWords, 'productPersonlization Model property is empty');
    });

    it('Testing productPersonlization Model property personalizationContent not empty', () => {
        assert.isNotNull(obj.personalizationContent, 'productPersonlization Model property is empty');
        assert.notEqual(obj.personalizationContent.productID, '');
        assert.isNotNull(obj.personalizationContent.jerseyStyle, 'Jersey Style Null');
        assert.equal(obj.personalizationContent.nopersonalizationsOption, '$0.00');
        assert.notEqual(obj.personalizationContent.nameOption, '$0.00');
        assert.notEqual(obj.personalizationContent.numberOption, '$0.00');
        assert.notEqual(obj.personalizationContent.namenumberOption, '$0.00');
        assert.notEqual(obj.personalizationContent.sponsorsOption, '$0.00');
        assert.notEqual(obj.personalizationContent.namesponsorsOption, '$0.00');
        assert.notEqual(obj.personalizationContent.numbersponsorsOption, '$0.00');
        assert.notEqual(obj.personalizationContent.namenumbersponsorsOption, '$0.00');
    });

    it('Testing productPersonlization Model property personlizeTemplate not empty', () => {
        assert.isNotNull(obj.personlizeTemplate, 'productPersonlization Model property is empty');
    });

    it('Testing productPersonlization Model property personlizeTemplate empty when isPersonalizationEligible is false', () => {
        var ProductPersonlizationPeronsalization = proxyquire('../../../../../cartridges/plugin_productpersonalize/cartridge/models/product/decorators/productPersonlization', {
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/helpers/productPersonlizationHelpers': {
                isPersonalizationEligible: () => false,
                getCustomObject: () => null
            },
            '*/cartridge/config/peronslizePreferences': {
                isPersonalizationEnable: false,
                personalizationMaxName: 10
            },
            '*/cartridge/models/personalize': proxyquire('../../../../../cartridges/plugin_productpersonalize/cartridge/models/personalize', {
                '*/cartridge/config/peronslizePreferences': proxyquire('../../../../../cartridges/plugin_productpersonalize/cartridge/config/peronslizePreferences', {
                    'dw/system/Site': require('../../../../mocks/dw/dw_system_Site')
                }),
                'dw/value/Money': require('../../../../mocks/dw/dw_value_Money'),
                'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
                'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource')
            }),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: function () { return 'someString'; }
            }
        });
        var obj = {};
        productPersonlization = new ProductPersonlizationPeronsalization(obj, apiProduct);
        assert.isNotNull(obj.personlizeTemplate, 'productPersonlization Model property is empty');
    });

});