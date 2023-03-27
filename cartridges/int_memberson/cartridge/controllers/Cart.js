'use strict';
var server = require('server');
server.extend(module.superModule);

// API includes
var HookMgr = require('dw/system/HookMgr');
var CouponMgr = require('dw/campaign/CouponMgr');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

// Helper files includes
var membersonHelpers = require('*/cartridge/scripts/helpers/membersonHelpers');

server.prepend('AddCoupon', function (req, res, next) {
    // Check If entered couponCode is for the memberson or not
    var currentCustomer = req.currentCustomer.raw;
    var couponObj = CouponMgr.getCouponByCode(req.querystring.couponCode);
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }
    if (!empty(couponObj)) {
        // Get the promotions for the Entered couponCode
        var promotions = couponObj.promotions;
        var membersonPromotion = membersonHelpers.getMembersonPromotion(promotions);
        if (!empty(membersonPromotion)) {
            if (!empty(currentCustomer) && currentCustomer.authenticated && !empty(currentCustomer.profile)) {
                var isEligibleForMemberson = membersonHelpers.validateUserForMemberson(currentCustomer.profile.email);
                if (isEligibleForMemberson && HookMgr.hasHook('app.memberson.CountryConfig')) {
                    var countryCode = session.custom.currentCountry || request.getLocale().slice(-2).toUpperCase(); // eslint-disable-line
                    var countryConfig = HookMgr.callHook('app.memberson.CountryConfig', 'getMembersonCountryConfig', countryCode);
                    // Call the memberson summary API to get the 'MembersonshipNo'
                    if (countryConfig.membersonEnabled) {
                        var membersonCustomerNo = currentCustomer.profile.custom['Loyalty-ID'];
                        if (!empty(membersonCustomerNo)) {
                            var voucherDetails = membersonHelpers.getVoucherNumber(membersonCustomerNo, req.querystring.couponCode);
                            if (!voucherDetails.error) {
                                var viewData = res.getViewData();
                                viewData.voucherCode = voucherDetails.voucherCode;
                                viewData.voucherNumber = voucherDetails.voucherNumber;
                                viewData.isMembersonPromotion = true;
                                res.setViewData(viewData);
                                return next();
                            }
                            res.json({
                                error: voucherDetails.error,
                                errorMessage: voucherDetails.errorMessage
                            });
                            this.emit('route:Complete', req, res);
                            // eslint-disable-next-line consistent-return
                            return;
                        }
                    }
                }
            }
            res.json({
                error: true,
                errorMessage: Resource.msg('error.unable.to.add.coupon', 'cart', null)
            });
            this.emit('route:Complete', req, res);
            // eslint-disable-next-line consistent-return
            return;
        }
    }
    res.json({ error: false });
    return next();
});

server.append('AddCoupon', function (req, res, next) {
    var viewData = res.getViewData();
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var currentCustomer = req.currentCustomer.raw;
    if (!empty(currentBasket) && !empty(currentCustomer) && currentCustomer.authenticated && !empty(currentCustomer.profile)) {
        if (!viewData.error && viewData.isMembersonPromotion) {
            var couponsIterator = currentBasket.getCouponLineItems().iterator();
            if (!empty(couponsIterator)) {
                while (couponsIterator.hasNext()) {
                    // this will loop through all the coupons applied
                    var couponLineItem = couponsIterator.next();
                    if (couponLineItem.isApplied() && couponLineItem.couponCode === viewData.voucherCode && !empty(viewData.voucherNumber)) {
                        // Store the voucherNumber on the cart level
                        Transaction.wrap(function () {
                            currentBasket.custom['Loyalty-VoucherName'] = viewData.voucherCode + '=' + viewData.voucherNumber;
                        });
                    }
                }
            }
        }
    }
    next();
});

server.append('RemoveCouponLineItem', function (req, res, next) {
    var viewData = res.getViewData();
    var BasketMgr = require('dw/order/BasketMgr');
    if (!viewData.error) {
        var couponObj = CouponMgr.getCouponByCode(req.querystring.code);
        if (!empty(couponObj)) {
        // Get the promotions for the Entered couponCode
            var promotions = couponObj.promotions;
            var membersonPromotion = membersonHelpers.getMembersonPromotion(promotions);
            if (!empty(membersonPromotion) && HookMgr.hasHook('app.memberson.CountryConfig')) {
                var countryCode = session.custom.currentCountry || request.getLocale().slice(-2).toUpperCase(); // eslint-disable-line
                var countryConfig = HookMgr.callHook('app.memberson.CountryConfig', 'getMembersonCountryConfig', countryCode);
                if (countryConfig.membersonEnabled) {
                    var currentBasket = BasketMgr.getCurrentBasket();
                    // Remove the voucherNumber on the cart level if it is not empty
                    if (!empty(currentBasket.custom['Loyalty-VoucherName'])) {
                        membersonHelpers.checkIfMembersonCouponApplied(req.currentCustomer.raw);
                    }
                }
            }
        }
    }
    res.json({ error: false });
    next();
});

module.exports = server.exports();
