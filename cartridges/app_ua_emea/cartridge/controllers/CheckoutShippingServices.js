'use strict';

var server = require('server');
server.extend(module.superModule);

/**
 * Handle Ajax shipping form submit
 */
server.append('SubmitShipping', function (req, res, next) {
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
    var Site = require('dw/system/Site');
    var isPaazlEnabled = Site.current.getCustomPreferenceValue('paazlEnabled');
    if (isPaazlEnabled) {
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
    }
    res.setViewData(viewData);
    return next();
});

/**
 * Handle Ajax Shipping Summary Update
 */
server.post('UpdateSummary', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) { return next(); }

    var Site = require('dw/system/Site');
    var isPaazlEnabled = Site.current.getCustomPreferenceValue('paazlEnabled');
    if (isPaazlEnabled) {
        var paazlHelper = require('*/cartridge/scripts/helpers/paazlHelper');
        var paazlStatus = paazlHelper.getPaazlStatus(currentBasket.defaultShipment);
        if (paazlStatus.active) {
            paazlHelper.resetSelectedShippingOption(currentBasket);
            paazlHelper.getSelectedShippingOption(currentBasket);
        }
    }

    var shippingAddressForm = server.forms.getForm('shipping');
    if (shippingAddressForm && shippingAddressForm.shippingAddress && shippingAddressForm.shippingAddress.valid && shippingAddressForm.shippingAddress.addressFields) {
        var shippingAddressFields = shippingAddressForm.shippingAddress.addressFields;
        var shippingData = {
            address: {}
        };
        shippingData.address.firstName = shippingAddressFields.firstName && shippingAddressFields.firstName.value ? shippingAddressFields.firstName.value : '';
        shippingData.address.lastName = shippingAddressFields.lastName && shippingAddressFields.lastName.value ? shippingAddressFields.lastName.value : '';
        shippingData.address.address1 = shippingAddressFields.address1 && shippingAddressFields.address1.value ? shippingAddressFields.address1.value : '';
        shippingData.address.address2 = shippingAddressFields.address2 && shippingAddressFields.address2.value ? shippingAddressFields.address2.value : '';
        shippingData.address.city = shippingAddressFields.city && shippingAddressFields.city.value ? shippingAddressFields.city.value : '';
        shippingData.address.postalCode = shippingAddressFields.postalCode && shippingAddressFields.postalCode.value ? shippingAddressFields.postalCode.value : '';
        shippingData.address.stateCode = shippingAddressFields.stateCode && shippingAddressFields.stateCode.value ? shippingAddressFields.stateCode.value : '';
        shippingData.address.countryCode = shippingAddressFields.country && shippingAddressFields.country.value ? shippingAddressFields.country.value : '';
        shippingData.address.phone = shippingAddressFields.phone && shippingAddressFields.phone.value ? shippingAddressFields.phone.value : '';

        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        COHelpers.copyShippingAddressToShipment(
            shippingData,
            currentBasket.defaultShipment
        );
    }

    var Transaction = require('dw/system/Transaction');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    var Locale = require('dw/util/Locale');
    var AccountModel = require('*/cartridge/models/account');
    var OrderModel = require('*/cartridge/models/order');
    var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
    var currentLocale = Locale.getLocale(req.locale.id);
    var basketModel = new OrderModel(
        currentBasket,
        { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
    );

    res.json({
        customer: new AccountModel(req.currentCustomer),
        order: basketModel
    });
    return next();
});

module.exports = server.exports();
