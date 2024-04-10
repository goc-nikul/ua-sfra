var chai = require('chai');
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var assert = chai.assert;

describe('queryCategories', function () {
    var queryCategories;
    var CatalogMgrMock;

    beforeEach(function () {
        sinon.restore();

        CatalogMgrMock = {
            getSiteCatalog: sinon.stub()
        };

        function buildCategory(data, parent) {
            var category = {
                ID: data.ID,
                displayName: data.displayName,
                parent: parent || null
            };

            if (data.siblings && data.siblings.length > 0) {
                category.hasOnlineSubCategories = function () { return true; };
                category.getOnlineSubCategories = function () {
                    var index = 0; // Capturing the current index in the closure
                    return {
                        iterator: function () {
                            return {
                                hasNext: function () {
                                    return index < data.siblings.length;
                                },
                                next: function () {
                                    return buildCategory(data.siblings[index++], category);
                                }
                            };
                        }
                    };
                };
            } else {
                category.hasOnlineSubCategories = function () { return false; };
                category.getOnlineSubCategories = function () {
                    return {
                        iterator: function () {
                            return {
                                hasNext: function () { return false; },
                                next: function () { return null; }
                            };
                        }
                    };
                };
            }

            return category;
        }

        CatalogMgrMock.getSiteCatalog.returns({
            getRoot: function () {
                return buildCategory({
                    ID: 'root',
                    displayName: 'Root',
                    siblings: [
                        {
                            ID: 'clothing',
                            displayName: 'Clothing',
                            siblings: [
                                { ID: 't-shirts', displayName: 'T-Shirts', siblings: [] },
                                { ID: 't-shirts', displayName: 'T-Shirts Duplicate', siblings: [] }
                            ]
                        }
                    ]
                });
            }
        });

        queryCategories = proxyquire('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/categories/queryCategories', {
            'dw/catalog/CatalogMgr': CatalogMgrMock
        });
    });

    afterEach(function () {
        sinon.restore(); // Clean up all Sinon mocks after each test
    });

    it('should not return duplicated categories', function () {
        var result = queryCategories();
        assert(result.some(category => category.ID === 'root'), 'Root category should be present');
        assert(result.some(category => category.ID === 'clothing'), 'Clothing category should be present');
        assert(result.some(category => category.ID === 't-shirts'), 'T-shirts category should be present');

        const uniqueIds = new Set(result.map(category => category.ID));
        assert.strictEqual(uniqueIds.size, result.length, 'Each category ID should be unique in the result');
        assert.strictEqual(result.length, 3, 'The total number of unique categories should be 3.');
    });

    it('should ensure duplicate categories are not added, indirectly testing duplicate prevention', function () {
        var result = queryCategories();
        const tShirtCount = result.filter(category => category.ID === 't-shirts').length;
        assert.strictEqual(tShirtCount, 1, 'T-shirts category should only appear once despite the duplicate setup.');
        assert.strictEqual(result.length, 3, 'The total number of categories should match expected, excluding duplicates.');
    });
});
