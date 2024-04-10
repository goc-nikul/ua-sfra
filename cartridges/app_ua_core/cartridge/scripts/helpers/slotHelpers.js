'use strict';

const ProductSearchModel = require('dw/catalog/ProductSearchModel');

/**
 * Get product search hit for a given product
 * @param {dw.catalog.Product} apiProduct - Product instance returned from the API
 * @returns {dw.catalog.ProductSearchHit} - product search hit for a given product
 */
function getProductSearchHit(apiProduct) {
    const searchModel = new ProductSearchModel();
    searchModel.setSearchPhrase(apiProduct.ID);
    searchModel.search();

    if (searchModel.count === 0) {
        searchModel.setSearchPhrase(apiProduct.ID.replace(/-/g, ' '));
        searchModel.search();
    }

    let hit = searchModel.getProductSearchHit(apiProduct);
    if (!hit) {
        if (searchModel.getProductSearchHits().hasNext()) {
            const tempHit = searchModel.getProductSearchHits().next();
            if (tempHit.firstRepresentedProductID === apiProduct.ID) {
                hit = tempHit;
            }
        }
    }
    return hit;
}

module.exports = {
    getProductSearchHit: getProductSearchHit
};
