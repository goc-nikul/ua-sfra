'use strict';


/**
 * add the last two items from the wishlist to the account model
 * @param {dw.customer.ProductList} apiWishList - Current users's wishlist
 * @returns {Array} an array of the last two items added to the wishlist
 */
function addWishList(apiWishList) {
    var ProductListItemModel = require('*/cartridge/models/productListItem');
    var listLength = apiWishList.items.length;
    var i = listLength - 1;
    var result = [];
    var productListItem;
    if (listLength === 0) {
        return result;
    }

    while (i >= 0) {
        productListItem = new ProductListItemModel(apiWishList.items[i], {}).productListItem;
        result.push(productListItem);
        i--;
    }
    return result;
}

module.exports = function (object, apiWishList) {
    Object.defineProperty(object, 'wishlist', {
        enumerable: true,
        value: addWishList(apiWishList)
    });
};
