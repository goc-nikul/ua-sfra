'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');


server.extend(module.superModule);
/**
 * CheckoutAddressServices-UpdateShippingAddress : Handle Ajax for add / update / delete shipping address in customer profile
 *  prepend : the route is prend to save suburb value to viewData before  shipping form clears
 */

server.prepend('UpdateShippingAddress',
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    consentTracking.consent,
    function (req, res, next) {
        var addressForm = server.forms.getForm('shipping');
        var showSplitPhoneMobileField = require('*/cartridge/config/preferences').isShowSplitPhoneMobileField;
        if (addressForm.shippingAddress.addressFields && addressForm.shippingAddress.addressFields.suburb && addressForm.shippingAddress.addressFields.suburb.value) {
            res.setViewData({ suburb: addressForm.shippingAddress.addressFields.suburb.value });
        }
        if (addressForm.shippingAddress.addressFields && addressForm.shippingAddress.addressFields.businessName && addressForm.shippingAddress.addressFields.businessName.value) {
            res.setViewData({ businessName: addressForm.shippingAddress.addressFields.businessName.value });
        }
        if (addressForm.shippingAddress.addressFields && addressForm.shippingAddress.addressFields.district && addressForm.shippingAddress.addressFields.district.value) {
            res.setViewData({ district: addressForm.shippingAddress.addressFields.district.value });
        }
        if (addressForm.shippingAddress.addressFields && addressForm.shippingAddress.addressFields.postalCode && addressForm.shippingAddress.addressFields.postalCode && addressForm.shippingAddress.addressFields.postalCode.value) {
            res.setViewData({ postalCode: addressForm.shippingAddress.addressFields.postalCode.value });
        }
        if (addressForm.shippingAddress.addressFields && addressForm.shippingAddress.addressFields.state && addressForm.shippingAddress.addressFields.state.value) {
            res.setViewData({ stateCode: addressForm.shippingAddress.addressFields.state.value });
        }
        if (addressForm.shippingAddress.addressFields && addressForm.shippingAddress.addressFields.city && addressForm.shippingAddress.addressFields.city && addressForm.shippingAddress.addressFields.city.value) {
            res.setViewData({ city: addressForm.shippingAddress.addressFields.city.value });
        }
        if (addressForm.shippingAddress.addressFields && addressForm.shippingAddress.addressFields.district && addressForm.shippingAddress.addressFields.district && addressForm.shippingAddress.addressFields.district.value) {
            res.setViewData({ district: addressForm.shippingAddress.addressFields.district.value });
        }
        if (showSplitPhoneMobileField) {
            if (addressForm.shippingAddress.addressFields) {
                if (addressForm.shippingAddress.addressFields.phone1
                    && addressForm.shippingAddress.addressFields.phone1.value
                    && addressForm.shippingAddress.addressFields.phone2
                    && addressForm.shippingAddress.addressFields.phone2.value
                    && addressForm.shippingAddress.addressFields.phone3
                    && addressForm.shippingAddress.addressFields.phone3.value) {
                    res.setViewData({ phone1: addressForm.shippingAddress.addressFields.phone1.value });
                    res.setViewData({ phone2: addressForm.shippingAddress.addressFields.phone2.value });
                    res.setViewData({ phone3: addressForm.shippingAddress.addressFields.phone3.value });
                    res.setViewData({ phone: addressForm.shippingAddress.addressFields.phone1.value + '-' + addressForm.shippingAddress.addressFields.phone2.value + '-' + addressForm.shippingAddress.addressFields.phone3.value });
                }
            }
        } else if (addressForm.shippingAddress.addressFields && addressForm.shippingAddress.addressFields.phone && addressForm.shippingAddress.addressFields.phone && addressForm.shippingAddress.addressFields.phone.value) {
            res.setViewData({ phone: addressForm.shippingAddress.addressFields.phone.value });
        }
        next();
    });

/**
 * CheckoutAddressServices-UpdateShippingAddress : Handle Ajax for add / update / delete shipping address in customer profile
 *  append : the route is append to save suburb value to customer profile addressbook from viewData
 */

server.append('UpdateShippingAddress', function (req, res, next) {
    var viewData = res.getViewData();
    var Transaction = require('dw/system/Transaction');
    var address = viewData.address;
    var addressBook = customer.getProfile().getAddressBook();
    var customerAddress = addressBook.getAddress(address.ID);
    var showSplitPhoneMobileField = require('*/cartridge/config/preferences').isShowSplitPhoneMobileField;
    var showOnlyLastNameAsNameFieldEnabled = require('*/cartridge/config/preferences').isShowOnlyLastNameAsNameFieldEnabled;
    viewData.isShowOnlyLastNameAsNameFieldEnabled = showOnlyLastNameAsNameFieldEnabled;
    if (viewData.suburb) {
        Transaction.wrap(function () {
            customerAddress.custom.suburb = viewData.suburb;
        });
        address.suburb = viewData.suburb;
    }
    if (viewData.businessName) {
        Transaction.wrap(function () {
            customerAddress.custom.businessName = viewData.businessName;
        });
        address.businessName = viewData.businessName;
    }
    if (viewData.district) {
        Transaction.wrap(function () {
            customerAddress.custom.district = viewData.district;
        });
        address.district = viewData.district;
    }
    if (viewData.postalCode) {
        Transaction.wrap(function () {
            customerAddress.setPostalCode(viewData.postalCode);
        });
        address.postalCode = viewData.postalCode;
    }
    if (viewData.city) {
        address.city = viewData.city;
        Transaction.wrap(function () {
            customerAddress.setCity(viewData.city);
        });
    }
    if (viewData.phone) {
        Transaction.wrap(function () {
            customerAddress.setPhone(viewData.phone);
        });
        address.phone = viewData.phone;
    }
    if (showSplitPhoneMobileField) {
        if (viewData.phone1) {
            Transaction.wrap(function () {
                customerAddress.custom.phone1 = viewData.phone1;
            });
            address.phone1 = viewData.phone1;
        }
        if (viewData.phone2) {
            Transaction.wrap(function () {
                customerAddress.custom.phone2 = viewData.phone2;
            });
            address.phone2 = viewData.phone2;
        }
        if (viewData.phone3) {
            Transaction.wrap(function () {
                customerAddress.custom.phone3 = viewData.phone3;
            });
            address.phone3 = viewData.phone3;
        }
    }
    next();
});

server.append('AddNewAddress', function (req, res, next) {
    var form = server.forms.getForm('shipping');
    var result = res.getViewData();
    if (result.address && !empty(form.shippingAddress.addressFields.suburb)) {
        result.address.suburb = form.shippingAddress.addressFields.suburb.value;
    }
    return next();
});

module.exports = server.exports();
