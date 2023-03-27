'use strict';

var log = require('dw/system/Logger').getLogger('legendsoft', 'legendsoft');

/**
 * Get legendsoft token - Exception handled in calling method
 * @returns {Object | null} returns service response
 */
function getToken() {
    try {
        var service = require('*/cartridge/scripts/services/legendSoftServices');
        var tokenResponse = service.tokenService().call();
        return tokenResponse.ok && tokenResponse.object ? JSON.parse(tokenResponse.object) : null;
    } catch (e) {
        log.error('Error Message: {0} /n stack: {1}', e.message, e.stack);
    }
    return null;
}

/**
 * Get suggestions from service
 * @param {string} postalCode postalcode to query
 * @returns {Object | null} returns suggestion response
 */
function getAllSuggestions(postalCode) {
    try {
        var service = require('*/cartridge/scripts/services/legendSoftServices');
        var legenSoftHelpers = require('*/cartridge/scripts/helpers/legendSoftHelpers');
        var params = {
            token: legenSoftHelpers.fetchCustomObjectToken() || legenSoftHelpers.fetchServiceToken(),
            postalCode: postalCode
        };
        var tokenResponse = service.postalCodeService().call(params);
        if (tokenResponse.error && tokenResponse.error === 401) {
            params.token = legenSoftHelpers.fetchServiceToken();
            tokenResponse = service.postalCodeService().call(params);
        }
        return tokenResponse.ok && tokenResponse.object ? JSON.parse(tokenResponse.object) : null;
    } catch (e) {
        log.error('Error Message: {0} /n stack: {1}', e.message, e.stack);
    }
    return null;
}

module.exports = {
    token: getToken,
    suggestions: getAllSuggestions
};
