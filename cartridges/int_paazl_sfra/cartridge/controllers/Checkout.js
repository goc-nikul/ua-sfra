'use strict';

var server = require('server');
server.extend(module.superModule);

// Main entry point for Checkout
server.append(
    'Begin', function (req, res, next) {
        var Site = require('dw/system/Site');
        var BasketMgr = require('dw/order/BasketMgr');

        // Check if Paazl is enable and selected as shipping method
        var currentBasket = BasketMgr.getCurrentBasket();
        if (!currentBasket) {
            return next();
        } else if (empty(currentBasket.defaultShipment.getShippingMethodID())) {
            // in case none of shipping methods is selected, apply default shipping method
            var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
            var Transaction = require('dw/system/Transaction');
            var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
            Transaction.wrap(function () {
                cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
    
                basketCalculationHelpers.calculateTotals(currentBasket);
            });
        }
        var paazlHelper = require('*/cartridge/scripts/helpers/paazlHelper');

        var paazlStatus = paazlHelper.getPaazlStatus(currentBasket.defaultShipment);
        res.setViewData({
            paazlStatus: paazlStatus
        });

        if (paazlStatus.applicable) {
            var currentPaazlShippingMethodID = paazlHelper.getShippingMethodID();
            var InitPaazlWidget = require('*/cartridge/scripts/init/initPaazlWidget');
            var paazlWidgetEndpoint = Site.current.getCustomPreferenceValue('paazlWidgetEndpoint');
            paazlHelper.updateTokenInBasket(currentBasket);
            var paazlWidgetCustomizedStyle;
            // If 'paazlWidgetPredefinedStyle' is set on CUSTOMIZED, fetch the customized style from the 'paazlWidgetCustomizedStyle' site preferences
            var paazlWidgetPredefinedStyle = Site.current.getCustomPreferenceValue('paazlWidgetPredefinedStyle');
            if (paazlWidgetPredefinedStyle.value === 'CUSTOMIZED') {
                paazlWidgetCustomizedStyle = Site.current.getCustomPreferenceValue('paazlWidgetCustomizedStyle');
                res.setViewData({
                    paazlWidgetCustomizedStyle: paazlWidgetCustomizedStyle || null
                });
            }

            var viewData = res.getViewData();
            var isPaazlUniqueShippingOption = false;
            var shippingModel = viewData.order && viewData.order.shipping[0];
            if (shippingModel && shippingModel.applicableShippingMethods && shippingModel.applicableShippingMethods.length === 1) {
                if (shippingModel.applicableShippingMethods[0].ID === currentPaazlShippingMethodID) {
                    isPaazlUniqueShippingOption = true;
                }
            }
            var paazlDeliveryType = shippingModel && shippingModel.paazlDeliveryType ? shippingModel.paazlDeliveryType : '';

            res.setViewData({
                paazlWidgetInit: InitPaazlWidget.initPaazlWidget(),
                paazlWidgetEndpoint: paazlWidgetEndpoint,
                currentPaazlShippingMethodID: currentPaazlShippingMethodID,
                isPaazlUniqueShippingOption: isPaazlUniqueShippingOption,
                paazlDeliveryType: paazlDeliveryType
            });
        }


        return next();
    }
);

module.exports = server.exports();
