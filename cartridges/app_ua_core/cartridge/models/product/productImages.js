'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var Site = require('dw/system/Site');
var ArrayList = require('dw/util/ArrayList');

/**
 * @constructor
 * @classdesc Returns images for a given product
 * @param {dw.catalog.Product} productObject - product to return images for
 * @param {Object} imageConfig - configuration object with image types
 * @param {string} fitModelViewPreference - selected FitModel view Preference
 */
function Images(productObject, imageConfig, fitModelViewPreference) {
    var product = productObject;
    var fitModelImages = new ArrayList();
    var imageViewType = null;
    var isFitModelImage = false;
    var modelSpec = {};
    if (product instanceof dw.catalog.ProductVariationModel) {
        if (product.selectedVariant) {
            product = product.selectedVariant.variationModel;
        } else if (product.defaultVariant && !product.selectedVariants.length) {
            product = product.defaultVariant.variationModel;
        }
    }
    if (Site.current.getCustomPreferenceValue('enableModelSpec')) {
        modelSpec = productHelper.getSelectedModelSpecObj(product);
    }
    if (Site.current.getCustomPreferenceValue('enableFitModels') && !empty(fitModelViewPreference)) {
        var mstrProduct = product instanceof dw.catalog.ProductVariationModel ? product.getMaster() : product;
        var productHasSizeModel = mstrProduct && 'hasSizeModel' in mstrProduct.custom ? mstrProduct.custom.hasSizeModel : false;
        if (productHasSizeModel) {
            imageViewType = productHelper.sizeModelImagesMapping(fitModelViewPreference);
        }
        if (!empty(imageViewType)) {
            fitModelImages = product.getImages(imageViewType);
        }
        isFitModelImage = !empty(fitModelImages) && fitModelImages.length > 0;
    }
    imageConfig.types.forEach(function (type) {
        var images = isFitModelImage ? fitModelImages : product.getImages(type);
        var result = {};
        var isPdpMainDesktopType = false;
        if (type === 'pdpMainDesktop') {
            isPdpMainDesktopType = true;
        }
        var recipeFitModelPDP = productHelper.recipeForPDPSizeModelImage(type);
        if (images.empty || (isFitModelImage && type === 'pdpMainMobile')) {
            var Resource = require('dw/web/Resource');
            var url = productHelper.getNoImageURL(type);
            result = [{
                alt: 'No image, gridTileDesktop',
                url: url,
                title: 'No image',
                index: '0',
                noImgAlt: Resource.msg('image.unavailable', 'product', null),
                absURL: url
            }];
        } else if (imageConfig.quantity === 'single') {
            var firstImage = collections.first(images);
            if (firstImage) {
                result = [{
                    alt: isFitModelImage ? firstImage.URL + '' + recipeFitModelPDP : firstImage.alt,
                    url: firstImage.URL.toString(),
                    title: firstImage.title,
                    index: '0',
                    absURL: isFitModelImage ? firstImage.absURL + '' + recipeFitModelPDP : firstImage.absURL.toString(),
                    modelSpec: isPdpMainDesktopType && Object.keys(modelSpec).length > 0 ? productHelper.getImageSpecificModelSpec(modelSpec, firstImage.absURL.toString()) : {}
                }];
            }
        } else {
            result = collections.map(images, function (image, index) {
                return {
                    alt: image.alt,
                    url: isFitModelImage ? image.URL + '' + recipeFitModelPDP : image.URL.toString(),
                    index: index.toString(),
                    title: image.title,
                    absURL: isFitModelImage ? image.absURL + '' + recipeFitModelPDP : image.absURL.toString(),
                    modelSpec: isPdpMainDesktopType && Object.keys(modelSpec).length > 0 ? productHelper.getImageSpecificModelSpec(modelSpec, image.absURL.toString()) : {}
                };
            });
        }
        this[type] = result;
    }, this);
}

module.exports = Images;
