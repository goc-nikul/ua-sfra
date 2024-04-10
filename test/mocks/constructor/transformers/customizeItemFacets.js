'use strict';

var productHelper = require('../custom/productHelper');

function getItemFacets(product, data) {
    var facets = [
        {
            key: 'categoryID',
            value: productHelper.getCategoryID(product)
        },
        {
            key: 'listPriceLow',
            value: data.minListPrice
        },
        {
            key: 'listPriceHigh',
            value: data.maxListPrice
        },
        {
            key: 'salePriceLow',
            value: product.ID === 'GC-0001-ALL' ? [10, 30, 70, 80, 110, 210] : data.minSalePrice
        },
        {
            key: 'salePriceHigh',
            value: data.maxSalePrice
        }
    ];

    // add simple product attribute values to facets
    facets.push.apply(facets, Array.from(data.itemFacets));

    // add search refinement values to facets
    facets.push.apply(facets, Array.from(data.searchRefinements));
    return facets;
}

module.exports.getItemFacets = getItemFacets;
