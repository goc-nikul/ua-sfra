'use strict';

var ContentMgr = require('dw/content/ContentMgr');

var baseHelper = require('app_ua_core/cartridge/scripts/helpers/contentHelpers');
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
    var Content = require('*/cartridge/models/content');
    var guestReturnsText = new Content(ContentMgr.getContent('returns-and-exchanges'));
    var guestReturnsTextBelow = new Content(ContentMgr.getContent('returns-and-exchanges-2'));
    var guestReturnsImage = new Content(ContentMgr.getContent('guest-returns-image'));
    var OrderTrackContent = new Content(ContentMgr.getContent('order-history-updates'));
    return {
        guestReturnsText: parseContent(guestReturnsText),
        guestReturnsTextName: guestReturnsText,
        guestReturnsTextBelow: parseContent(guestReturnsTextBelow),
        guestReturnsImage: parseContent(guestReturnsImage),
        OrderTrackContent: OrderTrackContent
    };
}

/**
 * Checks if the body of a content asset is available.
 * @param {string} contentAssetID - The ID of the content asset to check.
 * @returns {boolean} - Returns true if the content asset's body is available, otherwise false.
 */
function isContentAssetBodyAvailable(contentAssetID) {
    var content = ContentMgr.getContent(contentAssetID);
    var contentAvailable = false;

    if (content
        && content.online
        && content.custom
        && content.custom.body
        && content.custom.body.markup) {
        contentAvailable = true;
    }

    return contentAvailable;
}

baseHelper.provideExchangeAndReturnsContent = provideExchangeAndReturnsContent;
baseHelper.isContentAssetBodyAvailable = isContentAssetBodyAvailable;
module.exports = baseHelper;
