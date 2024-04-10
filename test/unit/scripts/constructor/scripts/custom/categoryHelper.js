const assert = require('chai').assert;
const expect = require('chai').expect;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var categoryHelper = require('../../../../../../test/mocks/constructor/custom/categoryHelper');

describe('getCategoryUrl', function () {
    it('should convert the URL format correctly for a valid category', function () {
        // Create a sample category object with an ID (you can provide a mock category object)
        const category = {
            ID: 'shoes'
        };

        // Call the function and get the result
        const result = categoryHelper.getCategoryUrl(category);

        // Make assertions about the result
        expect(result).to.equal('/en-us/c/shoes/');
    });

    it('should handle empty input', function () {
        // Call the function with a null category
        const result = categoryHelper.getCategoryUrl(null);

        // Make assertions about the result
        expect(result).to.equal('');
    });
});

describe('getParentCategories', function () {
    it('should return an array of parent categories including the self category and root', function () {
        // Create a sample category object
        const category = {
            ID: 'child-category',
            displayName: 'Child Category',
            parent: {
                ID: 'parent-category',
                displayName: 'Parent Category',
                parent: {
                    ID: 'root',
                    displayName: 'Root Category',
                    parent: null,
                    custom: {
                        hideFromBreadCrumbs: false,
                    },
                },
                custom: {
                    hideFromBreadCrumbs: true,
                },
            },
            custom: {
                hideFromBreadCrumbs: false,
            },
        };

        const result = categoryHelper.getParentCategories(category, null, 'asc', false, true);

        // Make assertions about the result
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(3); // Four categories in the hierarchy
        expect(result[0].id).to.equal('child-category');
        expect(result[1].id).to.equal('parent-category');
        expect(result[2].id).to.equal('root');
    });

    it('should handle empty input', function () {
        const result = categoryHelper.getParentCategories(null);

        expect(result).to.be.a('string').that.is.empty; // An empty array
    });

    it('should handle exclusion of the root category', function () {
        // Create a sample category hierarchy
        const category = {
            ID: 'child-category',
            displayName: 'Child Category',
            parent: {
                ID: 'parent-category',
                displayName: 'Parent Category',
                parent: {
                    ID: 'root',
                    displayName: 'Root Category',
                    parent: null,
                    custom: {
                        hideFromBreadCrumbs: false,
                    },
                },
                custom: {
                    hideFromBreadCrumbs: true,
                },
            },
            custom: {
                hideFromBreadCrumbs: false,
            },
        };

        const result = categoryHelper.getParentCategories(category, null, 'asc', true, true);

        // Make assertions about the result
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(2);
        expect(result[0].id).to.equal('child-category');
        expect(result[0].id).to.not.equal('root');
        expect(result[1].id).to.equal('parent-category');
        expect(result[1].id).to.not.equal('root');
    });

    it('should handle sorting in descending order', function () {
        // Create a sample category hierarchy
        const category = {
            ID: 'child-category',
            displayName: 'Child Category',
            parent: {
                ID: 'parent-category',
                displayName: 'Parent Category',
                parent: {
                    ID: 'root',
                    displayName: 'Root Category',
                    parent: null,
                    custom: {
                        hideFromBreadCrumbs: false,
                    },
                },
                custom: {
                    hideFromBreadCrumbs: true,
                },
            },
            custom: {
                hideFromBreadCrumbs: false,
            },
        };

        const result = categoryHelper.getParentCategories(category, null, 'desc', true, true);

        // Make assertions about the result
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(2);
        expect(result[0].id).to.equal('parent-category');
        expect(result[1].id).to.equal('child-category');
    });
});

describe('searchCategory', () => {
    it('should return search results for the passed category', () => {
        // Mocking category object
        const category = { cgid: 'root' };

        const result = categoryHelper.searchCategory(category);

        expect(result).to.be.an('object');
    });
});

describe('isGiftsCategory', () => {
    it('should return true if the passed category contains the gifts by price search refinement', () => {
        // Mocking category object
        const category = { ID: 'top-gifts' };

        const result = categoryHelper.isGiftsCategory(category);

        expect(result).to.be.true;
    });

    it('should return false if the passed category does not contain the gifts by price search refinement', () => {
        // Mocking category object
        const category = { ID: 'nonGiftsCategoryID' };

        const result = categoryHelper.isGiftsCategory(category);

        expect(result).to.be.false;
    });
});

describe('getGiftsCategories', () => {
    it('should return list of categories that contain the Gifts By Price search refinement', () => {
        // Mocking category object with subcategories
        const category = {
            ID: 'root',
            onlineSubCategories: {
                toArray: () => [
                    { ID: 'top-gifts', onlineSubCategories: { toArray: () => [] } },
                    { ID: 'ua-gift-cards', onlineSubCategories: { toArray: () => [] } },
                    { ID: 'women', onlineSubCategories: { toArray: () => [] } }
                ]
            }
        };

        const result = categoryHelper.getGiftsCategories(category);

        expect(result).to.eql(['top-gifts', 'ua-gift-cards']);
    });
});

describe('cleanUrl', () => {
    it('should return empty string when provided with an empty url', () => {
        const result = categoryHelper.cleanUrl('');
        expect(result).to.equal('');
    });

    it('should remove hostname from the url', () => {
        const originalUrl = 'https://development-na04-underarmour.demandware.net/path/to/resource';
        const scrubbedUrl = categoryHelper.cleanUrl(originalUrl);
        expect(scrubbedUrl).to.equal('/path/to/resource');
    });

    it('should convert "&amp;" to "&"', () => {
        const originalUrl = 'https://development-na04-underarmour.demandware.net/s/US/page?param1=value1&amp;param2=value2';
        const expectedUrl = '/en-us/page?param1=value1&amp;param2=value2';
        const scrubbedUrl = categoryHelper.cleanUrl(originalUrl);
        expect(scrubbedUrl).to.equal(expectedUrl);
    });

    it('should remove site info and convert underscores to dashes in locale', () => {
        const originalUrl = 'https://development-na04-underarmour.demandware.net/s/US/path';
        const expectedUrl = '/en-us/path';
        const scrubbedUrl = categoryHelper.cleanUrl(originalUrl);
        expect(scrubbedUrl).to.equal(expectedUrl);
    });

    it('should handle URL with no site info and locale', () => {
        const originalUrl = 'https://development-na04-underarmour.demandware.net/another/path';
        const expectedUrl = '/another/path'; // No changes expected
        const scrubbedUrl = categoryHelper.cleanUrl(originalUrl);
        expect(scrubbedUrl).to.equal(expectedUrl);
    });
});

describe('getCategoryAltUrl', () => {
    it('should return empty string for empty category', () => {
        const category = null;
        const result = categoryHelper.getCategoryAltUrl(category);
        expect(result).to.equal('');
    });

    it('should return cleaned category URL without alternativeUrl', () => {
        const category = {
            ID: '1234',
            custom: {}
        };
        const result = categoryHelper.getCategoryAltUrl(category);
        expect(result).to.equal('/en-us/c/1234/');
    });

    it('should return cleaned category URL with alternativeUrl', () => {
        const category = {
            ID: '5678',
            custom: {
                alternativeUrl: 'https://example.com/s/US/c/5678'
            }
        };
        const result = categoryHelper.getCategoryAltUrl(category);
        expect(result).to.equal('/en-us/c/5678');
    });
});

describe('getCategoryParentID', () => {
    it('should return empty string for empty category', () => {
        const result = categoryHelper.getCategoryParentID(null);
        expect(result).to.equal('');
    });

    it('should return empty string for category with no parent', () => {
        const category = {
            ID: '1234',
            parent: null
        };
        const result = categoryHelper.getCategoryParentID(category);
        expect(result).to.equal('');
    });

    it('should return parent category ID', () => {
        const parentCategory = {
            ID: '5678'
        };
        const category = {
            ID: '1234',
            parent: parentCategory
        };
        const result = categoryHelper.getCategoryParentID(category);
        expect(result).to.equal('5678');
    });
});

describe('getCategoryParentName', () => {
    it('should return parent category name if category and its parent exist', () => {
        const mockCategory = {
            parent: {
                displayName: 'Parent Category Name'
            }
        };
        const result = categoryHelper.getCategoryParentName(mockCategory);
        expect(result).to.equal('Parent Category Name');
    });

    it('should return an empty string if category or its parent is empty', () => {
        const mockCategoryNoParent = {
            parent: null
        };
        const mockCategoryEmpty = null;
        const resultNoParent = categoryHelper.getCategoryParentName(mockCategoryNoParent);
        const resultEmptyCategory = categoryHelper.getCategoryParentName(mockCategoryEmpty);
        expect(resultNoParent).to.equal('');
        expect(resultEmptyCategory).to.equal('');
    });
});
