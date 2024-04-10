'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');
var mockCollections = require('../../../../mocks/util/collections');

describe('ProductSearch model', function () {
    var endpointSearchShow = 'Search-ShowAjax';
    var endpointSearchUpdateGrid = 'Search-UpdateGrid';
    var pluckValue = 'plucked';
    var spySetPageSize = sinon.spy();
    var spySetStart = sinon.spy();
    var stubAppendPaging = sinon.stub();
    var stubGetPageSize = sinon.stub();
    var stubAppendQueryParams = sinon.stub();
    stubAppendQueryParams.returns({ toString: function () {} });

    var defaultPageSize = 12;
    var pagingModelInstance = {
        appendPaging: stubAppendPaging,
        getPageSize: stubGetPageSize,
        getEnd: function () { return 10; },
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

    var searchSpy = sinon.spy();
    var categoryMock = {
        parent: {
            ID: 'root'
        },
        template: 'rendering/category/categoryproducthits'
    };
    var productSearchModelMock = {
        search: searchSpy,
        getSearchRedirect: function () {
            return {
                getLocation: function () {
                    return 'some value';
                }
            };
        },
        category: categoryMock,
        pageMetaTags: [{
            ID: 'test',
            name: 'test',
            property: false,
            title: true,
            content: true
        }],
        removeRefinementValues: () => '',
        setRefinementValues: () => '',
        setOrderableProductsOnly: () => '',
        setRecursiveCategorySearch: () => '',
        setCategoryID: () => '',
        getCategoryID: () => ''
    };
    var ProductSearchModel = function () {
        return productSearchModelMock;
    };

    var BaseProductSearch = proxyquire('../../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/models/search/productSearch', {
        '*/cartridge/scripts/util/collections': {
            map: mockCollections.map,
            pluck: function () { return pluckValue; }
        },
        '*/cartridge/scripts/factories/searchRefinements': {
            get: function () { return refinementValues; }
        },
        '*/cartridge/models/search/productSortOptions': proxyquire('../../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/models/search/productSortOptions', {
            '*/cartridge/scripts/util/collections': {
                map: mockCollections.map
            },
            '*/cartridge/scripts/helpers/urlHelpers': {
                appendQueryParams: function () {}
            }
        }),
        '*/cartridge/scripts/helpers/urlHelpers': {
            appendQueryParams: stubAppendQueryParams
        },
        '*/cartridge/scripts/helpers/searchHelpers': {
            getBannerImageUrl: function (category) { return (category && category.weAreMockingThings) || ''; }
        },
        'dw/web/URLUtils': {
            url: function (endpoint, param, value) { return [endpoint, param, value].join(' '); }
        },
        'dw/web/PagingModel': stubPagingModel,
        '*/cartridge/config/preferences': {
            maxOrderQty: 10,
            defaultPageSize: 12
        },
        'dw/web/Resource': {
            msg: () => {},
            msgf: () => {}
        },
        'dw/catalog/ProductSearchModel': ProductSearchModel
    });

    var ProductSearch = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/models/search/productSearch', {
        '*/cartridge/scripts/util/collections': mockCollections,
        'app_storefront_base/cartridge/models/search/productSearch': BaseProductSearch,
        '*/cartridge/scripts/factories/searchRefinements': {
            get: function () { return refinementValues; }
        },
        '*/cartridge/scripts/helpers/urlHelpers': {
            appendQueryParams: stubAppendQueryParams
        },
        '*/cartridge/scripts/helpers/searchHelpers': {
            getBannerImageUrl: function (category) { return (category && category.weAreMockingThings) || ''; }
        },
        'dw/web/URLUtils': {
            url: function (endpoint, param, value) { return [endpoint, param, value].join(' '); }
        },
        'dw/web/PagingModel': stubPagingModel,
        '*/cartridge/config/preferences': {
            maxOrderQty: 10,
            defaultPageSize: 12
        },
        '*/cartridge/models/search/noJSPagination': function () {
            return '';
        },
        'dw/web/Resource': {
            msg: () => {},
            msgf: () => {}
        },
        'dw/catalog/ProductSearchModel': ProductSearchModel
    });

    var apiProductSearch;
    var httpParams = {};
    var result = '';

    stubPagingModel.returns(pagingModelInstance);
    stubGetPageSize.returns(defaultPageSize);

    afterEach(function () {
        spySetStart.reset();
        spySetPageSize.reset();
        stubAppendQueryParams.reset();
    });

    describe('.getRefinements()', function () {
        var displayName = 'zodiac sign';
        var categoryRefinement = { cat: 'catRefinement' };
        var attrRefinement = { attr: 'attrRefinement' };

        beforeEach(function () {
            apiProductSearch = {
                isCategorySearch: false,
                refinements: {
                    refinementDefinitions: [{
                        displayName: displayName,
                        categoryRefinement: categoryRefinement,
                        attributeRefinement: attrRefinement,
                        values: refinementValues
                    }],
                    getAllRefinementValues: function () {
                        return {
                            toArray: function () {
                                return [
                                    {
                                        value: 20,
                                        hitCount: 5,
                                        selectable: true,
                                        selected: false
                                    },
                                    {
                                        value: 30,
                                        hitCount: 3,
                                        selectable: true,
                                        selected: true
                                    },
                                    {
                                        value: 40,
                                        hitCount: 1,
                                        selectable: true,
                                        selected: false
                                    },
                                    {
                                        value: 50,
                                        hitCount: 4,
                                        selectable: true,
                                        selected: false
                                    },
                                    {
                                        value: 51,
                                        hitCount: 6,
                                        selectable: false,
                                        selected: false
                                    }
                                ];
                            }
                        };
                    }
                },
                url: function () { return 'http://some.url'; }
            };
        });

        it('should return refinements with a display name', function () {
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.deepEqual(result.refinements[0].displayName, displayName);
        });

        it('should return refinements with a categoryRefinement value', function () {
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.deepEqual(result.refinements[0].isCategoryRefinement, categoryRefinement);
        });

        it('should return refinements with an attribute refinement value', function () {
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.deepEqual(result.refinements[0].isAttributeRefinement, attrRefinement);
        });

        it('should return an object with refinement values', function () {
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.deepEqual(result.refinements[0].values, refinementValues);
        });
    });

    describe('.getSelectedFilters()', function () {
        beforeEach(function () {
            apiProductSearch = {
                isCategorySearch: false,
                refinements: {
                    refinementDefinitions: [{}],
                    getAllRefinementValues: function () {
                        return {
                            toArray: function () {
                                return [
                                    {
                                        value: 20,
                                        hitCount: 5,
                                        selectable: true,
                                        selected: false
                                    },
                                    {
                                        value: 30,
                                        hitCount: 3,
                                        selectable: true,
                                        selected: true
                                    },
                                    {
                                        value: 40,
                                        hitCount: 1,
                                        selectable: true,
                                        selected: false
                                    },
                                    {
                                        value: 50,
                                        hitCount: 4,
                                        selectable: true,
                                        selected: false
                                    },
                                    {
                                        value: 51,
                                        hitCount: 6,
                                        selectable: false,
                                        selected: false
                                    }
                                ];
                            }
                        };
                    }
                },
                url: function () { return 'http://some.url'; }
            };
        });

        it('should retrieve filter values that have been selected', function () {
            var selectedFilter = refinementValues.find(function (value) { return value.selected === true; });
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.equal(result.selectedFilters[0], selectedFilter);
        });

        it('should retrieve filter values that have been selected', function () {
            var selectedFilter = refinementValues.find(function (value) { return value.selected === true; });
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.equal(result.selectedFilters[0], selectedFilter);
        });
    });

    describe('.getResetLink()', function () {
        var expectedLink = '';

        beforeEach(function () {
            apiProductSearch = {
                categorySearch: false,
                refinements: {
                    refinementDefinitions: []
                },
                url: function () { return 'http://some.url'; }
            };

            httpParams = {
                cgid: 'cat123',
                q: 'keyword'
            };
        });

        it('should return a reset link for keyword searches', function () {
            expectedLink = [endpointSearchShow, 'q', httpParams.q].join(' ');
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.equal(result.resetLink, expectedLink);
        });

        it('should return a reset link for category searches', function () {
            apiProductSearch.categorySearch = true;
            expectedLink = [endpointSearchShow, 'cgid', httpParams.cgid].join(' ');
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.equal(result.resetLink, expectedLink);
        });
    });

    describe('.getBannerImageUrl()', function () {
        it('should use the searchHelper to resolve the banner URL', function () {
            apiProductSearch = {
                refinements: {
                    refinementDefinitions: []
                },
                url: function () { return 'http://some.url'; },
                category: {
                    weAreMockingThings: 'withMockData'
                }
            };

            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.equal(result.bannerImageUrl, 'withMockData');
        });
    });

    describe('.getPagingModel()', function () {
        beforeEach(function () {
            apiProductSearch = {
                isCategorySearch: false,
                refinements: {
                    refinementDefinitions: []
                },
                url: function () { return 'http://some.url'; }
            };
        });

        it('should call the PagingModel.setStart() method', function () {
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.isTrue(spySetStart.called);
        });

        it('should call the PagingModel.setPageSize() method', function () {
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.isTrue(spySetPageSize.called);
        });
    });

    describe('.getShowMoreUrl()', function () {
        var currentPageSize = 12;
        var expectedUrl = 'some url';

        beforeEach(function () {
            apiProductSearch = {
                isCategorySearch: false,
                refinements: {
                    refinementDefinitions: []
                },
                url: function () { return endpointSearchUpdateGrid; }
            };

            stubGetPageSize.returns(currentPageSize);
            stubAppendPaging.returns(expectedUrl);
        });

        afterEach(function () {
            stubGetPageSize.reset();
        });

        it('should return a url string if not on final results page', function () {
            expectedUrl = 'some url';
            apiProductSearch.count = 14;
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.equal(result.showMoreUrl, expectedUrl);
        });

        it('should return an empty string if last results page', function () {
            expectedUrl = '';
            apiProductSearch.count = 10;
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.equal(result.showMoreUrl, expectedUrl);
        });
    });

    describe('.getPermaLink()', function () {
        var expectedPermalink = 'permalink url';
        var mockToString = function () { return expectedPermalink; };
        stubAppendQueryParams.returns({ toString: mockToString });

        beforeEach(function () {
            httpParams = {
                start: '100'
            };
        });

        it('should produce a permalink URL', function () {
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.equal(result.permalink, expectedPermalink);
        });

        it('should append sz query param to a url = to start and default page size', function () {
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.isTrue(stubAppendQueryParams.calledWith(endpointSearchUpdateGrid));
            assert.deepEqual(stubAppendQueryParams.args[0][1], {
                start: '0',
                // start of 100 + default page size of 12
                sz: 112
            });
        });
    });

    describe('buildDiscountPercentageFilter', function () {
        var displayName = 'zodiac sign';
        var categoryRefinement = { cat: 'catRefinement' };
        var attrRefinement = { attr: 'attrRefinement' };
        refinementValues = [{
            value: 20,
            displayValue: '20',
            selected: false,
            selectable: true
        }, {
            value: 30,
            displayValue: '30',
            selected: true,
            selectable: true
        }, {
            value: 40,
            displayValue: '40',
            selected: false,
            selectable: true
        }, {
            value: 50,
            displayValue: '50',
            selected: true,
            selectable: true
        }, {
            value: 51,
            displayValue: '51',
            selected: false,
            selectable: true
        }];

        beforeEach(function () {
            apiProductSearch = {
                isCategorySearch: true,
                getCategoryID: () => 'men',
                refinements: {
                    refinementDefinitions: [{
                        displayName: displayName,
                        categoryRefinement: categoryRefinement,
                        attributeRefinement: attrRefinement,
                        values: refinementValues,
                        attributeID: 'discountPercentage'
                    }],
                    getAllRefinementValues: function () {
                        return {
                            toArray: function () {
                                return [
                                    {
                                        value: 20,
                                        hitCount: 5,
                                        selectable: true,
                                        selected: false
                                    },
                                    {
                                        value: 30,
                                        hitCount: 3,
                                        selectable: true,
                                        selected: true
                                    },
                                    {
                                        value: 40,
                                        hitCount: 1,
                                        selectable: true,
                                        selected: false
                                    },
                                    {
                                        value: 50,
                                        hitCount: 4,
                                        selectable: true,
                                        selected: false
                                    },
                                    {
                                        value: 51,
                                        hitCount: 6,
                                        selectable: false,
                                        selected: false
                                    }
                                ];
                            }
                        };
                    }
                },
                url: function () { return 'http://some.url'; },
                search: () => {},
                getRefinementValues: () => {
                    return {
                        toArray: () => [20, 30]
                    };
                },
                setRefinementValues: () => {},
                urlRelaxAttributeValue: () => {
                    return {
                        relative: () => ''
                    };
                },
                urlRefineAttributeValue: () => {
                    return {
                        relative: () => ''
                    };
                }
            };
        });
        it('should return mapped discountPercentages', function () {
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.deepEqual(result.refinements[0].values[0].value, 20);
            assert.deepEqual(result.refinements[0].values[1].value, 30);
            assert.deepEqual(result.refinements[0].values[2].value, 40);
        });

        it('should return mapped discountPercentages with hitcounts populated', function () {
            apiProductSearch = {
                isCategorySearch: true,
                getCategoryID: () => 'men',
                refinements: {
                    refinementDefinitions: [{
                        displayName: displayName,
                        categoryRefinement: categoryRefinement,
                        attributeRefinement: attrRefinement,
                        values: refinementValues,
                        attributeID: 'discountPercentage'
                    }],
                    getAllRefinementValues: function () {
                        return {
                            toArray: function () {
                                return [
                                    {
                                        value: 20,
                                        hitCount: 5,
                                        selectable: true,
                                        selected: false
                                    },
                                    {
                                        value: 30,
                                        hitCount: 3,
                                        selectable: true,
                                        selected: true
                                    },
                                    {
                                        value: 40,
                                        hitCount: 1,
                                        selectable: true,
                                        selected: false
                                    },
                                    {
                                        value: 50,
                                        hitCount: 4,
                                        selectable: true,
                                        selected: false
                                    },
                                    {
                                        value: 51,
                                        hitCount: 6,
                                        selectable: false,
                                        selected: false
                                    }
                                ];
                            }
                        };
                    }
                },
                url: function () { return 'http://some.url'; },
                search: () => {},
                getRefinementValues: () => {
                    return {
                        toArray: () => [20, 30]
                    };
                },
                setRefinementValues: () => {},
                urlRelaxAttributeValue: () => {
                    return {
                        relative: () => ''
                    };
                },
                urlRefineAttributeValue: () => {
                    return {
                        relative: () => ''
                    };
                }
            };
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.deepEqual(result.refinements[0].values[0].value, 20);
            assert.deepEqual(result.refinements[0].values[1].value, 30);
            assert.deepEqual(result.refinements[0].values[2].value, 40);
            assert.deepEqual(result.refinements[0].values[3].value, 50);
        });

        it('should return mapped discountPercentages with hitcounts populated1', function () {
            refinementValues = [{
                value: -1,
                displayValue: -1,
                selected: false,
                selectable: false
            }];
            apiProductSearch = {
                isCategorySearch: true,
                getCategoryID: () => 'men',
                refinements: {
                    refinementDefinitions: [{
                        displayName: displayName,
                        categoryRefinement: categoryRefinement,
                        attributeRefinement: attrRefinement,
                        values: refinementValues,
                        attributeID: 'discountPercentage'
                    }],
                    getAllRefinementValues: function () {
                        return {
                            toArray: function () {
                                return [
                                    {
                                        value: -1,
                                        hitCount: 0,
                                        selectable: false,
                                        selected: false
                                    }
                                ];
                            }
                        };
                    }
                },
                url: function () { return 'http://some.url'; },
                search: () => {},
                getRefinementValues: () => {
                    return {
                        toArray: () => [20, 30]
                    };
                },
                setRefinementValues: () => {},
                urlRelaxAttributeValue: () => {
                    return {
                        relative: () => ''
                    };
                },
                urlRefineAttributeValue: () => {
                    return {
                        relative: () => ''
                    };
                }
            };
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.deepEqual(result.refinements[0].values.length, 0);
        });

        it('refinement.set', function () {
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.deepEqual(result.refinements = null, null);
        });

        it('httpParams edge cases', function () {
            ProductSearch = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/models/search/productSearch', {
                '*/cartridge/scripts/util/collections': mockCollections,
                'app_storefront_base/cartridge/models/search/productSearch': BaseProductSearch,
                '*/cartridge/scripts/factories/searchRefinements': {
                    get: function () { return refinementValues; }
                },
                '*/cartridge/scripts/helpers/urlHelpers': {
                    appendQueryParams: stubAppendQueryParams
                },
                '*/cartridge/scripts/helpers/searchHelpers': {
                    getBannerImageUrl: function (category) { return (category && category.weAreMockingThings) || ''; }
                },
                'dw/web/URLUtils': {
                    url: function (endpoint, param, value) { return [endpoint, param, value].join(' '); }
                },
                'dw/web/PagingModel': stubPagingModel,
                '*/cartridge/config/preferences': {
                    maxOrderQty: 100,
                    defaultPageSize: 100,
                    size: 100
                },
                '*/cartridge/models/search/noJSPagination': function () {
                    return '';
                },
                'dw/web/Resource': {
                    msg: () => {},
                    msgf: () => {}
                },
                'dw/catalog/ProductSearchModel': ProductSearchModel
            });
            httpParams = {
                start: '100'
            };
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.deepEqual(result.refinements[0].displayName, displayName);
        });

        it('httpParams edge cases1', function () {
            ProductSearch = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/models/search/productSearch', {
                '*/cartridge/scripts/util/collections': mockCollections,
                'app_storefront_base/cartridge/models/search/productSearch': BaseProductSearch,
                '*/cartridge/scripts/factories/searchRefinements': {
                    get: function () { return refinementValues; }
                },
                '*/cartridge/scripts/helpers/urlHelpers': {
                    appendQueryParams: stubAppendQueryParams
                },
                '*/cartridge/scripts/helpers/searchHelpers': {
                    getBannerImageUrl: function (category) { return (category && category.weAreMockingThings) || ''; }
                },
                'dw/web/URLUtils': {
                    url: function (endpoint, param, value) { return [endpoint, param, value].join(' '); }
                },
                'dw/web/PagingModel': stubPagingModel,
                '*/cartridge/config/preferences': {
                    maxOrderQty: 100,
                    defaultPageSize: 100,
                    size: 100
                },
                '*/cartridge/models/search/noJSPagination': function () {
                    return '';
                },
                'dw/web/Resource': {
                    msg: () => {},
                    msgf: () => {}
                },
                'dw/catalog/ProductSearchModel': ProductSearchModel
            });
            httpParams = {
                breadCrumbLast: 12,
                pageSize: 12
            };
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.deepEqual(result.refinements[0].displayName, displayName);
        });

        it('httpParams edge cases2', function () {
            ProductSearch = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/models/search/productSearch', {
                '*/cartridge/scripts/util/collections': mockCollections,
                'app_storefront_base/cartridge/models/search/productSearch': BaseProductSearch,
                '*/cartridge/scripts/factories/searchRefinements': {
                    get: function () { return refinementValues; }
                },
                '*/cartridge/scripts/helpers/urlHelpers': {
                    appendQueryParams: stubAppendQueryParams
                },
                '*/cartridge/scripts/helpers/searchHelpers': {
                    getBannerImageUrl: function (category) { return (category && category.weAreMockingThings) || ''; }
                },
                'dw/web/URLUtils': {
                    url: function (endpoint, param, value) { return [endpoint, param, value].join(' '); }
                },
                'dw/web/PagingModel': stubPagingModel,
                '*/cartridge/config/preferences': {
                    maxOrderQty: 100,
                    size: 100
                },
                '*/cartridge/models/search/noJSPagination': function () {
                    return '';
                },
                'dw/web/Resource': {
                    msg: () => {},
                    msgf: () => {}
                },
                'dw/catalog/ProductSearchModel': ProductSearchModel
            });
            httpParams = {
                breadCrumbLast: 12,
                pageSize: 12,
                start: 12
            };
            result = new ProductSearch(apiProductSearch, httpParams, 'sorting-rule-1', [], {});
            assert.deepEqual(result.refinements[0].displayName, displayName);
        });
    });
});
