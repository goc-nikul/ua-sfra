/**
 *
 *
 * Handles OCAPI hooks for basket calls
 */

var Status = require('dw/system/Status');

/**
 * This method updates the necessary custom attributes to the shipment
 * @param {dw.order.Shipment} shipment - shipment
 */
function updateShipmentEstimatedDeliveryDate(shipment) {
    var shipMethod = shipment.getShippingMethod();
    if (!empty(shipMethod)) {
        var shippingDeliveryDates = require('*/cartridge/scripts/util/DeliveryHelper').getShippingDeliveryDates(shipMethod, false);
        if (shippingDeliveryDates) {
            // eslint-disable-next-line no-param-reassign
            shipment.custom.deliveryDateMin = shippingDeliveryDates[0].time;
            // eslint-disable-next-line no-param-reassign
            shipment.custom.deliveryDateMax = shippingDeliveryDates[1].time;
        }
    }
}

/**
 * This method updates the necessary custom attributes to the shipment
 * @param {dw.order.Basket} basket - basket
 * @param {dw.order.Shipment} shipment - shipment
 * @returns {dw.system.Shipment} Status - Status
 */
function afterPUT(basket, shipment) {
    // validate ShopRunner token
    if (basket.custom.sr_token) {
        var result = require('int_shoprunner/cartridge/scripts/ShopRunnerAuth').validate(basket.custom.sr_token, basket);
        if (!result.signin) {
            var Transaction = require('dw/system/Transaction');
            Transaction.wrap(function () {
                // eslint-disable-next-line no-param-reassign
                basket.custom.sr_token = '';
                session.custom.srtoken = '';
                basket.getDefaultShipment().shippingMethod = null; // eslint-disable-line
            });
            throw new Error('Error validating ShopRunner token on Basket');
        }
    }
    var paymentHelper = require('~/cartridge/scripts/paymentHelper');
    updateShipmentEstimatedDeliveryDate(shipment);
    require('dw/system/HookMgr').callHook('dw.order.calculate', 'calculate', basket);
    paymentHelper.autoAdjustBasketPaymentInstruments(basket);
    // klarna session management call
    var basketHelper = require('~/cartridge/scripts/basketHelper');
    basketHelper.manageKlarnaSession(basket);
    return new Status(Status.OK);
}

exports.afterPUT = afterPUT;

exports.afterPATCH = function (basket, shipment) {
    return afterPUT(basket, shipment);
};
