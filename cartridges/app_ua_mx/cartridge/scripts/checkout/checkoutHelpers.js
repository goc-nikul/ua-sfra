'use strict';

var Resource = require('dw/web/Resource');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');

/* Script modules */
var coreCheckoutHelper = require('app_ua_core/cartridge/scripts/checkout/checkoutHelpers');
var base = require('app_storefront_base/cartridge/scripts/checkout/checkoutHelpers');
/**
 * Sends a confirmation to the current user
 * @param {dw.order.Order} order - The current user's order
 * @param {string} locale - the current request's locale id
 * @returns {void}
 */
function sendConfirmationEmail(order) {
    if (!order.custom.confirmationEmailSent) {
        var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
        var orderObject = {
            order: order
        };
        var emailData = {
            to: order.customerEmail,
            subject: Resource.msg('subject.order.confirmation.email', 'order', null),
            from: '',
            type: emailHelpers.emailTypes.orderConfirmation
        };
        var emailObj = {
            templateData: orderObject,
            emailData: emailData
        };
        require('*/cartridge/modules/providers').get('Email', emailObj).send();
        var ordObj = order;
        Transaction.wrap(function () {
            ordObj.custom.confirmationEmailSent = true;
        });
    }
}

/**
 * Copies a CustomerAddress to a Shipment as its Shipping Address
 * @param {dw.customer.CustomerAddress} address - The customer address
 * @param {dw.order.Shipment} [shipmentOrNull] - The target shipment
 */
function copyCustomerAddressToShipment(address, shipmentOrNull) {
    base.copyCustomerAddressToShipment(address, shipmentOrNull);
    var currentBasket = BasketMgr.getCurrentBasket();
    var shipment = shipmentOrNull || currentBasket.defaultShipment;
    var shippingAddress = shipment.shippingAddress;
    var addressObject = !empty(address) && 'raw' in address && !empty(address.raw.custom) ? address.raw : address;
    Transaction.wrap(function () {
        if (!empty(addressObject.custom) && 'additionalInformation' in addressObject.custom && !empty(addressObject.custom.additionalInformation)) {
            shippingAddress.custom.additionalInformation = addressObject.custom.additionalInformation;
        }
        if (!empty(addressObject.custom) && 'colony' in addressObject.custom && !empty(addressObject.custom.colony)) {
            shippingAddress.custom.colony = addressObject.custom.colony;
        }
        if (!empty(addressObject.custom) && 'dependentLocality' in addressObject.custom && !empty(addressObject.custom.dependentLocality)) {
            shippingAddress.custom.dependentLocality = addressObject.custom.dependentLocality;
        }
        if (!empty(addressObject.custom) && 'exteriorNumber' in addressObject.custom && !empty(addressObject.custom.exteriorNumber)) {
            shippingAddress.custom.exteriorNumber = addressObject.custom.exteriorNumber;
        }
        if (!empty(addressObject.custom) && 'interiorNumber' in addressObject.custom && !empty(addressObject.custom.interiorNumber)) {
            shippingAddress.custom.interiorNumber = addressObject.custom.interiorNumber;
        }
    });
}

/**
 * Copies information from the shipping form to the associated shipping address
 * @param {Object} shippingData - the shipping data
 * @param {dw.order.Shipment} [shipmentOrNull] - the target Shipment
 * @param {string} type - origin of the request
 */
function copyShippingAddressToShipment(shippingData, shipmentOrNull, type) {
    base.copyShippingAddressToShipment(shippingData, shipmentOrNull, type);
    var currentBasket = BasketMgr.getCurrentBasket();
    var shipment = shipmentOrNull || currentBasket.defaultShipment;
    var form = require('server').forms.getForm('shipping');
    var shippingAddress = shipment.shippingAddress;

    Transaction.wrap(function () {
        shippingAddress.custom.additionalInformation = form.shippingAddress.addressFields.additionalInformation.value;
        if ((!empty(form.shippingAddress.addressFields.colony) && !empty(form.shippingAddress.addressFields.colony.value))) {
            shippingAddress.custom.colony = form.shippingAddress.addressFields.colony.value;
        }
        if ((!empty(form.shippingAddress.addressFields.dependentLocality) && !empty(form.shippingAddress.addressFields.dependentLocality.value))) {
            shippingAddress.custom.dependentLocality = form.shippingAddress.addressFields.dependentLocality.value;
        }
        if ((!empty(form.shippingAddress.addressFields.exteriorNumber) && !empty(form.shippingAddress.addressFields.exteriorNumber.value))) {
            shippingAddress.custom.exteriorNumber = form.shippingAddress.addressFields.exteriorNumber.value;
        }
        shippingAddress.custom.interiorNumber = form.shippingAddress.addressFields.interiorNumber.value;

        // Remove comma from city field if it is in the first position
        if (!empty(form.shippingAddress.addressFields.city) && !empty(form.shippingAddress.addressFields.city.value) && form.shippingAddress.addressFields.city.value.trim().indexOf(',') === 0) {
            shippingAddress.city = form.shippingAddress.addressFields.city.value.replace(/^,*/, '');
        }
    });
}

/**
 * Copies a raw address object to the baasket billing address
 * @param {Object} address - an address-similar Object (firstName, ...)
 * @param {Object} currentBasket - the current shopping basket
 */
function copyBillingAddressToBasket(address, currentBasket) {
    base.copyBillingAddressToBasket(address, currentBasket);
    var billingAddress = currentBasket.billingAddress;
    Transaction.wrap(function () {
        if (!empty(address.custom.additionalInformation)) {
            billingAddress.custom.additionalInformation = address.custom.additionalInformation;
        }
        if (!empty(address.custom.colony)) {
            billingAddress.custom.colony = address.custom.colony;
        }
        if (!empty(address.custom.dependentLocality)) {
            billingAddress.custom.dependentLocality = address.custom.dependentLocality;
        }
        if (!empty(address.custom.exteriorNumber)) {
            billingAddress.custom.exteriorNumber = address.custom.exteriorNumber;
        }
        if (!empty(address.custom.interiorNumber)) {
            billingAddress.custom.interiorNumber = address.custom.interiorNumber;
        }
    });
}

/**
 * Copies a CustomerAddress to a Basket as its Billing Address
 * @param {dw.customer.CustomerAddress} address - The customer address
 */
function copyCustomerAddressToBilling(address) {
    base.copyCustomerAddressToBilling(address);
    var currentBasket = BasketMgr.getCurrentBasket();
    var billingAddress = currentBasket.billingAddress;
    Transaction.wrap(function () {
        if (!empty(address.custom) && 'additionalInformation' in address.custom && !empty(address.custom.additionalInformation)) {
            billingAddress.custom.additionalInformation = address.custom.additionalInformation;
        }
        if (!empty(address.custom) && 'colony' in address.custom && !empty(address.custom.colony)) {
            billingAddress.custom.colony = address.custom.colony;
        }
        if (!empty(address.custom) && 'dependentLocality' in address.custom && !empty(address.custom.dependentLocality)) {
            billingAddress.custom.dependentLocality = address.custom.dependentLocality;
        }
        if (!empty(address.custom) && 'exteriorNumber' in address.custom && !empty(address.custom.exteriorNumber)) {
            billingAddress.custom.exteriorNumber = address.custom.exteriorNumber;
        }
        if (!empty(address.custom) && 'interiorNumber' in address.custom && !empty(address.custom.interiorNumber)) {
            billingAddress.custom.interiorNumber = address.custom.interiorNumber;
        }
    });
}

/**
 * Determines whether a Locale has atleast one corresponding address or not
 * @param {string} currentCountry - current locale
 * @param {Object} customerAddress - dw.customer.CustomerAddress
 * @returns {Object} address
 */
function getLocaleAddress(currentCountry, customerAddress) {
    var address = null;
    for (var i = 0; i < customerAddress.length; i++) {
        var addressCountry = customerAddress[i].countryCode.value;
        if (addressCountry === currentCountry) {
            address = customerAddress[i];
            break;
        }
    }

    return address;
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
        containsLocaleAddress = getLocaleAddress(countryCode, currentCustomer.addressBook.addresses);
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
            if (!shipment.shippingAddress && preferredAddress.countryCode.value === countryCode) {
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

/**
 * Get cfdiMapJSON & regimenFiscalMapJSON from Custom Cache or Site Preferences
 * @returns {{cfdiMapJSON: string, regimenFiscalMapJSON: string}} address
 */
function getMxTaxMap() {
    var CacheMgr = require('dw/system/CacheMgr');
    var prefsCache = CacheMgr.getCache('mxTaxMapPreferences');
    var mxTaxMapPreferences = prefsCache.get('preferences');
    if (mxTaxMapPreferences) {
        return mxTaxMapPreferences;
    }

    mxTaxMapPreferences = {
        cfdiMapJSON: Site.current.getCustomPreferenceValue('cfdiMapJSON') || '',
        regimenFiscalMapJSON: Site.current.getCustomPreferenceValue('regimenFiscalMapJSON') || ''
    };

    prefsCache.put('preferences', mxTaxMapPreferences);

    return mxTaxMapPreferences;
}

/**
 * Determine if RFC values are default ones and if they should be shown on order page
 * @param {Object} address checkout address
 * @returns {boolean} isHide
 */
function isHideRfcValues(address) {
    var rfcDefaultValuesJson = Site.current.getCustomPreferenceValue('rfcDefaultValuesJson') || '{}';
    var rfcDefaultValues = JSON.parse(rfcDefaultValuesJson);
    return address && address.rfc && rfcDefaultValuesJson !== '{}' && rfcDefaultValues.RFC_DEFAULT === address.rfc;
}

/**
 * Save Oxxo Details to the Order
 * @param {dw.order.Order} order - order
 * @param {Object} oxxoDetailsResponse - oxxoDetailsResponse
 */
function saveOxxoDetails(order, oxxoDetailsResponse) {
    if (order && oxxoDetailsResponse) {
        var Calendar = require('dw/util/Calendar');
        var Money = require('dw/value/Money');
        var StringUtils = require('dw/util/StringUtils');

        var oxxoDetails = {
            alternativeReference: oxxoDetailsResponse.alternativeReference || '',
            downloadUrl: oxxoDetailsResponse.downloadUrl || '',
            expiresAt: oxxoDetailsResponse.expiresAt || '',
            initialAmount: {
                currency: oxxoDetailsResponse.initialAmount ? oxxoDetailsResponse.initialAmount.currency : 'MXN',
                value: oxxoDetailsResponse.initialAmount ? oxxoDetailsResponse.initialAmount.value : 0
            },
            instructionsUrl: oxxoDetailsResponse.instructionsUrl || '',
            merchantName: oxxoDetailsResponse.merchantName || '',
            merchantReference: oxxoDetailsResponse.merchantReference || '',
            reference: oxxoDetailsResponse.reference || '',
            shopperEmail: oxxoDetailsResponse.shopperEmail || '',
            shopperName: oxxoDetailsResponse.shopperName || '',
            totalAmount: {
                currency: oxxoDetailsResponse.totalAmount ? oxxoDetailsResponse.totalAmount.currency : 'MXN',
                value: oxxoDetailsResponse.totalAmount ? oxxoDetailsResponse.totalAmount.value : 0
            },
            type: oxxoDetailsResponse.type || ''
        };

        var expiryDate = new Date(oxxoDetails.expiresAt);
        var expiryCalendar = new Calendar(expiryDate);
        oxxoDetails.formattedExpiryDate = StringUtils.formatCalendar(expiryCalendar, 'dd/MM/yyyy');

        oxxoDetails.formattedAmount = new Money(oxxoDetails.totalAmount.value / 100, oxxoDetails.totalAmount.currency).toFormattedString();

        Transaction.wrap(function () {
            order.custom.oxxoDetails = JSON.stringify(oxxoDetails); // eslint-disable-line
        });
    }
}

coreCheckoutHelper.isHideRfcValues = isHideRfcValues;
coreCheckoutHelper.sendConfirmationEmail = sendConfirmationEmail;
coreCheckoutHelper.copyCustomerAddressToShipment = copyCustomerAddressToShipment;
coreCheckoutHelper.copyShippingAddressToShipment = copyShippingAddressToShipment;
coreCheckoutHelper.copyBillingAddressToBasket = copyBillingAddressToBasket;
coreCheckoutHelper.copyCustomerAddressToBilling = copyCustomerAddressToBilling;
coreCheckoutHelper.copyCustomerAddressToBasket = copyCustomerAddressToBasket;
coreCheckoutHelper.getMxTaxMap = getMxTaxMap;
coreCheckoutHelper.saveOxxoDetails = saveOxxoDetails;

module.exports = coreCheckoutHelper;
