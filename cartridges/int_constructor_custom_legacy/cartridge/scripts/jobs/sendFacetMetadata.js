var moduleName = 'sendFacetMetadata.js';
var logger = require('../helpers/logger');
var config = require('link_constructor_connect_legacy/cartridge/scripts/helpers/config');

/**
 * Send facet metadata to Constructor.
 * @param {*} parameters The job parameters.
 * @param {*} stepExecution The job step execution.
 * @param {*} data The object that contains the data to be sent.
 * @returns {*} The job status.
 */
function sendFacetMetadata(parameters, stepExecution, data) {
    var api = require('../helpers/api');

    // Salesforce objects
    var Status = require('dw/system/Status');

    // Variables
    var credentials = null;

    // Init logs
    logger.log(moduleName, 'info', 'Sending facet metadata to Constructor.io...');

    // Get credentials
    credentials = config.getCredentialsOrNull(parameters.ApiKeyOverride);
    if (!credentials) {
        logger.log(moduleName, 'error', 'Credentials not set');
        return new Status(Status.ERROR);
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

/**
 * Get facet metadata from Constructor.
 * @param {*} parameters The job parameters.
 * @returns {*} The job status.
 */
function getFacetMetadata(parameters) {
    var api = require('../helpers/api');

    // Salesforce objects
    var Status = require('dw/system/Status');

    // Get credentials
    var credentials = config.getCredentialsOrNull(parameters.ApiKeyOverride);
    if (!credentials) {
        logger.log(moduleName, 'error', 'Credentials not set');
        return new Status(Status.ERROR);
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
