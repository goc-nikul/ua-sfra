'use strict';

var server = require('server');
server.extend(module.superModule);

/**
 *  Handle Ajax payment (and billing) form submit
 */
server.append(
    'SubmitPayment', function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var currentBasket = BasketMgr.getCurrentBasket();
        var Transaction = require('dw/system/Transaction');

        if (!currentBasket) { return; }

        var viewData = res.getViewData();
        var paazlHelper = require('*/cartridge/scripts/helpers/paazlHelper');
        var paazlStatus = paazlHelper.getPaazlStatus(currentBasket.defaultShipment);
        viewData.paazlStatus = paazlStatus;
        if (paazlStatus.active) {
            // If Paazl is active, retrieve the selected shipping option from Paazl
            var paazlShippingMethod = {};
            Transaction.wrap(function () {
                paazlShippingMethod = paazlHelper.getSavedPaazlShippingOption(currentBasket);
            });
            viewData.paazlShippingMethod = paazlShippingMethod;
        }

        res.setViewData(viewData);
        next();
    });


module.exports = server.exports();
