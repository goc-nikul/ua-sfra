'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../../../test/mockModuleSuperModule');
var BooleanAttributeValue;
function Base() { }
describe('BooleanAttributeValue model', function () {
    var refinementDefinition = {};
    var booleanAttributeValue = {};
    before(function () {
        mockSuperModule.create(Base);
        BooleanAttributeValue = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/search/attributeRefinementValue/boolean', {
            '*/cartridge/models/search/attributeRefinementValue/base': proxyquire(
                '../../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/models/search/attributeRefinementValue/base', {
                    'dw/web/Resource': {
                        msgf: function () { return 'some product title'; }
                    }
                }
            ),
            'dw/web/Resource': {
                msg: function () { return 'some display value'; }
            }
        });
    });

    var productSearch = {
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
                        toString: function () { return 'select url'; }
                    };
                }
            };
        }
    };
    var refinementValue = {
        ID: 'product 1',
        presentationID: 'prez',
        value: 'some value',
        displayValue: 'some display value',
        hitCount: 10
    };

    it('should instantiate a Boolean Attribute Value model', function () {
        booleanAttributeValue = new BooleanAttributeValue(productSearch, refinementDefinition, refinementValue);
        assert.equal(booleanAttributeValue.pageUrl, 'select url');
    });

    it('should instantiate a unselected Boolean Attribute Value model', function () {
        productSearch.isRefinedByAttributeValue = function () { return false; };
        booleanAttributeValue = new BooleanAttributeValue(productSearch, refinementDefinition, refinementValue);
        assert.equal(booleanAttributeValue.pageUrl, 'select url');
    });

    it('should instantiate a unselectable Boolean Attribute Value model', function () {
        productSearch.isRefinedByAttributeValue = function () { return false; };
        refinementValue.hitCount = 0;
        booleanAttributeValue = new BooleanAttributeValue(productSearch, refinementDefinition, refinementValue);
        assert.equal(booleanAttributeValue.pageUrl, '#');
    });
});
