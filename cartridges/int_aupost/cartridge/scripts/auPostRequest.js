/* eslint-disable  no-undef */
/* eslint-disable  no-param-reassign */
'use strict';

var Site = require('dw/system/Site');

/**
 * Build Order Including Shipment Request
 * @param {dw.order.Order} order - order
 * @param {Object} returnItemsInfo - returnItemsInfo
 * @returns {Object} an object that has payment request information
 */
function getOrderIncludingShipmentRequest(order, returnItemsInfo) {
    var Calendar = require('dw/util/Calendar');
    var StringUtils = require('dw/util/StringUtils');
    var createOrderIncludingShipmentRequest = {};
    var orderNo = order.getOrderNo();
    createOrderIncludingShipmentRequest.order_reference = orderNo;
    var aupostConfigrations = JSON.parse(Site.getCurrent().getCustomPreferenceValue('aupostConfigurations'));
    var movementType = aupostConfigrations.movementType;
    var shipments = [];
    var shipmentReq = {};
    var calendar = new Calendar();
    shipmentReq.shipment_reference = orderNo + '-' + StringUtils.formatCalendar(calendar, 'YYYYMMDDhhmmssSSS');
    var customerReference1 = '';
    // var customerReference2 = '';
    var senderReference = [];
    var allReturnedProductInfo = '';
    for (var i = 0; i < returnItemsInfo.length; i++) {
        var returnItemInfo = returnItemsInfo[i];
        allReturnedProductInfo += returnItemInfo.returnPid + '-' + returnItemInfo.returnQuantity + ',';
    }
    allReturnedProductInfo = allReturnedProductInfo.substr(0, allReturnedProductInfo.length - 1);
    customerReference1 = allReturnedProductInfo.substr(0, 50);
    // customerReference2 = allReturnedProductInfo.substr(50, 100);
    senderReference.push(orderNo, customerReference1);
    // AusPost API call structure Update for Print orderNo on label

    /*
    customerReference2 = allReturnedProductInfo.substr(50, 100);
    shipmentReq.customer_reference_1 = customerReference1;
    if (!empty(customerReference2)) {
        shipmentReq.customer_reference_2 = customerReference2;
    }
    */

    shipmentReq.sender_references = senderReference;
    shipmentReq.movement_type = movementType;
    shipmentReq.from = JSON.parse(Site.current.getCustomPreferenceValue('returnFromAddress'));
    shipmentReq.to = JSON.parse(Site.current.getCustomPreferenceValue('returnAddress'));
    shipmentReq.to.delivery_instructions += orderNo;
    var items = [];
    var itemReq = {};
    var productId = aupostConfigrations.chargeCode;
    itemReq.product_id = productId;
    itemReq.authority_to_leave = aupostConfigrations.authorityToLeave;
    itemReq.allow_partial_delivery = aupostConfigrations.deliverPartConsignment;
    itemReq.safe_drop_enabled = aupostConfigrations.safeDropEnabled;
    itemReq.contains_dangerous_goods = aupostConfigrations.containsDangerousGoods;
    items.push(itemReq);
    shipmentReq.items = items;
    shipments.push(shipmentReq);
    createOrderIncludingShipmentRequest.shipments = shipments;
    return createOrderIncludingShipmentRequest;
}

/**
 *Create Label Request
 * @param {dw.order.Order} shipmentID - shipmentID
 * @returns {Object} an object that has Create Label Request
 */
function createLabelRequest(shipmentID) {
    var aupostConfigrations = JSON.parse(Site.getCurrent().getCustomPreferenceValue('aupostConfigurations'));
    var labelRequest = {};
    labelRequest.wait_for_label_url = true;
    var preferences = [];
    var prefReq = {};
    prefReq.type = aupostConfigrations.requestType;
    var groups = [];
    var groupsObj = {};
    groupsObj.group = aupostConfigrations.templateName;
    groupsObj.layout = aupostConfigrations.layout;
    groupsObj.branded = aupostConfigrations.branding;
    groupsObj.left_offset = aupostConfigrations.leftOffset;
    groupsObj.top_offset = aupostConfigrations.topOffset;
    groups.push(groupsObj);
    prefReq.groups = groups;
    preferences.push(prefReq);
    var shipments = [];
    var shipmentReq = {};
    shipmentReq.shipment_id = shipmentID;
    shipments.push(shipmentReq);
    labelRequest.preferences = preferences;
    labelRequest.shipments = shipments;
    return labelRequest;
}

module.exports = {
    getOrderIncludingShipmentRequest: getOrderIncludingShipmentRequest,
    createLabelRequest: createLabelRequest
};
