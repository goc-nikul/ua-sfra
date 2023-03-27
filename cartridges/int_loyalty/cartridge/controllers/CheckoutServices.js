'use strict';

var server = require('server');
var Logger = require('dw/system/Logger').getLogger('Loyalty');
const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
var BasketMgr = require('dw/order/BasketMgr');
server.extend(module.superModule);

server.append('PlaceOrder', server.middleware.https, function (req, res, next) {
    if (!loyaltyHelper.isLoyaltyEnabled() || !loyaltyHelper.isLoyalCustomer()) {
        return next();
    }
    var OrderMgr = require('dw/order/OrderMgr');
    var viewData = res.getViewData();
    var order = OrderMgr.getOrder(viewData.orderID);

    try {
        const estRes = loyaltyHelper.updateBasketBallance(order);
        if (!estRes) {
            res.setViewData({
                errorEstimateMsg: require('dw/web/Resource').msg('loyalty.error.earning.basket', 'loyalty', '')
            });
        }

        var loyaltyCoupons = loyaltyHelper.getLoyaltyCouponsFromLineItemCtnr(order);
        var customerNo = order.customerNo;
        if (!empty(loyaltyCoupons)) {
            var updateCouponResponse = loyaltyHelper.updateCoupon(loyaltyCoupons, customerNo);

            if (updateCouponResponse.ok && updateCouponResponse.object && updateCouponResponse.object.couponUpdated) {
                Logger.info('Coupon Status updated successfully');
            } else {
                const Transaction = require('dw/system/Transaction');
                Transaction.begin();
                order.custom.loyaltyCouponNotUpdated = true;
                order.custom.loyaltyCouponUpdateRetries = 0;
                Transaction.commit();
                Logger.error('Error while updating the coupon status at LoyaltyPlus');
            }
        }
    } catch (e) {
        Logger.error('Error while calling the estimation points API during place order :: {0}', e.message);
    }
    return next();
});

server.prepend('PlaceOrder', server.middleware.https, function (req, res, next) {
    if (!loyaltyHelper.isLoyaltyEnabled() || !loyaltyHelper.isLoyalCustomer()) {
        return next();
    }
    var currentBasket = BasketMgr.getCurrentBasket();
    try {
        loyaltyHelper.removeInvalidLoyaltyCoupons(currentBasket);
    } catch (e) {
        Logger.error('Error while removing invalid coupon code from basket before placing an order :: {0}', e.message);
    }
    return next();
});

module.exports = server.exports();
