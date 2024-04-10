'use strict';

/**
 * @constructor
 * @classdesc Returns the selected color else the color of default/first variant available
 * @param {dw.catalog.Product} productObject - product to return selected color
 * @param {dw.catalog.Product} colorObject - selected color object
 */
function getSelectedColor(productObject, colorObject) {
    const product = productObject;
    /* istanbul ignore next */
    if (product === null) {
        // Not possible to reach here because it would have thrown error before reaching this
        return null;
    }
    const variationModel = product.variationModel;
    const currentVariationModel = product.isVariant()
        ? product.masterProduct.variationModel
        : product.variationModel;

    let selectedColor = null;
    const colorVA = variationModel.getProductVariationAttribute('color');
    if (colorVA === null) {
        return null;
    }

    selectedColor = variationModel.getSelectedValue(colorVA);
    if (!selectedColor) {
        selectedColor =
            !empty(colorObject) && !empty(colorObject.color)
                ? colorObject.color
                : selectedColor;
    }

    if (selectedColor) {
        return selectedColor;
    }

    let variant = product;

    /* istanbul ignore else */
    if (!product.isVariant()) {
        if (variationModel.defaultVariant) {
            variant = variationModel.defaultVariant;
            /* istanbul ignore else */
        } else if (variationModel.variants.length > 0) {
            variant = variationModel.variants[0];
        }
    }

    let cv = variationModel.getVariationValue(variant, colorVA);
    if (!currentVariationModel.hasOrderableVariants(colorVA, cv)) {
        for (let i = 0, il = variationModel.variants.length; i < il; i++) {
            cv = currentVariationModel.getVariationValue(
                variationModel.variants[i],
                colorVA
            );

            /* istanbul ignore if */
            if (currentVariationModel.hasOrderableVariants(colorVA, cv)) {
                break;
            }
        }
    }
    return cv;
}

/**
 * @constructor
 * @classdesc Returns video material for a given product
 * @param {dw.catalog.Product} productObject - product to return video material for
 * @param {dw.catalog.Product} colorObject - selected color object
 * @param {Object} images - product images
 */
module.exports = function ProductVideoMaterial(
    productObject,
    colorObject,
    images
) {
    const product = productObject;
    let masterID = null;

    let video360Material = [];
    try {
        if (product.isVariant()) {
            masterID = product.custom.style
                ? product.custom.style
                : product.masterProduct.ID;
        } else {
            masterID = product.ID;
        }

        const selectedColor = getSelectedColor(product, colorObject);
        const product360Videos = product.custom.videoMaterials;
        const videoMaterials = !empty(product360Videos)
            ? product360Videos.split(',')
            : product360Videos;
        if (product.custom.division === 'Footwear') {
            if (!empty(product360Videos)) {
                for (let i = 0; i < videoMaterials.length; i++) {
                    let colorLink = videoMaterials[i].split('|');
                    if (colorLink[0] !== selectedColor.value) {
                        continue; // eslint-disable-line no-continue
                    }
                    const posterUrl =
                        images &&
                        images.pdpMainDesktop &&
                        images.pdpMainDesktop[0]
                            ? images.pdpMainDesktop[0].url
                            : 'https://underarmour.scene7.com/is/image/Underarmour/' +
                              masterID +
                              '-' +
                              selectedColor.value +
                              '_DEFAULT?bgc=f0f0f0&wid=640&hei=480&size=550,460';
                    video360Material.push({
                        poster_url: posterUrl,
                        video_url_mp4:
                            'https://underarmour.scene7.com/is/content/Underarmour/auto_dim7_' +
                            masterID +
                            '-' +
                            selectedColor.value +
                            '-0x480-300k',
                        masterID_selectedColor:
                            masterID + '-' + selectedColor.value
                    });
                }
            }
        }
        return video360Material;
    } catch (e) {
        return video360Material;
    }
};
