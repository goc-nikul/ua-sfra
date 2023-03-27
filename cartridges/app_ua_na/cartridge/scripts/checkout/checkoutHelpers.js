/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
/* eslint-disable no-param-reassign */

'use strict';

/* Script modules */
var baseCheckoutHelper = require('app_ua_core/cartridge/scripts/checkout/checkoutHelpers');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');

/**
 * Copies information from the shipping form to the associated shipping address
 * @param {Object} shippingData - the shipping data
 * @param {dw.order.Shipment} [shipmentOrNull] - the target Shipment
 * @param {string} type - origin of the request
 */
function copyShippingAddressToShipment(shippingData, shipmentOrNull, type) {
    baseCheckoutHelper.copyShippingAddressToShipment(shippingData, shipmentOrNull, type);
    var currentBasket = BasketMgr.getCurrentBasket();
    var shipment = shipmentOrNull || currentBasket.defaultShipment;
    var form = require('server').forms.getForm('shipping');
    var shippingAddress = shipment.shippingAddress;

    Transaction.wrap(function () {
        if ('exteriorNumber' in form.shippingAddress.addressFields && (!empty(form.shippingAddress.addressFields.exteriorNumber) && !empty(form.shippingAddress.addressFields.exteriorNumber.value))) {
            shippingAddress.custom.exteriorNumber = form.shippingAddress.addressFields.exteriorNumber.value;
        }
        if ('interiorNumber' in form.shippingAddress.addressFields && (!empty(form.shippingAddress.addressFields.interiorNumber))) {
            shippingAddress.custom.interiorNumber = form.shippingAddress.addressFields.interiorNumber.value ? form.shippingAddress.addressFields.interiorNumber.value : '';
        }
        if ('additionalInformation' in form.shippingAddress.addressFields && (!empty(form.shippingAddress.addressFields.additionalInformation))) {
            shippingAddress.custom.additionalInformation = form.shippingAddress.addressFields.additionalInformation.value ? form.shippingAddress.addressFields.additionalInformation.value : '';
        }
        if ('colony' in form.shippingAddress.addressFields && (!empty(form.shippingAddress.addressFields.colony) && !empty(form.shippingAddress.addressFields.colony.value))) {
            shippingAddress.custom.colony = form.shippingAddress.addressFields.colony.value;
        }
        if ('dependentLocality' in form.shippingAddress.addressFields && (!empty(form.shippingAddress.addressFields.dependentLocality) && !empty(form.shippingAddress.addressFields.dependentLocality.value))) {
            shippingAddress.custom.dependentLocality = form.shippingAddress.addressFields.dependentLocality.value;
        }
    });
}

/**
 * Copies a raw address object to the baasket billing address
 * @param {Object} address - an address-similar Object (firstName, ...)
 * @param {Object} currentBasket - the current shopping basket
 */
function copyBillingAddressToBasket(address, currentBasket) {
    baseCheckoutHelper.copyBillingAddressToBasket(address, currentBasket);
    var billingAddress = currentBasket.billingAddress;
    var form = require('server').forms.getForm('shipping');
    Transaction.wrap(function () {
        if ('exteriorNumber' in address.custom && !empty(address.custom.exteriorNumber)) {
            billingAddress.custom.exteriorNumber = address.custom.exteriorNumber;
        }
        if ('interiorNumber' in address.custom && !empty(address.custom.interiorNumber)) {
            billingAddress.custom.interiorNumber = address.custom.interiorNumber;
        } else if ('interiorNumber' in form.shippingAddress.addressFields) {
            billingAddress.custom.interiorNumber = '';
        }
        if ('additionalInformation' in address.custom && !empty(address.custom.additionalInformation)) {
            billingAddress.custom.additionalInformation = address.custom.additionalInformation;
        } else if ('additionalInformation' in form.shippingAddress.addressFields) {
            billingAddress.custom.additionalInformation = '';
        }
        if ('colony' in address.custom && !empty(address.custom.colony)) {
            billingAddress.custom.colony = address.custom.colony;
        }
        if ('dependentLocality' in address.custom && !empty(address.custom.dependentLocality)) {
            billingAddress.custom.dependentLocality = address.custom.dependentLocality;
        }
    });
}

/**
 * Copies a CustomerAddress to a Shipment as its Shipping Address
 * @param {dw.customer.CustomerAddress} address - The customer address
 * @param {dw.order.Shipment} [shipmentOrNull] - The target shipment
 */
function copyCustomerAddressToShipment(address, shipmentOrNull) {
    var Locale = require('dw/util/Locale'); // eslint-disable-next-line
    var siteCountryCode = Locale.getLocale(request.locale).country;

    if (address.countryCode === siteCountryCode || address.countryCode.value === siteCountryCode) {
        baseCheckoutHelper.copyCustomerAddressToShipment(address, shipmentOrNull);
        var currentBasket = BasketMgr.getCurrentBasket();
        var shipment = currentBasket.defaultShipment;
        var shippingAddress = shipment.shippingAddress;
        Transaction.wrap(function () {
            if (!empty(address.custom) && 'exteriorNumber' in address.custom && !empty(address.custom.exteriorNumber)) {
                shippingAddress.custom.exteriorNumber = address.custom.exteriorNumber;
            }
            if (!empty(address.custom) && 'interiorNumber' in address.custom) {
                shippingAddress.custom.interiorNumber = address.custom.interiorNumber ? address.custom.interiorNumber : '';
            }
            if (!empty(address.custom) && 'additionalInformation' in address.custom) {
                shippingAddress.custom.additionalInformation = address.custom.additionalInformation ? address.custom.additionalInformation : '';
            }
            if (!empty(address.custom) && 'colony' in address.custom && !empty(address.custom.colony)) {
                shippingAddress.custom.colony = address.custom.colony;
            }
            if (!empty(address.custom) && 'dependentLocality' in address.custom && !empty(address.custom.dependentLocality)) {
                shippingAddress.custom.dependentLocality = address.custom.dependentLocality;
            }
        });
    }
}

/**
 * Copies a CustomerAddress to a Basket as its Billing Address
 * @param {dw.customer.CustomerAddress} address - The customer address
 */
function copyCustomerAddressToBilling(address) {
    var Locale = require('dw/util/Locale'); // eslint-disable-next-line
    var siteCountryCode = Locale.getLocale(request.locale).country;

    if (address.countryCode === siteCountryCode || address.countryCode.value === siteCountryCode) {
        baseCheckoutHelper.copyCustomerAddressToBilling(address);
        var currentBasket = BasketMgr.getCurrentBasket();
        var billingAddress = currentBasket.billingAddress;
        Transaction.wrap(function () {
            if (!empty(address.custom) && 'exteriorNumber' in address.custom && !empty(address.custom.exteriorNumber)) {
                billingAddress.custom.exteriorNumber = address.custom.exteriorNumber;
            }
            if (!empty(address.custom) && 'interiorNumber' in address.custom && !empty(address.custom.interiorNumber)) {
                billingAddress.custom.interiorNumber = address.custom.interiorNumber;
            }
            if (!empty(address.custom) && 'additionalInformation' in address.custom && !empty(address.custom.additionalInformation)) {
                billingAddress.custom.additionalInformation = address.custom.additionalInformation;
            }
            if (!empty(address.custom) && 'colony' in address.custom && !empty(address.custom.colony)) {
                billingAddress.custom.colony = address.custom.colony;
            }
            if (!empty(address.custom) && 'dependentLocality' in address.custom && !empty(address.custom.dependentLocality)) {
                billingAddress.custom.dependentLocality = address.custom.dependentLocality;
            }
        });
    }
}

/**
 * To copy customer address to Billing & Shipping
 * @param {dw.order.Basket} currentBasket - The current basket
 * @param {Object} currentCustomer current customer
 */
function copyCustomerAddressToBasket(currentBasket, currentCustomer) {
    var shipments = currentBasket.shipments;
    var billingAddress = currentBasket.billingAddress;
    var preferredAddress = null;
    var Locale = require('dw/util/Locale');
    var countryCode = Locale.getLocale(request.locale).country; // eslint-disable-line
    var containsLocaleAddress = null;
    if (currentCustomer && currentCustomer.addressBook && currentCustomer.addressBook.addresses.length > 0) {
        containsLocaleAddress = baseCheckoutHelper.getLocaleAddress(countryCode, currentCustomer.addressBook.addresses);
    }
    if (currentCustomer && currentCustomer.addressBook && currentCustomer.addressBook.preferredAddress && currentCustomer.addressBook.preferredAddress.countryCode === countryCode) {
        preferredAddress = currentCustomer.addressBook.preferredAddress;
    } else if (containsLocaleAddress) {
        preferredAddress = containsLocaleAddress;
    }
    // only true if customer is registered
    if (preferredAddress) {
        var collections = require('*/cartridge/scripts/util/collections');
        collections.forEach(shipments, function (shipment) {
            if ((!shipment.shippingAddress || shipment.shippingAddress.address1 === null) && preferredAddress.countryCode.value === countryCode) {
                copyCustomerAddressToShipment(preferredAddress, shipment);
            }
        });

        if (!billingAddress) {
            var isInternationalBillingAddress = 'isInternationalBillingAddressEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isInternationalBillingAddressEnabled');
            if (isInternationalBillingAddress || (preferredAddress && preferredAddress.countryCode && preferredAddress.countryCode.value === countryCode)) {
                copyCustomerAddressToBilling(preferredAddress);
            }
        }
    }
}

// Asigning all the attributes of the base object to the exports object
Object.assign(module.exports, baseCheckoutHelper);
module.exports.copyBillingAddressToBasket = copyBillingAddressToBasket;
module.exports.copyCustomerAddressToBasket = copyCustomerAddressToBasket;
module.exports.copyShippingAddressToShipment = copyShippingAddressToShipment;
module.exports.copyCustomerAddressToShipment = copyCustomerAddressToShipment;
module.exports.copyCustomerAddressToBilling = copyCustomerAddressToBilling;

