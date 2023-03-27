'use strict';

/* eslint-disable */

const assert = require('chai').assert;

describe('app_ua_core/cartridge/scripts/search/search test', () => {
    var searchModelHelper = require('../../../cartridges/app_ua_core/cartridge/scripts/search/search');

    it('Testing method: setProductProperties', () => {
        let ProductSearchModel = require('../../mocks/dw/dw_catalog_ProductSearchModel');
        let productSearch = new ProductSearchModel();
        let httpParameterMap = {
            pmax: {doubleValue:'10'},
            pmin: {doubleValue:'1'}
        }
        let httpParams = {
            q: 'testq',
            pid: 'testpid',
            pmax: '10',
            pmin: '1'
        }
        let selectedCategory = {
            ID: 'testid'
        };
        let sortingRule = 'testrule';

        searchModelHelper.setProductProperties(productSearch, httpParams, selectedCategory, sortingRule, httpParameterMap);

        assert.equal(productSearch.searchPhrase, 'testq');
        assert.equal(productSearch.categoryID, 'testid');
        assert.equal(productSearch.productID, 'testpid');
        assert.equal(productSearch.priceMin, '1');
        assert.equal(productSearch.priceMax, '10');
        assert.equal(productSearch.sortingRule, 'testrule');
        assert.equal(productSearch.recursiveCategorySearch, true);
    });

    it('Testing method: addRefinementValues', () => {
        let SearchModel = require('../../mocks/dw/dw_catalog_SearchModel');
        let search = new SearchModel();
        let preferences = {
            testId: 'testVal'
        };
        searchModelHelper.addRefinementValues(search, preferences)
        assert.equal('testVal', search.refinements.testId);
    });
});
