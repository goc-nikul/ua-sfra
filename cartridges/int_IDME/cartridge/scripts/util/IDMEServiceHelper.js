'use strict';

/**
 * IDME service helper functions
 */
/* eslint-disable spellcheck/spell-checker */
var Logger = require('dw/system/Logger');

/**
 * The purpose of this function is to get the access token from IDME
 * @param {string} code - Authorization code
 * @param {string} clientID - client ID
 * @param {string} clientSecret - clientSecret key
 * @param {string} redirectUri - redirect uri to return to SFCC
 * @param {Object} apiEndpointURI - Endpoint to get the accesstoken
 * @returns {Object} - returns service response object
 **/
function requestTokenData(code, clientID, clientSecret, redirectUri, apiEndpointURI) {
    var payload = 'code=' + code + '&client_id=' + clientID + '&client_secret=' + clientSecret + '&redirect_uri=' + redirectUri + '&grant_type=authorization_code';
    var serviceResult;
    var service;
    try {
        service = require('../init/IDMETokenDataService.js');
        serviceResult = service.call({
            apiEndpointURI: apiEndpointURI,
            payload: payload
        });
    } catch (e) {
        Logger.error('IDME token request error: ' + e.message);
    }
    if (!serviceResult || serviceResult.status !== 'OK') {
        Logger.error('IDME token request error: ' + serviceResult.status + ':  ' + serviceResult.errorMessage);
    }

    return service.getResponse();
}

/**
 * The purpose of this function is to recieve the validationstatus
 * @param {Object} tiaccesstoken - An accesstoken recieved by IDME
 * @param {Object} apiEndpointURI - Endpoint to get the validation status
 * @returns {Object} - returns service response object
 **/
function requestValidationStatus(tiaccesstoken, apiEndpointURI) {
    if (tiaccesstoken == null) {
        Logger.error('requestValidationData execution failed: Access token is null');
        return '';
    }
    // using the access token returned in the previous step,
    // call the IDme API to retrieve the id, verification status, and service affiliation status.
    var requestString = apiEndpointURI + tiaccesstoken;
    var service;
    var serviceResult;
    try {
        service = require('../init/IDMEValidationStatusService.js');
        serviceResult = service.call(requestString);
    } catch (e) {
        Logger.error('IDME validationStatus request error: ' + e.message);
    }
    if (!serviceResult || serviceResult.status !== 'OK') {
        Logger.error('IDME validationStatus request error: ' + serviceResult.status + ':  ' + serviceResult.errorMessage);
    }

    return service.getResponse();
}

module.exports = {
    requestTokenData: requestTokenData,
    requestValidationStatus: requestValidationStatus
};
