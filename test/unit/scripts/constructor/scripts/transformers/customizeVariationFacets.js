const assert = require('chai').assert;
const expect = require('chai').expect;
const sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var customizeVariationFacets = require('../../../../../mocks/constructor/transformers/customizeVariationFacets');

describe('getVariationFacets', function() {
    it('should correctly generate variation facets for a product with valid data', function() {
        const mockProduct = {
            ID: '12345',
            productName: 'Test Product',
            priceModel: {
                getPriceBookPrice: function(priceBookName) {
                    return { value: 23.99 };
                }
            },
            custom: {
                colorway: 'Red'
            },
            primaryCategory: {
                ID: '22222'
            },
            master: true
        };

        const mockData = {
            inventory: 10,
            orderable: true,
            hideColorWay: false,
            inGiftsCategory: true,
            minSalePrice: 49.99,
            promoPricingEnabled: true,
            promos: [],
            variationFacets: [{ key: 'attribute1', value: 'value1' }],
            searchRefinements: [{ key: 'refinement1', value: 'value1' }]
        };

        const result = customizeVariationFacets.getVariationFacets(mockProduct, mockData);

        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(8);

        expect(result).to.deep.include({ key: 'price', value: '$0 - $25' });
        expect(result).to.deep.include({ key: 'currentHealth', value: 10 });
        expect(result).to.deep.include({ key: 'orderable', value: true });
    });
});
