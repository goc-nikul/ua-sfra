/**
 * Reject Cacnclled Order Coupons -
 * this would be called in the event an order was cancelled and we need to revert L+ points
 * Note: coupons are note removed from Order, we are just rejecting them in L+ so the customer
 * gets their points back.
 * @param {dw.order.Order} order - order to check for coupons
 * @returns {boolean} - Successfull
 */
function rejectCancelledOrderCoupons(order) {
    const Logger = require('dw/system/Logger').getLogger('loyalty', 'Loyalty');
    const { LOYALTY_PREFIX } = require('*/cartridge/scripts/LoyaltyConstants');
    const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
    const Order = require('dw/order/Order');

    if (!empty(order) && order.status.value !== Order.ORDER_STATUS_CANCELLED) {
        return false;
    }

    if ('couponLineItems' in order && order.couponLineItems.length > 0) {
        for (var i = 0; i < order.couponLineItems.length; i++) {
            if (order.couponLineItems[i].couponCode.indexOf(LOYALTY_PREFIX) !== -1) {
                var rejectRewardResult = loyaltyHelper.rejectReward(order.couponLineItems[i].couponCode, order.customerNo);
                if (!rejectRewardResult) {
                    Logger.error('Coupon for order {0} is not successfully rejected', order.getOrderNo());
                }
            }
        }
    }

    return true;
}

/**
 * This function is called from MAO Order-Export to
 * update order with Loyalty points estimate, mark loyalty coupons as USED
 * The order will be Cancelled if the order contains invalid coupons
 * If the service cannot be reached, the order will be flagged to retry.
 * @param {dw.order.Order} order object
 * @return {boolean} updateLoyaltyCoupon - returns true if coupon is updated, else false
 */
function processLoyaltyOrder(order) {
    const Logger = require('dw/system/Logger').getLogger('loyalty', 'Loyalty');
    const Transaction = require('dw/system/Transaction');
    const OrderMgr = require('dw/order/OrderMgr');
    const Order = require('dw/order/Order');
    const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
    let orderObj = order;

    // ensure we have a loyalty order and return true so order export can proceed
    let isLoyaltyCustomerOrder = ('customerGroups' in orderObj.custom
                                    && !empty(orderObj.custom.customerGroups)
                                    && orderObj.custom.customerGroups.toLowerCase().split(/\s*,\s*/).includes('loyalty'));

    if (!orderObj || !isLoyaltyCustomerOrder) {
        return true;
    }

    // Update Estimated Points
    try {
        let estRes = loyaltyHelper.updateBasketBallance(orderObj, orderObj.customerNo);
        if (!estRes) {
            Logger.error('Loyalty OrderExport.updateLoyaltyCoupon Error :: {0}');
        }
    } catch (e) {
        Logger.error('Error while calling the estimation points API during place order :: {0}', e.message);
    }

    // Consume coupons
    try {
        let loyaltyCoupons = loyaltyHelper.getLoyaltyCouponsFromLineItemCtnr(orderObj);

        // Do nothing if we don't have loyalty coupons
        if (empty(loyaltyCoupons) || loyaltyCoupons.length === 0) {
            return true;
        }

        // Consume Coupons in L+
        let updateCouponResponse = loyaltyHelper.updateCoupon(loyaltyCoupons, orderObj.customerNo);

        // Flag the order, and retry later
        if (!updateCouponResponse || !updateCouponResponse.ok) {
            Logger.warn('Loyalty Service could not be reached, will retry.');
            Transaction.begin();
            orderObj.custom.loyaltyCouponNotUpdated = true;
            orderObj.custom.loyaltyCouponUpdateRetries = 0;
            Transaction.commit();
            return true;
        }

        // Order OK
        if (updateCouponResponse.object && updateCouponResponse.object.couponUpdated) {
            Logger.info('Coupon Status updated successfully');
            return true;
        }

        // Fail Order
        Transaction.begin();
        OrderMgr.cancelOrder(orderObj);
        orderObj.setExportStatus(Order.EXPORT_STATUS_FAILED);
        orderObj.addNote('Order Failed Reason', 'The coupons provided could not be marked as "USED" in Loyalty Plus as they were either invalid or missing. All coupons in this order will be rejected in Loyalty Plus.');
        Transaction.commit();

        // Revert Points
        rejectCancelledOrderCoupons(orderObj);

        return false;
    } catch (e) {
        Logger.error('Loyalty OrderExport.updateLoyaltyCoupon Error :: {0}', e.message);
    }

    return false;
}

module.exports = {
    processLoyaltyOrder: processLoyaltyOrder,
    rejectCancelledOrderCoupons: rejectCancelledOrderCoupons
};
