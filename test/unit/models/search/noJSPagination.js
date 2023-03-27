'use strict';

/* eslint-disable */
// SFRA test case

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

describe('app_ua_core/cartridge/models/search/noJSPagination', () => {
    var NoJsPagination = proxyquire('../../../../cartridges/app_ua_core/cartridge/models/search/noJSPagination', {
        'dw/web/URLUtils': {
            url: function () {
                return {
                    append: function () {
                        return 'some appened URL';
                    }
                };
            }
        },
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger')
    });

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
        toString: () => {}
    });

    var defaultPageSize = 12;
    var pagingModelInstance = {
        appendPaging: stubAppendPaging,
        getPageSize: stubGetPageSize,
        getEnd: () => {
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

    var apiProductSearch;
    var httpParams = {};
    var result = '';

    stubPagingModel.returns(pagingModelInstance);
    stubGetPageSize.returns(defaultPageSize);

    afterEach(() => {
        spySetStart.reset();
        spySetPageSize.reset();
        stubAppendQueryParams.reset();
    });


    describe('app_ua_core/cartridge/models/search/noJSPagination', () => {
        var displayName = 'zodiac sign';
        var categoryRefinement = {
            cat: 'catRefinement'
        };
        var attrRefinement = {
            attr: 'attrRefinement'
        };

        beforeEach(() => {
            apiProductSearch = {
                count: 1,
                isCategorySearch: false,
                refinements: {
                    refinementDefinitions: [{
                        displayName: displayName,
                        categoryRefinement: categoryRefinement,
                        attributeRefinement: attrRefinement,
                        values: refinementValues,
                        cutoffThreshold: true
                    }],
                    getAllRefinementValues: () => {}
                },
                url: () => {
                    return 'http://some.url';
                }
            };
        });

        it('should return refinements with a display name', () => {
            apiProductSearch.count = 6;
            apiProductSearch.pageSize = 2;
            result = new NoJsPagination(apiProductSearch, httpParams);
            var results = result.pagination;
            assert.deepEqual(result.pagination[0].index, 1);
        });

        it('should return refinements with a categoryRefinement value', () => {
            apiProductSearch.count = 6;
            apiProductSearch.pageSize = 2;
            apiProductSearch.category = {
                id : 'men'
            };
            httpParams.q = 'q';
            result = new NoJsPagination(apiProductSearch, httpParams);
            var results = result;
            assert.isTrue(result.isPreviousAvailable);
        });

        it('should return refinements with an attribute refinement value', () => {
            apiProductSearch.count = 6;
            apiProductSearch.pageSize = 2;
            result = new NoJsPagination(apiProductSearch, httpParams);
            var results = result.previousURL;
            assert.isDefined(result.previousURL);
        });

        it('should return an object with refinement values', () => {
            apiProductSearch.count = 6;
            apiProductSearch.pageSize = 2;
            result = new NoJsPagination(apiProductSearch, httpParams);
            assert.isTrue(result.isNextAvailable);
        });

        it('should return an object with cutoff Threshold', () => {
            apiProductSearch.count = 6;
            apiProductSearch.pageSize = 2;
            result = new NoJsPagination(apiProductSearch, httpParams);
            assert.isDefined(result.nextURL);
        });
    });
});