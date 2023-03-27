'use strict';

/* eslint-disable */
// SFRA test case

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

var collections = require('../../../cartridges/storefront-reference-architecture/test/mocks/util/collections');

describe('ProductSearch model', function() {
    var endpointSearchShow = 'Search-ShowAjax';
    var endpointSearchUpdateGrid = 'Search-UpdateGrid';
    var pluckValue = 'plucked';
    var spySetPageSize = sinon.spy();
    var spySetStart = sinon.spy();
    var querystringStub = sinon.stub();
    var stubAppendPaging = sinon.stub();
    var stubGetPageSize = sinon.stub();
    var stubAppendQueryParams = sinon.stub();
    stubAppendQueryParams.returns({
        toString: function() {}
    });

    var defaultPageSize = 12;
    var pagingModelInstance = {
        appendPaging: stubAppendPaging,
        getPageSize: stubGetPageSize,
        getEnd: function() {
            return 10;
        },
        setPageSize: spySetPageSize,
        setStart: spySetStart
    };
    var stubPagingModel = sinon.stub();
    var refinementValues = [{
        value: 1,
        selected: false
    }, {
        value: 2,
        selected: true
    }, {
        value: 3,
        selected: false
    }];

    var urlHelpers = proxyquire('../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/helpers/urlHelpers', {
        'server': { querystring: querystringStub }
    });

    var BaseProductSearch = proxyquire('../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/models/search/productSearch', {
        '*/cartridge/scripts/util/collections': collections,
        '*/cartridge/scripts/factories/searchRefinements': {
            get: function() {
                return refinementValues;
            }
        },
        '*/cartridge/models/search/productSortOptions': proxyquire('../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/models/search/productSortOptions', {
            '*/cartridge/scripts/util/collections': collections,
            '*/cartridge/scripts/helpers/urlHelpers': {
                appendQueryParams: function() {}
            }
        }),
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
        '*/cartridge/scripts/helpers/urlHelpers': urlHelpers,
        '*/cartridge/scripts/helpers/searchHelpers': require('../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/helpers/searchHelpers')
    });

    var NoJsPagination = proxyquire('../../../cartridges/app_ua_core/cartridge/models/search/noJSPagination', {
        'dw/web/URLUtils': {
            url: function () {
                return {
                    append: function () {
                        return 'some appened URL';
                    }
                };
            }
        }
    });

    var ProductSearch = proxyquire('../../../cartridges/app_ua_core/cartridge/models/search/productSearch', {
        'app_storefront_base/cartridge/models/search/productSearch': BaseProductSearch,
        '*/cartridge/scripts/util/collections': collections,
        '*/cartridge/models/search/noJSPagination': NoJsPagination,
        '*/cartridge/scripts/factories/searchRefinements': {
            get: function() {
                return refinementValues;
            }
        },
        'app_storefront_base/cartridge/scripts/helpers/urlHelpers': {
            appendQueryParams: stubAppendQueryParams
        },
        'dw/web/PagingModel': stubPagingModel,
        '*/cartridge/config/preferences': {
            maxOrderQty: 10,
            defaultPageSize: 12
        },
        'dw/web/URLUtils': {
            url: function(endpoint, param, value) {
                return [endpoint, param, value].join(' ');
            }
        }
    });

    var apiProductSearch;
    var httpParams = {};
    var result = '';

    stubPagingModel.returns(pagingModelInstance);
    stubGetPageSize.returns(defaultPageSize);

    afterEach(function() {
        spySetStart.reset();
        spySetPageSize.reset();
        stubAppendQueryParams.reset();
    });

    describe('.getRefinements()', function() {
        var displayName = 'zodiac sign';
        var categoryRefinement = {
            cat: 'catRefinement'
        };
        var attrRefinement = {
            attr: 'attrRefinement'
        };

        beforeEach(function() {
            apiProductSearch = {
                isCategorySearch: false,
                refinements: {
                    refinementDefinitions: [{
                        displayName: displayName,
                        categoryRefinement: categoryRefinement,
                        attributeRefinement: attrRefinement,
                        values: refinementValues,
                        cutoffThreshold: true
                    }],
                    getAllRefinementValues: function() {}
                },
                url: function() {
                    return 'http://some.url';
                }
            };
        });

        it('should return refinements with a display name', function() {
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.deepEqual(result.refinements[0].displayName, displayName);
        });

        it('should return refinements with a categoryRefinement value', function() {
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.deepEqual(result.refinements[0].isCategoryRefinement, categoryRefinement);
        });

        it('should return refinements with an attribute refinement value', function() {
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.deepEqual(result.refinements[0].isAttributeRefinement, attrRefinement);
        });

        it('should return an object with refinement values', function() {
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.deepEqual(result.refinements[0].values, refinementValues);
        });

        it('should return an object with cutoff Threshold', function() {
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.deepEqual(result.refinements[0].cutoffThreshold, true);
        });

        it('should return an object with start, createNewUrl, breadcrumbLast', function() {
            result = new ProductSearch(apiProductSearch, {start: 12, pageSize: 12, breadCrumbLast: 'someCategoryID'}, 'sorting-rule-1', [], {});
            assert.equal(result.start, 12);
            assert.equal(result.createNewUrl.start, 12);
            assert.equal(result.createNewUrl.breadcrumbLast, 'someCategoryID');
        });

        it('should return an object with start, pageSize', function() {
            result = new ProductSearch(apiProductSearch, {start: 0, pageSize: 12}, 'sorting-rule-1', [], {});
            assert.equal(result.start, 0);
            assert.equal(result.pageSize, 12);
        });
    });
});
