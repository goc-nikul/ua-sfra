'use strict';

var moduleName = 'buildFacetMetadata.js';
var facetHelper = require('../../../mocks/constructor/custom/facetHelper');
var Status = require('../../../mocks/dw/dw_system_Status');

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

function buildFacetMeta(facets) {
    var categoriesGetter = require('../../../../cartridges/link_constructor_connect_legacy/cartridge/scripts/getters/categories');
    var bucketedAttributesHelper = require('../../../mocks/constructor/custom/bucketedAttributesHelper');

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

function sendSizeList(stepExecution, sfccSizeList) {
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

function execute(parameters, stepExecution) {
    var sendFacetMetadata = require('../../../mocks/constructor/jobs/sendFacetMetadata');
    var bucketedAttributesHelper = require('../../../mocks/constructor/custom/bucketedAttributesHelper');
    var logger = require('../../../mocks/constructor/helpers/logger');
    var uaConfig = require('../../../mocks/constructor/helpers/config');
    var cioConfig = require('../../../mocks/constructor/helpers/config');
    var result;

    parameters.method = 'PATCH';

    // Init logs
    logger.log(moduleName, 'info', 'Building and sending facet metadata.');
    logger.log(moduleName, 'info', 'parameters.Locale: ' + parameters.Locale);

    // Set locale
    if (parameters.Locale) {
        //request.setLocale(parameters.Locale);
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

module.exports = {
    removeUnneededData: removeUnneededData,
    doesSFCCDataExistAsCIOFacetOptionCustomData: doesSFCCDataExistAsCIOFacetOptionCustomData,
    sendSizeList: sendSizeList,
    buildFacetMeta: buildFacetMeta,
    execute: execute
}