'use strict';

/**
 * Job Script, Process Pending Fraud Orders
 */

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var Logger = require('dw/system/Logger');
var Log = Logger.getLogger('int.accertify');

/* Script Modules */
var AccertifyNotifyMgr = require('int_accertify/cartridge/scripts/util/AccertifyNotifyMgr');
var AccertifyOrderHelper = require('int_accertify/cartridge/scripts/util/AccertifyOrderHelper');

/**
 * Update Orders, based on "AccertifyNotify" Custom Objects data
 */
function process() {
    var customObjects = AccertifyNotifyMgr.getAllNotifyCO();
    var accertifyOrderHelper = new AccertifyOrderHelper();

    while (customObjects.hasNext()) {
        var co = customObjects.next();
        var order = OrderMgr.getOrder(co.custom.orderNo);
        var notifyData = {};

        if (order) {
            try {
                notifyData = JSON.parse(co.custom.notifyData)[0];
            } catch (e) {
                Log.error('Can not parse JSON: {0}', e.message);
            }

            if (Object.keys(notifyData).length) {
                if (accertifyOrderHelper.addCONotificationData(order, notifyData)) {
                    AccertifyNotifyMgr.updateNotifyStatus(co);
                }

                accertifyOrderHelper.changeOrderStatus(order);
            }
        }
    }
}

/**
 * Remove processed "AccertifyNotify" Custom Objects
 */
function clear() {
    AccertifyNotifyMgr.deleteNotifyCO();
}

module.exports = {
    process: process,
    clear: clear
};
