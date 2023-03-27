/* globals session, empty */

'use strict';

var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');

/**
 * Atome Checkout Session Model
 *
 * When a new Atome checkout is created, an order is created as well.
 * The order id is then saved within the current session.
 * When the redirection is handled from Atome, the code must fail the session order,
 * even if its different from the order referenced by the Atome checkout,
 * so the redirect back to checkout works.
 */
var AtomeCheckoutSessionHelper = {
    /**
     * Indicates if the session contains a Atome order id.
     *
     * @returns {boolean} true, if session contains Atome order id.
     */
    hasAtomeOrder: function () {
        return (!empty(session.privacy.AtomeOrderId));
    },
    /**
     * Remove Atome order.
     */
    removeAtomeOrder: function () {
        session.privacy.AtomeOrderId = null;
    },
    /**
     * Fail Atome Order and remove it from session.
     *
     */
    failAtomeOrder: function () {
        var sessionOrder = OrderMgr.getOrder(session.privacy.AtomeOrderId);

        if (!empty(sessionOrder) && sessionOrder.getStatus().value === sessionOrder.ORDER_STATUS_CREATED) {
            Transaction.wrap(function () {
                try {
                    if (Object.prototype.hasOwnProperty.call(sessionOrder.custom, 'Loyalty-VoucherName') && !empty(sessionOrder.custom['Loyalty-VoucherName'])) {
                        var loyaltyVoucherName = sessionOrder.custom['Loyalty-VoucherName'].split('=')[1];
                        var HookMgr = require('dw/system/HookMgr');
                        if (HookMgr.hasHook('app.memberson.UnUtilizeMemberVoucher')) {
                            HookMgr.callHook('app.memberson.UnUtilizeMemberVoucher', 'unUtilizeMemberVoucher', sessionOrder, loyaltyVoucherName);
                        }
                    }
                } catch (e) {
                    var Logger = require('dw/system/Logger');
                    Logger.error('Unable to unutlize Loyalty voucher ' + e.message + e.stack);
                }
                OrderMgr.failOrder(sessionOrder, true);
            });
        }
        var BasketMgr = require('dw/order/BasketMgr');
        var currentBasket = BasketMgr.getCurrentBasket();
        if (currentBasket) {
            Transaction.wrap(function () {
                var atomePaymentInstrument = currentBasket.getPaymentInstruments('ATOME_PAYMENT');

                if (!empty(atomePaymentInstrument)) {
                    currentBasket.removePaymentInstrument(atomePaymentInstrument[0]);
                }
            });
        }

        this.removeAtomeOrder();
    },
    /**
     * Save Atome order in session.
     *
     * @param {dw.order.Order} atomeOrder Atome Order
     */
    saveAtomeOrder: function (atomeOrder) {
        Transaction.wrap(function () {
            session.privacy.AtomeOrderId = atomeOrder.getOrderNo();
        });
    },
    /**
     * Retrieve atome order id from session.
     *
     * @returns {string} Atome Order Id.
     */
    getAtomeOrderId: function () {
        return session.privacy.AtomeOrderId;
    }
};

module.exports = AtomeCheckoutSessionHelper;
