'use strict';

const PRODUCT_PERSONALIZATION_OPTION_ID = 'personalizations';
const CUSTOM_OBJECT_PERSONALIZATION = 'ProductPersonalization';

var Transaction = require('dw/system/Transaction');

/**
 * Fetch product option
 * @param {Object} apiProduct DW product object
 * @returns {Object} get product option
 */
function getProductOption(apiProduct) {
    if (!apiProduct.optionModel) return null;
    var option = apiProduct.optionModel.getOption(PRODUCT_PERSONALIZATION_OPTION_ID);
    if (!option && !apiProduct.master && apiProduct.masterProduct && apiProduct.masterProduct.optionModel) option = apiProduct.masterProduct.optionModel.getOption(PRODUCT_PERSONALIZATION_OPTION_ID);
    return option;
}

/**
 * Validates current product is eligible for product customization
 * @param {Object} apiProduct DW product object
 * @returns {boolean} returns whether current product is eligible for product customization
 */
function isPersonalizationEligible(apiProduct) {
    return !!getProductOption(apiProduct);
}

/**
 * Get Product Personalized custom object
 * @param {Object} apiProduct DW Product Object
 * @returns {Object} custom object
 */
function getCustomObject(apiProduct) {
    var Site = require('dw/system/Site').current;
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var customObj = CustomObjectMgr.getCustomObject(CUSTOM_OBJECT_PERSONALIZATION, Site.ID + '_' + apiProduct.ID);
    if (!customObj && !apiProduct.master && apiProduct.masterProduct) {
        customObj = CustomObjectMgr.getCustomObject(CUSTOM_OBJECT_PERSONALIZATION, Site.ID + '_' + apiProduct.ID + '-' + apiProduct.custom.color);
        if (!customObj) customObj = CustomObjectMgr.getCustomObject(CUSTOM_OBJECT_PERSONALIZATION, Site.ID + '_' + apiProduct.masterProduct.ID);
        if (!customObj) customObj = CustomObjectMgr.getCustomObject(CUSTOM_OBJECT_PERSONALIZATION, Site.ID + '_' + (apiProduct.masterProduct.ID + '-' + apiProduct.custom.color));
    }
    return customObj;
}

/**
 * Update Product line item for product personlization
 * @param {string} uuid lineItem's UUID
 * @param {string} productID productID
 * @param {Object} formData request form
 */
function updateProductLineItem(uuid, productID, formData) {
    var currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
    if (currentBasket) {
        var pli = require('*/cartridge/scripts/util/collections').find(currentBasket.getProductLineItems(productID), (lineItem) => {
            return lineItem.UUID === uuid;
        });
        if (pli && isPersonalizationEligible(pli.product)) {
            Transaction.wrap(() => {
                pli.custom.jerseyName = (formData.personalizationName) ? 'Yes' : 'No';
                pli.custom.jerseyNameText = formData.personalizationName || '';
                pli.custom.jerseyNumber = (formData.personalizationNumber) ? 'Yes' : 'No';
                pli.custom.jerseyNumberText = formData.personalizationNumber || '';
                pli.custom.sponsors = (formData.personalizationSponsors && formData.personalizationSponsors === 'Yes') ? 'Yes' : 'No';
            });
        }
    }
}

/**
 * Ensure lineitems of same details should not create multiple lineitem
 * @param {string} productID Product ID
 * @returns {null|Object} returns null or updated cart model
 */
function ensureProductQuantities(productID) {
    var Basket = require('dw/order/BasketMgr').getCurrentBasket();
    if (!Basket) return null;
    let sameProductLineItems = (productID ? Basket.getAllProductLineItems(productID) : Basket.getAllProductLineItems()).toArray();
    if (sameProductLineItems.length > 1) {
        sameProductLineItems.map((previousLineItem, index, arr) => { // eslint-disable-line
            arr.forEach((currentLineItem) => {
                var prevName = 'jerseyNameText' in previousLineItem.custom && previousLineItem.custom.jerseyNameText
                    ? previousLineItem.custom.jerseyNameText.toUpperCase()
                    : '';
                var currentName = 'jerseyNameText' in currentLineItem.custom && currentLineItem.custom.jerseyNameText
                    ? currentLineItem.custom.jerseyNameText.toUpperCase()
                    : '';
                var isSameJerseyName = prevName === currentName;
                var isSameJerseyNumber = previousLineItem.custom.jerseyNumberText === currentLineItem.custom.jerseyNumberText;
                var isSameJerseySponsors = previousLineItem.custom.sponsors === currentLineItem.custom.sponsors;

                if (isSameJerseyName && isSameJerseyNumber && isSameJerseySponsors && previousLineItem.UUID !== currentLineItem.UUID) {
                    // geting quanity of product in cart
                    Transaction.wrap(() => {
                        var quanity = previousLineItem.getQuantity();
                        Basket.removeProductLineItem(previousLineItem);
                        currentLineItem.setQuantityValue(currentLineItem.getQuantityValue() + quanity);
                    });
                }
            });
        });
    }
    Transaction.wrap(() => {
        require('*/cartridge/scripts/helpers/basketCalculationHelpers').calculateTotals(Basket);
    });
    var CartModel = require('*/cartridge/models/cart');
    return new CartModel(Basket);
}


module.exports = {
    isPersonalizationEligible: isPersonalizationEligible,
    getCustomObject: getCustomObject,
    updateProductLineItem: updateProductLineItem,
    ensureProductQuantities: ensureProductQuantities
};
