'use strict';

/**
 * Job step to fetch auth token and save it in custom object
 * @returns {Object} returns status of job step
 */
function getAuthToken() {
    var Status = require('dw/system/Status');
    var oAuthToken = require('*/cartridge/scripts/helpers/nzPostHelpers').getOAuthToken().access_token;
    // Fail the job if not able to fetch token
    if (!oAuthToken) return new Status(Status.ERROR);
    // Save token in custom object
    require('*/cartridge/scripts/helpers/customObjectHelpers').saveAuthToken(oAuthToken);
    return new Status(Status.OK);
}

module.exports.getAuthToken = getAuthToken;
