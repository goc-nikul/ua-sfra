'use strict';
/* eslint-disable block-scoped-var  */

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var collections = require('*/cartridge/scripts/util/collections');
var URLUtils = require('dw/web/URLUtils');
const giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
const promotionHelper = require('*/cartridge/scripts/util/promotionHelper');

server.extend(module.superModule);

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
                COUPON_CODE_ALREADY_IN_BASKET: 'error.coupon.already.in.cart.emea',
                COUPON_ALREADY_IN_BASKET: 'error.coupon.cannot.be.combined.emea',
                COUPON_CODE_ALREADY_REDEEMED: 'error.coupon.already.redeemed.emea',
                COUPON_CODE_UNKNOWN: 'error.coupon.code.unkown',
                COUPON_DISABLED: 'error.coupon.disabled',
                REDEMPTION_LIMIT_EXCEEDED: 'error.redemption.limit.exceeded',
                CUSTOMER_REDEMPTION_LIMIT_EXCEEDED: 'error.customer.redemption.limit.exceeded',
                TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED: 'error.redemption.limit.exceeded',
                NO_ACTIVE_PROMOTION: 'error.coupon.disabled',
                default: 'error.unable.to.add.coupon.emea'
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

module.exports = server.exports();
