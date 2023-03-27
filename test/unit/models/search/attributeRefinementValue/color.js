'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../../../test/mockModuleSuperModule');
var ColorAttributeValue;

function Base() { }
describe('ColorAttributeValue model', function () {
    var productSearch = {};
    var refinementDefinition = {};
    var refinementValue = {};
    var colorAttributeValue = {};

    before(function () {
        mockSuperModule.create(Base);
        ColorAttributeValue = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/search/attributeRefinementValue/color', {
            '*/cartridge/models/search/attributeRefinementValue/base': proxyquire(
                '../../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/models/search/attributeRefinementValue/base', {
                    'dw/web/Resource': {
                        msgf: function () { return 'some product title'; }
                    }
                }
            ),
            '*/cartridge/scripts/helpers/productHelpers': {
                changeSwatchBorder: function () {
                    return {};
                }
            }
        });
    });

    it('should instantiate a Color Attribute Value model', function () {
        productSearch = {
            isRefinedByAttributeValue: function () { return true; },
            urlRelaxAttributeValue: function () {
                return {
                    relative: function () {
                        return {
                            toString: function () { return 'relax url'; }
                        };
                    }
                };
            },
            urlRefineAttributeValue: function () {
                return {
                    relative: function () {
                        return {
                            toString: function () { return 'urlRefineAttributeValue'; }
                        };
                    }
                };
            }
        };
        refinementValue = {
            ID: 'product 1',
            presentationID: 'prez',
            value: 'some value',
            displayValue: 'some display value',
            hitCount: 10
        };
        colorAttributeValue = new ColorAttributeValue(productSearch, refinementDefinition, refinementValue);
        assert.equal(colorAttributeValue.pageUrl, 'urlRefineAttributeValue');
        assert.equal(colorAttributeValue.stdLightness, 0.6);
    });
});
