'use strict';

/**
 * This controller will create an order from Borderfree PO
 *
 * @module controllers/MissingOrderCreation
 */

/**
 * Require API dependencies
 */
var Transaction = require('dw/system/Transaction');
var Status = require('dw/system/Status');
var Site = require('dw/system/Site');
var BasketMgr = require('dw/order/BasketMgr');
var Logger = require('dw/system/Logger');

var server = require('server');
var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var prepareBasket = require('*/cartridge/scripts/PrepareBasketForCheckout');

server.post(
    'Process',
    server.middleware.https,
    function (req, res, next) {
        var cart = BasketMgr.getCurrentOrNewBasket();
        var poOrderStringObj = req.body; // Either req.body or request.getHttpParameterMap().getRequestBodyAsString()
        var poOrderObject = JSON.parse(poOrderStringObj);
        var poOrder = poOrderObject.poOrder;
        var pwd = req.querystring.password;
        var missingOrderServicePwd =  Site.getCurrent().getCustomPreferenceValue('createMissingOrderServicePwd');

        if (pwd == missingOrderServicePwd) {
            Transaction.begin();
            try {
                createBorderfreeBasket({
                    Basket: cart,
                    poOrder: poOrder
                });
                Transaction.commit();
            } catch (error) {
                var errorMsg = error;
                Logger.error('Error while executing createBorderfreeBasket', + errorMsg.message);
                Transaction.rollback();
                return false;
            }
    
        // update billing and shipping Address
            Transaction.wrap(function () {
                prepareBasket.updateBasket(cart, poOrder);
            });

        // calculate the cart
        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(cart);
        });

	    // create order
	        var order = placeOrder(cart, poOrder);

	        if (!empty(order)) {
                res.render('common/missingordercreationsuccess', {
                    Order: order
                });
	        } else {
	            var placeOrderError = new Status(Status.ERROR, 'confirm.error.technical');
                res.render('common/missingordercreationerror', {
                    Order: order,
                    PlaceOrderError: placeOrderError
                });
		    }
        } else {
            var placeOrderError = new Status(Status.ERROR, 'confirm.error.technical');
            res.render('common/missingordercreationerror', {
                Order: order,
                PlaceOrderError: placeOrderError
            });
        }
    }
  
);


function createBorderfreeBasket(params){
    var createBasketFromBorderfreePO = require('int_borderfree/cartridge/scripts/CreateBasketFromBorderfreePO');
    var result = createBasketFromBorderfreePO.execute(params);
    if (result === PIPELET_ERROR) {
        throw new Error('Problem creating basket from Borderfree PO response');
    }
}

function placeOrder(cart, poOrder) {
    // create order
    var order = COHelpers.createOrder(cart);
    var borderFreeOrder = JSON.parse(poOrder);
    var bfxOrderNo = !empty(borderFreeOrder) && !empty(borderFreeOrder.orderId) && !empty(borderFreeOrder.orderId.e4XOrderId) ? borderFreeOrder.orderId.e4XOrderId : '';

    // updating the merchandId in order.
    if (!empty(order)) {
        Transaction.wrap(function () {
            order.custom.bfxMerchantOrderRef = !empty(session) ? session.custom.orderRefVal : '';
            order.custom.bfxOrderId = bfxOrderNo;
            order.custom.bfxConfirmStatus = "Unconfirmed";
            order.custom.bfxShipmentNotificationStatus = "Unconfirmed";

            // sets address line 2 to border free order number
            if (!empty(bfxOrderNo)) {
                var defaultShipment = !empty(order) && !empty(order.getDefaultShipment()) ? order.getDefaultShipment() : null;
                var shippingAddress = !empty(defaultShipment) ? defaultShipment.getShippingAddress() : null;
                if (!empty(shippingAddress)) {
                    shippingAddress.setAddress2(bfxOrderNo);
                }
            }

        });
    }
    return order;
}

/**
 * @see module:controllers/MissingOrderCreation~Process */
 module.exports = server.exports();
