'use strict';

/* API includes */
var MessageDigest = require('dw/crypto/MessageDigest');
var Bytes = require('dw/util/Bytes');
var Encoding = require('dw/crypto/Encoding');
var Logger = require('dw/system/Logger').getLogger('FedexService');
var FedexLogger = require('dw/system/Logger').getLogger('FedexService', 'FedexService');
var Transaction = require('dw/system/Transaction');

/* Script modules */
var PreferencesUtil = require('app_ua_core/cartridge/scripts/utils/PreferencesUtil');

/* eslint-disable no-param-reassign */

/**
 * Check address expiration
 * @param {Date} expirationDate - Address expiration date
 * @returns {boolean} - Info if address expired
 */
function checkExpiration(expirationDate) {
    if (expirationDate) {
        var currentDate = new Date();
        return currentDate < expirationDate;
    }

    return null;
}

/**
 * Generate hash
 * @param {Object} data - Data to generate hash from
 * @returns {string} hash - Hash
 */
function generateHash(data) {
    var phrase = typeof data === 'string' ? data : JSON.stringify(data);
    var digest = new MessageDigest('SHA-256');
    var hash = Encoding.toHex(digest.digestBytes(new Bytes(phrase, 'UTF-8')));

    return hash;
}

/**
 * Get address data JSON
 * @param {dw.order.OrderAddress} address - currentAddress
 * @returns {Object} addressFields - JSON with address data
 */
function getAddressFields(address) {
    var addressFields = {
        firstName: address.getFirstName(),
        lastName: address.getLastName(),
        address1: address.getAddress1(),
        address2: address.getAddress2(),
        city: address.getCity(),
        postalCode: address.getPostalCode(),
        stateCode: address.getStateCode(),
        countryCode: address.getCountryCode().value,
        phone: address.getPhone()
    };

    return addressFields;
}

/**
 * Compare address hash to check if fields are modifies
 * @param {Object} addressFedexData - Current address custom attributes
 * @param {string} currentHash - Hash from address fields
 * @returns {boolean} - Info is hash unchanged
 */
function checkHash(addressFedexData, currentHash) {
    if (addressFedexData.addressTypeValidationHash) {
        var savedHash = addressFedexData.addressTypeValidationHash;

        return currentHash === savedHash;
    }

    return null;
}

/**
 * Update address with custom data
 * @param {dw.order.OrderAddress} address - currentAddress
 * @param {string} addressType - Fedex Address Type
 * @param {string} currentHash - Hash from address fields
 * @returns {void}
 */
function updateAddress(address, addressType, currentHash) {
    var maxAge = (PreferencesUtil.getValue('addressTypeValidationExpire') || 1) * 1;
    var expirationDate = new Date();
    var currentDate = new Date();
    expirationDate.setDate(currentDate.getDate() + maxAge);

    Transaction.wrap(function () {
        address.custom.addressType = addressType;
        address.custom.addressTypeValidationExpire = expirationDate;
        address.custom.addressTypeValidationHash = currentHash;
    });

    return;
}

/**
 * Fedex API call
 * @param {Object} addressFields - Address JSON data
 * @returns {Object} args - Data from Fedex Service
 */
function getAddressTypeCall(addressFields) {
    var args = {
        classification: 'RESIDENTIAL'
    };

    var service = require('int_fedex/cartridge/scripts/init/FedExService').getType;
    var beforeCurrentTime = new Date().getTime();

    var serviceResult = service.call(addressFields);

    var afterCurrentTime = new Date().getTime();
    FedexLogger.warn('fedex getType service elapsed time{0}', beforeCurrentTime - afterCurrentTime);

    if (serviceResult.status === 'OK') {
        var addressTypeStatus = service.getResponse();
        if (addressTypeStatus.status === 'OK' && !empty(addressTypeStatus.classification)) {
            args.classification = addressTypeStatus.classification;
        } else if (addressTypeStatus.status === 'OK' && empty(addressTypeStatus.classification)) {
            args.classification = args.classification;
        } else {
            Logger.error('Error: Fedex classification missed');
        }
    } else {
        Logger.error('Error: Status {0} : Message {1}', serviceResult.status, serviceResult.errorMessage);
    }

    return args;
}

/**
 * Getting Fedex address type
 * @param {dw.order.OrderAddress} address - currentAddress
 * @returns {string} addressType - Fedex address type
 */
function getAddressType(address) {
    var addressType;
    var addressFedexData = address.getCustom();
    var addressFields = getAddressFields(address);
    var currentHash = generateHash(addressFields);

    // Check addressType
    var currentAddressType = addressFedexData.addressType;

    // Check addressTypeValidationExpire
    var addressExpirationStatus = checkExpiration(addressFedexData.addressTypeValidationExpire);

    // Check addressTypeValidationHash
    var addressHashStatus = checkHash(addressFedexData, currentHash);

    if (!currentAddressType || !addressExpirationStatus || !addressHashStatus) {
        // API call to get code
        var serviceResult = getAddressTypeCall(addressFields);

        // Update address timeout, hash, addressType
        addressType = serviceResult.classification;
        updateAddress(address, addressType, currentHash);
    } else {
        addressType = currentAddressType;
    }

    return addressType;
}

module.exports = {
    getAddressType: getAddressType
};
