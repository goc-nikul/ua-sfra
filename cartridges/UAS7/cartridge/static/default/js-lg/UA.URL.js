UA.URL = (function () {
    'use strict';

    var api = {},
        exceptionUrlVarArray = [ "event", "init" ],
        buildQueryStringFromQueryStruct;

    api.getQueryString = function (exceptionArray) {

        var queryStruct, queryString, arrayIndex;
        // Initialize the query struct
        queryStruct = UA.Url.getQueryStringAsStruct();

        // Default the keys to remove if none were defined
        if (arguments.length === 0) {
            exceptionArray = exceptionUrlVarArray;
        }

        // Loop over the collection of exceptions to remove
        for (arrayIndex = 0; arrayIndex < exceptionArray.length; arrayIndex++) {
            delete queryStruct[exceptionArray[arrayIndex]];
        }

        // Re-build the query string (with the omitted key)
        queryString = UA.Url.buildQueryStringFromQueryStruct(queryStruct);

        // Return the query string
        return queryString;

    };

    api.getQueryStringAsStruct = function () {

        // Initialize local variables
        var query = window.location.search.substring(1),
            i,
            pair,
            vars = query.split("&"),
            obj = {};

        // Loop over the number of properties that were found
        for (i = 0; i < vars.length; i++) {

            // Split the variable / value pairs
            pair = vars[i].split("=");

            // Default or specify the value for each variable
            if (pair.length > 1) {
                obj[pair[0]] = pair[1];
            } else {
                obj[pair[0]] = "";
            }

        }

        // Return the collection
        return obj;

    };

    api.buildQueryStringFromQueryStruct = function (queryStruct) {

        // Initialize local variables
        var queryString = "", thisKey, lastChar;

        // Append the url variables and values to the query string
        for (thisKey in queryStruct) {
            if (queryStruct.hasOwnProperty(thisKey)) {
                // Concatonate (sp?) the url one parameter at a time
                if (queryStruct[thisKey] === "") {
                    queryString = queryString + thisKey + '&';
                } else {
                    queryString = queryString + thisKey + '=' + queryStruct[thisKey] + '&';
                }
            }
        }

        // Do some character math
        lastChar = queryString.length - 1;

        // Is the last character an ampersand?
        if (queryString.charAt(lastChar) === '&') {
            queryString = queryString.substring(0, lastChar);
        }

        // If a queryString was specified, then prepend the ?
        if (queryString.length > 0) { queryString = '?' + queryString; }

        // Return the query string
        return queryString;

    };

    return api;

}());