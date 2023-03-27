'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../../../test/mockModuleSuperModule');
var SizeAttributeValue;
function Base() { }
describe('SizeAttributeValue model', function () {
    var productSearch = {};
    var refinementDefinition = {};
    var refinementValue = {};
    var sizeAttributeValue = {};

    before(function () {
        mockSuperModule.create(Base);
        SizeAttributeValue = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/search/attributeRefinementValue/size', {
            '*/cartridge/models/search/attributeRefinementValue/base': proxyquire(
                '../../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/models/search/attributeRefinementValue/base', {
                    'dw/web/Resource': {
                        msgf: function () { return 'some product title'; }
                    }
                }
            )
        });
    });

    it('should instantiate a Size Attribute Value model', function () {
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
            presentationID: 'presentationId mock',
            value: 'some value',
            displayValue: 'some display value',
            hitCount: 10
        };
        sizeAttributeValue = new SizeAttributeValue(productSearch, refinementDefinition, refinementValue);
        assert.equal(sizeAttributeValue.pageUrl, 'urlRefineAttributeValue');
    });
});
