'use strict';

var StringUtils = require('dw/util/StringUtils');
var URLUtils = require('dw/web/URLUtils');
var StatusHelper = require('*/cartridge/scripts/util/utilHelper');
var OrderItemsHelper = require('*/cartridge/scripts/order/orderItemsHelper');
const Money = require('dw/value/Money');
var Calendar = require('dw/util/Calendar');

/**
 * Order class that represents the current order
 * @param {Object} node - The current order line items
 * @return {Object} Return orders model
 */
function ReturnDetailsModel(node) {
    var orderStatusModel = StatusHelper.rmaStatusModel();
    var order = {};
    order.orderNo = node.returnOrder ? node.returnOrder.orderNo : null;
    order.rmaNumber = node.rmaNumber;
    order.creationDate = StringUtils.formatCalendar(new Calendar(new Date(node.creationDate)), 'MM/dd');
    var orderItems = [];
    var itemCount = 0;
    var price = 0;
    var orderTotal = 0;
    var itemTax = 0;
    var shippingMethod;
    var listOfReturnItems = OrderItemsHelper.mergeDuplicateReturnItems(node.returnItems);
    Object.keys(listOfReturnItems).forEach(function (returnItem) {
        var currentOrderItem = listOfReturnItems[returnItem];
        if (currentOrderItem && currentOrderItem.orderItem && currentOrderItem.orderItem.productItem) {
            var productItem = currentOrderItem.orderItem.productItem;
            shippingMethod = currentOrderItem.shippingMethod;
            var product = productItem.product;
            var quantity = productItem.quantity;
            var productID = product.sku && product.sku.split('-') && product.sku.split('-')[0] ? product.sku.split('-')[0] : product.sku;
            var item = {};
            item.returnItem = true;
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
            item.price = StringUtils.formatMoney(new Money(lineItemTotalPrice, node.currency));
            item.pricePerUnit = StringUtils.formatMoney(new Money(itemNetPricePerUnit, node.currency));
            item.fulfillmentStatus = currentOrderItem.fulfillmentStatus;
            item.url = URLUtils.url('Product-Show', 'pid', productID).toString();
            item.shippedTo = node.shippingAddress && node.shippingAddress.fullName ? node.shippingAddress.fullName : null;
            item.shippingAddress = node.shippingAddress ? node.shippingAddress : null;
            itemCount += quantity;
            price += lineItemTotalPrice;
            itemTax += lineItemTotalTax;
            orderTotal += (lineItemTotalPrice + lineItemTotalTax);
            item.quantity = quantity;
            item.lineItemNumber = currentOrderItem && currentOrderItem.lineItemNumber ? currentOrderItem.lineItemNumber : null;
            item.shipmentId = currentOrderItem && currentOrderItem.shipmentId ? currentOrderItem.shipmentId : null;
            item.returnReason = currentOrderItem.returnReason;
            orderItems.push(item);
        }
    });
    order.orderItems = orderItems;
    order.status = node.rmaStatus;
    order.displayStatus = orderStatusModel[node.rmaStatus] ? orderStatusModel[node.rmaStatus] : node.rmaStatus;
    order.fulfillmentStatus = null;
    order.shippedItems = null;
    order.shipment = node.returnShipment[0];
    var refundEstimated = node.refundEstimated || null;
    var refundEstimatedSubtotal = refundEstimated && refundEstimated.subtotal ? refundEstimated.subtotal : price;
    var refundEstimatedTaxTotal = refundEstimated && refundEstimated.tax ? refundEstimated.tax : itemTax;
    var refundEstimatedOrderTotal = refundEstimated && refundEstimated.total ? refundEstimated.total : orderTotal;
    var refundSubtotal = node.refundProcessed && node.refundProcessed.subtotal ? node.refundProcessed.subtotal : refundEstimatedSubtotal;
    var refundOrderTotal = node.refundProcessed && node.refundProcessed.total ? node.refundProcessed.total : refundEstimatedOrderTotal;
    var refundTaxTotal = node.refundProcessed && node.refundProcessed.tax ? node.refundProcessed.tax : refundEstimatedTaxTotal;
    order.subTotal = StringUtils.formatMoney(new Money(refundSubtotal, node.currency));
    order.orderTotal = StringUtils.formatMoney(new Money(refundOrderTotal, node.currency));
    order.itemCount = itemCount;
    order.taxTotal = StringUtils.formatMoney(new Money(refundTaxTotal, node.currency));
    order.shippingTotal = null;
    order.shippingMethod = shippingMethod;
    order.currencyCode = node.currency;
    order.billingAddress = node.returnOrder && node.returnOrder.billingAddress ? node.returnOrder.billingAddress : null;
    order.customerInfo = node.customerInfo ? node.customerInfo : null;

    return order;
}

module.exports = ReturnDetailsModel;
