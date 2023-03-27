'use strict';

var Site = require('dw/system/Site');
var currentSite = Site.getCurrent();

/**
 * Customer details from profile
 * @param {req} req customer
 * @returns {Object} customerDataObj with customer Fname, LName,Phone and email
 */
function customerProfileDataObj(req) {
    var customerProfile = req.currentCustomer.profile;
    if (customer.registered && customerProfile !== undefined) {
        var customerDataObj = {};
        customerDataObj.firstName = !empty(customerProfile.firstName) ? customerProfile.firstName : '';
        customerDataObj.lastName = !empty(customerProfile.lastName) ? customerProfile.lastName : '';
        customerDataObj.email = !empty(customerProfile.email) ? customerProfile.email : '';
        customerDataObj.phone = !empty(customerProfile.phone) ? customerProfile.phone : '';
        return JSON.stringify(customerDataObj);
    }
    return null;
}

/**
 * Brauz Model SDK URI from site preference
 * @returns {string} bookSessionSDK URL
 */
function getBookSessionSDK() {
    var bookSessionSDK = 'bookSessionSDK' in Site.current.preferences.custom && currentSite.getCustomPreferenceValue('bookSessionSDK');
    return !empty(bookSessionSDK) ? bookSessionSDK : null;
}

/**
 * Brauz Model Group ID from site preference
 * @returns {string} bsgroupNumber URL
 */
function getBrauzGroupNumber() {
    var bsgroupNumber = 'bsgroupNumber' in Site.current.preferences.custom && currentSite.getCustomPreferenceValue('bsgroupNumber');
    return !empty(bsgroupNumber) ? bsgroupNumber : null;
}

module.exports = {
    customer: customerProfileDataObj,
    bookSessionEnabled: require('*/cartridge/scripts/utils/PreferencesUtil').isCountryEnabled('bookSessionEnabled'),
    bookSessionSDK: getBookSessionSDK(),
    bsgroupNumber: getBrauzGroupNumber()
};
