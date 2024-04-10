'use strict';

const clientWrapper = require('./constructorio/clientWrapper');
const { getConstructorioSearch } = require('./constructorio/request');

/**
 * Fetches initial search data
 */
function getInitialSearchResults() {
    const searchParams = window.constructorIOSettings && window.constructorIOSettings.initialSearchParams;
    if (!searchParams || !window.constructorIOSettings) {
        return;
    }

    const refinements = window.constructorIOSettings && window.constructorIOSettings.displayableRefinementCategories;
    const refinementsJSON = JSON.parse(refinements);
    const refinementsJSONKeys = Object.keys(refinementsJSON);
    const filtersKeys = Object.keys(searchParams.filterParams);

    for (var i = 0; i < refinementsJSONKeys.length; i++) {
        var rKey = refinementsJSONKeys[i];
        var searchKey = refinementsJSON[rKey].searchKey || '';

        if (searchKey !== '') {
            var filterIndex = filtersKeys.indexOf(searchKey);

            if (filterIndex >= 0) {
                searchParams.filterParams[refinementsJSONKeys[i]] = searchParams.filterParams[filtersKeys[filterIndex]];
                delete searchParams.filterParams[filtersKeys[filterIndex]];
            }
        }
    }

    const cioClient = clientWrapper.getConstructorIOClient();

    if (cioClient && cioClient.search && cioClient.search.getSearchResults && searchParams.query) {
        const event = new CustomEvent('cio:initialDataLoaded');

        window.cioClient = cioClient;
        window.initialTS = new Date().getTime();

        getConstructorioSearch({ searchParams })
            .then((res) => {
                window.initialConstuctorResponse = Object.assign(res, { searchParams });
                document.body.dispatchEvent(event);
                return window.initialConstuctorResponse;
            });
    }
}

getInitialSearchResults();
