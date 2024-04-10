'use strict';

var Logger = require('dw/system/Logger').getLogger('Loyalty');
const OrderMgr = require('dw/order/OrderMgr');
const Order = require('dw/order/Order');
const Transaction = require('dw/system/Transaction');

/**
 * Calls updateCoupon service and
 * updates order.custom.loyaltyCouponNotUpdated and
 * order.custom.loyaltyCouponUpdateRetries
 * based on couponUpdated response
* @param {Object} order - order to be checked
*/
function processOrderCallback(order) {
    const loyaltyHelper = require('int_loyalty/cartridge/scripts/helpers/loyaltyHelper');
    var loyaltyCoupons = loyaltyHelper.getLoyaltyCouponsFromLineItemCtnr(order);
    try {
        var customerNo = order.customerNo;
        if (!empty(loyaltyCoupons)) {
            var updateCouponResponse = loyaltyHelper.updateCoupon(loyaltyCoupons, customerNo);
            if (updateCouponResponse.ok && updateCouponResponse.object && updateCouponResponse.object.couponUpdated) {
                Transaction.begin();
                /* eslint-disable no-param-reassign */
                order.custom.loyaltyCouponNotUpdated = false;
                Transaction.commit();
                Logger.info('Coupon Status updated successfully');
            } else {
                Transaction.begin();
                order.custom.loyaltyCouponUpdateRetries++;
                Transaction.commit();
                Logger.error(' Unable to update Loyalty coupon status for order ' + order.orderNo);
            }
        }
    } catch (e) {
        Logger.error(e.message);
    }
}

/**
 * executes the job
 * @param {Object} params optional {startDate, endDate, retriesLimit}
 */
function execute(params) {
    const startDate = params && params.startDate ? new Date(params.startDate) : null;
    const endDate = params && params.endDate ? new Date(params.endDate) : null;
    const retriesLimit = params && params.retriesLimit ? params.retriesLimit : 5;

    var query = 'exportStatus = {0}' +
        ' AND custom.loyaltyCouponUpdateRetries < {1}' +
        ' AND custom.loyaltyCouponNotUpdated = true';

    if (startDate) {
        query += ' AND creationDate >= {2}';
    }

    if (endDate) {
        query += ' AND creationDate <= {3}';
    }

    OrderMgr.processOrders(processOrderCallback, query,
        Order.EXPORT_STATUS_EXPORTED,
        retriesLimit,
        startDate || '',
        endDate || ''
    );
}

module.exports.execute = execute;
module.exports.processOrderCallback = processOrderCallback;
