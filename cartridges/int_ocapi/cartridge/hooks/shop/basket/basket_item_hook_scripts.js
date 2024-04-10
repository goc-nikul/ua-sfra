/**
 * ©2013-2017 salesforce.com, inc. All rights reserved.
 *
 * basket_item_hook_scripts.js
 *
 * Handles OCAPI hooks for basket item calls
 */

var Status = require('dw/system/Status');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var CurrentSite = Site.getCurrent();
var errorLogHelper = require('*/cartridge/scripts/errorLogHelper');
var eGiftCardProductID = CurrentSite.getCustomPreferenceValue('eGiftCardProductID');


exports.beforePATCH = function (basket, item) {
    try {
        if (item && item.c_gcAmount && item.product_id === eGiftCardProductID) {
            // parse item_id from .../baskets/{basket_id}/items/{item_id}
            var paths = request.httpPath.split('/');
            var itemId = paths[paths.length - 1];

            if (itemId) {
                var basketItems = basket.productLineItems;
                for (var i = 0; i < basketItems.length; i++) {
                    if (itemId === basketItems[i].UUID) {
                        basketItems[i].setPriceValue(item.c_gcAmount);
                        break;
                    }
                }
            }
        }
        // ensure all bopis items have matching store id
        if (item && item.c_fromStoreId) {
            basket.getAllProductLineItems().toArray().forEach(lineItem => {
                if (lineItem.custom.fromStoreId) {
                    lineItem.custom.fromStoreId = item.c_fromStoreId; // eslint-disable-line no-param-reassign
                }
            });
        }
    } catch (e) {
        return errorLogHelper.handleOcapiHookErrorStatus(e, 'updateBasketResponseError', Resource.msg('error.ocapi.update.basket', 'cart', null));
    }
    return new Status(Status.OK);
};
