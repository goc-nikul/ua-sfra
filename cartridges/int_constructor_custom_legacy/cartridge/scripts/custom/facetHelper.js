/* eslint-disable no-param-reassign */

var bucketedAttributesHelper = require('./bucketedAttributesHelper');
var sendFacetMetadata = require('../jobs/sendFacetMetadata');

/**
 * Returns price refinement value.
 * @param {*} price The price.
 * @param {Object} product The product.
 * @returns {string} The refinement.
 */
function getPriceRefinement(price, product) {
    if (!price || price === '' || !product || product === '') {
        return '';
    }

    var entry;
    var primaryCat = product.master ? product.primaryCategory : product.masterProduct.primaryCategory;

    // get price buckets
    var map = bucketedAttributesHelper.getPriceMap(primaryCat);

    // find bucket for the passed price
    entry = map.find(item => (price >= item.valueFrom && price < item.valueTo));

    return !empty(entry) && 'displayName' in entry ? entry.displayName : '';
}

/**
 * Returns data for the passed option value for the passed facet.
 * @param {string} facet The facet.
 * @param {string|null} displayName The option value display name.
 * @param {*} parameters The HTTP call parameters.
 * @returns {Object|null} data for the passed option value for the passed facet.
 */
function getOptionValueData(facet, displayName, parameters) {
    var response;

    // set params for HTTP call to Constructor
    parameters = empty(parameters) ? {} : parameters;
    parameters.path = !empty(displayName) ? '/' + facet + '/options/' + displayName : '/' + facet + '/options';

    // get data
    var result = sendFacetMetadata.getFacetMetadata(parameters);

    if (!empty(result) && Object.keys(result).length) {
        var parsedResult = JSON.parse(result);
        if ('error' in parsedResult) {
            // if option value not found, return null. else, return error.
            response = parsedResult.error === 404 ? null : parsedResult;
        } else {
            // return option value
            response = parsedResult;
        }
    } else {
        response = null;
    }

    return response;
}

/**
 * Returns all option values for the passed facet.
 * @param {string} facet The facet.
 * @returns {Object|null} all option values for the passed facet.
 */
function getOptionValues(facet) {
    var parameters = {};
    parameters.num_results_per_page = 1000;

    return getOptionValueData(facet, null, parameters);
}

/**
 * Returns the passed custom data values combined with the existing custom data values from Constructor
 * @param {string} facet The facet.
 * @param {string|null} displayName The option value display name.
 * @param {Object} customValues The custom data values.
 * @param {boolean} returnWholeValue Whether or not to return all option value data in addition to the custom data values.
 * @param {Object|null} cioData The list of custom data values on Constructor.
 * @returns {Array|null} the custom data values combined with the existing custom data values from Constructor
 */
function mergeOptionValueData(facet, displayName, customValues, returnWholeValue, cioData) {
    var mergedValues = [];

    // get option value data from Constructor if not passed
    if (empty(cioData) || !cioData) {
        cioData = getOptionValueData(facet, displayName, null);
    }

    if (cioData && typeof cioData === 'object' && 'data' in cioData && cioData.data !== null && 'values' in cioData.data) {
        var mergedSet = new Set();

        // add existing Constructor values to set
        cioData.data.values.forEach(function (value) {
            mergedSet.add(value);
        });

        // add SFCC values to set
        customValues.forEach(function (value) {
            mergedSet.add(value);
        });

        // convert set to JS object
        mergedSet.forEach((value) => {
            mergedValues.push(value);
        });

        // merge the full list with the Constructor's returned option value if requested
        if (returnWholeValue) {
            cioData.data.values = mergedValues;
        }
    }

    return returnWholeValue ? cioData : mergedValues;
}

/**
 * Create option value for the passed facet
 * @param {string} facet The facet.
 * @param {*} stepExecution The job step execution.
 * @param {string} displayName The option value display name.
 * @param {Object} customValues The custom data values.
 * @returns {Object} result returned from Constructor.
 */
function createOptionValue(facet, stepExecution, displayName, customValues) {
    var parameters = {};

    // set parameters for HTTP call
    parameters.method = 'POST';
    parameters.path = '/' + facet + '/options';

    // create object with custom data values
    var customObj = {
        value: displayName,
        value_alias: null,
        display_name: displayName,
        hidden: false,
        position: null,
        data: {
            values: customValues
        }
    };

    // send data to Constructor
    return sendFacetMetadata.sendFacetMetadata(parameters, stepExecution, customObj);
}

/**
 * Update option value for the passed facet
 * @param {string} facet The facet.
 * @param {*} stepExecution The job step execution.
 * @param {Object} optionValue The option value.
 * @returns {Object} result returned from Constructor.
 */
function updateOptionValue(facet, stepExecution, optionValue) {
    var parameters = {};

    // set parameters for HTTP call
    parameters.method = 'PUT';
    parameters.path = '/' + facet + '/options/' + optionValue.value;

    // send data to Constructor
    return sendFacetMetadata.sendFacetMetadata(parameters, stepExecution, optionValue);
}

module.exports = {
    getPriceRefinement: getPriceRefinement,
    mergeOptionValueData: mergeOptionValueData,
    createOptionValue: createOptionValue,
    updateOptionValue: updateOptionValue,
    getOptionValueData: getOptionValueData,
    getOptionValues: getOptionValues
};
