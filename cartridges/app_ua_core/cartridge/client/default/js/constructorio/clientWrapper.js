'use strict';

const ConstructorioClient = require('@constructor-io/constructorio-client-javascript');
const { constructorIOSettings } = window;
const { cloneDeep } = require('lodash');
let constructorIOInstance;
let cIOSettings = null;

const parseJSON = (source, placeholder) =>{
    let result;
    try {
        result = JSON.parse(source);
    } catch (error) {
        result = placeholder;
    }
    return result || placeholder;
};


const getCustomerGroups = () => {
    const customerGroupsSourceEl = document.querySelector('.b-header_account');
    cIOSettings.customerGroups = parseJSON(customerGroupsSourceEl && customerGroupsSourceEl.dataset ? customerGroupsSourceEl.dataset.customerGroups : '', []);
};

/**
 * Initializes and returns the ConstructorIO client.
 *
 * @returns {Object|null} - The initialized ConstructorIO client or null if apiKey is not provided.
 */
const initConstructorIO = () => {
    if (constructorIOSettings && constructorIOSettings.apiKey) {
        const settings = {
            apiKey: constructorIOSettings.apiKey
        };

        if (constructorIOSettings.serviceUrl) {
            settings.serviceUrl = constructorIOSettings.serviceUrl;
        }
        if (constructorIOSettings.customerEmail) {
            settings.userId = constructorIOSettings.customerEmail;
        }

        constructorIOInstance = new ConstructorioClient(settings);
    }

    return constructorIOInstance;
};

/**
 * Gets the ConstructorIO client. If not initialized, it will initialize it first.
 *
 * @returns {Object} - The ConstructorIO client.
 */
const getConstructorIOClient = () => {
    return constructorIOInstance || initConstructorIO();
};

const getConstructorIOSettings = () => {
    if (!cIOSettings) {
        const {
            constructorIOSettings: constructorIOSettingsData = {}
        } = window;
        cIOSettings = cloneDeep(constructorIOSettingsData);
        cIOSettings.ROUTE_REFINEMENT_ATTRIBUTES = parseJSON(constructorIOSettingsData.routeRefinements, []);
        cIOSettings.SORT_OPTIONS_URL_MAP = parseJSON(constructorIOSettingsData.sortOptionsURLMap, {});
        cIOSettings.CIO_SORT_OPTIONS_MAP = parseJSON(constructorIOSettingsData.constructorIOSortOptionsMap, {});
        // eslint-disable-next-line no-nested-ternary
        cIOSettings.PRICE_RANGE = !constructorIOSettingsData ? {} : typeof constructorIOSettingsData.priceRange === 'string' ? parseJSON(constructorIOSettingsData.priceRange) : typeof constructorIOSettingsData.priceRange === 'object' && constructorIOSettingsData.priceRange ? constructorIOSettingsData.priceRange : {};

        cIOSettings.DEFAULT_CUTOFFTHRESHOLD = constructorIOSettingsData.defaultCutoffThreshold || 5;
        cIOSettings.DISPLAYABLE_REFINEMENT_CATEGORIES = parseJSON(constructorIOSettingsData.displayableRefinementCategories, {});
        cIOSettings.SIZE_SORT_RULES = parseJSON(constructorIOSettingsData.sizeSortRules, {});
        cIOSettings.SIZE_RANGE_MAP = parseJSON(constructorIOSettingsData.sizeRangeMap, {});


        cIOSettings.variationMap = parseJSON(constructorIOSettingsData.variationMap, undefined);
        cIOSettings.customerGroups = parseJSON(constructorIOSettingsData.customerGroups, []);
        if (document.readyState === 'complete') {
            getCustomerGroups();
        } else {
            document.addEventListener('DOMContentLoaded', getCustomerGroups);
        }
    }
    return cIOSettings;
};

/**
 * Wrapper around ConstructorIO client functionalities.
 * @typedef {Object} ClientWrapper
 * @property {function} getConstructorIOClient - Function to get the ConstructorIO client.
 */
const clientWrapper = {
    getConstructorIOSettings,
    getResource: (key)=> (window.constructorIOResources ? window.constructorIOResources[key] : ''),
    getURL: (key) => window.constructorIOURLs && typeof window.constructorIOURLs[key] === 'string' ? window.constructorIOURLs[key] : '',
    getConstructorIOClient
};

module.exports = clientWrapper;
