'use strict';

/**
 * Merge the duplicate line items into single line item and update the quantity
 * @param {Object} returnItems - list of items returned by rma and order details query
 * @return {Object} Return the updated items list
 */
function mergeDuplicateReturnItems(returnItems) {
    var listOfReturnItems = [];
    var listOfUPS = [];
    if (returnItems) {
        for (var i = 0; i < returnItems.length; i++) {
            var returnOrderItem = returnItems[i];
            if (returnOrderItem && returnOrderItem.orderItem && returnOrderItem.orderItem.productItem) {
                var returnProductItem = returnOrderItem.orderItem.productItem;
                var returnProductID = returnProductItem.product ? returnProductItem.product.upc : null;
                var storeId = returnOrderItem.orderItem && returnOrderItem.orderItem.storeId ? returnOrderItem.orderItem.storeId : '0';
                var productID = returnProductID && storeId ? returnProductID + ':' + storeId : null;
                if (productID) {
                    var index = listOfUPS.indexOf(productID);
                    if (index === -1) {
                        listOfUPS.push(productID);
                        listOfReturnItems.push(returnOrderItem);
                    } else {
                        listOfReturnItems[index].orderItem.productItem.quantity += returnProductItem.quantity;
                    }
                }
            }
        }
    }
    return listOfReturnItems;
}

/**
 * Merge the duplicate line items into single line item and update the quantity
 * @param {Object} exchangeItems - list of items returned by rma and order details query
 * @return {Object} Return the updated items list
 */
function mergeDuplicateExchangeItems(exchangeItems) {
    var listOfExchangeItems = [];
    var listOfUPS = [];
    if (exchangeItems) {
        for (var i = 0; i <= exchangeItems.length; i++) {
            var exchangeOrderItem = exchangeItems[i];
            if (exchangeOrderItem) {
                var exchangeProductID = exchangeOrderItem.upc;
                if (exchangeProductID) {
                    var index = listOfUPS.indexOf(exchangeProductID);
                    if (index === -1) {
                        listOfUPS.push(exchangeProductID);
                        listOfExchangeItems.push(exchangeOrderItem);
                    } else {
                        listOfExchangeItems[index].quantity += exchangeOrderItem.quantity;
                    }
                }
            }
        }
    }
    return listOfExchangeItems;
}

module.exports = {
    mergeDuplicateReturnItems: mergeDuplicateReturnItems,
    mergeDuplicateExchangeItems: mergeDuplicateExchangeItems
};
