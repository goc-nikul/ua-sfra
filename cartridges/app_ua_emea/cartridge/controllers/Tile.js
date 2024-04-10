'use strict'; /* eslint-disable prefer-const */

var server = require('server');
server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    var productHelper = require('*/cartridge/scripts/helpers/ProductHelper');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var ProductMgr = require('dw/catalog/ProductMgr');
    let viewData = res.getViewData();
    if (viewData && 'display' in viewData && 'swatches' in viewData.display && viewData.display.swatches === false) {
        var defaultSelectedColor = (viewData.product.swatches && viewData.product.swatches.values && viewData.product.swatches.values.length > 0) ? viewData.product.swatches.values[0].id : '';
        if (viewData.product.images && viewData.product.images.selectedColor && !empty(viewData.product.images.selectedColor.color)) {
            defaultSelectedColor = viewData.product.images.selectedColor.color;
        }

        var product = ProductMgr.getProduct(viewData.product.id);
        if (product && product.isMaster()) {
            var variantProduct = productHelper.getVariantForColor(product, defaultSelectedColor);
            let productTileParams = { pview: 'tile' };
            productTileParams.pid = variantProduct.ID;
            var priceProduct = ProductFactory.get(productTileParams);
            viewData.product.price = priceProduct.price;
        }
    }
    res.setViewData(viewData);
    next();
});
/* eslint-enable prefer-const */
module.exports = server.exports();
