'use strict';

var bucketedAttributesHelper = require('../../../mocks/constructor/custom/bucketedAttributesHelper');

function getOptionValueData(facet, displayName, parameters) {
    var response;

    // set params for HTTP call to Constructor
    parameters = empty(parameters) ? {} : parameters;
    parameters.path = !empty(displayName) ? '/' + facet + '/options/' + displayName : '/' + facet + '/options';

    // get data
    if (displayName === 'NonExistentValue' || facet === 'InvalidFacet') {
        var result = '{"error":404,"errorMessage":"Field not found.","mockResult":false,"msg":"ERROR","object":{},"ok":false,"status":"ERROR","unavailableReason":null}';
    } else if (empty(displayName)) {
        var result = '{"facet_options":[{"value":"4","value_alias":null,"display_name":"4","position":null,"data":{"values":["4/5.5","4"]},"hidden":false},{"value":"5","value_alias":null,"display_name":"5","position":null,"data":{"values":["3.5/5","5/6.5","5"]},"hidden":false}]}';
    } else {
        var result = '{"facet_options":[{"value":"4","value_alias":null,"display_name":"4","position":null,"data":{"values":["4/5.5","4"]},"hidden":false}]}';
    }

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

function getOptionValues(facet) {
    var parameters = {};
    parameters.num_results_per_page = 1000;

    return getOptionValueData(facet, null, parameters);
}

function mergeOptionValueData(facet, displayName, customValues, returnWholeValue, cioData) {
    var mergedValues = [];

    // get option value data from Constructor if not passed
    if (empty(cioData) || !cioData) {
        cioData = getOptionValueData(facet, displayName, null);
    }

    if (!empty(cioData) && Object.keys(cioData).length && 'data' in cioData && 'values' in cioData.data) {
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

function createOptionValue(facet, stepExecution, displayName, customValues) {
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

    return {
        error: 0,
        errorMessage: null,
        mockResult: false,
        msg: 'OK',
        object: {
            headers: null,
            response: customObj,
            statusCode: 200
        },
        ok: true,
        status: 'OK',
        unavailableReason: null
    };
}

function updateOptionValue(facet, stepExecution, optionValue) {
    return {
        error: 0,
        errorMessage: null,
        mockResult: false,
        msg: 'OK',
        object: {
            headers: null,
            response: optionValue,
            statusCode: 200
        },
        ok: true,
        status: 'OK',
        unavailableReason: null
    };
}

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

module.exports = {
    getOptionValueData: getOptionValueData,
    getOptionValues: getOptionValues,
    mergeOptionValueData: mergeOptionValueData,
    updateOptionValue: updateOptionValue,
    createOptionValue: createOptionValue,
    getPriceRefinement: getPriceRefinement
};