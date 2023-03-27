'use strict';

/* global dw */

/**
 * Handle entry point for SG integration
 * @param {Object} basket Basket
 * @returns {Object} processor result
 */
function Handle(basket) {
    var result = require('~/cartridge/scripts/paypal/processor').handle(basket);
    return result;
}

/**
 * Authorize entry point for SG integration
 * @param {Object} orderNumber order numebr
 * @param {Object} paymentInstrument payment intrument
 * @returns {Object} processor result
 */
function Authorize(orderNumber, paymentInstrument) {
	var Transaction = require('dw/system/Transaction');
    var order = dw.order.OrderMgr.getOrder(orderNumber);
    Transaction.wrap(function () {
    	order.custom.customerLocale = request.locale;
    });
    var result = require('~/cartridge/scripts/paypal/processor').authorize(order, orderNumber, paymentInstrument);
     // make secondary authorization call to XiPay if the site preference is enabled.
    // "isEnabled" site preference check is already there in "doAuthorization" method. So no need to put additional check here.
    if (result.authorized) {
        var paymetricXiPayHelper = require('int_paymetric/cartridge/scripts/util/paymetricXiPayHelper');
        var isAuthorized = paymetricXiPayHelper.doAuthorization(order, 'PayPal');
        if (!isAuthorized) {
            result = {
                error: true
            }
        }
    }
    return result;
}

exports.Handle = Handle;
exports.Authorize = Authorize;
