var Logger = require('dw/system/Logger').getLogger('paazlAPI', 'paazl');
var Site = require('dw/system/Site');
var paazlHelper = require('~/cartridge/scripts/helpers/paazlHelper');

/**
 * Paazl Order Service
 *
 * @returns {Object} Helper method
 */
function getCheckoutService() {
    /**
      * Implement service callbacks
      *
      * @returns {Object} service callback
      * @param {dw.order.Order} order - the order being exported
      * @private
      */
    function callback() {
        /**
          * Creates the request
          *
          * @param {dw.svc.HTTPService} svc HTTP service
          * @param {Object} params Required fields for service call
          */
        function createRequest(svc, params) {
            var paazlAPIKey = Site.current.getCustomPreferenceValue('paazlAPIKey');
            var paazlAPISecret = Site.current.getCustomPreferenceValue('paazlAPISecret');

            if (!paazlAPIKey || !paazlAPISecret) {
                throw new Error('REST API Checkout - Error paazlAPIKey OR paazlAPISecret missing from site preferences.');
            }

            var bearer = 'Bearer ' + paazlAPIKey + ':' + paazlAPISecret;

            svc.addHeader('Content-Type', 'application/json;charset=UTF-8');
            svc.addHeader('Authorization', bearer);
            svc.setRequestMethod('GET');

            svc.addParam('reference', params.orderReference);
        }

        /**
          * Parse the response
          *
          * @param {dw.svc.HTTPService} svc HTTP service
          * @param {Object} response Service response
          * @returns {Object} Service response
          */
        function parseResponse(svc, response) {
            var selectedOptionResponse = {};
            selectedOptionResponse.success = true;
            if (response.statusCode === 200 && response.statusMessage === 'OK') {
                var selectedOption = JSON.parse(response.text);
                if (selectedOption) {
                    selectedOptionResponse.ID = paazlHelper.getShippingMethodID();
                    if (selectedOption.deliveryType) {
                        selectedOptionResponse.deliveryType = selectedOption.deliveryType;
                    } else {
                        selectedOptionResponse.noDeliveryTypeInfo = true;
                        Logger.error('REST API Checkout - No deliveryType info return from Paazl.');
                        return selectedOptionResponse;
                    }
                    // The day of the week on which customers want their order delivered.
                    selectedOptionResponse.preferredDeliveryDate = selectedOption.preferredDeliveryDate;
                    var shippingOption = selectedOption.shippingOption;
                    if (shippingOption) {
                        selectedOptionResponse.carrierName = (shippingOption.carrier && shippingOption.carrier.name) || '';
                        selectedOptionResponse.carrierDescription = (shippingOption.carrier && shippingOption.carrier.description) || '';
                        selectedOptionResponse.cost = Number(shippingOption.rate || 0);
                        selectedOptionResponse.identifier = shippingOption.identifier || '';
                        selectedOptionResponse.name = shippingOption.name || '';
                        selectedOptionResponse.deliveryDates = shippingOption.deliveryDates || {};
                        selectedOptionResponse.estimatedDeliveryRange = shippingOption.estimatedDeliveryRange || {};
                    } else {
                        selectedOptionResponse.noSippingOptionObj = true;
                        Logger.error('REST API Checkout - No shippingOption Object return from Paazl.');
                        return selectedOptionResponse;
                    }
                    if (selectedOption.deliveryType && selectedOption.deliveryType === 'PICKUP_LOCATION') {
                        var pickupLocation = selectedOption.pickupLocation;
                        if (pickupLocation) {
                            selectedOptionResponse.pickupLocation = {};
                            selectedOptionResponse.pickupLocation.name = pickupLocation.name || '';
                            selectedOptionResponse.pickupLocation.accountNumber = pickupLocation.accountNumber || '';
                            selectedOptionResponse.pickupLocation.code = pickupLocation.code || '';
                            selectedOptionResponse.pickupLocation.openingTimes = pickupLocation.openingTimes || {};
                            var shippingAddress = {};
                            if (pickupLocation.address) {
                                shippingAddress = {
                                    firstName: '', // Needs to be added with an empty string for the FE
                                    lastName: pickupLocation.name || '',
                                    address1: pickupLocation.address.street || '',
                                    address2: pickupLocation.address.streetNumber || '',
                                    city: pickupLocation.address.city || '',
                                    postalCode: pickupLocation.address.postalCode || '',
                                    countryCode: pickupLocation.address.country || '',
                                    stateCode: pickupLocation.address.state || '',
                                    streetNumberSuffix: pickupLocation.address.streetNumberSuffix || ''
                                };
                            }
                            selectedOptionResponse.pickupLocation.address = shippingAddress;
                        } else {
                            selectedOptionResponse.noPickupLocationObj = true;
                            Logger.error('REST API Checkout - No pickupLocation Object return from Paazl.');
                            return selectedOptionResponse;
                        }
                    }
                    Logger.info('REST API Checkout - selected shipping option successfully requested from Paazl.');
                } else {
                    selectedOptionResponse.success = false;
                    Logger.error('REST API Checkout - returned selected shipping option empty or null.');
                }
            } else {
                selectedOptionResponse.success = false;
                Logger.error('REST API Checkout - Error requesting selected shipping option from Paazl.');
            }
            return selectedOptionResponse;
        }

        /**
         * filter the logged message
         *
         * @param {string} msg The message to filter
         * @returns {Object} The filtered message
         */
        function filterLogMessage(msg) {
            return msg;
        }

        return {
            createRequest: createRequest,
            parseResponse: parseResponse,
            filterLogMessage: filterLogMessage
        };
    }

    /**
      * Call checkout Paazl REST API service
      *
      * @param {Object} params Required fields for service call
      * @returns{dw.svc.Result} Service Result
      */
    function getSelectedOption(params) {
        var output = { success: false };
        try {
            var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
            var serviceID = 'service.paazl.rest.getSelectedOption';
            var checkoutService = LocalServiceRegistry.createService(serviceID, callback());
            Logger.info('Requesting selected shipping option from Paazl. Basket: {0}, apiToken: {1}', params.basket.getUUID(), params.basket.custom.paazlAPIToken);
            var result = checkoutService.call({ orderReference: params.basket.getUUID() });

            if (result.ok) {
                output = result.object;
                Logger.info('REST API Checkout - selected shipping option result. Basket: {0}', params.basket.getUUID());
            } else {
                var errorMessage = result.errorMessage;
                if (errorMessage) {
                    Logger.error('Error requesting selected shipping option from Paazl. Error message: {0}, basket: {1}.', errorMessage || '', params.basket.getUUID());
                } else {
                    Logger.error('Error requesting selected shipping option from Paazl. Basket: {0}', params.basket.getUUID());
                }
            }
        } catch (error) {
            Logger.error('Error requesting selected shipping option from Paazl. Error: {0}, basket: {1}', error, params.basket.getUUID());
        }

        return output;
    }

    return {
        getSelectedOption: getSelectedOption
    };
}
module.exports = getCheckoutService();
