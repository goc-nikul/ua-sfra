var moduleName = 'api.js';

/**
 * The URL to be used to perform a delta ingestion.
 */
var DELTA_INGESTION_URL = 'https://partner-authenticator.cnstrc.com/salesforce/feed';

/**
 * The max heap size allowed in the Salesforce cartridge ecosystem,
 * defined as the maximum number of characters in a string.
 */
var MAX_HEAP_SIZE_IN_STRING_LENGTH = 600000;

/**
 * Maximum number of chunks to send at once.
 */
var MAX_CHUNK_SIZE = 1000;

/**
 * Maximum number of failed chunks before aborting the job.
 */
var MAX_FAILED_CHUNKS = 1;

/**
 * Defines possible feed types to send via API.
 */
var feedTypes = {
  product: 'product',
  category: 'category',
  inventory: 'inventory'
};

var config = require('../helpers/config');

/**
 * Calculates the maximum number of records to send in a given chunk.
 * @param {*} xmlFileIterator The XML file iterator object.
 * @returns The maximum number of records that should be sent per chunk.
 */
function calculateMaxNumberOfRecordsPerChunk(xmlFileIterator) {
  var rawMaxNumber = Math.floor(MAX_HEAP_SIZE_IN_STRING_LENGTH / xmlFileIterator.getRecordSize());

  // Reduce by 25% to avoid exceeding the heap size
  rawMaxNumber = Math.floor(rawMaxNumber * 0.75);

  // Make sure the number is not too big
  return Math.min(MAX_CHUNK_SIZE, rawMaxNumber);
}

/**
 * Builds the ingestion strategy to send in the payload.
 * @param {import('../types').ApiPayloadParameters} params The function parameters.
 * @returns {string} The ingestion strategy.
 */
function getIngestionStrategy(params) {
  var ingestionStrategy;

  switch (params.type) {
    case feedTypes.category:
      ingestionStrategy = config.getConfig(config.configKeys.CONSTRUCTOR_CATEGORY_INGESTION_STRATEGY).value;
      break;

    case feedTypes.inventory:
      ingestionStrategy = config.getConfig(config.configKeys.CONSTRUCTOR_INVENTORY_INGESTION_STRATEGY).value;
      break;

    case feedTypes.product:
        if (params.section.toLowerCase() === 'categories') {
            ingestionStrategy = config.getConfig(config.configKeys.CONSTRUCTOR_CATEGORY_INGESTION_STRATEGY).value;
            break;
        }

    default:
      ingestionStrategy = config.getConfig(config.configKeys.CONSTRUCTOR_PRODUCT_INGESTION_STRATEGY).value;
      break;
  }

  /**
   * If we're sending a full ingestion and there are filters, we need to send a DELTA instead.
   * Otherwise, we can end up overriding the catalog with a partial catalog.
   */
  if (params.jobExecutionContext.hasFilters && ingestionStrategy === 'FULL') {
    return 'DELTA';
  }

  /**
   * If we're sending a full ingestion while filtering only the items updated since the last sync date (without filters),
   * we need to send a DELTA instead. Otherwise, we can end up overriding the catalog with a partial catalog.
   */
  if (params.jobExecutionContext.lastSyncDate && ingestionStrategy === 'FULL') {
    return 'DELTA';
  }

  return ingestionStrategy;
}

/**
 * Builds the payload object to send to the backend API.
 * @param {import('../types').ApiPayloadParameters} params The function parameters.
 * @returns The payload object.
 */
function buildPayload(params) {
  return JSON.stringify({
    strategy: getIngestionStrategy(params),
    salesforceFeedId: params.salesforceFeedId,
    version: config.cartridgeVersion,
    totalAmount: params.totalAmount,
    payload: params.records,
    section: params.section,
    type: params.type
  });
}

/**
 * Posts the ingestion files to the backend API.
 * @param {import('../types').ApiPayloadParameters} params The function parameters.
 * @returns The api service call result object.
 */
function sendDelta(params) {
  var serviceDefinition = require('../services/serviceDefinition');
  var logger = require('./logger');

  var service = serviceDefinition.init();
  var apiCallResult = null;

  service.setURL(DELTA_INGESTION_URL);
  service.setRequestMethod('POST');
  service.setAuthentication('NONE');

  service.addHeader('api-token', params.credentials.apiToken);
  service.addHeader('api-key', params.credentials.apiKey);

  apiCallResult = service.call(buildPayload(params));

  if (apiCallResult.isOk()) {
    logger.log(moduleName, 'info', 'Successfully sent one delta with ' + params.records.length + ' records');
  } else {
    logger.log(moduleName, 'error', 'Error while sending one delta: ' + apiCallResult.getErrorMessage());
  }

  return apiCallResult;
}

/**
 * Obtains the salesforce feed id from a given backend response.
 * @param {*} apiCallResult The api call result.
 * @returns The salesforce feed id, or null if not found.
 */
function getSalesforceFeedId(apiCallResult) {
  var apiCallJsonObject = JSON.parse(apiCallResult.object.response);
  var salesforceFeedId = apiCallJsonObject && apiCallJsonObject.id;

  return salesforceFeedId;
}

/**
 * Sends batched delta files to the backend API, respecting the maximum heap size.
 * @param {keyof typeof feedTypes} type The feed type.
 * @param {object} credentials The credentials object.
 * @param {*} xmlFileIterator The XML file iterator.
 * @param {string} section The Constructor index section
 * @param {object} jobExecutionContext The job execution context, containing shared job variables.
 * @returns The status according to the response.
 */
function sendDeltasFromXmlFile(type, credentials, xmlFileIterator, section, jobExecutionContext) {
  var Status = require('dw/system/Status');
  var logger = require('./logger');
  var apiCallResult = null;

  var maxNumberOfRecordsPerChunk = 0;
  var salesforceFeedId = null;
  var failedChunksCount = 0;
  var sentChunksCount = 0;
  var records = [];

  var totalAmount = xmlFileIterator.getSize();

  // Handle empty xml file case
  if (totalAmount === 0) {
    logger.log(moduleName, 'info', 'No deltas to send, file is empty');
    xmlFileIterator.close();

    return new Status(Status.OK);
  }

  maxNumberOfRecordsPerChunk = calculateMaxNumberOfRecordsPerChunk(xmlFileIterator);
  logger.log(moduleName, 'info', 'Sending deltas in chunks of ' + maxNumberOfRecordsPerChunk + ' records');

  while (xmlFileIterator.hasNext()) {
    // without toString it just breaks on version 18.10
    records.push(xmlFileIterator.next().toString());

    if (records.length < maxNumberOfRecordsPerChunk && xmlFileIterator.hasNext()) {
      // eslint-disable-next-line no-continue
      continue;
    }

    logger.log(moduleName, 'info', 'Sending one chunk of ' + records.length + ' records');

    apiCallResult = sendDelta({
      jobExecutionContext: jobExecutionContext || {},
      salesforceFeedId: salesforceFeedId,
      totalAmount: totalAmount,
      credentials: credentials,
      records: records,
      section: section,
      type: type
    });

    // Clear the chunk to repopulate it
    records = [];

    if (!apiCallResult.isOk()) {
      failedChunksCount += 1;

      // Abort if too many chunks failed
      if (failedChunksCount >= MAX_FAILED_CHUNKS) {
        xmlFileIterator.close();

        logger.log(moduleName, 'error', 'Aborting api requests since too many chunks failed.');
        return new Status(Status.ERROR);
      }
    }

    sentChunksCount += 1;

    if (!salesforceFeedId) {
      salesforceFeedId = getSalesforceFeedId(apiCallResult);
      logger.log(moduleName, 'info', 'Initialized the Salesforce feed ID: ' + salesforceFeedId);
    }

    if (!salesforceFeedId) {
      logger.log(moduleName, 'error', 'Error while obtaining Salesforce feed ID to send on next feed requests.');
      return new Status(Status.ERROR);
    }
  }

  xmlFileIterator.close();

  logger.log(moduleName, 'info', 'Failed chunks count: ' + failedChunksCount);
  logger.log(moduleName, 'info', 'Sent chunks count: ' + sentChunksCount);
  logger.log(moduleName, 'info', 'Finished sending deltas');

  return new Status(Status.OK);
}

module.exports = {
  sendDeltasFromXmlFile: sendDeltasFromXmlFile,
  feedTypes: feedTypes
};
