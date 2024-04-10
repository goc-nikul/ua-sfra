'use strict';

var priceHelper = require('../custom/priceHelper');
var site = require('dw/system/Site');

/**
 * The configuration keys used by the cartridge.
 */
var configKeys = {
    /**
     * Attribute Ids with search refinement definitions.
     */
    CUSTOM_CONSTRUCTOR_BUCKETED_ATTRIBUTE_IDS_TO_SEND: 'Constructor_BucketedAttributeIdsToSend',
    /**
     * The id for the list price book.
     */
    CUSTOM_LIST_PRICEBOOK_NAME: priceHelper.getPricebookID(site.current.currencyCode, request.locale, 'list'),
    /**
     * The id for the sale price book.
     */
    CUSTOM_SALE_PRICEBOOK_NAME: priceHelper.getPricebookID(site.current.currencyCode, request.locale, 'sale'),
    /**
     * Enable/disable the capture and sending of promotional pricing.
     */
    CUSTOM_PROMO_PRICING_ENABLED: 'Constructor_PromoPricingEnabled',
    /**
     * Search refinement definition display names.
     */
    CUSTOM_CONSTRUCTOR_BUCKETED_ATTRIBUTE_DISPLAY_NAMES_TO_SEND: 'Constructor_BucketedAttributeDisplayNamesToSend'
};

module.exports = {
    configKeys: configKeys
};
