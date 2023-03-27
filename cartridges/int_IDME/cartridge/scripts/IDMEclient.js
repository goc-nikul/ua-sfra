/* eslint-disable spellcheck/spell-checker */
/*
 * ID.me client class
 * Handles customer verification via 3rd party service handshake.
 */

'use strict';

var Logger = require('dw/system/Logger');

/**
* The purpose of this function is to handle customer verification via 3rd party service handshake.
* @param {Object} config - Service configuration object
* @returns {Object} - returns an object with scope and validation status
**/
function Client(config) {
    var isConfigInvalid = Object.keys(config).some(function (configKey) { return typeof configKey !== 'string' || configKey.length === 0; });
    if (isConfigInvalid || Object.keys(config).length < 6) {
        if (typeof config === 'object') {
            Logger.error('IDME client initialization failed: invalid config passed "{0}"', JSON.stringify(config));
        } else {
            Logger.error('IDME client initialization failed: invalid config passed');
        }
        return null;
    }

    var clientID = config.clientID;
    var clientSecret = config.clientSecret;
    var redirectUri = config.redirectUri;
    var apiTokenEndpointURI = config.apiTokenEndpointURI;
    var apiValidationStatusEndpointURI = config.apiValidationStatusEndpointURI;
    var code = config.code;

    this.verify = function () {
        // eslint-disable-next-line no-use-before-define
        var IDMEServiceHelper = require('./util/IDMEServiceHelper.js');
        var tokenData = IDMEServiceHelper.requestTokenData(code, clientID, clientSecret, redirectUri, apiTokenEndpointURI) || {};
        var accesstoken = tokenData.token;
        var scope = tokenData.scope;
        if (!scope || !accesstoken) return {};

        // eslint-disable-next-line no-use-before-define
        var validationStatus = IDMEServiceHelper.requestValidationStatus(accesstoken, apiValidationStatusEndpointURI) || '';
        if (!validationStatus) return {};

        return { scope: scope, validationStatus: validationStatus };
    };
}

module.exports = Client;
