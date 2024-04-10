var performConstructorConnectRequest = require('*/cartridge/scripts/helpers/api/performConstructorConnectRequest');
var feedTypes = require('*/cartridge/scripts/constants/feedTypes');
var version = require('*/cartridge/scripts/constants/version');
var apiUrl = require('*/cartridge/scripts/constants/apiUrl');
var logger = require('*/cartridge/scripts/helpers/logger');

/**
 * @param {import('../../types').ApiSendDeltaV2Parameters} params The function parameters.
 */
function buildPayload(params) {
  return JSON.stringify({
    salesforce_feed_id: params.salesforceFeedId,
    strategy: params.strategy,
    payload: params.records,
    section: params.section,
    type: params.type,
    version: version
  });
}

/**
 * @param {import('../../types').FeedType} feedType The feed type.
 * @returns {string} The URL.
 */
function getUrl(feedType) {
  switch (feedType) {
    case feedTypes.category:
      return apiUrl.v2.categoryFeed;

    case feedTypes.product:
    default:
      return apiUrl.v2.productFeed;
  }
}

/**
 * Sends a delta to the backend API using the v2 endpoint.
 *
 * @param {import('../../types').ApiSendDeltaV2Parameters} params The function parameters.
 * @returns {dw.svc.Result} The api response.
 */
module.exports = function sendDeltaV2(params) {
  var payload = buildPayload(params);
  var url = getUrl(params.type);

  var result = performConstructorConnectRequest({
    credentials: params.credentials,
    payload: payload,
    url: url
  });

  logger.log(
    'Successfully sent one delta with ' + params.records.length + ' records',
    { totalTimeMs: result.totalTimeMs + 'ms' }
  );

  return result.response;
};
