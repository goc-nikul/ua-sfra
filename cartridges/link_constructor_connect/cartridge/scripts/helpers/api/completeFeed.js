var performConstructorConnectRequest = require('*/cartridge/scripts/helpers/api/performConstructorConnectRequest');
var apiUrl = require('*/cartridge/scripts/constants/apiUrl');
var logger = require('*/cartridge/scripts/helpers/logger');

/**
 * Marks the feed as complete in the backend.
 *
 * @param {import('../../types').ApiMarkFeedAsCompletedV2Parameters} params The function parameters.
 * @returns {dw.svc.Result} The api response.
 */
module.exports = function completeFeed(params) {
  var payload = JSON.stringify({
    total_execution_time_ms: params.totalExecutionTimeMs,
    salesforce_feed_id: params.salesforceFeedId
  });

  var result = performConstructorConnectRequest({
    credentials: params.credentials,
    url: apiUrl.v2.completeFeed,
    payload: payload
  });

  logger.log('Completed feed with ' + params.sentChunksCount + ' chunks.');

  return result.response;
};
