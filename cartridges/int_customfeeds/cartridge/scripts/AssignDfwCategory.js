/*
 * Assign dfwCategory
 * Assigns dfwCategory custom attribute to products
 */

let Logger = require('dw/system/Logger'),
    CatalogMgr = require('dw/catalog/CatalogMgr');

function assignDfwCategoryToProducts() {
    try {
        // get products in prep-category
        var products = CatalogMgr.getCategory('prep-category').getProducts().iterator();

        while (products.hasNext()) {
            let product = products.next(),
                lowestCategory;
            product = product.isMaster() ? product : product.masterProduct;

            if (!empty(product.custom.dfwCategory)) {
                continue;
            }

            let categories = product.getOnlineCategories().toArray(),
                parentsCountMax = 0;

            function newParent(catParent, parentsCount, cat) {
                if (catParent.parent != null) {
                    parentsCount++;
                    newParent(catParent.parent, parentsCount, cat);
                } else if (parentsCount >= parentsCountMax) {
                    parentsCountMax = parentsCount;
                    lowestCategory = cat;
                }
            }

            for (let i = categories.length - 1; i >= 0; i--) {
                var parentsCount = 0;
                var parent = categories[i].parent;
                if (!empty(parent)) {
                    parentsCount++;
                    newParent(parent, parentsCount, categories[i]);
                }
            }

            if (!empty(lowestCategory)) {
                product.custom.dfwCategory = lowestCategory.getID();
            }
        }

    } catch(e) {
        Logger.error("AssignDfwCategory.js: " + e);
        return;
    }

}

/* Exported methods*/
module.exports = {
        assignDfwCategoryToProducts: assignDfwCategoryToProducts
};