'use strict';

var StringUtils = require('dw/util/StringUtils');
var StatusHelper = require('*/cartridge/scripts/UACAPI/helpers/util/utilHelper');
var orderUtils = require('app_ua_core/cartridge/scripts/util/OrderUtils');
const Money = require('dw/value/Money');
var Calendar = require('dw/util/Calendar');
var System = require('dw/system/System');
var Site = require('dw/system/Site');
var ProductMgr = require('dw/catalog/ProductMgr');
var StoreMgr = require('dw/catalog/StoreMgr');

/**
 * Order class that represents the current order
 * @param {Object} customerOrders - The current order's line items
 * @return {Object} Return orders model
 */
function OrderModel(customerOrders) {
    var orderModel = [];
    var orderDeliverThresholdDays = !empty(Site.current.getCustomPreferenceValue('orderDeliverThresholdDays')) ? Site.current.getCustomPreferenceValue('orderDeliverThresholdDays') : 15;
    var isAccountDashBoard = request.httpPath.indexOf('Account-Show') !== -1 ? true : false;  // eslint-disable-line
    var orderStatusModel = StatusHelper.orderStatusModel();
    var fulfillmentStatus = StatusHelper.fulfillmentStatus();
    var bopisStatusMapping = StatusHelper.bopisStatusMapping();
    var bopisFulfillmentStatus = StatusHelper.bopisOrderStatus();
    var orderStatusMapping = StatusHelper.orderStatusMapping();
    Object.keys(customerOrders.edges).forEach(function (edge) {
        var currentEdge = customerOrders.edges[edge];
        var node = currentEdge.node;
        // set date one year back from current data
        var currentCalendar = System.getCalendar();
        currentCalendar.add(Calendar.YEAR, -1);
        var oneYearOldCalender = currentCalendar;
        var orderStatus = orderStatusMapping[node.status] ? orderStatusMapping[node.status] : node.status;
        var bopisOrderStatus = '';
        var isOrderHasBopisItems = false;
        var bopisItemsCount = 0;
        var bopisItemsOnly = false;
        var orderCreationDate = StringUtils.formatCalendar(new Calendar(new Date(node.creationDate)), 'MM/dd/yyyy');
        if (isAccountDashBoard && new Calendar(new Date(orderCreationDate)).before(oneYearOldCalender)) {
            return;
        }
        var order = {};
        order.orderNo = node.orderNo;
        order.creationDate = orderCreationDate;
        var orderItems = [];
        var itemDeliveredCount = 0;
        var ItemShipedStatusCount = 0;
        var isOrderConsiderDelivered = false;
        if (isAccountDashBoard && (orderStatus === 'PARTIAL_SHIPPED' || orderStatus === 'SHIPPED')) {
            var noOfDays = Math.floor((System.getCalendar().getTime().getTime() - new Date(orderCreationDate).getTime()) / (1000 * 60 * 60 * 24));
            if (noOfDays > orderDeliverThresholdDays) {
                isOrderConsiderDelivered = true;
            }
        }
        Object.keys(node.orderItems).forEach(function (orderItem) {
            var currentOrderItem = node.orderItems[orderItem];
            var productItem = currentOrderItem.productItem;
            var product = productItem.product;
            if (isAccountDashBoard && (orderStatus === 'DELIVERED' && !(ProductMgr.getProduct(product.upc) != null && ProductMgr.getProduct(product.upc).online))) {
                return;
            }
            if (currentOrderItem.fulfillmentStatus === 'DELIVERED') {
                itemDeliveredCount++;
            }
            if (currentOrderItem.fulfillmentStatus === 'SHIPPED') {
                ItemShipedStatusCount++;
            }
            if (currentOrderItem.storeId && !empty(currentOrderItem.storeId)) {
                isOrderHasBopisItems = true;
                bopisItemsCount++;
                if (empty(bopisOrderStatus)) {
                    bopisOrderStatus = bopisStatusMapping[currentOrderItem.fulfillmentStatus] || currentOrderItem.fulfillmentStatus;
                }
            }
            var item = {};
            item.name = product.copy.name;
            item.sku = product.sku;
            item.upc = product.upc;
            let itemImage = orderUtils.getLineItemImage(product);
            item.imageUrl = itemImage.imageUrl;
            item.imgAlt = itemImage.altText;
            item.color = product.color;
            item.fulfillmentStatus = currentOrderItem.fulfillmentStatus;
            item.store = !empty(currentOrderItem.storeId) ? StoreMgr.getStore(currentOrderItem.storeId) : null;
            item.shipmentId = currentOrderItem.shipmentId;
            orderItems.push(item);
        });
        if (isAccountDashBoard && (orderStatus === 'PARTIAL_SHIPPED' || orderStatus === 'SHIPPED')) {
            order.orderItems = reOrderItems(orderItems, ItemShipedStatusCount, itemDeliveredCount); // eslint-disable-line
        } else {
            order.orderItems = orderItems;
        }
        if (orderItems && orderItems.length > 4) {
            order.moreItemsCount = orderItems.length - 4;
        }
        if (orderItems && orderItems.length > 3) {
            order.moreItemsCountOnMobile = orderItems.length - 3;
        }
        if (orderItems && (orderItems.length === bopisItemsCount)) {
            bopisItemsOnly = true;
        }
        order.status = orderStatus;
        order.displayStatus = orderStatusModel[orderStatus] ? orderStatusModel[orderStatus] : orderStatus;
        order.bopisOrderStatus = bopisOrderStatus;
        order.bopisDisplayStatus = bopisFulfillmentStatus[bopisOrderStatus] ? bopisFulfillmentStatus[bopisOrderStatus] : bopisOrderStatus;
        order.isOrderHasBopisItems = isOrderHasBopisItems;
        order.bopisItemsOnly = bopisItemsOnly;
        var orderFulfillmentStatus = node.fulfillmentGroups[0].fulfillmentStatus;
        order.fulfillmentStatus = orderFulfillmentStatus;
        order.fulfillmentDisplayStatus = fulfillmentStatus[orderFulfillmentStatus] ? fulfillmentStatus[orderFulfillmentStatus] : orderFulfillmentStatus;
        order.shippedItems = node.fulfillmentGroups[0].items.length;
        order.deliveredItems = itemDeliveredCount;
        order.ItemShipedStatusCount = ItemShipedStatusCount;
        order.isOrderConsiderDelivered = isOrderConsiderDelivered;
        order.shipment = node.fulfillmentGroups[0].shipment;
        order.orderTotal = StringUtils.formatMoney(new Money(node.orderTotal, node.currency));
        if ((isAccountDashBoard && order.orderItems.length > 0) || !isAccountDashBoard) {
            orderModel.push(order);
        }
    });
    return orderModel;
}
/**
 * rearrange the order if order status partial shipped or shipped
 * @Param {Object} orderItems - order Items
 * @Param {number} shippedCount -shipped Count
 * @Param {number} DeliveredCount -DeliveredCount
 * @return {Object} order Items
 */
function reOrderItems(orderItems, shippedCount, DeliveredCount) {
    var compareStatus = 'SHIPPED';
    if ((DeliveredCount > 0 && shippedCount === 0) || (orderItems[0].fulfillmentStatus === 'SHIPPED')) {
        compareStatus = 'DELIVERED';
    }
    for (var i = 0; i < orderItems.length; i++) {
        if (orderItems[0].fulfillmentStatus === 'SHIPPED') {
            compareStatus = 'DELIVERED';
        }
        if (orderItems[0].fulfillmentStatus === 'SHIPPED' && i === 0) {
    	    continue; // eslint-disable-line
        }
        for (var j = i; j < orderItems.length; j++) {
            if (orderItems[j].fulfillmentStatus === compareStatus) {
                var temp = orderItems[i];
                orderItems[i] = orderItems[j]; // eslint-disable-line
                orderItems[j] = temp; // eslint-disable-line
            }
        }
    }
    return orderItems;
}
module.exports = OrderModel;
