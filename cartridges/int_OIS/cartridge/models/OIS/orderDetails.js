'use strict';

var StringUtils = require('dw/util/StringUtils');
var URLUtils = require('dw/web/URLUtils');
var StatusHelper = require('*/cartridge/scripts/util/utilHelper');
const Money = require('dw/value/Money');
var Calendar = require('dw/util/Calendar');
var Resource = require('dw/web/Resource');

/**
 * Order class that represents the current order
 * @param {Object} node - The current order line items
 * @param {Object} shipmentId - The current item shipment ID
 * @param {string} itemStatus - Order item fulfillmentStatus status
 * @param {Object} shipmentsUpdated - Array to filter out the duplicate shipments
 * @return {Object} Return orders model
 */
function getShipment(node, shipmentId, itemStatus, shipmentsUpdated) {
    var shipments = node.shipments;
    var result = {};
    result.status = itemStatus;
    var shipment = null;
    for (var i = 0; i < shipments.length; i++) {
        shipment = shipments[i];
        if (shipmentsUpdated && shipmentsUpdated.indexOf(shipmentId) !== -1) {
            return null;
        }
        if (shipment && shipment.shipmentId && shipment.shipmentId === shipmentId) {
            var updatedDate = null;
            if (itemStatus === 'SHIPPED' || itemStatus === 'PARTIAL_SHIPPED' || itemStatus === 'PICKUP_READY') {
                updatedDate = shipment.dateShipped;
            } else if (itemStatus === 'DELIVERED' || itemStatus === 'PICKED_UP') {
                updatedDate = shipment.dateDelivered;
            }
            if (node.status === 'CANCELED') {
                result.updatedDate = StringUtils.formatCalendar(new Calendar(new Date(node.lastModified)), 'MM/dd');
            } else {
                result.updatedDate = updatedDate ? StringUtils.formatCalendar(new Calendar(new Date(updatedDate.split('-')[0], (updatedDate.split('-')[1] - 1), updatedDate.split('-')[2])), 'MM/dd') : null;
            }
            result.trackingLink = shipment.trackingLink;
            shipmentsUpdated.push(shipment.shipmentId);
            break;
        }
    }
    return result;
}

/**
 * Construct the category page URL
 * @param {Object} productId - retrieve the product object
 * @return {Object} Return category page URL
 */
function getShopSimilarItemsLink(productId) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var result = '';
    try {
        var apiProduct = ProductMgr.getProduct(productId);
        if (apiProduct) {
            var category = apiProduct.getPrimaryCategory() ? apiProduct.getPrimaryCategory() : apiProduct.getMasterProduct().getPrimaryCategory();
            result = category && category.ID ? URLUtils.url('Search-Show', 'cgid', category.ID).toString() : '';
        }
    } catch (e) {
        return '';
    }
    return result;
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
 * rearrange the  item if order have BOPIS items
 * @Param {Array} orderItems - order Items
 * @return {Array} order Items
 */
function reOrderItems(orderItems) {
    orderItems.sort(function (obj1, obj2) {
        // mixed BOPIS scenario for order details: ship to address values come first
        return (obj1.isBopis === obj2.isBopis) ? 0 : obj1.isBopis ? -1 : 1; // eslint-disable-line
    });
    return orderItems;
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
 * @param {boolean} orderDetailsTemplate - handle the multiple shipments
 * @return {Object} Return orders model
 */
function OrderDetailsModel(node, orderDetailsTemplate) {
    var orderStatusModel = StatusHelper.orderStatusModel();
    var fulfillmentStatus = StatusHelper.fulfillmentStatus();
    var bopisFulfillmentStatuses = StatusHelper.bopisOrderStatus();
    var order = {};
    order.orderNo = node.orderNo;
    order.creationDate = StringUtils.formatCalendar(new Calendar(new Date(node.creationDate)), 'MM/dd/yyyy');
    var orderItems = [];
    var itemCount = 0;
    var shippingMethod;
    var eligibleForReturn = false;
    var eligibleForExchange = false;
    var hasMultipleShipments = false;
    if (orderDetailsTemplate) {
        if (node.status === 'PARTIAL_SHIPPED' || (node.shipments && node.shipments.length > 1)) {
            hasMultipleShipments = true;
        }
    }
    order.hasMultipleShipments = hasMultipleShipments;
    var shipmentsUpdated = [];
    var shipmentCounter = 0;
    var bopisItemscount = 0;
    var bopisItemsOnly = false;
    var bopisItemQuantity = 0;
    var bopisOrderStatuses = '';
    Object.keys(node.orderItems).forEach(function (orderItem) {
        var currentOrderItem = node.orderItems[orderItem];
        var productItem = currentOrderItem.productItem;
        shippingMethod = currentOrderItem.shippingMethod;
        var product = productItem.product;
        var productUPC = product.upc;
        var productID = product.sku && product.sku.split('-') && product.sku.split('-')[0] && shippingMethod !== 'eGift Card Delivery' ? product.sku.split('-')[0] : product.sku;
        var quantity = productItem.quantity;
        var item = {};
        item.name = product.copy.name;
        item.ID = productID;
        item.sku = product.sku;
        item.upc = productUPC;
        // EPMD-4773 load sfcc images instead of OIS/MAO
        let orderUtils = require('app_ua_core/cartridge/scripts/util/OrderUtils');
        let itemImage = orderUtils.getLineItemImage(product);
        item.imageUrl = itemImage.imageUrl;
        item.imgAlt = itemImage.altText;
        item.color = product.color && product.color.colorway ? product.color.colorway : null;
        item.size = product.sku && product.sku.split('-') && product.sku.split('-')[2] ? product.sku.split('-')[2] : null;
        var itemPriceTotal = product.prices && product.prices.total ? product.prices.total : 0.0;
        itemPriceTotal = new Money(itemPriceTotal, node.currency);
        var itemTaxTotal = product.prices.tax && product.prices.tax ? product.prices.tax : 0.0;
        itemTaxTotal = new Money(itemTaxTotal, node.currency);
        var productTotal = (itemPriceTotal).subtract(itemTaxTotal);
        item.price = StringUtils.formatMoney(productTotal.multiply(quantity));
        item.listPrice = 0;
        if (product.prices.discount > 0) {
            item.listPrice = StringUtils.formatMoney(new Money(product.prices.base, node.currency));
        }
        item.pricePerUnit = StringUtils.formatMoney(productTotal);
        var itemFulfillmentStatus = currentOrderItem.fulfillmentStatus;
        item.fulfillmentStatus = itemFulfillmentStatus;
        if (itemFulfillmentStatus && (itemFulfillmentStatus === 'CANCELED' || itemFulfillmentStatus === 'CANCELLED') && productUPC) {
            item.shopSimilarItemsLink = getShopSimilarItemsLink(productUPC);
        }
        item.url = URLUtils.url('Product-Show', 'pid', productID).toString();
        var shippingAddress = getShippingAddress(node.shippingAddress, node.orderItems[orderItem]);
        item.shippedTo = shippingAddress ? shippingAddress.fullName : null;
        item.shippingAddress = shippingAddress ? shippingAddress.address : null;
        item.isBopis = shippingAddress.isBopis;
        item.storeMapLink = shippingAddress.storeMapLink;
        itemCount += quantity;
        item.quantity = quantity;
        item.lineItemNumber = currentOrderItem && currentOrderItem.lineItemNumber ? currentOrderItem.lineItemNumber : null;
        item.shipmentId = currentOrderItem && currentOrderItem.shipmentId ? currentOrderItem.shipmentId : null;
        if (hasMultipleShipments) {
            var itemShipment = getShipment(node, currentOrderItem.shipmentId, itemFulfillmentStatus, shipmentsUpdated);
            if (itemShipment && itemShipment.trackingLink) {
                itemShipment.shipmentCounter = ++shipmentCounter;
            }
            item.shipment = itemShipment;
        }
        var returnInfo = currentOrderItem && currentOrderItem.returnInfo ? currentOrderItem.returnInfo : null;
        var isEligibleForReturn = returnInfo && returnInfo.isEligibleForReturn ? returnInfo.isEligibleForReturn : null;
        if (isEligibleForReturn && !eligibleForReturn) {
            eligibleForReturn = true;
        }
        var exchangeItems = returnInfo && returnInfo.exchangeItems && returnInfo.exchangeItems.length > 0 ? returnInfo.exchangeItems : null;
        if (isEligibleForReturn && exchangeItems && !eligibleForExchange) {
            eligibleForExchange = true;
        }
        if (shippingAddress.isBopis) {
            bopisItemQuantity += quantity;
            bopisItemscount++;
            if (empty(bopisOrderStatuses)) {
                bopisOrderStatuses = currentOrderItem.fulfillmentStatus;
            }
        }
        item.exchangeItems = exchangeItems || [];
        item.isEligibleForReturn = isEligibleForReturn;
        item.ineligibilityReason = returnInfo && returnInfo.ineligibilityReason ? returnInfo.ineligibilityReason : '';
        item.ineligibilityReasonTxt = item.ineligibilityReason ?
                Resource.msg('error.inegibility.reason.' + item.ineligibilityReason.toLowerCase(), 'order', null) : null;
        item.quantityExchanged = !empty(productItem) && Object.hasOwnProperty.call(productItem, 'quantityExchanged') ? productItem.quantityExchanged : 0;
        item.quantityReturned = !empty(productItem) && Object.hasOwnProperty.call(productItem, 'quantityReturned') ? productItem.quantityReturned : 0;
        orderItems.push(item);
    });
    order.shipmentCounter = shipmentCounter;
    if (orderItems.length > 0 && orderItems.length === bopisItemscount) {
        bopisItemsOnly = true;
    }
    order.orderItems = !bopisItemsOnly && (bopisItemscount > 0 && orderItems.length - bopisItemscount > 0) ? reOrderItems(orderItems) : orderItems;
    order.status = node.status;
    order.displayStatus = orderStatusModel[node.status] ? orderStatusModel[node.status] : node.status;
    var orderFulfillmentStatus = node.fulfillmentGroups[0].fulfillmentStatus;
    order.fulfillmentStatus = orderFulfillmentStatus;
    order.fulfillmentDisplayStatus = fulfillmentStatus[orderFulfillmentStatus] ? fulfillmentStatus[orderFulfillmentStatus] : orderFulfillmentStatus;
    order.bopisDisplayStatus = bopisFulfillmentStatuses[bopisOrderStatuses] ? bopisFulfillmentStatuses[bopisOrderStatuses] : bopisOrderStatuses;
    order.shippedItems = node.fulfillmentGroups[0].items.length;
    var shipment = node.shipments && node.shipments.length > 0 ? node.shipments[0] : null;
    var updatedDate = null;
    if ((node.status === 'PARTIAL_SHIPPED' || node.status === 'SHIPPED' || node.status === 'PICKUP_READY') && shipment) {
        updatedDate = shipment.dateShipped;
    } else if ((node.status === 'DELIVERED' || node.status === 'PICKED_UP') && shipment) {
        updatedDate = shipment.dateDelivered;
    }
    if (node.status === 'CANCELED') {
        order.updatedDate = StringUtils.formatCalendar(new Calendar(new Date(node.lastModified)), 'MM/dd');
    } else {
        order.updatedDate = updatedDate ? StringUtils.formatCalendar(new Calendar(new Date(updatedDate.split('-')[0], (updatedDate.split('-')[1] - 1), updatedDate.split('-')[2])), 'MM/dd') : null;
    }
    order.shipment = shipment;
    order.subTotal = StringUtils.formatMoney(new Money(node.productTotal, node.currency));
    order.orderTotal = StringUtils.formatMoney(new Money(node.orderTotal, node.currency));
    order.itemCount = itemCount;
    order.taxTotal = StringUtils.formatMoney(new Money(node.taxTotal, node.currency));
    order.shippingTotal = StringUtils.formatMoney(new Money(node.shippingTotal, node.currency));
    order.bopisItemsOnly = bopisItemsOnly;
    order.bopisItemscount = bopisItemscount;
    order.bopisItemQuantity = bopisItemQuantity;
    order.shippingMethod = shippingMethod;
    order.currencyCode = node.currency;
    order.billingAddress = node.billingAddress ? node.billingAddress : null;
    order.customerInfo = node.customerInfo ? node.customerInfo : null;
    order.isEligibleForReturn = eligibleForReturn;
    order.isEligibleForExchange = eligibleForExchange;
    order.shippingTotalWithoutCurrency = node.shippingTotal;
    order.isCommercialPickup = node.isCommercialPickup;
    order.pickUpStore = order.isCommercialPickup && node.shippingAddress ? node.shippingAddress.address1 : '';
    order.paymentMethod = node.paymentInstruments && node.paymentInstruments[0] && node.paymentInstruments[0].paymentMethod && node.paymentInstruments[0].paymentMethod.id;
    return order;
}

module.exports = OrderDetailsModel;
