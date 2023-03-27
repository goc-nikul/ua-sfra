'use strict';

/* eslint-disable */
// SFRA test case

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../mockModuleSuperModule');
var sinon = require('sinon');

var collections = require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections');

describe('ProductSortOption model', function() {
    var querystringStub = sinon.stub();
    var stubAppendQueryParams = sinon.stub();
    stubAppendQueryParams.returns({
        toString: function() {}
    });

    var sortRuleUrl = 'some url';
    var productSearch = {
        category: {
            defaultSortingRule: {
                ID: 'defaultRule1'
            }
        },
        urlSortingRule: () => {
            return {
                toString: () => { return sortRuleUrl; }
            };
        }
    };
    var sortingRuleId = 'provided sort rule ID';
    var sortingOption1 = {
        displayName: 'Sort Option 1',
        ID: 'abc',
        sortingRule: 'rule1'
    };
    var sortingOption2 ={
        displayName: 'Sort Option 2',
        ID: 'cde',
        sortingRule: 'rule2'
    };
    var sortingOptions = [sortingOption1, sortingOption2];
    var rootCategory = {
        defaultSortingRule: {
            ID: 'defaultRule2'
        }
    };
    var pagingModel = { end: 5 };
    var stubPagingModel = sinon.stub();

    var sortRuleUrlWithParams = 'some url with params';
    var BaseProductSearch = proxyquire('../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/models/search/productSortOptions', {
        '*/cartridge/scripts/util/collections': collections,
        '*/cartridge/scripts/helpers/urlHelpers': {
            appendQueryParams: () => {
                return {
                    toString: () => {
                        return sortRuleUrlWithParams;
                    }
                };
            }
        },
        'dw/web/URLUtils': {
            url: function(endpoint, param, value) {
                return [endpoint, param, value].join(' ');
            }
        },
        'dw/web/PagingModel': stubPagingModel,
        '*/cartridge/config/preferences': {
            maxOrderQty: 10,
            defaultPageSize: 12
        },
        '*/cartridge/scripts/helpers/searchHelpers': require('../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/helpers/searchHelpers')
    });
    var ProductSortOptions = proxyquire('../../../../cartridges/app_ua_core/cartridge/models/search/productSortOptions', {
        'app_storefront_base/cartridge/models/search/productSortOptions': BaseProductSearch,
        '*/cartridge/scripts/util/collections': collections,
        '*/cartridge/scripts/helpers/urlHelpers':{
            appendQueryParams: () => {
                return {
                    toString: () => {
                        return sortRuleUrlWithParams;
                    }
                };
            }
        }
    });

        it('should set a list of sorting rule options', () => {
            var productSortOptions = new ProductSortOptions(productSearch, sortingRuleId, sortingOptions, rootCategory, pagingModel);
            assert.deepEqual(productSortOptions.options, [{
                displayName: sortingOption1.displayName,
                id: sortingOption1.ID,
                pageUrl: sortRuleUrlWithParams,
                url: sortRuleUrlWithParams
            }, {
                displayName: sortingOption2.displayName,
                id: sortingOption2.ID,
                pageUrl: sortRuleUrlWithParams,
                url: sortRuleUrlWithParams
            }]);
        });

        it('should set a option.displayName for selectedSortingOption when sortingRuleId matches with option ID', () => {
            sortingRuleId = 'abc';
            var productSortOptions = new ProductSortOptions(productSearch, sortingRuleId, sortingOptions, rootCategory, pagingModel);
            assert.equal(productSortOptions.selectedSortingOption, 'Sort Option 1');
        });
    
        it('should set rule ID to provided sort rule ID', () => {
            var productSortOptions = new ProductSortOptions(productSearch, sortingRuleId, sortingOptions, null, pagingModel);
            assert.isTrue(productSortOptions.ruleId === sortingRuleId);
        });
    
        it('should set rule ID to category\'s default sort rule ID when no rule provided', () => {
            var productSearchWithNoCategory = {
                category: null,
                urlSortingRule: productSearch.urlSortingRule
            };
            var productSortOptions = new ProductSortOptions(productSearchWithNoCategory, null, sortingOptions, rootCategory, pagingModel);
            assert.isTrue(productSortOptions.ruleId === rootCategory.defaultSortingRule.ID);
        });
    
        it('should set rule ID to product search\'s category\'s default sort rule ID when no rule provided', () => {
            var productSortOptions = new ProductSortOptions(productSearch, null, sortingOptions, null, pagingModel);
            assert.isTrue(productSortOptions.ruleId === productSearch.category.defaultSortingRule.ID);
        });

        it('should set rule ID to \'null\' when no rule provided and there is no default rule for category', () => {
            var productSearchWithNoCategoryDefaultSortingRule = {
                category: {
                    defaultSortingRule: null
                },
                urlSortingRule: productSearch.urlSortingRule
            };
            var productSortOptions = new ProductSortOptions(productSearchWithNoCategoryDefaultSortingRule, null, sortingOptions, rootCategory, pagingModel);
            assert.isTrue(productSortOptions.ruleId === null);
        });
});

