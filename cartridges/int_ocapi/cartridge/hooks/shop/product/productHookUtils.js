'use strict';

var Site = require('dw/system/Site');
const URLUtils = require('dw/web/URLUtils');
var Logger = require('dw/system/Logger');
var Calendar = require('dw/util/Calendar');

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

/**
 * map and format tags
 * @param {Array} metaTags - Current product or variant metatags
 * @returns {Array} - mapped and formatted tags
 *
**/
function mapAndFormatTags(metaTags) {
    if (metaTags.length > 0) {
        const formattedMetaTags = [];
        metaTags.forEach(function (tag) {
            formattedMetaTags.push({
                ID: tag.ID,
                name: tag.name,
                property: tag.property,
                title: tag.title,
                content: tag.content
            });
        });
        return formattedMetaTags;
    }
    return [];
}

/**
 * @param  {promotions} promotions - PromotionMgr product promotions
 * @returns {Array} - array in format for OCAPI c_productPromotions custom property
 */
function mapProductPromotions(promotions) {
    var productPromotions = [];
    for (var j = 0; j < promotions.length; j++) {
        try {
            productPromotions.push({
                _type: promotions[j].promotionClass.toLowerCase() + '_promotion', // product_promotion or order_promotion or shipping_promotion
                callout_msg: !empty(promotions[j].calloutMsg) ? promotions[j].calloutMsg.markup : '',
                promotion_id: promotions[j].ID,
                tooltip: !empty(promotions[j].details) ? promotions[j].details.markup : ''
            });
        } catch (e) {
            Logger.warn('Error mapping product promotion ' + promotions[j].ID + ', check for invalid or incomplete promotion setup.');
        }
    }
    return productPromotions;
}

/**
 * @param {Object} entry Product color info
 * @param {Array} arr Array of Product color info
 * @returns {boolean} - arr contains duplicate value of entry
 */
function isDuplicate(entry, arr) {
    return arr.some(x => (entry.color === x.color));
}

/**
 * Finds an existing entry by color
 * @param {string} color Product color
 * @param {Array} arr Array of Product color info
 * @returns {Object | undefined} - arr contains duplicate entry
 */
function getDuplicate(color, arr) {
    return arr.find((c) => { return c.color === color; });
}

/**
 * Checks if the product color is new based on the activation interval
 * @param {Object} product Product object
 * @param {number} interval - Number of days to consider a color new
 * @returns {boolean} - true if the color is new, false otherwise
 */
function isNewColor(product, interval) {
    try {
        // get the activation date from the product custom attributes colorActivationDate or shipmentstartdate
        var activationDate = null;
        if (!empty(product.custom.colorActivationDate)) {
            activationDate = new Date(product.custom.colorActivationDate);
        } else if (!empty(product.custom.shipmentstartdate)) {
            activationDate = new Date(product.custom.shipmentstartdate);
        }

        if (!empty(activationDate)) {
            const cal = new Calendar();
            const difference = (cal.time - activationDate) / (1000 * 3600 * 24);
            // if the difference between the activation date and today is less than or equal to the interval, then the color is new
            if (Math.floor(difference) <= interval) {
                return true;
            }
        }
    } catch (e) {
        Logger.warn(`Error getting new color info for product ${product.ID}, check for invalid colorActivationDate or shipmentstartdate.`);
    }
    return false;
}

/**
 * Maps product variants to colors
 * @param {Array} productVariants Array of product variants
 * @returns {Array} - arr contains variant colors
 */
function mapVariantColors(productVariants) {
    var cVariantColors = [];
    var activationInterval = Site.getCurrent().getCustomPreferenceValue('newColorsActivationInterval') || 45;
    var isEmphasizeNewColorsEnabled = Site.getCurrent().getCustomPreferenceValue('isEmphasizeNewColorsEnabled') || false;
    for (var x = 0; x < productVariants.length; x++) {
        var entry = {
            color: productVariants[x].custom.color,
            colorway: productVariants[x].custom.colorway,
            hex: productVariants[x].custom.hexcolor,
            secondaryHex: productVariants[x].custom.secondaryhexcolor,
            team: productVariants[x].custom.team,
            isLoyaltyExclusiveColor: productVariants[x].custom.isLoyaltyExclusive,
            newColor: isEmphasizeNewColorsEnabled ? isNewColor(productVariants[x], activationInterval) : false
        };
        if (!isDuplicate(entry, cVariantColors)) {
            cVariantColors.push(entry);
        } else {
            var existingEntry = getDuplicate(entry.color, cVariantColors);
            if (entry.isLoyaltyExclusiveColor === true) {
                // Take true value if previously set at least once
                existingEntry.isLoyaltyExclusiveColor = true;
            }
            if (entry.newColor === true) {
                existingEntry.newColor = true;
            }
        }
    }
    return cVariantColors;
}

module.exports = {
    getProductUrl: getProductUrl,
    beautifySelectedFeatureAndBenifits: beautifySelectedFeatureAndBenifits,
    mapAndFormatTags: mapAndFormatTags,
    mapProductPromotions: mapProductPromotions,
    mapVariantColors: mapVariantColors
};
