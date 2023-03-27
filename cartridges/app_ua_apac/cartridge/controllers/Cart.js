'use strict';

var server = require('server');

server.extend(module.superModule);

server.prepend('Show', function (req, res, next) {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');

    var currentBasket = BasketMgr.getCurrentBasket();
    var isAfterLimitExceeding = false;
    var isAfterLimitExceedingMsg = '';
    var isAfterPayEnabled = PreferencesUtil.isCountryEnabled('afterPayEnabled');
    if (isAfterPayEnabled && COHelpers.isBasketExceedingAfterPayLimit(currentBasket)) {
        isAfterLimitExceeding = true;
        isAfterLimitExceedingMsg = Resource.msg('error.afterpay.range.exceed', 'checkout', null);
    }
    var zippayEnabled = require('*/cartridge/config/preferences').isZipPayEnabled;
    res.setViewData({ isAfterPayEnabled: isAfterPayEnabled, isAfterLimitExceeding: isAfterLimitExceeding, isAfterLimitExceedingMsg: isAfterLimitExceedingMsg, zippayEnabled: zippayEnabled });
    next();
});

server.append('Show', function (req, res, next) {
    var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    if (res.viewData.zippayEnabled) {
        res.setViewData({
            templateUtils: require('*/cartridge/scripts/util/template')
        });
    }
    var productHelper = require('*/cartridge/scripts/helpers/ProductHelper');
    var enableAvailablePerLocale = productHelper.enableAvailablePerLocale();
    var isAtomeContentEnabled = PreferencesUtil.isCountryEnabled('atomeContentEnabled');
    res.setViewData({
        enableAvailablePerLocale: enableAvailablePerLocale,
        isPersonalizationEnabled: require('*/cartridge/config/preferences').isPersonalizationEnable,
        isAtomeContentEnabled: isAtomeContentEnabled
    });
    next();
});

server.append('GetProduct', function (req, res, next) {
    res.setViewData({
        isPersonalizationEnabled: require('*/cartridge/config/preferences').isPersonalizationEnable,
        isAtomeContentEnabled: require('*/cartridge/scripts/utils/PreferencesUtil').isCountryEnabled('atomeContentEnabled')
    });
    next();
});

server.append('RemoveCouponLineItem', function (req, res, next) {
    var viewData = res.getViewData();
    if (!viewData.error) {
        var checkouturl = require('dw/web/URLUtils').url('Checkout-Begin', 'stage', 'payment');
        viewData.checkouturl = checkouturl.toString();
        res.setViewData(viewData);
    }
    next();
});

server.append('AddCoupon', function (req, res, next) {
    var viewData = res.getViewData();
    if (!viewData.error) {
        var checkouturl = require('dw/web/URLUtils').url('Checkout-Begin', 'stage', 'payment');
        viewData.checkouturl = checkouturl.toString();
        res.setViewData(viewData);
    }
    next();
});

server.append('EditProductLineItem', function (req, res, next) {
    var viewData = res.getViewData();
    var arrayHelper = require('*/cartridge/scripts/util/array');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var params = req.form;
    var prod = ProductFactory.get(params);
    var productQuantitties = prod ? prod.quantities : null;
    var uuid = req.form.uuid;
    var cartModel = viewData.cartModel;
    if (cartModel) {
        var cartItem = arrayHelper.find(cartModel.items, function (item) {
            return item.UUID === uuid;
        });
        cartItem.quantities = productQuantitties;
    }
    res.setViewData(cartModel);
    next();
});

module.exports = server.exports();
