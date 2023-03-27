'use strict';

// eslint-disable-next-line spellcheck/spell-checker
/**
 * Makes service call to UACAPI and returns pickup locations
 *
 * @param {string} type - Search type. Possible values are - zipCode or geolocationCoordinates or addressInput
 * @param {string} query - Parameter/Search term. Possible values are - Postal code for zipCode type search, geo co-ordinates for geolocationCoordinates type search and address object for addressInput type search
 * @param {number} maxDistanceMiles - Max distance in miles. Default value is 25 if not provided.
 * @returns {Object} pickupLocations - Pickup-locations or NULL
 */
function getPickupLocations(type, query, maxDistanceMiles) {
    var Logger = require('dw/system/Logger');
    var Locale = require('dw/util/Locale');
    var Site = require('dw/system/Site');
    // eslint-disable-next-line no-undef
    var currentLocale = Locale.getLocale(request.getLocale());
    var countryCode = (currentLocale && currentLocale.country) || 'US';
    // Use already implemented GC/UACAPI services for HAL
    var FirstDataAuthTokenHelper = require('int_first_data/cartridge/scripts/firstDataAuthTokenHelper');
    var firstDataService = require('int_first_data/cartridge/scripts/services/firstDataService');
    var tokenHelper = new FirstDataAuthTokenHelper();
    var createGraphQLService = firstDataService.createGraphQLService();
    var graphQLApiUrl = Site.current.getCustomPreferenceValue('halShipToEndpoint');
    var pickupLocations = null;
    try {
        var requestBody;
        if (type === 'addressInput') {
            requestBody = {
                query: 'query pickupLocationByAddress($input: PickupLocationByAddressInput!) {\n  pickupLocationByAddress(input: $input) {\n  id\n   type\n    distanceMiles\n      companyName\n      description\n      address {\n        streetLines\n        city\n        state\n        postalCode\n        countryCode\n      }\n      pickupHours {\n        day\n        openTime\n        closeTime\n      }\n  }\n}',
                variables: {
                    input: query
                }
            };
        } else {
            requestBody = {
                query: 'query pickupLocations($input: PickupLocationsInput!) {\n  pickupLocations(input: $input) {\n    count\n    locations {\n  id\n   type\n    distanceMiles\n      companyName\n      description\n      address {\n        streetLines\n        city\n        state\n        postalCode\n        countryCode\n      }\n      pickupHours {\n        day\n        openTime\n        closeTime\n      }\n    }\n  }\n}',
                variables: {
                    input: {
                        type: type,
                        query: query,
                        maxDistanceMiles: maxDistanceMiles || 25,
                        countryCode: countryCode
                    }
                }
            };
        }
        var accessToken = tokenHelper.getValidToken().accessToken;
        if (!empty(accessToken)) {
            var params = {
                requestBody: requestBody,
                token: accessToken,
                graphQLApiUrl: graphQLApiUrl
            };
            var serviceResponse = createGraphQLService.call(params);
            if (serviceResponse && serviceResponse.status === 'OK' && serviceResponse.object && serviceResponse.object.statusCode === 200) {
                var responseObj = JSON.parse(serviceResponse.object.text);
                if (!empty(responseObj.data)) {
                    pickupLocations = responseObj.data;
                }
            }
        }
    } catch (e) {
        // eslint-disable-next-line spellcheck/spell-checker
        Logger.error('Error in halHelper.js -> getPickupLocations()', e.message);
    }
    return pickupLocations;
}
/**
 * Executes the search by postal code and returns pickup-locations
 *
 * @param {string} postalCode - Postal code
 * @param {number} maxDistanceMiles - Max distance in miles
 * @returns {Object} pickupLocations - Returns pickup-locations or NULL
 */
function getPickupLocationsByPostalCode(postalCode, maxDistanceMiles) {
    var pickupLocations;
    if (!empty(postalCode)) {
        pickupLocations = getPickupLocations('zipCode', postalCode, maxDistanceMiles);
    }
    return pickupLocations;
}
/**
 * Executes the search by geolocation co-ordinates and returns pickup-locations
 *
 * @param {string} geolocation - location in ISO 6709 format (e.g. '+39.342239-76.635977/')
 * @param {number} maxDistanceMiles - Max distance in miles
 * @returns {Object} pickupLocations - Returns pickup-locations or NULL
 */
function getPickupLocationsByGeolocation(geolocation, maxDistanceMiles) {
    var pickupLocations;
    if (!empty(geolocation)) {
        pickupLocations = getPickupLocations('geolocationCoordinates', geolocation, maxDistanceMiles);
    }
    return pickupLocations;
}
/**
 * Executes the search by address and returns pickup-locations
 *
 * @param {Object} address - address JSON object
 * Example - {
 *   "streetLines": ["3003 N Charles St"],
 *   "city": "Baltimore",
 *   "state": "MD",
 *   "postalCode": "21218",
 *   "countryCode": "US"
 * }
 * @param {number} maxDistanceMiles - Max distance in miles
 * @returns {Object} pickupLocations - Returns pickup-locations or NULL
 */
function getPickupLocationsByAddress(address) {
    var pickupLocations;
    if (!empty(address)) {
        pickupLocations = getPickupLocations('addressInput', address, null);
    }
    return pickupLocations;
}

/**
 * validates shipping address is valid HAL
 * @param {Object} basket DW basket object
 * @returns {boolean} returns status of HAL Address
 */
function isValidAddress(basket) {
    if (basket && basket.defaultShipment && basket.defaultShipment.shippingAddress && 'isCommercialPickup' in basket.custom && basket.custom.isCommercialPickup) {
        try {
            var orderAddress = basket.defaultShipment.shippingAddress;
            var halAddressObject = {
                streetLines: orderAddress.address2,
                city: orderAddress.city,
                state: orderAddress.stateCode,
                postalCode: orderAddress.postalCode,
                countryCode: orderAddress.countryCode.value
            };
            var pickupLocations = getPickupLocationsByAddress(halAddressObject);
            if (pickupLocations && pickupLocations.pickupLocationByAddress && pickupLocations.pickupLocationByAddress.address && pickupLocations.pickupLocationByAddress.companyName) {
                return pickupLocations.pickupLocationByAddress.companyName === orderAddress.address1;
            }
        } catch (e) {
            var Logger = require('dw/system/Logger');
            Logger.error('Error in halHelper.js -> getPickupLocations()', e.message);
        }
        return false;
    }
    return true;
}
/*
 * Export public methods
 */
module.exports = {
    getPickupLocationsByPostalCode: getPickupLocationsByPostalCode,
    getPickupLocationsByGeolocation: getPickupLocationsByGeolocation,
    getPickupLocationsByAddress: getPickupLocationsByAddress,
    isValidAddress: isValidAddress
};
