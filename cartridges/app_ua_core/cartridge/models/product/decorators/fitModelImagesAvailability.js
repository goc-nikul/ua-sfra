'use strict';

var Site = require('dw/system/Site');

/**
 * @description returns object, fitModel availability status used on PDP
 * @param {dw.catalog.Product} productObject - product object
 * @returns {Object} result - fitModel availability status
 */
var fitModelImageAvailability = function (productObject) {
    var product = productObject;
    var productHasSizeModel = false;
    var result = {};
    if (product instanceof dw.catalog.ProductVariationModel) {
        if (product.selectedVariant) {
            product = product.selectedVariant.variationModel;
        } else if (product.defaultVariant && !product.selectedVariants.length) {
            product = product.defaultVariant.variationModel;
        }
    }
    if (Site.current.getCustomPreferenceValue('enableFitModels')) {
        var masterProduct = product instanceof dw.catalog.ProductVariationModel ? product.getMaster() : product;
        if (masterProduct && 'hasSizeModel' in masterProduct.custom) {
            productHasSizeModel = masterProduct.custom.hasSizeModel;
        }
        if (productHasSizeModel) {
            var fitModelImageViewTypes = ['sizeModelXS', 'sizeModelSM', 'sizeModelMD', 'sizeModelLG', 'sizeModelXL', 'sizeModelXXL'];
            var fitModelViewTypes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
            var count = 0;
            var fitModelImageViewType = {};
            for (var i = 0; i < fitModelImageViewTypes.length; i++) {
                var fitModelimages = product.getImages(fitModelImageViewTypes[i]);
                var fitModelViewType = fitModelViewTypes[i];
                if (fitModelimages.length > 0) {
                    fitModelImageViewType[fitModelViewType] = true;
                } else {
                    fitModelImageViewType[fitModelViewType] = false;
                    count++;
                }
            }
            result.fitModelImageViewType = fitModelImageViewType;
            result.fitModelAvailable = (fitModelImageViewTypes.length === count) ? false : true; // eslint-disable-line
        }
    }
    return result;
};

module.exports = function (object, product) {
    Object.defineProperty(object, 'fitModelImagesAvailability', {
        enumerable: true,
        writable: true,
        value: fitModelImageAvailability(product)
    });
};
