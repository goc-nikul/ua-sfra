'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');


server.extend(module.superModule);
/**
 * CheckoutAddressServices-UpdateShippingAddress : Handle Ajax for add / update / delete shipping address in customer profile
 *  prepend : the route is prend to save MX fields value to viewData before  shipping form clears
 */

server.prepend('UpdateShippingAddress',
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    consentTracking.consent,
    function (req, res, next) {
        var addressForm = server.forms.getForm('shipping');
        if (addressForm.shippingAddress.addressFields && addressForm.shippingAddress.addressFields.exteriorNumber && addressForm.shippingAddress.addressFields.exteriorNumber.value) {
            res.setViewData({ exteriorNumber: addressForm.shippingAddress.addressFields.exteriorNumber.value });
        }
        if (addressForm.shippingAddress.addressFields && addressForm.shippingAddress.addressFields.interiorNumber) {
            res.setViewData({ interiorNumber: addressForm.shippingAddress.addressFields.interiorNumber.value ? addressForm.shippingAddress.addressFields.interiorNumber.value : '' });
        }
        if (addressForm.shippingAddress.addressFields && addressForm.shippingAddress.addressFields.additionalInformation) {
            res.setViewData({ additionalInformation: addressForm.shippingAddress.addressFields.additionalInformation.value ? addressForm.shippingAddress.addressFields.additionalInformation.value : '' });
        }
        if (addressForm.shippingAddress.addressFields && addressForm.shippingAddress.addressFields.colony && addressForm.shippingAddress.addressFields.colony.value) {
            res.setViewData({ colony: addressForm.shippingAddress.addressFields.colony.value });
        }
        if (addressForm.shippingAddress.addressFields && addressForm.shippingAddress.addressFields.dependentLocality && addressForm.shippingAddress.addressFields.dependentLocality.value) {
            res.setViewData({ dependentLocality: addressForm.shippingAddress.addressFields.dependentLocality.value });
        }
        next();
    });

/**
 * CheckoutAddressServices-UpdateShippingAddress : Handle Ajax for add / update / delete shipping address in customer profile
 *  append : the route is append to save MX fields value to customer profile addressbook from viewData
 */

server.append('UpdateShippingAddress', function (req, res, next) {
    var viewData = res.getViewData();
    var Transaction = require('dw/system/Transaction');
    var address = viewData.address;
    var addressBook = customer.getProfile().getAddressBook();
    var customerAddress = addressBook.getAddress(address.ID);

    if (viewData.exteriorNumber) {
        Transaction.wrap(function () {
            customerAddress.custom.exteriorNumber = viewData.exteriorNumber;
        });
        address.exteriorNumber = viewData.exteriorNumber;
    }
    if ('interiorNumber' in viewData) {
        Transaction.wrap(function () {
            customerAddress.custom.interiorNumber = viewData.interiorNumber;
        });
        address.interiorNumber = viewData.interiorNumber;
    }
    if ('additionalInformation' in viewData) {
        Transaction.wrap(function () {
            customerAddress.custom.additionalInformation = viewData.additionalInformation;
        });
        address.additionalInformation = viewData.additionalInformation;
    }
    if (viewData.colony) {
        Transaction.wrap(function () {
            customerAddress.custom.colony = viewData.colony;
        });
        address.colony = viewData.colony;
    }
    if (viewData.dependentLocality) {
        Transaction.wrap(function () {
            customerAddress.custom.dependentLocality = viewData.dependentLocality;
        });
        address.dependentLocality = viewData.dependentLocality;
    }
    next();
});

module.exports = server.exports();
