/**
 * Module provides utility methods to prepare data for Shoplinker
 * @module scripts/util/ShoplinkerHelper
 * @type {object}
 */

/* Script Modules */
const ArrayList = require('dw/util/ArrayList');
const Resource = require('dw/web/Resource');
const ProductMgr = require('dw/catalog/ProductMgr');

/**
 * Returns DW product instance for provided Material ID
 *
 * @param {string} materialID - Shoplinker Material ID
 * @returns {dw.catalog.Product} DW product instance
 */
function getProductForMaterial(materialID) {
    const styleColor = materialID.split('-');
    const productID = styleColor[0];

    return ProductMgr.getProduct(productID);
}

/**
 * Returns a collection of master product variants filtered by a color attribute for
 * provided Material ID (master product ID and color ID)
 *
 * @param {string} materialID - Shoplinker Material ID
 * @returns {dw.util.Collection} Product variants
 */
function getVariantsForMaterial(materialID) {
    const styleColor = materialID.split('-');
    const productColor = styleColor[1];
    const product = getProductForMaterial(materialID);
    const allVariants = product.getVariants().iterator();
    let variantsForColor = new ArrayList();

    while (allVariants.hasNext()) {
        let variant = allVariants.next();

        if (variant.custom.color === productColor) {
            variantsForColor.push(variant);
        }
    }

    return variantsForColor;
}

/**
 * Returns product's color display value
 * from colorway or colorgroup custom properties
 *
 * @param {dw.catalog.Product} product - Shoplinker Material ID
 * @returns {string} Color display value
 */
function getColorValue(product) {
    let colorValue = null;

    if (!empty(product.custom.colorway)) {
        // Regex matches all word characters till '/' character not including possible whitespace before it.
        // E.g. patterns like 'True Gray Heather' in 'True Gray Heather /  / Black'.
        const regex = new RegExp(/^\w+(?:\s?\w+)*(?=\s?\/)/i);
        colorValue = regex.exec(product.custom.colorway);
        colorValue = !empty(colorValue) ? colorValue[0] : product.custom.colorgroup;
    } else {
        colorValue = product.custom.colorgroup;
    }

    return colorValue;
}

/**
 * Returns a string with size values(display) separated by comma for
 * provided Material ID (master product ID and color ID)
 *
 * @param {string} materialID - Shoplinker Material ID
 * @returns {string} Display values for sizes
 */
function getSizesForMaterial(materialID) {
    const product = getProductForMaterial(materialID);
    const pvm = product.getVariationModel();
    const pva = pvm.getProductVariationAttribute('size');
    const materialSizes = [];
    const variants = getVariantsForMaterial(materialID).iterator();

    while (variants.hasNext()) {
        let variant = variants.next();
        let sizeVAValue = pvm.getVariationValue(variant, pva);
        let sizeValue = !empty(sizeVAValue) ? sizeVAValue.getDisplayValue() : variant.custom.size;
        let sizeDisplayValue = Resource.msg('addtobag.size.' + sizeValue, 'checkout', sizeValue);

        materialSizes.push(sizeDisplayValue);
    }

    return materialSizes.join(',');
}

/**
 * Returns a string with color value(display) for
 * provided Material ID (master product ID and color ID)
 *
 * @param {string} materialID - Shoplinker Material ID
 * @returns {string} Display value for color
 */
function getColorNameForMaterial(materialID) {
    const product = getProductForMaterial(materialID);
    const pvm = product.getVariationModel();
    const pva = pvm.getProductVariationAttribute('color');
    const variants = getVariantsForMaterial(materialID);
    const variantIterator = variants.iterator();
    let colorDisplayValue = null;

    while (variantIterator.hasNext()) {
        let variant = variantIterator.next();
        let colorAttrValue = pvm.getVariationValue(variant, pva);

        if (!empty(colorAttrValue)) {
            colorDisplayValue = colorAttrValue.getDisplayValue();
            break;
        }
    }

    if (empty(colorDisplayValue)) {
        colorDisplayValue = getColorValue(variants[0]);
    }

    return colorDisplayValue;
}

/**
 * Returns text of rendered material description template with stripped
 * newline and carriage return characters.
 *
 * @param {dw.catalog.Product} product - DW product instance
 * @param {Object} productImages - productImages
 * @returns {string} Rendered template text
 */
function getMaterialDescriptionText(product, productImages) {
    const Template = require('dw/util/Template');
    const HashMap = require('dw/util/HashMap');
    const System = require('dw/system/System');
    const template = new Template('components/materialdescription');
    const s7BaseURL = System.getPreferences().getCustom()['scene7CDNUrl']; // eslint-disable-line dot-notation
    const params = new HashMap();
    params.put('product', product);
    params.put('productImages', productImages);
    params.put('s7BaseURL', s7BaseURL);
    // Delete newline and carriage return characters from the template text
    return template.render(params).getText().replace(/[\n\r]/g, '');
}

/**
 * Returns an arrayList of images to be sent to shoplinker for a specific material
 *
 * @param {dw.util.Collection} variants Product
 * @returns {dw.util.ArrayList} Shoplinker image data
 */
function getImagesForMaterial(variants) {
    let images = null;
    var productImages = new ArrayList();

    while (variants.hasNext()) {
        let variant = variants.next();
        images = variant.getImages('pdpMainDesktop');

        if (images.getLength()) {
            break;
        }
    }

    if (images && images.length) {
        const imageIterator = images.iterator();
        // The first image is used as main PDP image
        // and must have 'type' value as IMG1
        const pdpImage = imageIterator.next();
        productImages.push({
            type: 'IMG1',
            URL: pdpImage.httpsURL.toString() + '&jpg'
        });

        // Rest of the images are used as gallery product images
        // and must have 'type' values as IMG6...IMG12'
        let counter = 6;
        while (imageIterator.hasNext() && counter <= 12) {
            let galeryImage = imageIterator.next();

            productImages.push({
                type: 'IMG' + counter,
                URL: galeryImage.httpsURL.toString() + '&jpg'
            });

            counter++;
        }
    }

    return productImages;
}

module.exports = {
    getSizesForMaterial: getSizesForMaterial,
    getColorNameForMaterial: getColorNameForMaterial,
    getProductForMaterial: getProductForMaterial,
    getVariantsForMaterial: getVariantsForMaterial,
    getColorValue: getColorValue,
    getMaterialDescriptionText: getMaterialDescriptionText,
    getImagesForMaterial: getImagesForMaterial
};
