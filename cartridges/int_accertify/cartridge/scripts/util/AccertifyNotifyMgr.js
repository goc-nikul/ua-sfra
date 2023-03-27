'use strict';

/**
 * Script file AccertifyNotifyMgr provide functionality to work with custom object AccertifyNotify
 */

/* API Includes */
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');
var Log = Logger.getLogger('int.accertify');

/* Global variables */
var OrderNotifyType = 'AccertifyNotify';

/* eslint-disable no-param-reassign */
/* eslint-disable no-loop-func */

module.exports = {

    /**
     * Save order data to the CustomObject
     * @param {dw.order.Order} orderNo - order number
     * @param {Object} orderData - Additional order data
     * @returns {boolean} - Custom object creation status
     */
    saveNotifyCO: function (orderNo, orderData) {
        var co = this.getNotifyCO(orderNo);

        if (empty(co)) {
            try {
                Transaction.wrap(function () {
                    co = CustomObjectMgr.createCustomObject(OrderNotifyType, orderNo);
                    co.custom.notifyData = orderData;
                    co.custom.isProcessed = false;
                });
            } catch (e) {
                Log.error('Can not create {1} custom object for order {0}. Error: {2}.', orderNo, OrderNotifyType, e);
                return false;
            }
        } else {
            Log.error('Record for order No{0} already exist', orderNo);
        }

        return true;
    },

    /**
     * Find Custom Object by order number
     * @param {string} orderNo - Order number
     * @returns {CustomObject} - Custom Object
     */
    getNotifyCO: function (orderNo) {
        return CustomObjectMgr.getCustomObject(OrderNotifyType, orderNo);
    },

    /**
     * Returns Collection of the Custom Object
     * @param {boolean} status - isProcessed status
     * @returns {Iterator} - Custom Objects with unprocessed orders
     */
    getAllNotifyCO: function (status) {
        var isProcessed = !!status;

        return CustomObjectMgr.queryCustomObjects(OrderNotifyType, 'custom.isProcessed = {0}', null, isProcessed);
    },

    /**
     * Removes given Custom Object
     */
    deleteNotifyCO: function () {
        // Get all Custom Objects with status isProcessed
        var customObjects = this.getAllNotifyCO(true);

        // Delete Custom Objects
        while (customObjects.hasNext()) {
            var co = customObjects.next();
            try {
                Transaction.wrap(function () {
                    CustomObjectMgr.remove(co);
                });
            } catch (e) {
                Log.error('Can not remove custom object for order {0}. Error: {1}.', co.custom.orderNo, e);
            }
        }

        return;
    },

    /**
     * Mark given Custom Object as processed
     * @param {CustomObject} co - Custom Object
     */
    updateNotifyStatus: function (co) {
        if (!empty(co)) {
            try {
                Transaction.wrap(function () {
                    co.custom.isProcessed = true;
                });
            } catch (e) {
                Log.error('Can not set custom.isProcessed. Error: {0}', e);
            }
        }
    }
};
