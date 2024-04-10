var logger = require('dw/system/Logger').getLogger('paazlAPI', 'paazl');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var helper = require('~/cartridge/scripts/helpers/paazlHelper');
/**
 * Paazl Order Service
 *
 * @returns {Object} Helper method
 */
function commitOrderTrackingService() {
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
            var orderTrackingRequest = helper.existingShipmentTrackingRequest(this.webReference, params.order);
            return orderTrackingRequest;
        }

        /**
          * Executes the SOAP request
          *
          * @param {dw.svc.SOAPService} svc SOAP service
          * @param {Object} request request
          * @returns {Object} SOAP
          */
        function execute(svc, request) {
            return svc.serviceClient.addExistingShipment(request);
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
            var errorShipmentMessage = response.shipmentsOrMessageOrErrors;
            if(typeof errorShipmentMessage !== 'object' && errorShipmentMessage.toLowerCase() === 'success')
            {
                result.success = true;
                logger.info('Order tracking number successfully commited to Paazl.');
            }
            else {
                var message;
                var code;
                if(errorShipmentMessage && 'shipment' in errorShipmentMessage)
                {
                    var errorShipment = errorShipmentMessage.shipment;
                    var errorTracking = errorShipment[0].errors;
                    var errorResponse = errorTracking.error;
                    message = errorResponse[0]['message'];
                    code = errorResponse[0]['code']
                }
                else if(errorShipmentMessage && 'error' in errorShipmentMessage)
                {
                    var errorResponse = errorShipmentMessage.error;
                    message = errorResponse[0].message;
                    code = errorResponse[0].code;
                }

                if(errorResponse) {
                    result.success = false;
                    result.message = message || '';
                    result.code = code || '';
                    logger.error('Error commiting order tracking number in Paazl. Error code: {0}. Error message: {1}.', code || '', message || '');
                }
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
    function commitOrderTracking(params) {
        var apiOrder = params.order;
        var orderNo = apiOrder.orderNo;
        var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
        var serviceID = 'service.paazl.orderrequest.addExistingShipment';

        var maxShipmentAttempts = Site.getCurrent().getCustomPreferenceValue('paazlCommitShipmentMaxAttempts');
        var failedShipmentAttempts = apiOrder.custom.failedShipmentAttempts || 0;

        var shiptrackingcode='';
        var trackcodes = helper.getShipmentInfo(apiOrder);
        trackcodes.forEach(function (shipping) {
            if (shipping.trackingCode) {
                shiptrackingcode = shipping.trackingCode
            }
        });

        if(shiptrackingcode === '') {
            failedShipmentAttempts++;
                Transaction.wrap(function () {
                    apiOrder.custom.failedShipmentAttempts = failedShipmentAttempts;
                    if (failedShipmentAttempts <= maxShipmentAttempts) {
                        var note = 'Committing order tracking number in paazl system has failed ' + failedShipmentAttempts + ' times. Order tracking number not available for the order ' + orderNo;
                        if (failedShipmentAttempts === maxShipmentAttempts) {
                            note += ' This order won\'t be processed for Paazl-Commit-Order-Shipment anymore';
                        }
                        apiOrder.addNote('Paazl-Commit-Order-ShipmentTracking', note);
                    }
                });
            var output = { success: false, errorMessage:'Not available tracking number'  };
            return output;
        }

        try {
            var orderService = LocalServiceRegistry.createService(serviceID, callback());
            var result = orderService.call({ order: apiOrder });

            var output = { success: true };
            if (result.ok) {
                output = result.object;
                if(output.success)
                {
                    Transaction.wrap(function () {
                        apiOrder.custom.notSavedPaazlShipping = false;
                        apiOrder.addNote('Paazl-Commit-Order-ShipmentTracking', 'Order tracking number successfully committed in paazl system');
                    });
                }

            } else {
                output.success = false;
                output.message = result.message;
                output.code = result.code;
                logger.error('Error commiting order tracking number in Paazl. Error code: {0}. Error message: {1}.', result.code || '', result.message || '');

                failedShipmentAttempts++;
                Transaction.wrap(function () {
                    apiOrder.custom.failedShipmentAttempts = failedShipmentAttempts;
                    if (failedShipmentAttempts <= maxShipmentAttempts) {
                        var note = 'Committing order tracking number in paazl system has failed ' + failedShipmentAttempts + ' times. Error code:' + result.code + ' Error message:'+result.message;
                        if (failedShipmentAttempts === maxShipmentAttempts) {
                            note += ' This order won\'t be processed for Paazl-Commit-Order-Shipment anymore';
                        }
                        apiOrder.addNote('Paazl-Commit-Order-ShipmentTracking',note);
                    }
                });
            }

        } catch (error) {
                failedShipmentAttempts++;
                Transaction.wrap(function () {
                    apiOrder.custom.failedShipmentAttempts = failedShipmentAttempts;
                    if (failedShipmentAttempts <= maxShipmentAttempts) {
                        var note = 'Committing order tracking number in paazl system has failed ' + failedShipmentAttempts + ' times. Due to paazl service is unresponsive';
                        if (failedShipmentAttempts === maxShipmentAttempts) {
                            note += ' This order won\'t be processed for Paazl-Commit-Order-Shipment anymore';
                        }
                        apiOrder.addNote('Paazl-Commit-Order-ShipmentTracking',note);
                    }
                });
            Logger.error('Error in commiting order tracking number in Paazl for orderNo {0} Error: {1}.', orderNo, error);
        }
        return output;
    }
    return {
        commit: commitOrderTracking
    };
}

module.exports = commitOrderTrackingService();
