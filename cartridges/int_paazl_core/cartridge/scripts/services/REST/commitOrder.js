var Logger = require('dw/system/Logger').getLogger('paazlAPI', 'paazl');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var StringUtils = require('dw/util/StringUtils');

/**
 * Paazl Order Service
 *
 * @returns {Object} Helper method
 */
function commitOrderService() {
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
          * @returns{string} post request payload
          */
        function createRequest(svc, params) {
            var paazlAPIKey = Site.current.getCustomPreferenceValue('paazlAPIKey');
            var paazlAPISecret = Site.current.getCustomPreferenceValue('paazlAPISecret');

            if (!paazlAPIKey || !paazlAPISecret) {
                throw new Error('CommitOrder API - Error paazlAPIKey OR paazlAPISecret missing from site preferences.');
            }

            var bearer = 'Bearer ' + paazlAPIKey + ':' + paazlAPISecret;

            svc.addHeader('Content-Type', 'application/json;charset=UTF-8');
            svc.addHeader('Authorization', bearer);

            var helper = require('~/cartridge/scripts/helpers/commitOrderHelper');
            var requestObj = helper.getCommitRequestPayload(params.order);

            Transaction.wrap(function () {
                var msg = JSON.stringify(requestObj);
                var nr = 1;
                do {
                    params.order.addNote('Paazl Commit Request ' + nr, StringUtils.truncate(msg, 4000, StringUtils.TRUNCATE_CHAR, ''));
                    msg = msg.substr(4000);
                    nr++;
                } while (msg.length > 0);
            });

            return JSON.stringify(requestObj);
        }

        /**
          * Parse the response
          *
          * @param {dw.svc.HTTPService} svc HTTP service
          * @param {Object} response Service response
          * @returns {Object} Service response
          */
        function parseResponse() {
            return { success: true };
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
      * Call Commit Order(Save Order) REST API service
      *
      * @param {Object} params Required fields for service call
      * @returns{Object} success true/false status js object { success: true }
      */
    function commitOrder(params) {
        var output = { success: false };
        var apiOrder = params.order;
        var orderNo = apiOrder.orderNo;
        var maxAttempts = Site.getCurrent().getCustomPreferenceValue('paazlCommitOrderMaxAttempts');
        var failedAttempts = apiOrder.custom.failedAttempts || 0;

        try {
            var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
            var serviceID = 'service.paazl.rest.commitOrder';
            var commitOrderSvc = LocalServiceRegistry.createService(serviceID, callback());
            var result = commitOrderSvc.call({ order: apiOrder });
            if (result.ok) {
                output = result.object;
                Transaction.wrap(function () {
                    apiOrder.custom.notSavedInPaazl = false;
                    apiOrder.addNote('Paazl-Commit-Order', 'Order successfully committed in paazl system');
                });
            } else {
                failedAttempts++;
                Transaction.wrap(function () {
                    apiOrder.custom.failedAttempts = failedAttempts;
                    if (failedAttempts === maxAttempts) {
                        var note = 'Committing this order in paazl system has failed ' + failedAttempts + ' times. This order won\'t be processed for Paazl commit order anymore';
                        apiOrder.addNote('Paazl-Commit-Order', note);
                    }
                });
                var errorMessage = result.errorMessage;
                if (errorMessage) {
                    Logger.error('Error in commit order request to paazl for orderNo {0}. Error message: {1}.', orderNo, errorMessage);
                } else {
                    Logger.error('Error in commit order request to paazl for orderNo {0}', orderNo);
                }
                output.errorMessage = errorMessage;
            }
        } catch (error) {
            Logger.error('Error in commit order request to paazl for orderNo {0} Error: {1}.', orderNo, error);
        }

        return output;
    }

    return {
        commit: commitOrder
    };
}
module.exports = commitOrderService();
