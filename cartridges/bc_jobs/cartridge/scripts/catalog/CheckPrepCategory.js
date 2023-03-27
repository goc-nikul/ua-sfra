/*
 * Check Prep Category
 * Check the prep-catory for any products and return
 * custom ok status to stop job from continuing
 */
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');
var CatalogMgr = require('dw/catalog/CatalogMgr');

function checkPrepCategoryForProducts(params) {
    try {
        // Grab the products in the prep-category or prep-image category for current site assignment
        var prepCategoryForProducts = !empty(params.prepImageCategoryID) ? params.prepImageCategoryID : 'prep-category';
        var prepCategory = CatalogMgr.getCategory(prepCategoryForProducts);
        var products = prepCategory ? prepCategory.getProducts() : [];

        // Return custom status to exit the job if there are no products in the prep category
        if (products.length === 0) {
            return new Status(Status.OK, 'NOPRODUCTS');
        }

        return;

    } catch (e) {
        Logger.error("CheckPrepCategory.js: " + e);
        return new Status(Status.ERROR);
    }
}

/* Exported methods*/
module.exports = {
    checkPrepCategoryForProducts: checkPrepCategoryForProducts
};
