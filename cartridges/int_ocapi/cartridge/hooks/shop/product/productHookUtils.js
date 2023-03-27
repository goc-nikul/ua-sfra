'use strict';

const Site = require('dw/system/Site');
const URLUtils = require('dw/web/URLUtils');

/**
 * Get product url
 * @param {Object} product - Current product
 * @returns {string} - Url of the product
 *
 * @param {dw.catalog.Product} - category to be checked if it loyalty
**/
function getProductUrl(product) {
    const productUrl = URLUtils.url('Product-Show', 'pid', product.ID).toString();
    const siteId = Site.getCurrent().getID();
    const sitePattern = '/s/' + siteId;
    // eslint-disable-next-line no-undef
    const localePattern = '/' + request.getLocale().toLowerCase().replace('_', '-');
    return productUrl.replace(sitePattern, '').replace(localePattern, '');
}

/**
 * Get Beautify Selected Feature And Benifits
 * @param {Object} product - Current product
 * @returns {Array} - Array of the objects
 *
 * @param {dw.catalog.Product} - Beautify Enum in OCAPI Response
**/
function beautifySelectedFeatureAndBenifits(product) {
    var icons = product.custom.icons;
    if (icons.length > 0) {
        var icon;
        var iconDisplayValue;
        var iconValue;
        var iconsList = [];
        for (var i = 0; i < icons.length; i++) {
            icon = icons[i];
            iconDisplayValue = icon.displayValue;
            iconValue = icon.value;

            if (!empty(iconDisplayValue) && !empty(iconValue)) {
                iconsList.push({
                    displayValue: iconDisplayValue,
                    value: iconValue
                });
            }
        }
        return iconsList;
    }
    return [];
}

module.exports = {
    getProductUrl: getProductUrl,
    beautifySelectedFeatureAndBenifits: beautifySelectedFeatureAndBenifits
};
