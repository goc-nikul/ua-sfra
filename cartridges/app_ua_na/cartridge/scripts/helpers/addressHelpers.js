'use strict';

var baseCheckoutHelper = require('app_ua_core/cartridge/scripts/helpers/addressHelpers');

/**
 * Copy information from address object and save it in the system
 * @param {dw.customer.CustomerAddress} newAddress - newAddress to save information into
 * @param {*} address - Address to copy from
 */
function updateAddressFields(newAddress, address) {
    baseCheckoutHelper.updateAddressFields(newAddress, address); // eslint-disable-next-line no-param-reassign
    if ('exteriorNumber' in address) { // eslint-disable-next-line no-param-reassign
        newAddress.custom.exteriorNumber = !empty(address) && address.exteriorNumber ? address.exteriorNumber : ''; // eslint-disable-next-line no-param-reassign
    }
    if ('interiorNumber' in address) { // eslint-disable-next-line no-param-reassign
        newAddress.custom.interiorNumber = !empty(address) && address.interiorNumber ? address.interiorNumber : ''; // eslint-disable-next-line no-param-reassign
    }
    if ('additionalInformation' in address) { // eslint-disable-next-line no-param-reassign
        newAddress.custom.additionalInformation = !empty(address) && address.additionalInformation ? address.additionalInformation : ''; // eslint-disable-next-line no-param-reassign
    }
    if ('colony' in address) { // eslint-disable-next-line no-param-reassign
        newAddress.custom.colony = !empty(address) && address.colony ? address.colony : ''; // eslint-disable-next-line no-param-reassign
    }
    if ('dependentLocality' in address) { // eslint-disable-next-line no-param-reassign
        newAddress.custom.dependentLocality = !empty(address) && address.dependentLocality ? address.dependentLocality : ''; // eslint-disable-next-line no-param-reassign
    }
    if ('rfc' in address && typeof address.rfc === 'object') { // eslint-disable-next-line no-param-reassign
        if (address.rfc.razonsocial !== null) {
            newAddress.custom.razonsocial = address.rfc.razonsocial || ''; // eslint-disable-line no-param-reassign
        }
        if (address.rfc.rfc !== null) {
            newAddress.custom.rfc = address.rfc.rfc || ''; // eslint-disable-line no-param-reassign
        }
    }
}

/**
 * Copy dwscript address object into JavaScript object
 * @param {dw.order.OrderAddress} address - Address to be copied
 * @returns {Object} - Plain object that represents an address
 */
function copyShippingAddress(address) {
    var shippingAddress = baseCheckoutHelper.copyShippingAddress(address);
    if ('exteriorNumber' in address.custom && address.custom.exteriorNumber) {
        shippingAddress.exteriorNumber = address.custom.exteriorNumber;
    }
    if ('interiorNumber' in address.custom && address.custom.interiorNumber) {
        shippingAddress.interiorNumber = address.custom.interiorNumber;
    }
    if ('additionalInformation' in address.custom && address.custom.additionalInformation) {
        shippingAddress.additionalInformation = address.custom.additionalInformation;
    }
    if ('colony' in address.custom && address.custom.colony) {
        shippingAddress.colony = address.custom.colony;
    }
    if ('dependentLocality' in address.custom && address.custom.dependentLocality) {
        shippingAddress.dependentLocality = address.custom.dependentLocality;
    }

    return shippingAddress;
}

/**
 * Stores a new address for a given customer
 * @param {Object} address - New address to be saved
 * @param {Object} customer - Current customer
 * @param {string} addressId - Id of a new address to be created
 * @returns {void}
 */
function saveAddress(address, customer, addressId) {
    var Transaction = require('dw/system/Transaction');

    if (customer && customer.raw) {
        var addressBook = customer.raw.getProfile().getAddressBook();
        if (addressBook && addressId) {
            Transaction.wrap(function () {
                var newAddress = addressBook.createAddress(addressId);
                updateAddressFields(newAddress, address);
            });
        }
    }
}

/**
 * Gather all addresses from shipments and return as an array
 * @param {dw.order.Basket} order - current order
 * @returns {Array} - Array of shipping addresses
 */
function gatherShippingAddresses(order) {
    var collections = require('*/cartridge/scripts/util/collections');
    var allAddresses = [];

    if (order.shipments) {
        collections.forEach(order.shipments, function (shipment) {
            if (shipment.shippingAddress) {
                allAddresses.push(copyShippingAddress(shipment.shippingAddress));
            }
        });
    } else {
        allAddresses.push(order.defaultShipment.shippingAddress);
    }
    return allAddresses;
}

/**
 * Save RFC data to Customer Address
 * @param {string} addressId - customer address ID
 * @param {string} rfc - customer address ID
 * @param {string} razonsocial - customer address ID
 */
function saveRFCtoCustomerAddress(addressId, rfc, razonsocial) {
    if (!customer.profile || !customer.profile.addressBook) {
        return;
    }

    var address = customer.profile.addressBook.getAddress(addressId);
    if (address) {
        var Transaction = require('dw/system/Transaction');
        Transaction.wrap(function () {
            address.custom.razonsocial = razonsocial;
            address.custom.rfc = rfc;
        });
    }
}

Object.assign(module.exports, baseCheckoutHelper);
module.exports.updateAddressFields = updateAddressFields;
module.exports.copyShippingAddress = copyShippingAddress;
module.exports.gatherShippingAddresses = gatherShippingAddresses;
module.exports.saveAddress = saveAddress;
module.exports.saveRFCtoCustomerAddress = saveRFCtoCustomerAddress;
