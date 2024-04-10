'use strict';

var priceHelper = require('../custom/priceHelper');

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
    CUSTOM_LIST_PRICEBOOK_NAME: priceHelper.getPricebookID('USD', 'en_US', 'list'),
    /**
     * The id for the sale price book.
     */
    CUSTOM_SALE_PRICEBOOK_NAME: priceHelper.getPricebookID('USD', 'en_US', 'sale'),
    /**
     * Enable/disable the capture and sending of promotional pricing.
     */
    CUSTOM_PROMO_PRICING_ENABLED: 'Constructor_PromoPricingEnabled',
    /**
     * Search refinement definition display names.
     */
    CUSTOM_CONSTRUCTOR_BUCKETED_ATTRIBUTE_DISPLAY_NAMES_TO_SEND: 'Constructor_BucketedAttributeDisplayNamesToSend',
    /**
     * The product ingestion strategy to use when sending data to Constructor.
     */
    CONSTRUCTOR_PRODUCT_INGESTION_STRATEGY: 'Constructor_ProductIngestionStrategy',
    /**
     * The category ingestion strategy to use when sending data to Constructor.
     */
    CONSTRUCTOR_CATEGORY_INGESTION_STRATEGY: 'Constructor_CategoryIngestionStrategy',
    /**
     * The inventory ingestion strategy to use when sending data to Constructor.
     */
    CONSTRUCTOR_INVENTORY_INGESTION_STRATEGY: 'Constructor_InventoryIngestionStrategy'
};

function getCredentialsOrNull(ApiKeyOverride) {
    return {
        apiKey: 'key_eSQY7mMtt3YNq0e4',
        apiToken: 'tok_IgQt8jeTyCLrO7Ix'
    };
}

function getConfig(key) {
    if (key === 'CUSTOM_CONSTRUCTOR_BUCKETED_ATTRIBUTE_DISPLAY_NAMES_TO_SEND') {
        return 'silhouette';
    }
}

module.exports = {
    configKeys: configKeys,
    getCredentialsOrNull: getCredentialsOrNull,
    getConfig: getConfig
};
