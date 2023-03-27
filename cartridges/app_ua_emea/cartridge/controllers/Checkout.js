'use strict';
/* eslint-disable block-scoped-var  */

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

var Transaction = require('dw/system/Transaction');

server.extend(module.superModule);

server.prepend('Begin', server.middleware.https, consentTracking.consent, csrfProtection.generateToken, function (req, res, next) {
    if ('currentOrder' in session.custom && session.custom.currentOrder) {
        var OrderMgr = require('dw/order/OrderMgr');
        var URLUtils = require('dw/web/URLUtils');
        try {
            var order = OrderMgr.getOrder(session.custom.currentOrder);
            Transaction.wrap(function () {
                try {
                    if (Object.prototype.hasOwnProperty.call(order.custom, 'Loyalty-VoucherName') && !empty(order.custom['Loyalty-VoucherName'])) {
                        var loyaltyVoucherName = order.custom['Loyalty-VoucherName'].split('=')[1];
                        var HookMgr = require('dw/system/HookMgr');
                        if (HookMgr.hasHook('app.memberson.UnUtilizeMemberVoucher')) {
                            HookMgr.callHook('app.memberson.UnUtilizeMemberVoucher', 'unUtilizeMemberVoucher', order, loyaltyVoucherName);
                        }
                    }
                } catch (e) {
                    var Logger = require('dw/system/Logger');
                    Logger.error('Unable to unutlize Loyalty voucher ' + e.message + e.stack);
                }
                OrderMgr.failOrder(order, true);
            });
            session.custom.currentOrder = null;
            if (req.querystring.paymentError && !empty(req.querystring.paymentError)) {
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', req.querystring.paymentError));
            } else {
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment'));
            }
        } catch (e) {
            var Logger = require('dw/system/Logger');
            Logger.error('Error while retriving the order :: {0}', e.message);
        }
    }
    next();
});

server.append('Begin', function (req, res, next) {
    var preferences = require('*/cartridge/config/preferences');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    var viewData = res.getViewData();
    var applicablePaymentMethods = viewData.order.billing.payment.applicablePaymentMethods;
    var hasAdyen = applicablePaymentMethods.find(function (method) {
        return method.ID === 'AdyenComponent';
    });
    var containsLocaleAddress = viewData.containsLocaleAddress;
    var currentCountry = viewData.currentCountry;
    var internationalShippingCountriesList = COHelpers.getInternationalShippingCountriesList(currentCountry);
    var hasInternationalShippingCountriesList = internationalShippingCountriesList && internationalShippingCountriesList.length > 0;

    if (customer && customer.addressBook && customer.addressBook.addresses.length > 0) {
        containsLocaleAddress = COHelpers.containsAtleastOneLocaleAddress(currentCountry, customer.addressBook.addresses);
        if (containsLocaleAddress === null && hasInternationalShippingCountriesList) {
            for (var i = 0; i < internationalShippingCountriesList.length; i++) {
                containsLocaleAddress = COHelpers.getLocaleAddress(internationalShippingCountriesList[i], customer.addressBook.addresses);
                if (containsLocaleAddress) {
                    break;
                }
            }
        }
    }

    var additionalViewData = {
        qasProvinceMapping: preferences.qasProvinceMapping,
        containsLocaleAddress: containsLocaleAddress,
        internationalShippingCountriesList: internationalShippingCountriesList
    };

    if (hasAdyen) {
        additionalViewData.selectedPaymentMethod = 'AdyenComponent';
    }

    res.setViewData(additionalViewData);
    next();
});

module.exports = server.exports();
