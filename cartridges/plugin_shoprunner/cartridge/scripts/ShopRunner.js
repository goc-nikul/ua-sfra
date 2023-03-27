'use strict';

/* API includes */
var BasketMgr = require('dw/order/BasketMgr');
var CartModel = require('*/cartridge/models/cart');
var currentBasket = BasketMgr.getCurrentBasket();
var Transaction = require('dw/system/Transaction');

/**
 * Hooks from COCustomer use this controller to select either the regular
 * shipping controller or the multiship controller
 * @return {string} - cart eligibility
 */
function checkoutMethod() {
    var cart;
    var Status;
    cart = new CartModel(currentBasket);
    if (!empty(session.custom.srtoken)) {
        Status = require('int_shoprunner/cartridge/scripts/checkout/CheckCartEligibility').checkEligibility(cart);
    }
    return Status;
}

/**
 * If a user is logged in to ShopRunner, this checks if their basket
 * qualifies and checks against the mixed order preference
 * @return {string} - cart eligibility
 */
function eligibleBasket() {
    var srtoken = require('int_shoprunner/cartridge/scripts/checkout/GetShopRunnerToken').getToken();
    var cart;
    var Status;
    if (empty(session.custom.srtoken || empty(srtoken))) {
        return;
    } else {  // eslint-disable-line
        cart = new CartModel(currentBasket);
        Status = require('int_shoprunner/cartridge/scripts/checkout/CheckCartEligibility').checkEligibility(cart);
        return Status;  // eslint-disable-line
    }
}

/**
 * @param {dw.order} order - Order
 * Simple controller for save the ShopRunner Order Token
 */
function saveOrderToken(order) {
    Transaction.wrap(function () {
        require('int_shoprunner/cartridge/scripts/checkout/SaveShopRunnerOrderToken').saveToken(session, order);
    });
    return;
}

/**
 * server.append('PlaceOrder')
 * @param {Object} res - res
 * Defined here so that we can effectively call this 'controller' via ShopRunner-PayrunnerAPI
 */
function placeOrderAppend(res) {
    var viewData = res.getViewData();
    var Site = require('dw/system/Site');

    if (!viewData.error && Site.getCurrent().getCustomPreferenceValue('sr_enabled')) {
        var OrderMgr = require('dw/order/OrderMgr');
        var order = OrderMgr.getOrder(viewData.orderID);
        saveOrderToken(order);
    }
}

module.exports = {
    CheckoutMethod: checkoutMethod,
    EligibleBasket: eligibleBasket,
    PlaceOrderAppend: placeOrderAppend
};
