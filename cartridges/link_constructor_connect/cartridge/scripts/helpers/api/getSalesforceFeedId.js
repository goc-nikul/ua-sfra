/**
 * Obtains the salesforce feed id from a given backend response.
 * @param {dw.svc.Result} apiCallResult The api call result.
 * @returns The salesforce feed id, or null if not found.
 */
module.exports = function getSalesforceFeedId(apiCallResult) {
  var apiCallJsonObject = JSON.parse(apiCallResult.object.response);
  var salesforceFeedId = apiCallJsonObject && apiCallJsonObject.id;

  return salesforceFeedId;
};
