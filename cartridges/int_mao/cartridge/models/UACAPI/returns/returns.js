'use strict';

var StringUtils = require('dw/util/StringUtils');
var StatusHelper = require('*/cartridge/scripts/UACAPI/helpers/util/utilHelper');
var OrderItemsHelper = require('*/cartridge/scripts/UACAPI/helpers/order/orderItemsHelper');
var Calendar = require('dw/util/Calendar');

/**
 * Order class that represents the current order
 * @param {Object} customerOrders - The current order's line items
 * @return {Object} Return orders model
 */
function ReturnsModel(customerOrders) {
    var returnsModel = [];
    var orderStatusModel = StatusHelper.rmaStatusModel();
    var orderStatusMapping = StatusHelper.rmaStatusMapping();
    Object.keys(customerOrders.edges).forEach(function (edge) {
        var currentEdge = customerOrders.edges[edge];
        var node = currentEdge.node;
        var order = {};
        order.rmaNumber = node.rmaNumber;
        order.creationDate = StringUtils.formatCalendar(new Calendar(new Date(node.creationDate)), 'MM/dd');
        order.hasExchangeOrder = false;
        var exchangeOrder = node.exchangeOrder;
        if (exchangeOrder) {
            order.hasExchangeOrder = true;
            order.exchangeOrderNo = exchangeOrder.orderNo;
            order.exchangeCreationDate = StringUtils.formatCalendar(new Calendar(new Date(exchangeOrder.creationDate)), 'MM/dd/yyyy');
        }
        var orderItems = [];
        var listOfReturnItems = OrderItemsHelper.mergeDuplicateReturnItems(node.returnItems);
        Object.keys(listOfReturnItems).forEach(function (returnItem) {
            var currentOrderItem = listOfReturnItems[returnItem];
            if (currentOrderItem && currentOrderItem.orderItem && currentOrderItem.orderItem.productItem) {
                var productItem = currentOrderItem.orderItem.productItem;
                var product = productItem.product;
                var item = {};
                item.name = product.copy.name;
                item.sku = product.sku;
                item.upc = product.upc;
                item.imageUrl = product.assets && product.assets.images && product.assets.images.length > 0 ? product.assets.images[0].url : null;
                item.color = product.color;
                item.fulfillmentStatus = currentOrderItem.fulfillmentStatus;
                item.rmaItemStatus = currentOrderItem.rmaItemStatus;
                orderItems.push(item);
            }
        });
        order.orderItems = orderItems;
        if (orderItems && orderItems.length > 4) {
            order.moreItemsCount = orderItems.length - 4;
        }
        if (orderItems && orderItems.length > 3) {
            order.moreItemsCountOnMobile = orderItems.length - 3;
        }
        order.status = orderStatusMapping[node.rmaStatus] ? orderStatusMapping[node.rmaStatus] : node.rmaStatus;
        order.displayStatus = orderStatusModel[order.status] ? orderStatusModel[order.status] : node.rmaStatus;
        returnsModel.push(order);
    });
    return returnsModel;
}

module.exports = ReturnsModel;
