'use strict';

var StringUtils = require('dw/util/StringUtils');
var URLUtils = require('dw/web/URLUtils');
var StatusHelper = require('*/cartridge/scripts/util/utilHelper');
var ExchangeOrderHelper = require('*/cartridge/scripts/order/exchangeOrderHelper');
const Money = require('dw/value/Money');
var Calendar = require('dw/util/Calendar');
var Resource = require('dw/web/Resource');

/**
 * Validate selected PIDs with order item
 * @param {Object} orderItem OIS order item
 * @param {Object} selectedPidsArray selected PIDs
 * @param {string} productUPC product ID
 * @param {boolean} isBopisItem bopis item or not
 * @param {string} quantity item quantity
 * @returns {boolean} return status of order item
 */
function isMatchingLineItem(orderItem, selectedPidsArray, productUPC, isBopisItem, quantity) {
    return selectedPidsArray.some(function (selectedPid) {
        var isMatchingShipment = !selectedPid.shipmentId
                                || ((orderItem && orderItem.shipmentId) && (selectedPid && selectedPid.shipmentId) && (orderItem.shipmentId.toString() === selectedPid.shipmentId.toString()));
        return isMatchingShipment && productUPC && (productUPC === selectedPid.pid) && (selectedPid.isBopisItem === isBopisItem) && (selectedPid.quantity === quantity);
    });
}

/**
 * Fetches SFCC store address
 * @param {Object} orderItem OIS response object
 * @returns {Object} shippingAddress Store address
 */
function findStoreAddress(orderItem) {
    var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
    var storeID = orderItem ? orderItem.storeId : null;
    var store = storeID ? storeHelpers.findStoreById(storeID) : null;
    if (!store) {
        return null;
    }
    var storeMapLink = storeHelpers.getStoreGoogleMapLink(store);
    return {
        fullName: '',
        shippingAddress: {
            name: store.name,
            address1: store.address1,
            city: store.city,
            stateCode: store.stateCode,
            postalCode: store.postalCode
        },
        storeMapLink: storeMapLink
    };
}

/**
 * fetch shipping address
 * @param {Object} shippingAddress OIS shipping address response
 * @param {Object} orderItem OIS order item
 * @returns {Object} returns OIS shipping address
 */
function getShippingAddress(shippingAddress, orderItem) {
    if (!orderItem || !shippingAddress) {
        return null;
    }
    // If it is BOPIS productline item fetch shipping address from SFCC
    var storeAddress = findStoreAddress(orderItem);
    return {
        fullName: storeAddress ? (storeAddress.fullName) : (shippingAddress.fullName),
        address: storeAddress ? (storeAddress.shippingAddress) : shippingAddress,
        storeMapLink: storeAddress ? storeAddress.storeMapLink : null,
        isBopis: !!storeAddress
    };
}

/**
 * Order class that represents the current order
 * @param {Object} node - The current order line items
 * @param {Array} selectedPidsArray - The selected order items info
 * @param {boolean} includeExchangeProducts - include the exchange product model
 * @param {string} pid - product ID
 * @param {Object} pidQtyObj - product and quantity Object
 * @return {Object} Return orders model
 */
function OrderDetailsModel(node, selectedPidsArray, includeExchangeProducts, pid, pidQtyObj) {
    var orderStatusModel = StatusHelper.orderStatusModel();
    var fulfillmentStatus = StatusHelper.fulfillmentStatus();
    var order = {};
    order.orderNo = node.orderNo;
    order.creationDate = StringUtils.formatCalendar(new Calendar(new Date(node.creationDate)), 'MM/dd/yyyy');
    var orderItems = [];
    var itemCount = 0;
    var refundSubtotal = 0;
    var shippingMethod;
    var eligibleForReturn = false;
    var eligibleForExchange = false;
    var taxTotal = 0;
    var itemRemoved = 0;
    Object.keys(node.orderItems).forEach(function (orderItem) {
        var duplicateItem = false;
        var isBopisItem = false;
        var currentOrderItem = node.orderItems[orderItem];
        if (currentOrderItem.storeId) {
            isBopisItem = true;
        }
        var productItem = currentOrderItem.productItem;
        shippingMethod = currentOrderItem.shippingMethod;
        var product = productItem.product;
        var productID = product.sku && product.sku.split('-') && product.sku.split('-')[0] ? product.sku.split('-')[0] : product.sku;
        var productUPC = product.upc;
        var quantity = productItem.quantity;
        var returnInfo = currentOrderItem && currentOrderItem.returnInfo ? currentOrderItem.returnInfo : null;
        var isEligibleForReturn = returnInfo && returnInfo.isEligibleForReturn ? returnInfo.isEligibleForReturn : null;
        var isLineItemMatched = isMatchingLineItem(currentOrderItem, selectedPidsArray, productUPC, isBopisItem, quantity);
        if (productUPC && selectedPidsArray && isLineItemMatched && isEligibleForReturn) {
            var item = {};
            item.name = product.copy.name;
            item.ID = productID;
            item.sku = product.sku;
            item.upc = productUPC;
            item.imageUrl = product.assets && product.assets.images && product.assets.images.length > 0 ? product.assets.images[0].url : null;
            item.color = product.color && product.color.colorway ? product.color.colorway : null;
            item.size = product.sku && product.sku.split('-') && product.sku.split('-')[2] ? product.sku.split('-')[2] : null;
            var itemPriceTotal = product.prices && product.prices.total ? product.prices.total : 0.0;
            var taxPerUnit = product.prices && product.prices.tax ? product.prices.tax : 0.0;
            var itemNetPricePerUnit = itemPriceTotal - taxPerUnit;
            item.price = StringUtils.formatMoney(new Money((itemNetPricePerUnit * quantity), node.currency));
            item.listPrice = 0;
            if (product.prices.discount > 0) {
                item.listPrice = StringUtils.formatMoney(new Money(product.prices.base, node.currency));
            }
            item.pricePerUnit = StringUtils.formatMoney(new Money(itemNetPricePerUnit, node.currency));
            item.fulfillmentStatus = currentOrderItem.fulfillmentStatus;
            item.url = URLUtils.url('Product-Show', 'pid', productID).toString();
            var shippingAddress = getShippingAddress(node.shippingAddress, currentOrderItem);
            item.shippedTo = shippingAddress ? shippingAddress.fullName : null;
            item.shippingAddress = shippingAddress ? shippingAddress.address : null;
            item.isBopis = shippingAddress.isBopis;
            item.storeMapLink = shippingAddress.storeMapLink;
            item.quantity = quantity;
            if (!empty(pidQtyObj) && pidQtyObj.length > 0) {
                pidQtyObj.forEach(function (itemToUpdate) {
                    if (itemToUpdate.pid === productUPC) {
                        itemCount += Number(itemToUpdate.qty);
                        refundSubtotal += (itemNetPricePerUnit * itemToUpdate.qty);
                        taxTotal += (taxPerUnit * itemToUpdate.qty);
                    }
                });
            } else {
                refundSubtotal += itemNetPricePerUnit;
                taxTotal += taxPerUnit;
                itemCount += 1;
            }
            if (productUPC === pid && pidQtyObj && pidQtyObj.length === 0) {
                refundSubtotal -= itemNetPricePerUnit;
                taxTotal += taxPerUnit;
                duplicateItem = true;
                itemRemoved = 1;
            }
            item.shipmentId = currentOrderItem && currentOrderItem.shipmentId ? currentOrderItem.shipmentId : null;
            if (isEligibleForReturn && !eligibleForReturn) {
                eligibleForReturn = true;
            }
            var exchangeItems = returnInfo && returnInfo.exchangeItems && returnInfo.exchangeItems.length > 0 ? returnInfo.exchangeItems : null;
            if (isEligibleForReturn && exchangeItems && !eligibleForExchange) {
                eligibleForExchange = true;
            }
            item.exchangeItems = exchangeItems || [];
            if (includeExchangeProducts && exchangeItems) {
                var exchangeProductsArrayString = ExchangeOrderHelper.getExchangeProductList(exchangeItems);
                item.exchangeProductHits = ExchangeOrderHelper.getExchangeProductHits(exchangeItems, quantity, exchangeProductsArrayString);
                item.exchangeProducts = exchangeProductsArrayString;
            }
            item.isEligibleForReturn = isEligibleForReturn;
            item.ineligibilityReason = returnInfo && returnInfo.ineligibilityReason ? returnInfo.ineligibilityReason : '';
            item.ineligibilityReasonTxt = item.ineligibilityReason ?
                Resource.msg('error.inegibility.reason.' + item.ineligibilityReason.toLowerCase(), 'order', null) : null;
            item.duplicateItem = duplicateItem;
            orderItems.push(item);
        }
    });

    orderItems.forEach(function (itemToBeRemoved) {
        if (itemToBeRemoved.duplicateItem) {
            var index = orderItems.indexOf(itemToBeRemoved);
            if (index !== -1) {
                orderItems.splice(index, 1);
            }
        }
    });

    order.orderItems = orderItems;
    order.status = node.status;
    order.displayStatus = orderStatusModel[node.status] ? orderStatusModel[node.status] : node.status;
    order.fulfillmentStatus = fulfillmentStatus[node.fulfillmentGroups[0].fulfillmentStatus] ? fulfillmentStatus[node.fulfillmentGroups[0].fulfillmentStatus] : node.fulfillmentGroups[0].fulfillmentStatus;
    order.shippedItems = node.fulfillmentGroups[0].items.length;
    order.shipment = node.fulfillmentGroups[0].shipment;
    order.itemCount = itemCount - itemRemoved;
    order.taxTotal = StringUtils.formatMoney(new Money(taxTotal, node.currency));
    order.subTotal = StringUtils.formatMoney(new Money(refundSubtotal, node.currency));
    var orderTotal = refundSubtotal + taxTotal;
    order.orderTotal = StringUtils.formatMoney(new Money(orderTotal, node.currency));
    order.shippingTotal = StringUtils.formatMoney(new Money(node.shippingTotal, node.currency));
    order.shippingMethod = shippingMethod;
    order.currencyCode = node.currency;
    order.billingAddress = node.billingAddress ? node.billingAddress : null;
    order.shippingAddress = node.shippingAddress ? node.shippingAddress : null;
    order.customerInfo = node.customerInfo ? node.customerInfo : null;
    order.isEligibleForReturn = eligibleForReturn;
    order.isEligibleForExchange = eligibleForExchange;

    return order;
}

module.exports = OrderDetailsModel;
