'use strict';

module.exports.RemoveBadgesFromAllVariants = function (params) {
    var Logger = require('dw/system/Logger').getLogger('RemoveBadgesFromAllVariants');
    var Status = require('dw/system/Status');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var Transaction = require('dw/system/Transaction');
    var locales = !empty(params) && !empty(params.locales) ? params.locales.split(',') : ['default'];
    var locale;
    try {
        var allSiteProducts = ProductMgr.queryAllSiteProducts();
        var product;
        var variationProduct;
        var variantsCollection;
        while (allSiteProducts.hasNext()) {
            product = allSiteProducts.next();
            if (product.isMaster()) {
                variantsCollection = product.getVariants().iterator();
                while (variantsCollection.hasNext()) {
                    variationProduct = variantsCollection.next();
                    Transaction.wrap(function () {
                        // Loop through all the configured locales as attribute "productTileUpperLeftBadge" is localized.
                        for (var i = 0; i < locales.length; i++) {
                            locale = locales[i].trim();
                            if (locale.length > 0) { // check if it contains at least 1 or more characters after removing white space characters at the start and the end of the string.
                                request.setLocale(locale);
                            }
                            if ('productTileUpperLeftBadge' in variationProduct.custom && !empty(variationProduct.custom.productTileUpperLeftBadge)) {
                                variationProduct.custom.productTileUpperLeftBadge = '';
                            }
                        }
                        if ('productTileBottomLeftBadge' in variationProduct.custom && !empty(variationProduct.custom.productTileBottomLeftBadge)) {
                            variationProduct.custom.productTileBottomLeftBadge = '';
                        }
                    });
                }
            }
        }
    } catch (e) {
        Logger.error('{0}:{1}: {2} ({3}:{4}) \n{5}', 'Error in RemoveBadgesFromAllVariants.js', e.name, e.message, e.fileName, e.lineNumber, e.stack);
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
}
