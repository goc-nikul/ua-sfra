
var Logger = require('dw/system/Logger').getLogger('paazlAPI', 'paazl');
var Site = require('dw/system/Site');

/**
 * Paazl Order Service
 *
 * @returns {Object} Helper method
 */
function getTokenService() {
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
          * @returns {Object} HTTP request
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
            svc.setRequestMethod('POST');

            var getTokenRequest = JSON.stringify({ reference: params.orderReference });

            return getTokenRequest;
        }

        /**
          * Parse the response
          *
          * @param {dw.svc.HTTPService} svc HTTP service
          * @param {Object} response Service response
          * @returns {Object} Service response
          */
        function parseResponse(svc, response) {
            var output = {};
            output.success = true;
            if (response.statusCode === 200 && response.statusMessage === 'OK') {
                var responseObj = JSON.parse(response.text);
                if (responseObj) {
                    output.success = true;
                    output.token = responseObj.token;
                    Logger.info('REST API token successfully requested from Paazl.');
                } else {
                    output.success = false;
                    Logger.error('REST API  - returned token empty or null.');
                }
            } else {
                output.success = false;
                Logger.error('REST API - Error requesting authentification from Paazl.');
            }
            return output;
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
      * Call service.paazl.getToken service
      *
      * @param {Object} params Required field for service call
      * @returns{dw.svc.Result} Service Result
      */
    function getToken(params) {
        var output = { success: true };
        try {
            var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
            var serviceID = 'service.paazl.rest.gettoken';
            var tokenService = LocalServiceRegistry.createService(serviceID, callback());
            Logger.info('Requesting REST API token from Paazl for basket: {0}', params.basket.getUUID());
            var result = tokenService.call({ orderReference: params.basket.getUUID() });

            if (result.ok) {
                output = result.object;
                Logger.info('REST API token request result. Token: {0}, basket: {1}', output.token, params.basket.getUUID());
            } else {
                var errorMessages = JSON.parse(result.errorMessage);
                if (errorMessages && errorMessages.errors && errorMessages.errors.length > 0) {
                    var errorMessage = errorMessages.errors[0];
                    if (errorMessage.message === 'Reference is not unique') {
                        output.success = true;
                        Logger.info('REST API token already requested from Paazl, basket {0}', params.basket.getUUID());
                    } else {
                        output.success = false;
                        Logger.error('Error requesting token from Paazl. Error message: {0}, basket: {1}', result.errorMessage || '', params.basket.getUUID());
                    }
                } else {
                    output.success = false;
                    Logger.error('Error requesting token from Paazl. Error message: {0}, basket: {1}', result.errorMessage || '', params.basket.getUUID());
                }
            }
        } catch (error) {
            Logger.error('Error requesting token from Paazl. Error: {0}, basket: {1}', error, params.basket.getUUID());
        }

        return output;
    }

    return {
        getToken: getToken
    };
}

module.exports = getTokenService();
