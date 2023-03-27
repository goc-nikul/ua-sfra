'use strict';

var Logger = require('dw/system/Logger').getLogger('Loyalty');
const loyaltyHelper = require('int_loyalty/cartridge/scripts/helpers/loyaltyHelper');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');

/**
 executes the job
 */
function execute() {
    /** Runs all the orders containing the custom attribute loyaltyCouponNotUpdated = true
    * and loyaltyCouponUpdateRetries with a value less than 5
    * @param {Object} order - order to be checked
    */
    function processOrderCallback(order) {
        var loyaltyCoupons = loyaltyHelper.getLoyaltyCouponsFromLineItemCtnr(order);
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
                Logger.error('Error while updating the coupon status at LoyaltyPlus');
            }
        }
    }
    var query = 'custom.loyaltyCouponUpdateRetries < 5 ' +
        'AND custom.loyaltyCouponNotUpdated = true ';
    OrderMgr.processOrders(processOrderCallback, query);
}
module.exports.execute = execute;
