'use strict';

var ContentMgr = require('dw/content/ContentMgr');
var Content = require('*/cartridge/models/content');

/**
 * validate and parse content asset
 * @param {Object} contentText input object
 * @returns {Object} returns parsed string
 */
function parseContent(contentText) {
    return (contentText && contentText.body) ? (contentText.body) : '';
}
/**
 * Get Content Asset
 * @returns {Object} guestReturns content assets
 */
function provideExchangeAndReturnsContent() {
    var Site = require('dw/system/Site').getCurrent().getID().toUpperCase();
    var guestReturnsText;
    var guestReturnsImage;

    if (!empty(Site) && Site === 'MX') {
        guestReturnsText = new Content(ContentMgr.getContent('returns-and-exchanges'));
        guestReturnsImage = new Content(ContentMgr.getContent('guest-returns-image'));
        var OrderTrackContent = new Content(ContentMgr.getContent('order-history-updates'));
        return {
            guestReturnsText: parseContent(guestReturnsText),
            guestReturnsTextName: guestReturnsText,
            guestReturnsImage: parseContent(guestReturnsImage),
            OrderTrackContent: OrderTrackContent
        };
    }
    guestReturnsText = new Content(ContentMgr.getContent('guest-returns-text'));
    guestReturnsImage = new Content(ContentMgr.getContent('guest-returns-image'));
    return {
        guestReturnsText: parseContent(guestReturnsText),
        guestReturnsImage: parseContent(guestReturnsImage)
    };
}
/**
* @param {dw.catalog.Category} category - Current category
 * @returns {Object} returns subcategory
 */
function getOnlineSubCategoriesRefactor(category) {
    var ArrayList = require('dw/util/ArrayList');
    var collections = require('*/cartridge/scripts/util/collections');
    var subcategory = category.hasOnlineSubCategories() ? category.getOnlineSubCategories() : null;
    var subcategories = new ArrayList();
    if (subcategory) {
        collections.forEach(subcategory, function (subcategoryValue) {
            if ('showInMenu' in subcategoryValue.custom && subcategoryValue.custom.showInMenu.valueOf() && subcategoryValue.custom.showInMenu.valueOf().toString() === 'true') {
                subcategories.add1(subcategoryValue);
            }
        });
    }
    return subcategories;
}

/**
 * Get category url
 * @param {dw.catalog.Category} category - Current category
 * @returns {string} - Url of the category
 */
function getCategoryUrl(category) {
    var URLUtils = require('dw/web/URLUtils');
    return category.custom && 'alternativeUrl' in category.custom && category.custom.alternativeUrl
        ? (category.custom.alternativeUrl.toString()).replace(/&amp;/g, '&')
        : URLUtils.url('Search-Show', 'cgid', category.getID()).toString();
}

/**
 * Get Content Asset
 * @returns {Object} Returns content assets
 * @param {string} contentAssetID - content asset ID
 */
function getContentAsset(contentAssetID) {
    var contentModel = new Content(ContentMgr.getContent(contentAssetID));
    var contentbody = parseContent(contentModel);
    return contentbody;
}

module.exports = {
    provideExchangeAndReturnsContent: provideExchangeAndReturnsContent,
    getOnlineSubCategoriesRefactor: getOnlineSubCategoriesRefactor,
    getCategoryUrl: getCategoryUrl,
    getContentAsset: getContentAsset
};
