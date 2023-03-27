'use strict';

var server = require('server');
server.extend(module.superModule);

/**
 * Handle Ajax shipping form submit
 */
server.append(
    'SubmitShipping', function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

        var viewData = res.getViewData();
        if (viewData.error) { return next(); }

        var currentBasket = BasketMgr.getCurrentBasket();
        if (!currentBasket) { return next(); }

        COHelpers.copyShippingAddressToShipment(
            viewData,
            currentBasket.defaultShipment
        );

        // Check if Paazl is enable and selected as shipping method
        var paazlHelper = require('*/cartridge/scripts/helpers/paazlHelper');
        paazlHelper.resetSelectedShippingOption(currentBasket);
        var paazlStatus = paazlHelper.getPaazlStatus(currentBasket.defaultShipment);
        viewData.paazlStatus = paazlStatus;
        if (paazlStatus.active) {
            // If Paazl is active, retrieve the selected shipping option from Paazl
            var paazlShippingMethod = paazlHelper.getSelectedShippingOption(currentBasket);
            if (paazlShippingMethod) {
                viewData.paazlShippingMethod = paazlShippingMethod;
            } else {
                viewData.error = true;
            }
        }

        res.setViewData(viewData);
        return next();
    });

/**
 * Handle Ajax shipping form submit
 */
server.append(
    'SelectShippingMethod', function (req, res, next) {
        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var BasketMgr = require('dw/order/BasketMgr');
            var currentBasket = BasketMgr.getCurrentBasket();

            if (!currentBasket) { return; }

            var viewData = res.getViewData();
            var paazlHelper = require('*/cartridge/scripts/helpers/paazlHelper');
            var paazlStatus = paazlHelper.getPaazlStatus(currentBasket.defaultShipment);
            if (paazlStatus.active) {
                var InitPaazlWidget = require('*/cartridge/scripts/init/initPaazlWidget');
                var paazlWidgetInit = InitPaazlWidget.initPaazlWidget();

                viewData.paazlWidgetInit = paazlWidgetInit;
            }
            res.setViewData(viewData);
        });
        return next();
    });

module.exports = server.exports();
