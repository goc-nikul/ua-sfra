'use strict';

/**
 * Utility functions for Border cartridge
 */

/* API Dependencies */
const Logger = require('dw/system/Logger');
const Site = require('dw/system/Site');

/* PO Constants*/
const GREENSTATE = 'GREEN';
const REDSTATE = 'RED';

exports.GREENSTATE = GREENSTATE;
exports.REDSTATE = REDSTATE;

/* Preference IDs */
const PREFERENCE = {

    /**
     * Merchant ID
     * @type {string}
     */
    MERCHANT_ID: 'bfxMerchantId',

    /**
     * Catalog Mapping
     * @type {string}
     */
    CATALOG_MAPPING: 'bfxCatalogMapping',

    /**
     * Custom Mapping
     * @type {string}
     */
    CUSTOM_MAPPING: 'bfxCustomsMapping',

    /**
     * Error Emails
     * @type {string}
     */
    ERROR_EMAILS: 'bfxErrorEmail',

    /**
     * Dutiable Price Book
     * @type {string}
     */
    DUTIABLE_PRICE_BOOK: 'bfxDutiablePricebook',


    /**
     * Sale Price Book
     * @type {string}
     */
    SALE_PRICE_BOOK: 'bfxSalePricebook',

     /** SFTP Host
     * @type {string}
     */
    SFTP_HOST: 'bfxSFTPHost',

    /**
     * SFTP User
     * @type {string}
     */
    SFTP_USER_NAME: 'bfxSFTPUsername',

    /**
     * SFTP Password
     * @type {string}
     */
    SFTP_PASSWORD: 'bfxSFTPPassword',

    /**
     * SFTP timeout value
     * @type {string}
     */
    SFTP_TIMEOUT: 'bfxSFTPTimeout',

    /**
     * createmissingorder service password
     * @type {string}
     */
    CREATEMISSINGORDER_PASSWORD: 'createMissingOrderServicePwd',

    /**
     * order status feed src
     */
    ORDER_STATUS_FEED_SRC:'orderStatusFeedSrc',

    /**
     * order status feed src
     */
    ORDER_STATUS_FEED_NAME:'orderStatusFeedName',

    /**
     * order status feed src
     */
    ORDER_STATUS_FEED_HOST_NAME:'orderStatusFeedHostName',

    /**
     * order status feed src
     */
    ORDER_STATUS_FEED_HOST_USER:'orderStatusFeedHostUser',

    /**
     * order status feed src
     */
    ORDER_STATUS_FEED_HOST_PWD:'orderStatusFeedHostPwd',

    /**
     * order status feed src
     */
    ORDER_STATUS_FEED_IMPEX_LOCATION:'orderStatusFeedImpLocation',

    /**
     * order status feed src
     */
    ORDER_STATUS_FEED_IMPEX_ARCHIVE:'orderStatusFeedImpArchive'




};

exports.PREFERENCE = PREFERENCE;

const VALUE = {
    /**
     * File Export Folder
     * @type {string}
     */
     FILE_EXPORT_FOLDER: '/src/upload/borderfree/',

     /**
      * Catalog Feed Upload Folder
      * @type {string}
      */
      FEED_EXPORT_FOLDER: 'Inbox/Catalog',

     /**
      * Kits Export File name
      * @type {string}
      */
     KITS_EXPORT_FILE_NAME: 'kits.txt',

     /**
     * Catalog Export File name
     * @type {string}
     */
    CATALOG_EXPORT_FILE_NAME: 'standard.txt',

    /**
     * Custom Export File name
     * @type {string}
     */
    CUSTOM_EXPORT_FILE_NAME: 'customs.txt',

    /**
     * Site Preference value for merchant ID
     * @type {string}
     */
    MERCHANT_ID: getPreferenceValue(PREFERENCE.MERCHANT_ID),

    /**
     * Site Preference value for catalog mapping
     * @type {string}
     */
    CATALOG_MAPPING: getPreferenceValue(PREFERENCE.CATALOG_MAPPING),

    /**
     * Site Preference value for custom mapping
     * @type {string}
     */
    CUSTOM_MAPPING: getPreferenceValue(PREFERENCE.CUSTOM_MAPPING),

    /**
     * Site Preference value for error emails
     * @type {string}
     */
    ERROR_EMAILS: getPreferenceValue(PREFERENCE.ERROR_EMAILS),

    /**
     * Site Preference value for dutiable price book
     * @type {string}
     */
    DUTIABLE_PRICE_BOOK: getPreferenceValue(PREFERENCE.DUTIABLE_PRICE_BOOK),

    /**
     * Site Preference value for sale price book
     * @type {string}
     */
    SALE_PRICE_BOOK: getPreferenceValue(PREFERENCE.SALE_PRICE_BOOK),

    /**
     * Site Preference value for SFTP Host
     * @type {string}
     */
    SFTP_HOST: getPreferenceValue(PREFERENCE.SFTP_HOST),


    /**
     * Site Preference value for SFTP Username
     * @type {string}
     */
    SFTP_USER_NAME: getPreferenceValue(PREFERENCE.SFTP_USER_NAME),


    /**
     * Site Preference value for SFTP Password
     * @type {string}
     */
    SFTP_PASSWORD: getPreferenceValue(PREFERENCE.SFTP_PASSWORD),

    /**
     * Site Preference value for SFTP Timeout
     * @type {number}
     */
     SFTP_TIMEOUT: getPreferenceValue(PREFERENCE.SFTP_TIMEOUT),

    /**
     * Site Preference value for createmissingorder  service
     * @type {string}
     */
    CREATEMISSINGORDER_PASSWORD: getPreferenceValue(PREFERENCE.CREATEMISSINGORDER_PASSWORD),

    /**
    * orderstatus feed location
    * @type {string}
    */
    ORDER_STATUS_FEED_SRC_FOLDER: getPreferenceValue(PREFERENCE.ORDER_STATUS_FEED_SRC),

    /**
    * orderstatus feed sftp host
    * @type {string}
    */
    ORDER_STATUS_FEED_SFTP_HOST: getPreferenceValue(PREFERENCE.ORDER_STATUS_FEED_HOST_NAME),


    /**
    * orderstatus feed sftp username
    * @type {string}
    */
    ORDER_STATUS_FEED_SFTP_USER_NAME: getPreferenceValue(PREFERENCE.ORDER_STATUS_FEED_HOST_USER),

    /**
    * orderstatus feed sftp password
    * @type {string}
    */
    ORDER_STATUS_FEED_SFTP_PASSWORD: getPreferenceValue(PREFERENCE.ORDER_STATUS_FEED_HOST_PWD),

    /**
     * order status file import Folder in IMPEX
     * @type {string}
     */
    ORDER_STATUS_FILE_IMPORT_FOLDER: getPreferenceValue(PREFERENCE.ORDER_STATUS_FEED_IMPEX_LOCATION),

    /**
     * order status file import archive Folder in IMPEX
     * @type {string}
     */
    ORDER_STATUS_FILE_IMPORT_ARCHIVE_FOLDER: getPreferenceValue(PREFERENCE.ORDER_STATUS_FEED_IMPEX_ARCHIVE),

    /**
     * order status import file name
     * @type {string}
     */
    ORDER_STATUS_FILE_NAME: getPreferenceValue(PREFERENCE.ORDER_STATUS_FEED_NAME)

};

exports.VALUE = VALUE;

/**
 * Catalog feed mapping attributes
 */
const CATALOG_FEED_MAPPING = {
    id: {
        type: 'String',
        source: 'ID'
    },
    title: {
        type: 'String',
        source: 'name'
    },
    description: {
        type: 'HTML',
        source: 'shortDescription'
    },
    category: {
        type: 'Category',
        source: 'primaryCategory'
    },
    link: {
        type: 'URL',
        source: 'pageURL'
    },
    image_link: {
        type: 'Image',
        source: 'httpsURL'
    },
    additional_image_link: {
        type: 'Image',
        source: 'httpsURL'
    },
    condition: {
        type: 'EnumOfStrings',
        source: 'custom.bfxCondition'
    },
    last_updated: {
        type: 'DateTime',
        source: 'lastModified'
    },
    availability: {
        type: 'Availability',
        source: 'availabilityStatus'
    },
    availability_date: {
        type: 'DateTime',
        source: 'inStockDate'
    },
    dutiable_price: {
        type: 'Price',
        source: 'price'
    },
    sale_price: {
        type: 'Price',
        source: 'sale_price'
    },
    sale_price_effective_date: {
        type: 'DateTime',
        source: 'custom.salePriceEffectiveDate'
    },
    brand: {
        type: 'String',
        source: 'brand'
    },
    gender: {
        type: 'EnumOfStrings',
        source: 'custom.bfxGender'
    },
    age_group: {
        type: 'EnumOfStrings',
        source: 'custom.bfxAgeGroup'
    },
    color: {
        type: 'String',
        source: 'custom.color'
    },
    size: {
        type: 'String',
        source: 'custom.size'
    },
    size_type: {
        type: 'EnumOfStrings',
        source: 'custom.bfxSizeType'
    },
    size_system : {
        type: 'EnumOfStrings',
        source: 'custom.bfxSizeSystem'
    },
    item_group_id: {
        type: 'ProductTypeId',
        source: 'ID'
    },
    materials: {
        type: 'SetOfStrings',
        source: 'custom.bfxMaterials'
    },
    pattern: {
        type: 'String',
        source: 'custom.bfxPattern'
    },
    season: {
        type: 'EnumOfStrings',
        source: 'custom.bfxSeason'
    }
};


exports.CATALOG_FEED_MAPPING = CATALOG_FEED_MAPPING;

/**
 * KIT feed mapping attributes
 */
const  KIT_FEED_HEADERS = ['parent', 'child', 'quantity'];

exports.KIT_FEED_HEADERS = KIT_FEED_HEADERS;

/**
 * Custom feed mapping attributes
 */
const CUSTOM_FEED_MAPPING = {
    id: {
        type: 'String',
        source: 'ID'
    },
    barcode: {
        type: 'String',
        source: 'custom.bfxBarcode'
    },
    barcode_type: {
        type: 'EnumOfStrings',
        source: 'custom.bfxBarcodeType'
    },
    eccn: {
        type: 'String',
        source: 'custom.bfxECCN'
    },
    mpn: {
        type: 'String',
        source: 'custom.bfxMPN'
    },
    shipping_height: {
        type: 'String',
        source: 'custom.bfxShippingHeight'
    },
    shipping_width: {
        type: 'String',
        source: 'custom.bfxShippingWidth'
    },
    shipping_length: {
        type: 'String',
        source: 'custom.bfxShippingLength'
    },
    shipping_weight: {
        type: 'String',
        source: 'custom.bfxShippingWeight'
    },
    COO: {
        type: 'String',
        source: 'custom.bfxCOO'
    },
    VAT: {
        type: 'String',
        source: 'custom.bfxVAT'
    },
    fish_wild_source: {
        type: 'EnumOfStrings',
        source: 'custom.bfxFishWildSource'
    },
    fish_wild_common: {
        type: 'String',
        source: 'custom.bfxFishWildCommon'
    },
    fish_wild_science: {
        type: 'String',
        source: 'custom.bfxFishWildScience'
    },
    fish_wild_coo: {
        type: 'String',
        source: 'custom.bfxFishWildCOO'
    },
    country_restrictions: {
        type: 'SetOfStrings',
        source: 'custom.bfxCountryRestrictions'
    },
    hazmat: {
        type: 'Boolean',
        source: 'custom.bfxHazmat'
    }
};


exports.CUSTOM_FEED_MAPPING = CUSTOM_FEED_MAPPING;

/* SERVICE NAMES */
//TODO we need to check if we actually use it
const SERVICE = {
    BORDERFREE_SERVICE: 'Borderfreee.REST.API',
};

exports.SERVICE = SERVICE;


/**
 * Shared Logger
 * @type {Log}
 */
const log = Logger.getLogger('borderfree', 'borderfree');

/**
 * Borderfree Logger
 * @type {Log}
 */
exports.log = log;

/**
 * Convenience method to get a site custom preference
 *
 * @param {String} id The Site Preference ID
 * @returns {*}
 */
function getPreferenceValue (id) {
    if (!empty(Site.getCurrent().getCustomPreferenceValue(id))) {
        return Site.getCurrent().getCustomPreferenceValue(id);
    }
    return null;
}
