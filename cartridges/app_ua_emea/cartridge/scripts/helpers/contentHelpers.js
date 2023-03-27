'use strict';

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
    var ContentMgr = require('dw/content/ContentMgr');
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

baseHelper.provideExchangeAndReturnsContent = provideExchangeAndReturnsContent;
module.exports = baseHelper;
