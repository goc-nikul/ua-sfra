'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

describe('int_ocapi/cartridge/hooks/shop/category/searchSuggestion.js', () => {
    var searchSuggestion = proxyquire('../../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/category/searchSuggestion.js', {
        'dw/system/Status': function () {},
        'dw/catalog/CatalogMgr': {
            getCategory: function () {
                return {
                    custom: {
                        categorySearchDisplayName: 'categorySearchDisplayName'
                    }
                };
            }
        }
    });

    it('Testing modifyGETResponse', () => {
        var suggestionResponse = {
            category_suggestions: {
                categories: { cat1: { id: 'cat1' } }
            }
        };
        var result = searchSuggestion.modifyGETResponse(suggestionResponse);
        assert.isNotNull(result);
    });
});
