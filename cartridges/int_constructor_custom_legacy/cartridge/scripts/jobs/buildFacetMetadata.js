/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
/* eslint-disable no-loop-func */

var moduleName = 'buildFacetMetadata.js';
var Status = require('dw/system/Status');

/**
 * Removes unneeded attributes from API response.
 * @param {array} facets The facets from Constructor.
 * @param {array} attributes The attributes to get display names for.
 * @returns {*} The facet metadata.
 */
function removeUnneededData(facets, attributes) {
    var newObject = [];

    // create new object with only:
    // * the attributes we need to update AND
    // * the refinements from the Constructor_BucketedAttributeDisplayNamesToSend site pref
    facets.forEach(function (facet) {
        var index = attributes.findIndex(item => (item.toLowerCase() === facet.name.toLowerCase()));
        if (index >= 0) {
            newObject.push({
                data: facet.data,
                display_name: facet.display_name,
                name: facet.name
            });
        }
    });

    return newObject;
}

/**
 * Gets the display name overrides for the passed facets
 * @param {array} facets The facets from Constructor.
 * @returns {*} The facet metadata.
 */
function buildFacetMeta(facets) {
    var categoriesGetter = require('link_constructor_connect_legacy/cartridge/scripts/getters/categories');
    var bucketedAttributesHelper = require('../custom/bucketedAttributesHelper');

    // initialize change made
    var changeMade = false;

    // get all categories in the site catalog
    var categories = categoriesGetter.getAllCategories();

    // add the display name overrides
    categories.forEach(function (category) {
        facets = bucketedAttributesHelper.getDisplayNamesMap(category, facets);

        // if one or more display names were added/changed, note it
        changeMade = changeMade ? true : facets.changeMade;
    });

    delete facets.changeMade;
    return changeMade ? facets : false;
}

/**
 * Searches passed Constructor data for matching SFCC data
 * @param {Object} sfccData The SFCC data.
 * @param {Object} cioData The Constructor data.
 * @returns {boolean} Whether or not the Constructor data matches the SFCC data.
 */
function doesSFCCDataExistAsCIOFacetOptionCustomData(sfccData, cioData) {
    var exists = true;

    if ('data' in cioData && !empty(cioData.data) && 'values' in cioData.data && Array.isArray(cioData.data.values) && cioData.data.values.length) {
        for (var i = 0; i < sfccData.length; i += 1) {
            // check to see if the custom data values from sfcc are in Constructor
            var index = cioData.data.values.findIndex(item => (item.toLowerCase() === sfccData[i].toLowerCase()));

            // if the custom value is not in Constructor, record it
            if (index === -1) {
                exists = false;
                break;
            }
        }
    } else {
        // if the data or values objects are not in Constructor, record it
        exists = false;
    }

    return exists;
}

/**
 * Sends batched delta files to the backend API, respecting the maximum heap size.
 * @param {*} stepExecution The job step execution.
 * @param {Object} sfccSizeList The list of attribute and search refinement values from SFCC.
 * @returns {*} The status according to the response.
 */
function sendSizeList(stepExecution, sfccSizeList) {
    var facetHelper = require('../custom/facetHelper');
    var facet = 'size';
    var exists = false;
    var result;

    // build and send formatted list
    if (!empty(sfccSizeList) && Object.keys(sfccSizeList).length) {
        // get all option values for this facet from Constructor
        var cioOptionValues = facetHelper.getOptionValues(facet);

        for (var key in sfccSizeList) {
            var sfccData = sfccSizeList[key];
            var cioData = cioOptionValues.facet_options;

            // search for matching option value in Constructor data
            var index = cioData.findIndex(item => (item.value.toLowerCase() === key.toLowerCase()));

            if (index >= 0) {
                // search for matching custom data values in Constructor data
                exists = doesSFCCDataExistAsCIOFacetOptionCustomData(sfccData, cioData[index]);

                if (!exists) {
                    // merge custom values from sfcc and constructor
                    var mergedOptionValue = facetHelper.mergeOptionValueData(facet, key, sfccData, true, cioData[index]);

                    // update Constructor custom data values. facet option values must be sent one-by-one.
                    // Constructor does not allow multiple values to be updated at once.
                    result = facetHelper.updateOptionValue(facet, stepExecution, mergedOptionValue);
                }
            } else {
                // create Constructor option value. facet option values must be sent one-by-one.
                // Constructor does not allow multiple values to be created at once.
                result = facetHelper.createOptionValue(facet, stepExecution, key, sfccData);
            }
        }
    }

    return result;
}

/**
 * Sends facet metadata to Constructor.
 * @param {*} parameters The job parameters.
 * @param {*} stepExecution The job step execution.
 * @returns {*} The job status.
 */
function execute(parameters, stepExecution) {
    var bucketedAttributesHelper = require('../custom/bucketedAttributesHelper');
    var logger = require('../helpers/logger');
    var uaConfig = require('../helpers/config');
    var cioConfig = require('link_constructor_connect_legacy/cartridge/scripts/helpers/config');
    var sendFacetMetadata = require('./sendFacetMetadata');
    var result;
    parameters.method = 'PATCH';

    // Init logs
    logger.log(moduleName, 'info', 'Building and sending facet metadata.');
    logger.log(moduleName, 'info', 'parameters.Locale: ' + parameters.Locale);

    // Set locale
    if (parameters.Locale) {
        /**
         * Request is a global object that is available in all job steps.
         * Using this, we can set the locale for the current request.
         *
         * See:
         * - https://salesforcecommercecloud.github.io/b2c-dev-doc/docs/current/scriptapi/html/index.html?target=class_dw_system_Request.html
         */
        request.setLocale(parameters.Locale);
    }

    // get attribute ids in the Constructor_BucketedAttributeDisplayNamesToSend site preference
    var attributes = (cioConfig.getConfig(uaConfig.configKeys.CUSTOM_CONSTRUCTOR_BUCKETED_ATTRIBUTE_DISPLAY_NAMES_TO_SEND) || '').split(',');

    if (!empty(attributes)) {
        // get existing facets from Constructor(if any)
        var facets = sendFacetMetadata.getFacetMetadata(parameters);
        if (!empty(facets)) {
            // extract facets from Constructor API response
            facets = JSON.parse(facets);
            if ('facets' in facets) {
                facets = facets.facets;
                facets.changeMade = false;

                // remove data we dont need
                facets = removeUnneededData(facets, attributes);

                // get updated data to send to Constructor
                facets = buildFacetMeta(facets);

                // send data
                if (!empty(facets) && facets) {
                    result = sendFacetMetadata.sendFacetMetadata(parameters, stepExecution, facets);
                    logger.log(moduleName, 'info', 'Finished building and sending category display names.');

                    // return error if Constructor returns error
                    if ('errorMessage' in result && !empty(result.errorMessage)) {
                        return new Status(Status.ERROR);
                    }
                } else {
                    logger.log(moduleName, 'info', 'No data has changed in SFCC; so no data was sent to Constructor.');
                }
            }
        }
    } else {
        logger.log(moduleName, 'error', 'No facets present in the Constructor_BucketedAttributeDisplayNamesToSend site pref on SFCC.');
        return new Status(Status.ERROR);
    }

    // get attribute and search refinement values for size
    var sizeList = bucketedAttributesHelper.getSizeList(parameters);
    if ('errorMessage' in sizeList && !empty(sizeList.errorMessage)) {
        return new Status(Status.ERROR);
    }
    logger.log(moduleName, 'info', 'Finished getting size attribute/refinement values from SFCC.');

    // add attribute and search refinement values to Constructor
    result = sendSizeList(stepExecution, sizeList);
    if (!empty(result) && 'errorMessage' in result && !empty(result.errorMessage)) {
        return new Status(Status.ERROR);
    }
    logger.log(moduleName, 'info', 'Finished creating/updating size option values in Constructor.');

    logger.log(moduleName, 'info', 'Finished building and sending facet metadata.');

    return new Status(Status.OK);
}

module.exports.execute = execute;
