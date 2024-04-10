/**
 *
 * int_ocapi/cartridge/scripts/addressHelper.js
 *
 * Helper for OCAPI address related operations
 */

/* DW API Includes */
const Logger = require('dw/system/Logger').getLogger('OCAPI_ADDRESS_HELPER');

/* Script Includes */
const collections = require('*/cartridge/scripts/util/collections');
const Constants = require('*/cartridge/scripts/constants/constants');

/**
 * Validate address using the same address validation rules as order creation.
 * @param {Object} address - address to validate
 * @returns {Object} errors - object containing error messages.
 */
function validateAddress(address) {
    let errors = require('*/cartridge/scripts/checkout/checkoutHelpers').checkEmptyEmojiNonLatinChars(address, Constants.ADDRESS_FIELDS_TO_VERIFY, address.countryCode);
    if (Object.keys(errors).length === 0) {
        errors = require('*/cartridge/scripts/utils/checkCrossSiteScript').crossSiteScriptPatterns(address, Constants.ADDRESS_FIELDS_TO_VERIFY);
    }

    return errors;
}

/**
 * Remove invalid address from customer profile.
 * @param {dw.customer.Profile} profile - profile to validate.
 * @returns {boolean} boolean - indicate if the operation was successful
 */
function deleteInvalidAddressFromProfile(profile) {
    try {
        let addressBook = profile && profile.addressBook ? profile.addressBook : null;
        if (addressBook) {
            collections.forEach(addressBook.addresses, function (address) {
                let errors = validateAddress(address);

                if (Object.keys(errors).length > 0) {
                    addressBook.removeAddress(address);
                    Logger.error('Invalid address found for customer {0}. Removed address ID: {1}, Address validation error: {2}', customer.ID, 'ID' in address ? address.ID : 'NOT_FOUND', JSON.stringify(errors));
                }
            });
        }
    } catch (e) {
        Logger.error('Error for deleting customer addressbook: {0} {1}', e.message, e.stack);
        return false;
    }

    return true;
}

module.exports = {
    validateAddress: validateAddress,
    deleteInvalidAddressFromProfile: deleteInvalidAddressFromProfile
};
