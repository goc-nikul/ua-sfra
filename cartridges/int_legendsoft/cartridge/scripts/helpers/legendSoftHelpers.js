'use strict';

const CUSTOM_OBJECT = {
    TYPE: 'authTokens',
    KEY: 'legendsoft'
};

const CustomObjectMgr = require('dw/object/CustomObjectMgr');

/**
 * Fetches token from custom object
 * @returns {Object | null} returns token if exists in custom object or null if not exists
 */
function fetchCustomObjectToken() {
    var co = CustomObjectMgr.getCustomObject(CUSTOM_OBJECT.TYPE, CUSTOM_OBJECT.KEY);
    if (!co || !co.custom.token) return null;
    return co.custom.token;
}

/**
 * Fetches token from live service
 * @returns {Object | null} returns token if service sends response else null
 */
function fetchServiceToken() {
    var result = require('*/cartridge/scripts/helpers/hooks')('app.address.suggestion', 'token', () => null);
    if (!result || !result.access_token || !result.expires_in) return null;
    return require('dw/system/Transaction').wrap(() => {
        var co = CustomObjectMgr.getCustomObject(CUSTOM_OBJECT.TYPE, CUSTOM_OBJECT.KEY) || CustomObjectMgr.createCustomObject(CUSTOM_OBJECT.TYPE, CUSTOM_OBJECT.KEY);
        co.custom.token = result.access_token;
        co.custom.expires = new Date(Date.now() + (result.expires_in * 1000));
        return co.custom.token;
    });
}

/**
 * Fetch suggestions from legendsoft
 * @param {string} postalCode input required for legendsoft
 * @returns {Object | null} returns suggestion from legendsoft
 */
function fetchAllOptions(postalCode) {
    var resp = require('*/cartridge/scripts/helpers/hooks')('app.address.suggestion', 'suggestions', postalCode, () => null);
    if (resp && resp.success && resp.total) {
        var town = [], city = [], state = [], colonies = []; //eslint-disable-line
        resp.data.forEach((item) => {
            if (colonies.indexOf(item.Name) === -1) colonies.push(item.Name);
            if (item.Town && town.indexOf(item.Town.Name) === -1) town.push(item.Town.Name);
            if (item.Town && city.indexOf(item.Town.CityName) === -1) city.push(item.Town.CityName);
            if (item.Town && item.Town.State) {
                var stateCode = require('*/cartridge/scripts/config/statemap')[item.Town.State.Code];
                if (stateCode) stateCode = stateCode.split('|')[0];
                if (stateCode && state.indexOf(stateCode) === -1) state.push(stateCode);
            }
        });
        return {
            towns: town,
            cities: city,
            states: state,
            colonies: colonies
        };
    }
    return null;
}

module.exports = {
    fetchCustomObjectToken: fetchCustomObjectToken,
    fetchServiceToken: fetchServiceToken,
    fetchAllOptions: fetchAllOptions
};
