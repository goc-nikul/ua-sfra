'use strict';

var superModule = module.superModule;

superModule.prototype.generateItemImageURL = function (li) {
    var url = '';
    var product = null;
    if (li.optionProductLineItem) {
        product = (li.parent.getProduct());
    } else {
        product = (li.getProduct());
    }
    // eslint-disable-next-line
    if (product instanceof dw.catalog.ProductVariationModel) {
        if (product.selectedVariant) {
            product = product.selectedVariant.variationModel;
        } else if (product.defaultVariant && !product.selectedVariants.length) {
            product = product.defaultVariant.variationModel;
        }
    }
    var ImageModel = require('*/cartridge/models/product/productImages');
    var images = new ImageModel(product, { types: ['cartFullDesktop'], quantity: 'single' });
    if (images && images.cartFullDesktop) {
        var firstImage = images.cartFullDesktop[0];
        url = firstImage.url;
    }

    return url;
};

module.exports = superModule;
