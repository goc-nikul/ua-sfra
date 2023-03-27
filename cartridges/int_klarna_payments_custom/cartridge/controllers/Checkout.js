'use strict';

var BasketMgr = require('dw/order/BasketMgr');
var Site = require('dw/system/Site');
var server = require('server');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.extend(module.superModule);


server.append('Begin', function (req, res, next) {
    var viewData = res.getViewData();
    var Logger = require('dw/system/Logger');
    var currentBasket = BasketMgr.getCurrentBasket();

    var isKlarnaPaymentEnabled = COHelpers.isKlarnaPaymentEnabled();
    var userSession = req.session.raw;
    if (isKlarnaPaymentEnabled || !empty(userSession.privacy.KlarnaPaymentsSessionID)) { // eslint-disable-line
        if (currentBasket && (currentBasket.totalGrossPrice.available || currentBasket.totalNetPrice.available)) {
            viewData.klarna = {
                currency: currentBasket.getCurrencyCode()
            };
            viewData.klarnaForm = server.forms.getForm('klarna');
        } else {
            // Klarna session not created
            var customerProfile = req.currentCustomer && req.currentCustomer.profile;
            var customerData = !customerProfile ? 'unregistered' : 'registered';
            var isEmployee = customerProfile && customerProfile.custom && 'isEmployee' in customerProfile.custom && customerProfile.custom.isEmployee ? true : false; // eslint-disable-line
            var isVIP = Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && customerProfile && customerProfile.custom && 'vipAccountId' in customerProfile.custom && !empty(customerProfile.custom.vipAccountId) ? true : false; // eslint-disable-line
            var isHALAddress = currentBasket && 'isCommercialPickup' in currentBasket.custom && currentBasket.custom.isCommercialPickup ? true : false; // eslint-disable-line
            var defaultShipment = currentBasket.defaultShipment;
            var shippingMethod = defaultShipment && defaultShipment.shippingMethodID ? defaultShipment.shippingMethodID : null;
            var shippingAddress = defaultShipment.shippingAddress;
            var address1 = shippingAddress ? shippingAddress.address1 : null;
            var postalCode = shippingAddress ? shippingAddress.postalCode : null;
            var state = shippingAddress ? shippingAddress.stateCode : null;
            var country = shippingAddress && shippingAddress.countryCode ? shippingAddress.countryCode.displayValue : null;
            Logger.info('Could not create/update Klarna Payments Session : customerType: {0}, isEmployee: {1}, isVIP: {2}, isHALAddress: {3}, shippingMethod: {4}, shippingAddress1: {5}, shippingPostalCode: {6}, shippingState: {7}, shippingCountry: {8}', customerData, isEmployee, isVIP, isHALAddress, shippingMethod, address1, postalCode, state, country);
        }
    }
    viewData.isKlarnaEnabled = isKlarnaPaymentEnabled;
    res.setViewData(viewData);
    next();
}, pageMetaData.computedPageMetaData);

module.exports = server.exports();
