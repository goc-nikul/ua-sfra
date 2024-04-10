/* eslint-disable no-param-reassign */

var customizeProductData = require('int_constructor_custom_legacy/cartridge/scripts/transformers/customizeProductData');
var customizeVariationMetadata = require('int_constructor_custom_legacy/cartridge/scripts/transformers/customizeVariationMetadata');
var customizeVariationFacets = require('int_constructor_custom_legacy/cartridge/scripts/transformers/customizeVariationFacets');
var customizeItemMetadata = require('int_constructor_custom_legacy/cartridge/scripts/transformers/customizeItemMetadata');
var customizeItemFacets = require('int_constructor_custom_legacy/cartridge/scripts/transformers/customizeItemFacets');

/**
 * This function is responsible for transforming the product data into the format
 * that will be written to the final catalog files before sending it to the
 * Constructor API, and into a format that is understood by our API.
 *
 * NOTE: You should not modify this file. If you need to customize any piece of catalog
 * data, look for the `customize` functions in this folder.
 *
 * @param {*} product The product.
 * @param {Object} data Product and feed data.
 * @returns {*} The transformed data.
 */
function transformProduct(product, data) {
    var productData = customizeProductData.getProductData(product, data);

    if (productData.parentId) {
        productData.metadata = customizeVariationMetadata.getVariationMetadata(product, productData);
        productData.facets = customizeVariationFacets.getVariationFacets(product, productData);
    } else {
        productData.metadata = customizeItemMetadata.getItemMetadata(product, productData);
        productData.facets = customizeItemFacets.getItemFacets(product, productData);
    }

    return productData;
}

module.exports.transformProduct = transformProduct;
