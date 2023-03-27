/* globals session, empty */

'use strict';

var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');

/**
 * SafetyPay Checkout Session Model
 *
 * When a new SafetyPay checkout is created, an order is created as well.
 * The order id is then saved within the current session.
 * When the redirection is handled from SafetyPay, the code must fail the session order,
 * even if its different from the order referenced by the SafetyPay checkout,
 * so the redirect back to checkout works.
 */
var SafetypayCheckoutSessionHelper = {
    /**
     * Indicates if the session contains a SafetyPay order id.
     *
     * @returns {boolean} true, if session contains SafetyPay order id.
     */
    hasSafetypayOrder: function () {
        return (!empty(session.privacy.SafetypayOrderId));
    },
    /**
     * Remove SafetyPay order.
     */
    removeSafetypayOrder: function () {
        session.privacy.SafetypayOrderId = null;
    },
    /**
     * Fail SafetyPay Order and remove it from session.
     *
     */
    failSafetyPayOrder: function () {
        var sessionOrder = OrderMgr.getOrder(session.privacy.SafetypayOrderId);

        if (!empty(sessionOrder) && sessionOrder.getStatus().value === sessionOrder.ORDER_STATUS_CREATED) {
            Transaction.wrap(function () {
                OrderMgr.failOrder(sessionOrder, true);
            });
        }
        var BasketMgr = require('dw/order/BasketMgr');
        var currentBasket = BasketMgr.getCurrentBasket();
        if (currentBasket) {
            Transaction.wrap(function () {
                var safetyPayPaymentInstrument = currentBasket.getPaymentInstruments('AURUS_SAFETYPAY');

                if (!empty(safetyPayPaymentInstrument)) {
                    currentBasket.removePaymentInstrument(safetyPayPaymentInstrument[0]);
                }
            });
        }

        this.removeSafetypayOrder();
    },
    /**
     * Save Safetypay order in session.
     *
     * @param {dw.order.Order} safetyPayOrder Safetypay Order
     */
    saveSafetypayOrder: function (safetyPayOrder) {
        Transaction.wrap(function () {
            session.privacy.SafetypayOrderId = safetyPayOrder.getOrderNo();
        });
    },
    /**
     * Retrieve Safetypay order id from session.
     *
     * @returns {string} Safetypay Order Id.
     */
    getSafetypayOrderId: function () {
        return session.privacy.SafetypayOrderId;
    }
};

module.exports = SafetypayCheckoutSessionHelper;
