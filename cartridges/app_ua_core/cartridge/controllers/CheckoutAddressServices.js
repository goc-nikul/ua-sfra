'use strict';

var server = require('server');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');


server.extend(module.superModule);

// Handle Ajax for add / update / delete shipping address in customer profile

server.post('UpdateShippingAddress',
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
            var newAddress = {
                firstName: addressForm.shippingAddress.addressFields.firstName.value,
                lastName: addressForm.shippingAddress.addressFields.lastName.value,
                address1: addressForm.shippingAddress.addressFields.address1.value,
                address2: addressForm.shippingAddress.addressFields.address2 ? addressForm.shippingAddress.addressFields.address2.value : '',
                city: addressForm.shippingAddress.addressFields.city.value,
                postalCode: addressForm.shippingAddress.addressFields.postalCode.value,
                country: addressForm.shippingAddress.addressFields.country.value,
                states: {
                    stateCode: addressForm.shippingAddress.addressFields.states.stateCode.value
                },
                phone: addressForm.shippingAddress.addressFields.phone.value,
                saveAsDefault: addressForm.shippingAddress.addressFields.setAsDefault.checked
            };
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

server.get('DeleteShippingAddress',
    userLoggedIn.validateLoggedInAjax,
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Transaction = require('dw/system/Transaction');
        var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');

        var addressId = req.querystring.addressId;
        var isDefault = req.querystring.isDefault;
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );
        var addressBook = customer.getProfile().getAddressBook();
        var address = addressBook.getAddress(addressId);
        this.on('route:BeforeComplete', function () { // eslint-disable-line no-shadow
            Transaction.wrap(function () {
                addressBook.removeAddress(address);
                var length = addressBook.getAddresses().length;
                if (isDefault && length > 0) {
                    var newDefaultAddress = addressBook.getAddresses()[0];
                    addressBook.setPreferredAddress(newDefaultAddress);
                }
            });

            // Send account edited email
            accountHelpers.sendAccountEditedEmail(customer.profile);

            res.json({
                success: true,
                addressID: addressId
            });
        });
        return next();
    });

server.replace(
    'AddNewAddress',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Transaction = require('dw/system/Transaction');
        var AccountModel = require('*/cartridge/models/account');
        var OrderModel = require('*/cartridge/models/order');
        var URLUtils = require('dw/web/URLUtils');
        var UUIDUtils = require('dw/util/UUIDUtils');
        var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
        var Locale = require('dw/util/Locale');

        var pliUUID = req.form.productLineItemUUID;
        var shipmentUUID = req.form.shipmentSelector || req.form.shipmentUUID;
        var origUUID = req.form.originalShipmentUUID;
        var storeId = req.form.storeId;

        var form = server.forms.getForm('shipping');
        var shippingFormErrors = COHelpers.validateShippingForm(form.shippingAddress.addressFields);

        var basket = BasketMgr.getCurrentBasket();
        if (!basket) {
            res.json({
                redirectUrl: URLUtils.url('Cart-Show').toString(),
                error: true
            });

            return next();
        }

        var result = {};

        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
        var productLi = COHelpers.getProductLineItem(basket, pliUUID);
        COHelpers.saveInstorePickUpContacts(productLi, '', '');

        if (!storeId && Object.keys(shippingFormErrors).length > 0) {
            if (shipmentUUID === 'new') {
                req.session.privacyCache.set(origUUID, 'invalid');
            } else {
                req.session.privacyCache.set(shipmentUUID, 'invalid');
            }
            res.json({
                form: form,
                fieldErrors: [shippingFormErrors],
                serverErrors: [],
                error: true
            });
        } else if (storeId) {
            var StoreMgr = require('dw/catalog/StoreMgr');
            var store = StoreMgr.getStore(storeId);
            result.address = {
                firstName: !empty(form.primaryContact.personFirstName) ? form.primaryContact.personFirstName.value : store.name,
                lastName: !empty(form.primaryContact.personLastName) ? form.primaryContact.personLastName.value : '',
                address1: store.address1,
                address2: store.address2,
                city: store.city,
                stateCode: store.stateCode,
                postalCode: store.postalCode,
                countryCode: store.countryCode,
                phone: store.phone
            };
            var instorePickupStoreHelper = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
            if (productLi && productLi.product.custom.availableForInStorePickup) {
                if (storeId) {
                    instorePickupStoreHelper.setStoreInProductLineItem(storeId, productLi);
                }
            }
            var pickUpNotification = {};
            var primaryContact = COHelpers.saveInstorePickUpContacts(productLi, form.primaryContact, 'primary');
            pickUpNotification.primaryContact = primaryContact;

            if (form.secondaryContact.someOneMayPickup.checked) {
                var secondaryContact = COHelpers.saveInstorePickUpContacts(productLi, form.secondaryContact, 'secondary');
                pickUpNotification.secondaryContact = secondaryContact;
            }
            result.pickUpNotification = pickUpNotification;
            result.shippingMethod = form.shippingAddress.shippingMethodID.value ?
                form.shippingAddress.shippingMethodID.value.toString() :
                null;
            res.setViewData(result);
        } else {
            result.address = {
                firstName: form.shippingAddress.addressFields.firstName.value,
                lastName: form.shippingAddress.addressFields.lastName.value,
                address1: form.shippingAddress.addressFields.address1.value,
                address2: form.shippingAddress.addressFields.address2.value,
                city: form.shippingAddress.addressFields.city.value,
                postalCode: form.shippingAddress.addressFields.postalCode.value,
                countryCode: form.shippingAddress.addressFields.country.value,
                phone: form.shippingAddress.addressFields.phone.value
            };

            if (Object.prototype.hasOwnProperty
                .call(form.shippingAddress.addressFields, 'states')) {
                result.address.stateCode =
                    form.shippingAddress.addressFields.states.stateCode.value;
            }

            result.shippingBillingSame =
                form.shippingAddress.shippingAddressUseAsBillingAddress.value;

            result.shippingMethod =
                form.shippingAddress.shippingMethodID.value ?
                '' + form.shippingAddress.shippingMethodID.value : null;
            result.form = form;

            result.isGift = form.shippingAddress.isGift.checked;

            result.giftMessage = result.isGift ? form.shippingAddress.giftMessage.value : null;

            res.setViewData(result);
        }

        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var viewData = res.getViewData();

            if (viewData.error || !productLi) {
                res.json(viewData);
                return;
            }

            var shipment;

            if (!COHelpers.isShippingAddressInitialized()) {
                // First use always applies to defaultShipment
                COHelpers.copyShippingAddressToShipment(viewData, basket.defaultShipment);
                shipment = basket.defaultShipment;
            } else {
                try {
                    Transaction.wrap(function () {
                        if (origUUID === shipmentUUID) {
                            // An edit to the address or shipping method
                            shipment = ShippingHelper.getShipmentByUUID(basket, shipmentUUID);
                            COHelpers.copyShippingAddressToShipment(viewData, shipment);
                        } else {
                            productLi = COHelpers.getProductLineItem(basket, pliUUID);
                            if (shipmentUUID === 'new') {
                                // Choosing a new address for this pli
                                if (origUUID === basket.defaultShipment.UUID &&
                                    basket.defaultShipment.productLineItems.length === 1) {
                                    // just replace the built-in one
                                    shipment = basket.defaultShipment;
                                } else {
                                    // create a new shipment and associate the current pli (later)
                                    shipment = basket.createShipment(UUIDUtils.createUUID());
                                }
                            } else if (shipmentUUID.indexOf('ab_') === 0) {
                                shipment = basket.createShipment(UUIDUtils.createUUID());
                            } else {
                                // Choose an existing shipment for this PLI
                                shipment = ShippingHelper.getShipmentByUUID(basket, shipmentUUID);
                            }
                            COHelpers.copyShippingAddressToShipment(viewData, shipment);
                            productLi.setShipment(shipment);

                            COHelpers.ensureNoEmptyShipments(req);
                        }
                    });
                } catch (e) {
                    viewData.error = e;
                }
            }
            if (shipment && shipment.UUID) {
                req.session.privacyCache.set(shipment.UUID, 'valid');
                viewData.shipmentUUID = shipment.UUID;
                // Update all the ShipToAddress shipments Shipping Address & Shipping Method
                if (usingMultiShipping && !shipment.shippingMethod.custom.storePickupEnabled) {
                    for (let k = 0; k < basket.shipments.length; k++) {
                        var currentShipment = basket.shipments[k];
                        if ((currentShipment.productLineItems.length > 0) && (currentShipment.UUID !== shipment.UUID) && (currentShipment.shippingAddress && currentShipment.shippingAddress.address1) && !currentShipment.shippingMethod.custom.storePickupEnabled) {
                            Transaction.wrap(function () { //eslint-disable-line
                                currentShipment.setShippingMethod(shipment.shippingMethod);
                                COHelpers.copyShippingAddressToShipment(viewData, currentShipment);
                            });
                        }
                    }
                }
            }

            // Loop through all shipments and make sure all are valid
            var isValid;
            var allValid = true;
            for (var i = 0, ii = basket.shipments.length; i < ii; i++) {
                isValid = req.session.privacyCache.get(basket.shipments[i].UUID);
                if (isValid !== 'valid') {
                    allValid = false;
                    break;
                }
            }

            if (shipment && viewData && !!viewData.isGift) {
                var giftResult = COHelpers.setGift(shipment, viewData.isGift, viewData.giftMessage);

                if (giftResult.error) {
                    res.json({
                        error: giftResult.error,
                        fieldErrors: [],
                        serverErrors: [giftResult.errorMessage]
                    });
                    return;
                }
            }

            var Site = require('dw/system/Site');
            var isBOPISEnabled = 'isBOPISEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isBOPISEnabled');
            if (!basket.billingAddress) {
                var countryCode = Locale.getLocale(req.locale.id).country;
                var isInternationalBillingAddress = 'isInternationalBillingAddressEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isInternationalBillingAddressEnabled');
                if (req.currentCustomer.addressBook && req.currentCustomer.addressBook.preferredAddress &&
                    (isInternationalBillingAddress || req.currentCustomer.addressBook.preferredAddress.countryCode === countryCode)) {
                    // Copy over preferredAddress (use addressUUID for matching)
                    COHelpers.copyBillingAddressToBasket(
                        req.currentCustomer.addressBook.preferredAddress, basket);
                } else {
                    // Copy over first shipping address (use shipmentUUID for matching)
                    var copyBillingAddress = basket.defaultShipment.shippingAddress;
                    var checkShipment = basket.defaultShipment;
                    if (basket.defaultShipment.shippingMethodID === 'eGift_Card' || (isBOPISEnabled && basket.defaultShipment.shippingMethod.custom.storePickupEnabled)) {
                        var collections = require('*/cartridge/scripts/util/collections');
                        collections.forEach(basket.shipments, function (shipment) { // eslint-disable-line no-shadow
                            if (shipment.shippingMethodID !== 'eGift_Card' && (!shipment.shippingMethod.custom.storePickupEnabled) && (shipment.shippingAddress && shipment.shippingAddress.address1)) {
                                checkShipment = shipment;
                                copyBillingAddress = shipment.shippingAddress;
                                return;
                            }
                        });
                    }
                    if (copyBillingAddress && !checkShipment.shippingMethod.custom.storePickupEnabled) {
                        COHelpers.copyBillingAddressToBasket(copyBillingAddress, basket);
                    }
                }
            }

            COHelpers.recalculateBasket(basket);
            var currentLocale = Locale.getLocale(req.locale.id);
            var basketModel = new OrderModel(
                basket, {
                    usingMultiShipping: usingMultiShipping,
                    shippable: allValid,
                    countryCode: currentLocale.country,
                    containerView: 'basket'
                }
            );

            var accountModel = new AccountModel(req.currentCustomer);

            res.json({
                form: form,
                data: viewData,
                order: basketModel,
                customer: accountModel,
                fieldErrors: [],
                serverErrors: [],
                error: false
            });

            if (shipment) {
                if (req.form.storeId) {
                    ShippingHelper.markShipmentForPickup(shipment, req.form.storeId);
                } else {
                    ShippingHelper.markShipmentForShipping(shipment);
                }
            }
        });

        return next();
    }
);
module.exports = server.exports();
