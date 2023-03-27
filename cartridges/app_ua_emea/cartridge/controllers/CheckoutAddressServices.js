'use strict';

var server = require('server');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');


server.extend(module.superModule);

// Handle Ajax for add / update / delete shipping address in customer profile

server.replace('UpdateShippingAddress',
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    consentTracking.consent,
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var AddressModel = require('*/cartridge/models/address');
        var Transaction = require('dw/system/Transaction');
        var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
        var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');

        var addressForm = server.forms.getForm('shipping');
        var shippingFormErrors = COHelpers.validateShippingForm(addressForm.shippingAddress.addressFields);
        var addressId = req.querystring.addressId;

        if (Object.keys(shippingFormErrors).length > 0) {
            res.json({
                form: addressForm,
                fieldErrors: [shippingFormErrors],
                serverErrors: [],
                error: true
            });
        } else {
            var customer = CustomerMgr.getCustomerByCustomerNumber(
                req.currentCustomer.profile.customerNo
            );
            var addressBook = customer.getProfile().getAddressBook();
            var states = {};
            if ('states' in addressForm.shippingAddress.addressFields && !empty(addressForm.shippingAddress.addressFields.states.stateCode.value) && addressForm.shippingAddress.addressFields.states.stateCode.value !== undefined) {
                states = {
                    stateCode: addressForm.shippingAddress.addressFields.states.stateCode.value
                };
            }
            var newAddress = {
                firstName: addressForm.shippingAddress.addressFields.firstName.value,
                lastName: addressForm.shippingAddress.addressFields.lastName.value,
                address1: addressForm.shippingAddress.addressFields.address1.value,
                address2: addressForm.shippingAddress.addressFields.address2.value,
                city: addressForm.shippingAddress.addressFields.city ? addressForm.shippingAddress.addressFields.city.value : '',
                postalCode: addressForm.shippingAddress.addressFields.postalCode ? addressForm.shippingAddress.addressFields.postalCode.value : '',
                country: addressForm.shippingAddress.addressFields.country.value,
                states: states,
                phone: addressForm.shippingAddress.addressFields.phone.value,
                saveAsDefault: addressForm.shippingAddress.addressFields.setAsDefault.checked
            };
            if (empty(newAddress.city) && addressForm.shippingAddress.addressFields.city && addressForm.shippingAddress.addressFields.city && addressForm.shippingAddress.addressFields.city.value) {
                newAddress.city = addressForm.shippingAddress.addressFields.city.value;
            }
            if (empty(newAddress.postalCode) && addressForm.shippingAddress.addressFields.postalCode && addressForm.shippingAddress.addressFields.postalCode && addressForm.shippingAddress.addressFields.postalCode.value) {
                newAddress.postalCode = addressForm.shippingAddress.addressFields.postalCode.value;
            }
            if (Object.keys(states).length === 0 && addressForm.shippingAddress.addressFields && addressForm.shippingAddress.addressFields.state && addressForm.shippingAddress.addressFields.state.value) {
                newAddress.states.stateCode = addressForm.shippingAddress.addressFields.state.value;
            }
            var addressLength = addressBook.getAddresses().length;
            var preferredAddress = false;

            Transaction.wrap(function () {
                var address;
                if (addressId !== 'null' && addressId) {
                    address = addressBook.getAddress(addressId);
                } else {
                    var randomID = Math.random().toString(36).substr(2);
                    if (addressBook.getAddress(randomID)) {
                        randomID = Math.random().toString(36).substr(2);
                    }
                    address = addressBook.createAddress(randomID);
                }
                if (address) {
                    // Save form's address
                    addressHelpers.updateAddressFields(address, newAddress);
                    var addressModel = new AddressModel(address);
                    if (addressLength === 0 || newAddress.saveAsDefault) {
                        addressBook.setPreferredAddress(address);
                        preferredAddress = true;
                    }
                    // Send account edited email
                    accountHelpers.sendAccountEditedEmail(customer.profile);
                    addressForm.clear();
                    addressForm.copyFrom(addressModel.address);
                    var isNewAddress = addressId !== address.ID;
                    res.json({
                        form: addressForm,
                        address: addressModel.address,
                        newAddress: isNewAddress,
                        preferredAddress: preferredAddress,
                        success: true
                    });
                } else {
                    res.json({
                        form: addressForm,
                        fieldErrors: [],
                        serverErrors: [],
                        error: true
                    });
                }
            });
        }

        next();
    });

module.exports = server.exports();
