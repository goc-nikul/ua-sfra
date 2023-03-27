var logger = require('dw/system/Logger').getLogger('paazlAPI', 'paazl');

/**
 * Paazl Order Service
 *
 * @returns {Object} Helper method
 */
function addressService() {
    /**
      * Implement service callbacks
      *
      * @returns {Object} service callback
      * @param {dw.order.Order} order - the order being exported
      * @private
      */
    function callback() {
        /**
          * SOAP WSDL init
          *
          * @returns {dw.svc.SOAPService} Service
          */
        function initServiceClient() {
            this.webReference = webreferences2.orderRequest;// eslint-disable-line no-undef
            return this.webReference.getDefaultService();
        }

        /**
          * Creates the actual SOAP request
          *
          * @param {dw.svc.SOAPService} svc SOAP service
          * @param {Object} params Required fields for service call
          * @returns {Object} SOAP request
          */
        function createRequest(svc, params) {
            var helper = require('~/cartridge/scripts/helpers/paazlHelper');
            var orderRequest = helper.addressRequest(this.webReference, params);
            return orderRequest;
        }

        /**
          * Executes the SOAP request
          *
          * @param {dw.svc.SOAPService} svc SOAP service
          * @param {Object} request request
          * @returns {Object} SOAP
          */
        function execute(svc, request) {
            return svc.serviceClient.address(request);
        }


        /**
          * Executes the SOAP request
          *
          * @param {dw.svc.SOAPService} svc SOAP service
          * @param {Object} response Service response
          * @returns {Object} Service response
          */
        function parseResponse(svc, response) {
            var result = {};
            if (response.errorOrAddress && response.errorOrAddress instanceof webreferences2.orderRequest.com.paazl.schemas.matrix.ErrorType) { // eslint-disable-line no-undef
                result.success = false;
                result.message = response.errorOrAddress.message || '';
                logger.error('Error requesting address validation in Paazl. Error code: {0}. Error message: {1}.', response.errorOrAddress.code.toString() || '', response.errorOrAddress.message || '');
            } else {
                result.success = true;
                result.address = response.errorOrAddress || '';
                logger.info('Address validation successfully requested from Paazl.');
            }
            return result;
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
            initServiceClient: initServiceClient,
            createRequest: createRequest,
            execute: execute,
            parseResponse: parseResponse,
            filterLogMessage: filterLogMessage
        };
    }

    /**
      * Call service.paazl.orderrequest service
      *
      * @param {Object} params Required fields for service call
      * @returns{dw.svc.Result} Service Result
      */
    function address(params) {
        var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
        var serviceID = 'service.paazl.orderrequest.address';
        var orderService = LocalServiceRegistry.createService(serviceID, callback());
        var result = orderService.call(params);

        var output = { success: true };

        if (result.ok) {
            output = result.object;
        } else {
            output.success = false;
            output.message = result.errorMessage;
            logger.error('Error requesting address validation in Paazl. Error message: {0}.', result.errorMessage || '');
        }
        return output;
    }
    return {
        address: address
    };
}

module.exports = addressService();
