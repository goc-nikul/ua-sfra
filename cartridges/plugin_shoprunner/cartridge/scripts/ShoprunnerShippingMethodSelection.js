'use strict';

/**
 * If the user has just logged into ShopRunner, select ShopRunner's shipping
 * method
 *
 * If the user has just logged out, select the default shipping method if
 * ShopRunner was previously selected
 */
function shoprunnerShippingMethodSelection() {
    var BasketMgr = require('dw/order/BasketMgr');
    var ShippingMgr = require('dw/order/ShippingMgr');
    var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
    var SRHelper = require('~/cartridge/scripts/SRHelper');
    var Transaction = require('dw/system/Transaction');

    var currentBasket = BasketMgr.getCurrentBasket();
    var srEligibleCart = SRHelper.CheckCartEligibility(currentBasket); // eslint-disable-line
    var defaultShippingMethod;

    if (currentBasket) {
        if (!empty(session.custom.freshSRLogin)) {
            if (session.custom.freshSRLogin && !empty(session.custom.srtoken)) {
                // If cart is SR-eligible, select ShopRunner as the shipping method

                if (srEligibleCart === 'ALL_SR') {
                    Transaction.wrap(function () {
                        ShippingHelper.selectShippingMethod(currentBasket.defaultShipment, 'shoprunner');
                    });
                }
            } else if (empty(session.custom.srtoken)) {
                // If you've just logged out, set the shipping method back to the default
                defaultShippingMethod = ShippingMgr.getDefaultShippingMethod();
                if (currentBasket.defaultShipment.shippingMethodID === 'shoprunner') {
                    Transaction.wrap(function () {
                        ShippingHelper.selectShippingMethod(currentBasket.defaultShipment, defaultShippingMethod.ID);
                    });
                }
            }
        }

        if ((empty(session.custom.srtoken) && currentBasket.defaultShipment.shippingMethodID === 'shoprunner') || (srEligibleCart !== 'ALL_SR' && currentBasket.defaultShipment.shippingMethodID === 'shoprunner')) {
            // If the cart is no longer ShopRunner eligible, set the shipping method back to the default
            defaultShippingMethod = ShippingMgr.getDefaultShippingMethod();
            Transaction.wrap(function () {
                ShippingHelper.selectShippingMethod(currentBasket.defaultShipment, defaultShippingMethod.ID);
            });
        }

        // Set the shoprunner shipping method based on the sr_token cookie
        if (empty(session.custom.srtoken) && currentBasket.defaultShipment.shippingMethodID !== 'shoprunner') {
            // eslint-disable-next-line no-undef
            var cookies = request.getHttpCookies();
            for (var i = 0; i < cookies.cookieCount; i++) {
                var cookie = cookies[i];
                if (cookie.name === 'sr_token') {
                    if (srEligibleCart === 'ALL_SR') {
                        Transaction.wrap(function () {
                            ShippingHelper.selectShippingMethod(currentBasket.defaultShipment, 'shoprunner');
                        });
                    }
                    break;
                }
            }
        }
    }
}

module.exports = {
    ShoprunnerShippingMethodSelection: shoprunnerShippingMethodSelection
};
