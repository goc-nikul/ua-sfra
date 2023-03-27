'use strict';

/* Script modules */
var baseCheckoutHelper = require('app_ua_apac/cartridge/scripts/checkout/checkoutHelpers');
var Transaction = require('dw/system/Transaction');

/**
 * Attempts to create an order from the current basket
 * @param {dw.order.Basket} currentBasket - The current basket
 * @param {string} orderNo - Order number
 * @returns {dw.order.Order} The order object created from the current basket
 */
function createOrder(currentBasket, orderNo) {
    var order;
    var OrderMgr = require('dw/order/OrderMgr');
    var Resource = require('dw/web/Resource');
    var utilizeMemberVouchers;
    var HookMgr = require('dw/system/HookMgr');

    try {
        order = Transaction.wrap(function () {
            if (orderNo) {
                return OrderMgr.createOrder(currentBasket, orderNo);
            }
            return OrderMgr.createOrder(currentBasket);
        });

        // Check if memberson is enabled for the country
        if (HookMgr.hasHook('app.memberson.CountryConfig')) {
            var countryCode = session.custom.currentCountry || request.getLocale().slice(-2).toUpperCase(); // eslint-disable-line
            var countryConfig = HookMgr.callHook('app.memberson.CountryConfig', 'getMembersonCountryConfig', countryCode);
            if (countryConfig.membersonEnabled) {
                if (!empty(order)) {
                    var currentCustomer = order.customer;
                    if (!empty(currentCustomer) && currentCustomer.authenticated) {
                        var profile = currentCustomer.getProfile();
                        if (!empty(profile) && !empty(profile.custom['Loyalty-ID'])) {
                            Transaction.wrap(function () {
                                order.custom['Loyalty-ID'] = profile.custom['Loyalty-ID'];
                            });
                        }
                    }
                    // Check if orderId is created or not, if yes then call the Utilize voucher API if any applied to basket
                    if (!empty(currentBasket) && !empty(currentBasket.custom['Loyalty-VoucherName'])) {
                        var loyaltyVoucherName = order.custom['Loyalty-VoucherName'].split('=')[1];
                        if (HookMgr.hasHook('app.memberson.UtilizeMemberVoucher')) {
                            utilizeMemberVouchers = HookMgr.callHook('app.memberson.UtilizeMemberVoucher', 'utilizeMemberVoucher', order, loyaltyVoucherName, countryConfig.ecommLocation);
                        }

                        // Check if utilize voucherAPI call is OK
                        if (!empty(utilizeMemberVouchers) && utilizeMemberVouchers.status === 'OK') {
                            Transaction.wrap(function () {
                                order.custom['Loyalty-VoucherCancelled'] = 0; //eslint-disable-line
                            });
                        } else {
                            // Remove the coupon and display the error message
                            var membersonCoupon = currentBasket.custom['Loyalty-VoucherName'].split('=')[0];
                            var couponLineItem = order.getCouponLineItem(membersonCoupon);
                            if (!empty(couponLineItem)) {
                                Transaction.begin();
                                OrderMgr.failOrder(order, true);
                                Transaction.commit();
                            }
                            session.custom.membersonOrderFailedError = Resource.msg('memberson.msg.apierror', 'checkout', null);
                            if (!empty(utilizeMemberVouchers) && !empty(utilizeMemberVouchers.errorMessage)) {
                                var errorCode = JSON.parse(utilizeMemberVouchers.errorMessage).ErrorCode;
                                if (errorCode === 4109) {
                                    session.custom.membersonOrderFailedError = Resource.msg('memberson.msg.utilizevoucher.cart', 'membersonGlobal', null);
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        return null;
    }
    return order;
}
// Asigning all the attributes of the base object to the exports object
Object.assign(module.exports, baseCheckoutHelper);
module.exports.createOrder = createOrder;

