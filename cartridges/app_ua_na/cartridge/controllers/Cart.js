'use strict';

var server = require('server');

server.extend(module.superModule);

server.append('EditProductLineItem', function (req, res, next) {
    var viewData = res.getViewData();
    var arrayHelper = require('*/cartridge/scripts/util/array');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var params = req.form;
    var uuid = req.form.uuid ? req.form.uuid : '';
    if (!empty(uuid)) {
        var prod = ProductFactory.get(params);
        var productQuantities = prod ? prod.quantities : null;
        if (productQuantities !== null) {
            var cartModel = viewData.cartModel;
            if (cartModel) {
                var cartItem = arrayHelper.find(cartModel.items, function (item) {
                    return item.UUID === uuid;
                });
                cartItem.quantities = productQuantities;
            }
        }
    }
    res.setViewData(viewData);
    next();
});

server.append('AddCoupon', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var secureEncoder = require('dw/util/SecureEncoder');
    var currentBasket = BasketMgr.getCurrentBasket();
    var error = false;
    var errorMessage;
    var couponLineItem = currentBasket.getCouponLineItem(req.querystring.couponCode);

    if (currentBasket && empty(couponLineItem)) {
        try {
            Transaction.wrap(function () {
                return currentBasket.createCouponLineItem(req.querystring.couponCode, true);
            });
        } catch (e) {
            error = true;
            var errorCodes = {
                COUPON_CODE_ALREADY_IN_BASKET: 'error.coupon.already.in.cart',
                COUPON_ALREADY_IN_BASKET: 'error.coupon.cannot.be.combined',
                COUPON_CODE_ALREADY_REDEEMED: 'error.coupon.already.redeemed',
                COUPON_CODE_UNKNOWN: 'error.unknown.coupon',
                COUPON_DISABLED: 'error.disabled.coupon',
                REDEMPTION_LIMIT_EXCEEDED: 'error.unable.to.add.coupon',
                TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED: 'error.unable.to.add.coupon',
                NO_ACTIVE_PROMOTION: 'error.no.active.coupon',
                default: 'error.unable.to.add.coupon'
            };

            var errorMessageKey = errorCodes[e.errorCode] || errorCodes.default;
            errorMessage = Resource.msgf(errorMessageKey, 'cart', null, secureEncoder.forHtmlContent(req.querystring.couponCode));
        }
    }

    if (error) {
        res.json({
            error: error,
            errorMessage: errorMessage
        });
    }

    return next();
}
);

/**
 * Cart-showPromoCodeForm : The Cart-showPromoCodeForm endpoint sets a state flag to display the promo code form
 * @function
 * @memberof Cart
 * @param {serverfunction} - post
 */
server.post('showPromoCodeForm', function (req, res, next) {
    session.custom.showPromoCodeForm = true;
    res.json({
        success: true
    });
    return next();
});

module.exports = server.exports();
