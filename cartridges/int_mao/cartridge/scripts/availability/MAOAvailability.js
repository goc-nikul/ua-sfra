'use strict';

// eslint-disable-next-line spellcheck/spell-checker
const AvailabilityHelper = require('int_mao/cartridge/scripts/availability/MAOAvailabilityHelper');
const MaoService = require('int_mao/cartridge/scripts/services/MaoService');
const MAOAuthTokenHelper = require('int_mao/cartridge/scripts/MAOAuthTokenHelper');
const logger = require('dw/system/Logger').getLogger('constructor', 'constructor');

/**
 *
 * Return MAO availability response for the items
 * @param {Array} items - items Array
 * @param {Array} locations - stores Array
 * @param {boolean} saveToken do not save token if OCAPI
 * @returns {Object} availability object
 */
function getMaoAvailability(items, locations, saveToken) {
    var availabilityResponse = null;
    var Logger = require('dw/system/Logger').getLogger('MAOAvailability');
    try {
        const availabilityRequestJSON = JSON.stringify(AvailabilityHelper.getAvailabilityRequest(items, locations));
        var tokenHelper = new MAOAuthTokenHelper();
        const accessToken = tokenHelper.getValidToken(saveToken).accessToken;
        var responseObject;
        if (!empty(availabilityRequestJSON) && !empty(accessToken)) {
            var endPointUrl = null;
            const availabilityService = MaoService.getAvailability();
            const MAOPreferences = require('~/cartridge/scripts/MaoPreferences');
            if (locations) {
                endPointUrl = MAOPreferences.MaoBOPISAvailabilityEndpointUrl;
            }
            const availabilityServiceRequest = {
                requestData: availabilityRequestJSON,
                accessToken: accessToken
            };
            responseObject = availabilityService.call(availabilityServiceRequest, endPointUrl);
            if (!empty(responseObject) && !empty(responseObject.status) && responseObject.status === 'OK') {
                availabilityResponse = responseObject.object;

                // if we get the quantity of the item(s) from MAO, send inventory to Constructor
                if (typeof availabilityResponse === 'object' && Object.keys(availabilityResponse).length > 0) {
                    logger.info('item: ' + items[0]);
                    logger.info('MAO availability response: ' + availabilityResponse[items[0]]);
                    AvailabilityHelper.sendInventoryToConstructor(availabilityResponse);
                }
            }
        }
    } catch (e) {
        Logger.error('Error in MAOAvailability.js -> getMaoAvailability() :: {0}', e.message);
    }
    return availabilityResponse;
}

module.exports = {
    getMaoAvailability: getMaoAvailability
};
