'use strict';

const { cloneDeep } = require('lodash');
const { getConstructorIOSettings } = require('../clientWrapper');

const getGroupFacets = () => {
    const { customerGroups } = getConstructorIOSettings();
    return customerGroups.length > 0 && customerGroups.map((group) => `Price ${group}`);
};

const getPriceFacetOptions = (res) => {
    let options = [];

    if (res && res.response && res.response.facets && res.response.facets.length > 0) {
        const salePriceFacet = res.response.facets.find(facet => facet.name === 'salePriceLow');

        if (salePriceFacet) {
            options = salePriceFacet.options;
        }

        // Add options for promotions that aren't currently captured
        const groupFacets = getGroupFacets();
        const optionDisplayNames = options.map(option=> option.display_name);
        const validUserGroups = groupFacets ? res.response.facets.filter(value => groupFacets.includes(value.name)) : [];
        validUserGroups.forEach((group) => {
            if (group.options) {
                group.options.forEach((option) => {
                    if (optionDisplayNames.indexOf(option.display_name) === -1 && option.range) {
                        options.push(option);
                        optionDisplayNames.push(option.display_name);
                    }
                });
            }
        });
    }

    return options;
};

const getCioPreFilterExpression = (priceRange) => {
    const [selectedPriceLow, selectedPriceHigh] = priceRange;
    const { customerGroups } = getConstructorIOSettings();
    const groupPricingExpressions = customerGroups.length > 0 ? customerGroups.map((group) => ({
        name: `Price ${group}`,
        range: [selectedPriceLow, selectedPriceHigh]
    })) : [];

    return {
        or: [
            {
                name: 'salePriceLow',
                range: [selectedPriceLow, selectedPriceHigh]
            },
            ...groupPricingExpressions
        ]
    };
};

const modifyValue = (prevVal, upValue, action) => {
    const value = (typeof prevVal === 'string') ? prevVal.split(',') : prevVal;
    const isUpdateValueExistInPrevValue = Array.isArray(value) ? value.includes(upValue) : value === upValue;

    let newValue;
    if (action === 'remove' || action === '-' || (action === 'toggle' && isUpdateValueExistInPrevValue)) {
        if (Array.isArray(value)) {
            newValue = value.filter(itemValue => itemValue !== upValue);
        }
    } else if (action === 'add' || action === '+' || (action === 'toggle' && !isUpdateValueExistInPrevValue)) {
        newValue = Array.isArray(value) ? value.slice(0) : [value];
        newValue.push(upValue);
    } else {
        newValue = upValue;
    }
    return Array.isArray(newValue) ? newValue.filter(val => [null, undefined, NaN, ''].indexOf(val) === -1).join('|') : newValue.toString();
};

const searchToQueryParams = ({ filterParams = {}, extraParams = {}, query = '', sortRule = '', priceRange, pageSize = '12', start = 0 }) => {
    const filterQueryParams = {};
    Object.keys(filterParams).forEach(function (key, i) {
        const index = i + 1;
        const filterValue = filterParams[key];
        filterQueryParams['prefn' + index] = key;
        filterQueryParams['prefv' + index] = Array.isArray(filterValue) ? filterValue.join('|') : filterValue;
    });

    const regex = /(\d)(?=(\d{3})+$)/g;
    const queryParams = Object.assign({}, extraParams, filterQueryParams, {
        start: start,
        sz: pageSize,
        q: query,
        srule: sortRule,
        pmin: priceRange ? parseInt(priceRange[0], 10).toString().replaceAll(regex, '$1,') + '.00' : '',
        pmax: priceRange ? parseInt(priceRange[1], 10).toString().replaceAll(regex, '$1,') + '.00' : ''
    });
    return queryParams;
};

const generatePLPURL = ({ url = window.location, params: allParams, action }) => {
    const params = allParams ? cloneDeep(allParams) : {};
    const filterParams = params.filterParams ? cloneDeep(params.filterParams) : null;
    if (params.filterParams) {
        delete params.filterParams;
    }

    const currentURL = new URL(url, window.location);
    const isControllerURL = currentURL.pathname.includes('/on/demandware.store/Sites-');
    const loadedSearchParams = window.searchParams || (window.constructorIOSettings && window.constructorIOSettings.initialSearchParams) || {};
    const pathname = currentURL.pathname;
    const querySearchParams = new URLSearchParams();
    let queryParams = {};
    let urlSearchParams = cloneDeep(loadedSearchParams);

    if (filterParams && typeof filterParams === 'object') {
        const isSetAction = !action || action === 'set';
        const sourceObj = isSetAction ? filterParams : loadedSearchParams.filterParams;
        urlSearchParams.filterParams = cloneDeep(sourceObj || {});

        if (!isSetAction) {
            Object.keys(filterParams).forEach(filterKey => {
                const filterValueArray = !Array.isArray(filterParams[filterKey]) ? [filterParams[filterKey]] : filterParams[filterKey];
                filterValueArray.forEach(filterValue => {
                    if ([null, undefined, NaN, ''].indexOf(filterValue) === -1) {
                        const modifiedValue = modifyValue(urlSearchParams.filterParams[filterKey], filterValue.toString(), action);
                        if (modifiedValue.length === 0) {
                            delete urlSearchParams.filterParams[filterKey];
                        } else {
                            urlSearchParams.filterParams[filterKey] = modifiedValue;
                        }
                    }
                });
            });
        }
    }

    Object.keys(params).forEach(key => {
        const paramValue = params[key];
        if ([null, undefined, NaN, ''].indexOf(paramValue) === -1) {
            urlSearchParams[key] = paramValue;
        } else {
            delete urlSearchParams[key];
        }
    });

    if (!isControllerURL) {
        // generate pathname and remove data from search params
        let activePathRefinements = [];

        const { ROUTE_REFINEMENT_ATTRIBUTES } = getConstructorIOSettings();

        ROUTE_REFINEMENT_ATTRIBUTES.forEach(function (key) {
            let value = urlSearchParams.filterParams[key] || undefined;

            if (value) {
                value = Array.isArray(value) ? value : [value];

                delete urlSearchParams.filterParams[key];
                activePathRefinements.push(
                    value.map((ref) => encodeURIComponent(ref.toString().toLowerCase().replace('&', 'and').replace(' ', '_'))).join('+')
                );
            }
        });

        currentURL.pathname = pathname.replace(/\/search(\/.*)?/, `/search${(activePathRefinements.length > 0 ? '/' : '') + activePathRefinements.join('-')}`);
    }

    queryParams = searchToQueryParams(urlSearchParams);

    if (!queryParams.start) {
        delete queryParams.start;
        delete queryParams.sz;
    }

    Object.keys(queryParams).forEach(key => {
        const value = queryParams[key];
        if ([null, undefined, NaN, ''].indexOf(value) === -1) {
            querySearchParams.set(key, queryParams[key]);
        }
    });
    currentURL.search = querySearchParams.toString().replace(/[+]/g, ' ');
    return currentURL.toString();
};

const parseControllerPLPURL = ({ url: _url, data }) => {
    const url = new URL(_url || '', window.location.href);
    if (!url.pathname.includes('/on/demandware.store/Sites-')) {
        return false;
    }
    url.searchParams.sort();
    let priceParams = {};
    let filterParams = {};
    let trailingFilters = {};
    let extraParams = {};
    let sortRule;
    let pageSize = (data && data.pageSize) || '12';
    let start = '';
    let query = '';
    let priceRange;
    url.searchParams.forEach(function (value, key) {
        if (key === 'srule') {
            sortRule = value;
        } else if (key === 'q') {
            query = value;
        } else if (key === 'sz') {
            pageSize = value;
        } else if (key === 'start') {
            start = value;
        } else if (['pmin', 'pmax'].indexOf(key) > -1) {
            priceParams[key] = parseInt(value.replace(',', ''), 10);
        } else if (/^(prefn|prefv)\d+$/.test(key)) {
            const prefIndex = key.slice(5); // 'prefn'.length || 'prefv'.length
            const prefName = url.searchParams.get('prefn' + prefIndex);
            const prefValue = url.searchParams.get('prefv' + prefIndex);
            filterParams[prefName] = prefValue.split('|');
        } else {
            extraParams[key] = value;
        }
    });

    if (Object.keys(priceParams).length) {
        priceRange = [parseInt(priceParams.pmin, 10) || 0, parseInt(priceParams.pmax, 10) || 9999];
    }

    return {
        url,
        query,
        sortRule,
        start,
        pageSize,
        priceRange,
        filterParams,
        trailingFilters,
        extraParams
    };
};

const getPriceRange = (value) => {
    const { PRICE_RANGE } = getConstructorIOSettings();
    const min =
        typeof value.range[0] === 'string'
            ? PRICE_RANGE[value.range[0]]
            : value.range[0];
    const max =
        typeof value.range[1] === 'string'
            ? PRICE_RANGE[value.range[1]]
            : value.range[1];
    return [min, max];
};

/**
 * Converts an HEX color value to RGB. Conversion formula
 * @param   {number}  hex       The hex color value
 * @return  {Array}           The RGB representation
 */
const hexToRgb = (hex) => {
    var hexValue = hex;
    hexValue = hexValue.length === 4 ? '#' + hexValue[1] + hexValue[1] + hexValue[2] + hexValue[2] + hexValue[3] + hexValue[3] : hexValue;
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexValue);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

/**
 * Converts an RGB color value to HSL. Conversion formula
 * returns h, s, and l in the set [0, 1].
 * @param   {number}  r       The red color value
 * @param   {number}  g       The green color value
 * @param   {number}  b       The blue color value
 * @return  {Array}           The HSL representation
 */
const rgbToHsl = (r, g, b) => {
    r /= 255, g /= 255, b /= 255; // eslint-disable-line
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2; // eslint-disable-line

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) { // eslint-disable-line
            case r: h = (g - b) / d + (g < b ? 6 : 0); break; // eslint-disable-line
            case g: h = (b - r) / d + 2; break; // eslint-disable-line
            case b: h = (r - g) / d + 4; break; // eslint-disable-line
        }
        h /= 6;
    }

    return [h, s, l];
};

/**
 * Checks and return the color Lightness values
 * @param   {string}  color       The swatch color value
 * @return  {boolean}           HSL color or False
 */
const getLightnessValue = (color) => {
    if (color) {
        let RGBColor = hexToRgb(color);
        if (RGBColor) {
            let getHSLColor = rgbToHsl(RGBColor.r, RGBColor.g, RGBColor.b);
            return getHSLColor;
        }
    }
    return false;
};

const determineNoBorderClass = (hexCode, hexCodeII) => {
    const stdLightness = 0.6;
    let swatchColor = hexCode || '#1d1d1d';
    let swatchColorII = hexCodeII || '#1d1d1d';
    let lightness;
    let lightnessII;

    lightness = getLightnessValue(swatchColor);
    if (swatchColor !== swatchColorII) {
        lightnessII = getLightnessValue(swatchColorII);
    }
    if (lightness && lightnessII) {
        return lightness[2] < stdLightness && lightnessII[2] < stdLightness ? 'no-border' : '';
    }
    if (lightness) {
        return lightness[2] < stdLightness ? 'no-border' : '';
    }
    return '';
};

module.exports = {
    getPriceRange,
    getPriceFacetOptions,
    getCioPreFilterExpression,
    searchToQueryParams,
    parseControllerPLPURL,
    generatePLPURL,
    determineNoBorderClass
};
