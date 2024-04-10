'use strict';

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var collections = require('*/cartridge/scripts/util/collections');
var URLUtils = require('dw/web/URLUtils');
const giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
const promotionHelper = require('*/cartridge/scripts/util/promotionHelper');

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
    if (!empty(req.querystring.paymentError)) {
        res.viewData.cartError = req.querystring.paymentError;  // eslint-disable-line no-param-reassign
    }
    var productHelper = require('*/cartridge/scripts/helpers/ProductHelper');
    var enableAvailablePerLocale = productHelper.enableAvailablePerLocale();
    var isAtomeContentEnabled = PreferencesUtil.isCountryEnabled('atomeContentEnabled');
    var mobileAuthProvider = require('*/cartridge/modules/providers').get('MobileAuth');
    res.viewData.mobileAuthEnabled = mobileAuthProvider.mobileAuthEnabled; // eslint-disable-line no-param-reassign
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

/**
 * Cart-AddCoupon : The Cart-AddCoupon endpoint is responsible for adding a coupon to a basket
 * @name Base/Cart-AddCoupon
 * @function
 * @memberof Cart
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {querystringparameter} - couponCode - the coupon code to be applied
 * @param {querystringparameter} - csrf_token - hidden input field csrf token
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.replace(
    'AddCoupon',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Resource = require('dw/web/Resource');
        var Locale = require('dw/util/Locale');
        var secureEncoder = require('dw/util/SecureEncoder');
        var Transaction = require('dw/system/Transaction');
        var CartModel = require('*/cartridge/models/cart');
        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

        var currentBasket = BasketMgr.getCurrentBasket();

        if (!currentBasket) {
            res.setStatusCode(500);
            res.json({
                error: true,
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });

            return next();
        }

        if (!currentBasket) {
            res.setStatusCode(500);
            res.json({
                errorMessage: Resource.msg('error.add.coupon', 'cart', null)
            });
            return next();
        }

        var error = false;
        var errorMessage;

        var previousBonusDiscountLineItems = currentBasket.getBonusDiscountLineItems();

        try {
            Transaction.wrap(function () {
                return currentBasket.createCouponLineItem(
                    req.querystring.couponCode,
                    true
                );
            });
        } catch (e) {
            error = true;
            var errorCodes = {
                COUPON_CODE_ALREADY_IN_BASKET: 'error.coupon.already.in.cart',
                COUPON_ALREADY_IN_BASKET: 'error.coupon.cannot.be.combined',
                COUPON_CODE_ALREADY_REDEEMED: 'error.coupon.already.redeemed',
                COUPON_CODE_UNKNOWN: 'error.unable.to.add.coupon',
                COUPON_DISABLED: 'error.unable.to.add.coupon',
                REDEMPTION_LIMIT_EXCEEDED: 'error.unable.to.add.coupon',
                TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED: 'error.unable.to.add.coupon',
                NO_ACTIVE_PROMOTION: 'error.unable.to.add.coupon',
                default: 'error.unable.to.add.coupon'
            };

            var errorMessageKey = errorCodes[e.errorCode] || errorCodes.default;
            var currentLocale = Locale.getLocale(req.locale.id);

            if (currentLocale.country === 'MX') {
                errorMessage = Resource.msgf(errorMessageKey, 'cart', null, secureEncoder.forHtmlContent(req.querystring.couponCode));
            } else {
                errorMessage = Resource.msg(errorMessageKey, 'cart', null);
            }
        }

        if (error) {
            res.json({
                error: error,
                errorMessage: errorMessage
            });
            return next();
        }

        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(currentBasket);
        });

        var allLineItems = currentBasket.allProductLineItems;
        var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');

        var urlObject = {
            url: URLUtils.url('Cart-ChooseBonusProducts').toString(),
            configureProductstUrl: URLUtils.url(
                'Product-ShowBonusProducts'
            ).toString(),
            addToCartUrl: URLUtils.url('Cart-AddBonusProducts').toString()
        };

        collections.forEach(allLineItems, function (pli) {
            var newBonusDiscountLineItem = cartHelper.getNewBonusDiscountLineItem(
                currentBasket,
                previousBonusDiscountLineItems,
                urlObject,
                pli.UUID
            );

            if (newBonusDiscountLineItem) {
                Transaction.wrap(function () {
                    pli.custom.bonusProductLineItemUUID = 'bonus'; // eslint-disable-line no-param-reassign
                    pli.custom.preOrderUUID = pli.UUID; // eslint-disable-line no-param-reassign
                });
            }
        });

        var basketModel = new CartModel(currentBasket);

        res.json(basketModel);
        return next();
    }
);

server.append('AddCoupon', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var OrderModel = require('*/cartridge/models/order');
    var AccountModel = require('*/cartridge/models/account');
    var Locale = require('dw/util/Locale');
    const viewData = res.getViewData();
    const couponCode = req.querystring.couponCode;
    const analytics = {
        couponCode: couponCode,
        errorMessage: viewData.errorMessage
    };
    if (!viewData.error) {
        const promotions = promotionHelper.getBasketPromotionsByCouponCode(couponCode);
        analytics.promotions = (promotions && promotions.length)
            ? promotions.map(function (p) {
                return {
                    ID: p.ID,
                    name: p.name,
                    promotionClass: p.promotionClass,
                    coupons: [{
                        ID: p.coupons[0] && p.coupons[0].ID
                    }]
                };
            })
            : [];

        var checkouturl = require('dw/web/URLUtils').url('Checkout-Begin', 'stage', 'payment');
        viewData.checkouturl = checkouturl.toString();
        res.setViewData(viewData);
    }
    var currentBasket = BasketMgr.getCurrentBasket();
    var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
    var currentLocale = Locale.getLocale(req.locale.id);
    var basketModel = new OrderModel(
        currentBasket,
        { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
    );
    var gcObj = giftcardHelper.orderTotalGCCouponAmount(currentBasket);
    var giftCardFormData = giftcardHelper.giftCardFormData(res.viewData.csrf);
    var couponLineItem = currentBasket.getCouponLineItem(couponCode);
    var couponApplied = couponLineItem ? couponLineItem.applied : false;
    res.json({
        order: basketModel,
        customer: new AccountModel(req.currentCustomer),
        analytics: analytics,
        nonGCPaymentRemainingBalance: gcObj.nonGCPaymentRemainingBalance,
        orderTotalRedeemed: gcObj.orderTotalRedeemed,
        gcAmount: gcObj.gcAmount,
        gcUUID: gcObj.gcUUID,
        gcResults: giftCardFormData.gcResults,
        renderedTemplate: giftCardFormData.templateContent,
        couponApplied: couponApplied
    });
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
