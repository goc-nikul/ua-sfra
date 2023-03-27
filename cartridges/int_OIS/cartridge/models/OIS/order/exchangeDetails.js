'use strict';

var StringUtils = require('dw/util/StringUtils');
var URLUtils = require('dw/web/URLUtils');
var StatusHelper = require('*/cartridge/scripts/util/utilHelper');
const Money = require('dw/value/Money');
var Calendar = require('dw/util/Calendar');

/**
 * Order class that represents the current order
 * @param {Object} originalOrder - The current order line items
 * @return {Object} Return orders model
 */
function ExchangeDetailsModel(originalOrder) {
    var node = originalOrder.exchangeOrder;
    var orderStatusModel = StatusHelper.rmaStatusModel();
    var orderReturnReasonModel = StatusHelper.orderReturnReasonModel();
    var order = {};
    order.orderNo = node.orderNo;
    order.originalOrderNo = originalOrder.returnOrder.orderNo;
    order.rmaNumber = originalOrder.rmaNumber;
    order.creationDate = StringUtils.formatCalendar(new Calendar(new Date(node.creationDate)), 'MM/dd');
    order.status = node.status;
    order.displayStatus = orderStatusModel[node.status] ? orderStatusModel[node.status] : node.status;
    order.fulfillmentStatus = null;
    order.shippedItems = null;
    order.shipment = node.shipments[0];
    var returnOrderItems = originalOrder.returnItems;
    var orderItems = [];
    var itemCount = 0;
    var price = 0;
    var orderTotal = 0;
    var itemTax = 0;
    var shippingMethod;

    var originalOrderItems = [];
    var originalItemCount = 0;
    var originalPrice = 0;
    var originalOrderTotal = 0;
    var originalItemTax = 0;
    var originalShippingMethod;
    Object.keys(node.orderItems).forEach(function (exchangeItem) {
        var currentOrderItem = node.orderItems[exchangeItem];
        var productItem = currentOrderItem.productItem;
        shippingMethod = currentOrderItem.shippingMethod;
        var product = productItem.product;
        var quantity = productItem.quantity;
        var productID = product.sku && product.sku.split('-') && product.sku.split('-')[0] ? product.sku.split('-')[0] : product.sku;
        var item = {};
        var originalOrderItem = {};
        item.exchangeItem = true;
        item.name = product.copy.name;
        item.ID = productID;
        item.sku = product.sku;
        item.upc = product.upc;
        item.imageUrl = product.assets && product.assets.images && product.assets.images.length > 0 ? product.assets.images[0].url : null;
        item.color = product.color && product.color.colorway ? product.color.colorway : null;
        item.size = product.sku && product.sku.split('-') && product.sku.split('-')[2] ? product.sku.split('-')[2] : null;
        var itemPriceTotal = product.prices && product.prices.total ? product.prices.total : 0.0;
        var taxPerUnit = product.prices && product.prices.tax ? product.prices.tax : 0.0;
        var itemNetPricePerUnit = itemPriceTotal - taxPerUnit;
        var lineItemTotalPrice = itemNetPricePerUnit * quantity;
        var lineItemTotalTax = taxPerUnit * quantity;
        item.price = lineItemTotalPrice;
        item.pricePerUnit = StringUtils.formatMoney(new Money(itemNetPricePerUnit, node.currency));
        item.fulfillmentStatus = currentOrderItem.fulfillmentStatus;
        item.url = URLUtils.url('Product-Show', 'pid', productID).toString();
        item.shippedTo = node.shippingAddress && node.shippingAddress.fullName ? node.shippingAddress.fullName : null;
        item.shippingAddress = node.shippingAddress ? node.shippingAddress : null;
        itemCount += productItem.quantity;
        price += lineItemTotalPrice;
        itemTax += lineItemTotalTax;
        orderTotal += (lineItemTotalPrice + lineItemTotalTax);
        item.quantity = productItem.quantity;
        item.lineItemNumber = currentOrderItem && currentOrderItem.lineItemNumber ? currentOrderItem.lineItemNumber : null;
        item.shipmentId = currentOrderItem && currentOrderItem.shipmentId ? currentOrderItem.shipmentId : null;
        item.returnReason = currentOrderItem.returnReason;
        orderItems.push(item);
        returnOrderItems.forEach(function (returnItem) {
            var returnItemID = returnItem.orderItem.productItem.product.sku && returnItem.orderItem.productItem.product.sku.split('-') && returnItem.orderItem.productItem.product.sku.split('-')[0] ? returnItem.orderItem.productItem.product.sku.split('-')[0] : returnItem.orderItem.productItem.product.sku;
            if (productID === returnItemID) {
                originalShippingMethod = returnItem.shippingMethod;
                originalOrderItem.name = returnItem.orderItem.productItem.product.copy.name;
                originalOrderItem.ID = returnItemID;
                originalOrderItem.sku = returnItem.orderItem.productItem.product.sku;
                originalOrderItem.upc = returnItem.orderItem.productItem.product.upc;
                originalOrderItem.imageUrl = returnItem.orderItem.productItem.product.assets && returnItem.orderItem.productItem.product.assets.images && returnItem.orderItem.productItem.product.assets.images.length > 0 ? returnItem.orderItem.productItem.product.assets.images[0].url : null;
                originalOrderItem.color = returnItem.orderItem.productItem.product.color && returnItem.orderItem.productItem.product.color.colorway ? returnItem.orderItem.productItem.product.color.colorway : null;
                originalOrderItem.size = returnItem.orderItem.productItem.product.sku && returnItem.orderItem.productItem.product.sku.split('-') && returnItem.orderItem.productItem.product.sku.split('-')[2] ? returnItem.orderItem.productItem.product.sku.split('-')[2] : null;
                var originalItemPriceTotal = returnItem.orderItem.productItem.product.prices && returnItem.orderItem.productItem.product.prices.total ? returnItem.orderItem.productItem.product.prices.total : 0.0;
                var originalTaxPerUnit = returnItem.orderItem.productItem.product.prices && returnItem.orderItem.productItem.product.prices.tax ? returnItem.orderItem.productItem.product.prices.tax : 0.0;
                var originalItemNetPricePerUnit = originalItemPriceTotal - originalTaxPerUnit;
                var originalLineItemTotalPrice = originalItemNetPricePerUnit * returnItem.orderItem.productItem.quantity;
                originalOrderItem.price = StringUtils.formatMoney(new Money(originalLineItemTotalPrice, node.currency));
                originalOrderItem.pricePerUnit = StringUtils.formatMoney(new Money(originalItemNetPricePerUnit, node.currency));
                originalOrderItem.fulfillmentStatus = returnItem.fulfillmentStatus;
                originalOrderItem.url = URLUtils.url('Product-Show', 'pid', productID).toString();
                originalOrderItem.shippedTo = originalOrder.returnOrder.shippingAddress && originalOrder.returnOrder.shippingAddress.fullName ? originalOrder.returnOrder.shippingAddress.fullName : null;
                originalOrderItem.shippingAddress = originalOrder.returnOrder.shippingAddress ? originalOrder.returnOrder.shippingAddress : null;
                originalItemCount += returnItem.orderItem.productItem.quantity;
                originalPrice += returnItem.price;
                originalItemTax += returnItem.tax;
                originalOrderTotal += (returnItem.price + returnItem.tax);
                originalOrderItem.quantity = returnItem.orderItem.productItem.quantity;
                originalOrderItem.shipmentId = returnItem && returnItem.shipmentId ? returnItem.shipmentId : null;
                originalOrderItem.returnReason = orderReturnReasonModel[returnItem.returnReason] ? orderReturnReasonModel[returnItem.returnReason] : returnItem.returnReason;
                originalOrderItem.exchangeItem = false;
                originalOrderItems.push(originalOrderItem);
            }
        });
    });
    order.originalOrderItems = originalOrderItems;
    order.itemCount = itemCount;
    order.price = price;
    order.orderTotal = orderTotal;
    order.itemTax = itemTax;
    order.shippingMethod = shippingMethod;
    order.originalItemCount = originalItemCount;
    order.originalPrice = originalPrice;
    order.originalOrderTotal = originalOrderTotal;
    order.originalItemTax = originalItemTax;
    order.originalShippingMethod = originalShippingMethod;
    order.orderItems = orderItems;
    return order;
}

module.exports = ExchangeDetailsModel;
