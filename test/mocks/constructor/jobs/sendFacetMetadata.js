'use strict';

var moduleName = 'sendFacetMetadata.js';
var logger = require('../helpers/logger');
var config = require('../helpers/config');

function sendFacetMetadata(parameters, stepExecution, data) {
    var api = require('../helpers/api');

    // Salesforce objects
    var Status = require('../../dw/dw_system_Status');

    // Variables
    var credentials = null;

    // Init logs
    logger.log(moduleName, 'info', 'Sending facet metadata to Constructor.io...');

    // Get credentials
    credentials = config.getCredentialsOrNull(parameters.ApiKeyOverride);
    if (!credentials) {
        logger.log(moduleName, 'error', 'Credentials not set');
        return Status.constructor(Status.ERROR);
    }

    // Send data
    var response = api.sendData(
        api.feedTypes.facet,
        credentials,
        data,
        'Products',
        parameters
    );

    logger.log(moduleName, 'info', 'Finished sending facet metadata to Constructor.io');

    return response;
}

function getFacetMetadata(parameters) {
    var api = require('../helpers/api');

    // Salesforce objects
    var Status = require('../../dw/dw_system_Status');

    // Get credentials
    var credentials = config.getCredentialsOrNull(parameters.ApiKeyOverride);
    if (!credentials) {
        logger.log(moduleName, 'error', 'Credentials not set');
        return Status.constructor(Status.ERROR);
    }

    // Send data
    return api.getData(
        api.feedTypes.facet,
        credentials,
        'Products',
        parameters
    );
}

module.exports = {
    sendFacetMetadata: sendFacetMetadata,
    getFacetMetadata: getFacetMetadata
};
