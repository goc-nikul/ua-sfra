const assert = require('chai').assert;
const expect = require('chai').expect;
const sinon = require('sinon');

var SystemObjectMgr = require('../../../../../mocks/dw/dw_object_SystemObjectMgr');
var ProductSearchModel = require('../../../../../mocks/dw/dw_catalog_ProductSearchModel');
var ArrayList = require('../../../../../mocks/dw/dw.util.Collection');
var logger = require('../../../../../mocks/constructor/helpers/logger');
var bucketedAttributeHelper = require('../../../../../mocks/constructor/custom/bucketedAttributesHelper');

describe('getSearchRefinements', function () {
    it('should return refinements for a product search', function () {
        // Create a sample filter and searchType
        const filter = { ID: 1370030 };
        const searchType = 'product';

        // Call the function and get the result
        const result = bucketedAttributeHelper.getSearchRefinements(filter, searchType);

        // Assert that the function behaves as expected
        expect(result).to.be.an('object');
        expect(result).to.have.property('priceRefinementDefinition').that.is.an('object');
        expect(result.priceRefinementDefinition).to.have.property('displayName', 'Price');
    });
});

describe('getAttributeValuesMap', () => {
    it('should return an array of attribute values with key-value pairs', () => {
        // Create a sample product object for testing
        const sampleProduct = {
            ID: 1327965,
            custom: {
                team: 'Team Value',
                experienceType: 'Experience Type Value',
                agegroup: 'Age Group Value'
            },
        };

        // Call the function and check the result
        const attributeValues = bucketedAttributeHelper.getAttributeValuesMap(sampleProduct);

        // Assert the expected outcome based on your sampleProduct
        expect(attributeValues).to.deep.equal([
            { key: 'team', value: ['Cubs'] },
            { key: 'experienceType', value: ['Premium'] },
            { key: 'ageGroup', value: ['Adult'] }
        ]);
    });
});

describe('getPriceMap', function () {
    it('should return an empty array when category is empty', function () {
        const category = null;
        const result = bucketedAttributeHelper.getPriceMap(category);
        expect(result).to.be.an('array').that.is.empty;
    });

    it('should return an empty array when category ID is empty', function () {
        const category = { ID: '' };
        const result = bucketedAttributeHelper.getPriceMap(category);
        expect(result).to.be.an('array').that.is.empty;
    });

    it('should return an array of price map objects when a valid category is provided', function () {
        const category = { ID: 'root' };
        const result = bucketedAttributeHelper.getPriceMap(category);

        // Define the expected result
        const expected = [
            { displayName: '$0 - $25', valueFrom: 0, valueTo: 25 }
        ];

        expect(result).to.deep.equal(expected);
    });
});

describe('isDisplayName', () => {
    it('should return true for valid price refinement display names', () => {
        // Valid price refinement display names
        const validDisplayNames = ['gifts by price', 'cadeaux par prix'];

        // Testing each valid display name for 'price' type
        validDisplayNames.forEach(displayName => {
            const result = bucketedAttributeHelper.isDisplayName('price', displayName);
            expect(result).to.be.true;
        });
    });

    it('should return false for invalid price refinement display names', () => {
        // Invalid price refinement display names
        const invalidDisplayNames = ['some other name', 'random name', '', null, undefined];

        // Testing each invalid display name for 'price' type
        invalidDisplayNames.forEach(displayName => {
            const result = bucketedAttributeHelper.isDisplayName('price', displayName);
            expect(result).to.be.false;
        });
    });

    it('should return false for empty type or display name', () => {
        // Testing with empty type and display name
        const resultEmptyType = bucketedAttributeHelper.isDisplayName('', 'gifts by price');
        const resultEmptyDisplayName = bucketedAttributeHelper.isDisplayName('price', '');

        expect(resultEmptyType).to.be.false;
        expect(resultEmptyDisplayName).to.be.false;
    });

    it('should return false for non-price type', () => {
        // Testing with a non-price type
        const resultNonPriceType = bucketedAttributeHelper.isDisplayName('someOtherType', 'gifts by price');

        expect(resultNonPriceType).to.be.false;
    });
});

describe('buildSizeList', () => {
    it('should build size list correctly', () => {
        const product = {
            custom: {
                size: 'M'
            }
        };
        const sizeList = {
            'S': ['S']
        };

        const result = bucketedAttributeHelper.buildSizeList(product, sizeList);

        expect(result).to.deep.equal({
            'S': ['S', 'M']
        });
    });
});

describe('getSizeList', () => {
    it('should gather size attribute and refinement values', () => {
        const result = bucketedAttributeHelper.getSizeList({});

        expect(result).to.deep.equal({
            'S': ['SM', 'MD', 'LG', 'XL', 'XXL', 'XXXL']
        });
    });
});

describe('getDisplayNamesMap', () => {
    it('should return facets without changes if no facets provided', () => {
        const category = {};
        const facets = [];
        var expectedResult = [];
        expectedResult.changeMade = false;

        const result = bucketedAttributeHelper.getDisplayNamesMap(category, facets);

        expect(result).to.deep.equal(expectedResult);
    });

    it('should return facets without changes if no matching search refinements found', () => {
        const category = {};
        const facets = [{ name: 'facet1', display_name: 'Facet 1', data: {} }];

        const result = bucketedAttributeHelper.getDisplayNamesMap(category, facets);

        facets.changeMade = false;

        expect(result).to.deep.equal(facets);
    });

    it('should update facet display names if refinements found', () => {
        const category = { ID: 'root' };
        const facets = [
            { name: 'team', display_name: 'Facet 1', data: {} },
            { name: 'facet2', display_name: 'Facet 2', data: {} },
        ];

        var expectedResult = [
            { name: 'team', display_name: 'Facet 1', data: { categoryOverrides: { root: 'Team' } } },
            { name: 'facet2', display_name: 'Facet 2', data: {} }
        ];
        expectedResult.changeMade = true;
        
        const result = bucketedAttributeHelper.getDisplayNamesMap(category, facets);

        expect(result).to.deep.equal(expectedResult);
    });
});
