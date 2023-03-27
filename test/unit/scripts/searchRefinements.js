'use strict';

// SFRA test case
/* eslint-disable */

var assert = require('chai').assert;
const { nextTick } = require('q');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockCollections = require('../../../cartridges/storefront-reference-architecture/test/mocks/util/collections');
var mockPriceRefinementValue = sinon.spy();
var mockColorRefinementValue = sinon.spy();
var mockSizeRefinementValue = sinon.spy();
var mockBooleanRefinementValue = sinon.spy();
var mockGetCategory = sinon.stub();

let categoryRefinementValue = function(temp1, temp2, category) {
    return {
        online: true,
        name: category.name,
        subCategories: [],
        hasOnlineProducts: function() {
            return true;
        }
    };
}

let baseSearchRefinements = proxyquire('../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/factories/searchRefinements', {
    'dw/catalog/CatalogMgr': {
        getCategory: mockGetCategory
    },
    '*/cartridge/scripts/util/collections': mockCollections,
    '*/cartridge/models/search/attributeRefinementValue/price': mockPriceRefinementValue,
    '*/cartridge/models/search/attributeRefinementValue/color': mockColorRefinementValue,
    '*/cartridge/models/search/attributeRefinementValue/size': mockSizeRefinementValue,
    '*/cartridge/models/search/attributeRefinementValue/boolean': mockBooleanRefinementValue,
    '*/cartridge/models/search/attributeRefinementValue/category': categoryRefinementValue
});

var searchRefinements = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/factories/searchRefinements', {
    'dw/catalog/CatalogMgr': {
        getCategory: mockGetCategory
    },
    '*/cartridge/scripts/util/collections': mockCollections,
    '*/cartridge/models/search/attributeRefinementValue/price': mockPriceRefinementValue,
    '*/cartridge/models/search/attributeRefinementValue/color': mockColorRefinementValue,
    '*/cartridge/models/search/attributeRefinementValue/size': mockSizeRefinementValue,
    '*/cartridge/models/search/attributeRefinementValue/boolean': mockBooleanRefinementValue,
    '*/cartridge/models/search/attributeRefinementValue/category': categoryRefinementValue
});

describe('Search Refinements Factory', function() {
    var productSearch;
    var refinementDefinition;
    var refinementValues = [{}];

    beforeEach(function() {
        productSearch = {};
        refinementDefinition = {};
        mockPriceRefinementValue.reset();
        mockColorRefinementValue.reset();
        mockSizeRefinementValue.reset();
        mockBooleanRefinementValue.reset();
    });

    it('should retrieve price refinements ', function() {
        refinementDefinition = {
            priceRefinement: true
        };

        searchRefinements.get(productSearch, refinementDefinition, refinementValues);

        assert.isTrue(mockPriceRefinementValue.calledWithNew());
    });

    it('should retrieve size refinements ', function() {
        refinementDefinition = {
            attributeID: 'size'
        };

        searchRefinements.get(productSearch, refinementDefinition, refinementValues);

        assert.isTrue(mockSizeRefinementValue.calledWithNew());
    });

    it('should retrieve boolean refinements ', function() {
        searchRefinements.get(productSearch, refinementDefinition, refinementValues);

        assert.isTrue(mockBooleanRefinementValue.calledWithNew());

    });

    it('should retrieve size refinements ', function() {
        refinementDefinition = {
            categoryRefinement: true
        };

        productSearch.categorySearch = true;
        productSearch.category = {
                root: 'category'
        };

        searchRefinements.get(productSearch, refinementDefinition, refinementValues);

        assert.isFalse(mockSizeRefinementValue.calledWithNew());
    });

    it('should retrieve size refinements ', function() {
        refinementDefinition = {
            attributeID: 'colorgroup'
        };

        productSearch.categorySearch = true;
        productSearch.category = {
                root: 'category'
        };

        searchRefinements.get(productSearch, refinementDefinition, refinementValues);

        assert.isFalse(mockSizeRefinementValue.calledWithNew());
    });

    it('should retrieve size refinements ', function() {
        refinementDefinition = {
            categoryRefinement: true
        };

        productSearch.categorySearch = true;
        productSearch.category = {
                category : {
                    name : 'category'
                },
                name: 'category',
                root: false,
                onlineSubCategories: () => {
                    return 'usad'
                },
                parent: {
                    root: false,
                    parent: {
                        root: false
                    },
                    onlineSubCategories: {
                        iterator: function () {
                            var cnt = 0;
                            return {
                                count: 1,
                                hasNext: () => {
                                    cnt++;
                                    return cnt === 1;
                                },
                                next: () => {
                                    return {
                                        online: true,
                                        hasOnlineProducts: function() {
                                            return true;
                                        }
                                    }
                                },
                                hasOnlineProducts: function() {
                                    return true;
                                }
                            }
                        },
                        hasOnlineProducts: function() {
                            return true;
                        }
                    }
                }
            };
        searchRefinements.get(productSearch, refinementDefinition, refinementValues);

        assert.isFalse(mockSizeRefinementValue.calledWithNew());
    });

    describe('Category Refinements', function() {
        var level1Category;
        var level2Category;
        var level3Category;
        var results;
        var rootCategory;

        beforeEach(function() {
            productSearch = {
                categorySearch: true
            };
            refinementDefinition = {
                categoryRefinement: true
            };
            rootCategory = {
                ID: 'root',
                root: true,
                parent: {
                    ID: null
                },
                subCategories: []
            };
            level1Category = {
                ID: 'women',
                online: true,
                name: 'women',
                parent: rootCategory,
                subCategories: [],
                hasOnlineProducts: function() {
                    return true;
                }
            };
            level2Category = {
                ID: 'women-clothing',
                online: true,
                name: 'women-clothing',
                parent: level1Category,
                subCategories: [],
                hasOnlineProducts: function() {
                    return true;
                }
            };
            level3Category = {
                ID: 'women-clothing-bottoms',
                online: true,
                name: 'women-clothing-bottoms',
                parent: level2Category,
                subCategories: [],
                hasOnlineProducts: function() {
                    return true;
                }
            };
        });

        describe('createCategorySearchRefinement() function', function() {
            it('should return a hierarchical category object', function() {
                productSearch.category = level2Category;
                level2Category.subCategories.push(level3Category);
                results = searchRefinements.get(productSearch, refinementDefinition, refinementValues);

                assert.equal(results[0].name, level1Category.name);
                assert.equal(results[0].subCategories[0].name, level2Category.name);
                assert.equal(results[0].subCategories[0].subCategories[0].name, level3Category.name);
            });

            it('should only return a category with its immediate subCategories if it or its parent is a root', function() {
                var l2CategoryA = {
                    online: true,
                    name: 'l2CA',
                    subCategories: [],
                    hasOnlineProducts: function() {
                        return true;
                    }
                };
                var l2CategoryB = {
                    online: true,
                    name: 'l2CB',
                    subCategories: [],
                    hasOnlineProducts: function() {
                        return true;
                    }
                };
                level1Category.subCategories = [l2CategoryA, l2CategoryB];
                productSearch.category = level1Category;
                results = searchRefinements.get(productSearch, refinementDefinition, refinementValues);

                assert.equal(results[0].subCategories.length, [l2CategoryA, l2CategoryB].length);
            });
        });

        describe('createProductSearchRefinement() function', function() {
            beforeEach(function() {
                productSearch = {
                    categorySearch: false
                };
                refinementDefinition = {
                    categoryRefinement: true
                };
            });

            afterEach(function() {
                mockGetCategory.reset();
            });

            it('should return a hierarchical category object', function() {
                var level1Result;
                var level2Result;
                var level3Result;

                refinementValues = [{
                        value: 'root'
                    },
                    {
                        value: 'women'
                    },
                    {
                        value: 'women-clothing'
                    },
                    {
                        value: 'women-clothing-bottoms'
                    }
                ];

                mockGetCategory.withArgs('root').returns(rootCategory);
                mockGetCategory.withArgs('women').returns(level1Category);
                mockGetCategory.withArgs('women-clothing').returns(level2Category);
                mockGetCategory.withArgs('women-clothing-bottoms').returns(level3Category);

                results = searchRefinements.get(productSearch, refinementDefinition, refinementValues);
                level1Result = results[0];
                level2Result = level1Result.subCategories[0];
                level3Result = level2Result.subCategories[0];

                assert.equal(level1Result.name, level1Category.name);
                assert.equal(level2Result.name, level2Category.name);
                assert.equal(level3Result.name, level3Category.name);
            });
        });
    });
});
