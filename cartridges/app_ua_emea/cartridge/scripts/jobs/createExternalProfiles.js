/* API includes */
var CustomerMgr = require('dw/customer/CustomerMgr');
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');
var profiles;
var idmPreferences = require('plugin_ua_idm/cartridge/scripts/idmPreferences.js');
var oauthProviderId = idmPreferences.oauthProviderId;

// eslint-disable-next-line consistent-return
exports.beforeStep = function () {
    // Setup Product Search Model
    try {
        profiles = CustomerMgr.queryProfiles('', null);
    } catch (e) {
        Logger.error('ERROR: Error while querrying profiles: ' + e);
        return new Status(Status.ERROR, 'ERROR: Error while querrying profiles: ' + e);
    }
};

exports.getTotalCount = function () {
    return profiles.count;
};

exports.read = function () {
    if (!profiles.hasNext()) return null;
    return profiles.next();
};

// eslint-disable-next-line consistent-return
exports.process = function (profile) {
    try {
        var customerNo = profile.customerNo;
        var customer = profile.customer;
        if (!empty(customer) && empty(customer.getExternalProfile(oauthProviderId, customerNo))) {
            customer.createExternalProfile(oauthProviderId, customerNo);
        }
    } catch (e) {
        var errorMsg = e.message;
        Logger.error('error in updateExternalProfiles - errorMsg: {0}', errorMsg);
        return new Status(Status.ERROR, 'ERROR: Error while updating external profile attribute: ' + e);
    }
};

// eslint-disable-next-line consistent-return
exports.afterStep = function () {
    try {
        profiles.close();
    } catch (e) {
        Logger.error('error in while clossing SeekableIterator - errorMsg: {0}', e.message);
        return new Status(Status.ERROR, 'ERROR: Error while querrying profiles: ' + e);
    }
};

// eslint-disable-next-line no-unused-vars
exports.write = function (lines, parameters, stepExecution) {};
