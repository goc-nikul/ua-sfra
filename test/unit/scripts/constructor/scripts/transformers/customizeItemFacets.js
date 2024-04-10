const assert = require('chai').assert;
const expect = require('chai').expect;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var customizeItemFacets = proxyquire('../../../../../mocks/constructor/transformers/customizeItemFacets', {
    '../custom/productHelper': {
        getCategoryID: function(product) {
            return 'men-clothing-outerwear';
        }
    }
});

var mockedData = {
    minListPrice: 200,
    maxSalePrice: 175,
    maxListPrice: 300,
    minSalePrice: 150,
    itemFacets: [
        {
            key: 'gearLine',
            value: 'N/A'
        },
        {
            key: 'subsubsilhouette',
            value: 'Soft Shell'
        }
    ],
    searchRefinements: [
        {
            key: 'experienceType',
            value: ['Premium','Outlet']
        },
        {
            key: 'collection',
            value: ['Ridge Reaper']
        }
    ]
};

describe('getItemFacets Function', function() {
    it('should return an array of objects representing custom facets', function() {
        var mockedProduct = {
            ID: 1316724
        };

        var response = [
            {
                key: 'categoryID',
                value: 'men-clothing-outerwear'
            },
            {
                key: 'listPriceLow',
                value: 200
            },
            {
                key: 'listPriceHigh',
                value: 300
            },
            {
                key: 'salePriceLow',
                value: 150
            },
            {
                key: 'salePriceHigh',
                value: 175
            },
            {
                key: 'gearLine',
                value: 'N/A'
            },
            {
                key: 'subsubsilhouette',
                value: 'Soft Shell'
            },
            {
                key: 'experienceType',
                value: ['Premium','Outlet']
            },
            {
                key: 'collection',
                value: ['Ridge Reaper']
            }
        ];

        const result = customizeItemFacets.getItemFacets(mockedProduct, mockedData);

        expect(result).to.be.an('array');
        expect(result).to.deep.equal(response);
    });

    it('should return an array of numbers for salePriceLow', function() {
        var mockedProduct = {
            ID: 'GC-0001-ALL'
        };

        var response = [
            {
                key: 'categoryID',
                value: 'men-clothing-outerwear'
            },
            {
                key: 'listPriceLow',
                value: 200
            },
            {
                key: 'listPriceHigh',
                value: 300
            },
            {
                key: 'salePriceLow',
                value: [10, 30, 70, 80, 110, 210]
            },
            {
                key: 'salePriceHigh',
                value: 175
            },
            {
                key: 'gearLine',
                value: 'N/A'
            },
            {
                key: 'subsubsilhouette',
                value: 'Soft Shell'
            },
            {
                key: 'experienceType',
                value: ['Premium','Outlet']
            },
            {
                key: 'collection',
                value: ['Ridge Reaper']
            }
        ];

        const result = customizeItemFacets.getItemFacets(mockedProduct, mockedData);
        expect(result).to.deep.equal(response);
    });
});