'use strict';

// API includes
var Logger = require('dw/system/Logger');

var earlyAccessHelpers = require('*/cartridge/scripts/helpers/earlyAccessHelpers');

// Function to check if current customer is a member of Early Access.
exports.isEarlyAccessCustomer = function (product) {
    try {
        return earlyAccessHelpers.checkEarlyAccess(product);
    } catch (error) {
        Logger.error('Error while checking early access for product : {0}\n{1} {2}', product.ID, error.message, error.stack);
        return {
            earlyAccessConfigs: false
        };
    }
};
