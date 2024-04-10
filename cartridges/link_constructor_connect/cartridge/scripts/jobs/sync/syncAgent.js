var updateLastSyncDate = require('*/cartridge/scripts/helpers/config/lastSyncDate/updateLastSyncDate');
var getSalesforceFeedId = require('*/cartridge/scripts/helpers/api/getSalesforceFeedId');
var completeFeed = require('*/cartridge/scripts/helpers/api/completeFeed');
var sendDeltaV2 = require('*/cartridge/scripts/helpers/api/sendDeltaV2');
var feedTypes = require('*/cartridge/scripts/constants/feedTypes');
var logger = require('*/cartridge/scripts/helpers/logger');

var REQUIRED_PARAMETERS = [
  'transformer',
  'parameters',
  'reader',
  'type'
];

/**
 * Object responsible for executing the flow of syncing the catalog data in a chunk-oriented job.
 *
 * In the `beforeStep` action, you must initialize the correct adapters for the sync agent:
 * - `transformer`: The transformer to be used to process the data.
 * - `reader`: The reader to be used to read the data.
 * - `parameters`: The parsed job parameters.
 * - `type`: The type of feed to be sent.
 *
 * It will then handle the following steps:
 * - `getTotalCount`: Calculates the total number of records to be processed.
 * - `read`: Reads the next record to be processed.
 * - `process`: Transforms the record before sending it to the backend.
 * - `write`: Sends the processed records to the backend.
 * - `afterStep`: Finalizes the job step.
 *
 * For pieces that are not generic (e.g. how to fetch the data or how to transform the data),
 * it will rely on adapters that must be provided by the user.
 */
var SyncAgent = function () {
  /**
   * @type {import('../../types').SyncJobBaseParameters} The parsed job parameters
   *
   * Every sync job is expected to have at least a base set of parameters.
   * Depending on the job, this may hold additional parameters.
   */
  this.parameters = null;

  /**
   * @type {string} The Salesforce feed ID to send on the next feed requests.
   */
  this.salesforceFeedId = null;

  /**
   * @type {number} The total number chunks that have been sent to the backend.
   */
  this.sentChunksCount = 0;

  /**
   * @type {import('../../types').SyncJobReaderAdapter} The reader adapter to be used to read the data.
   */
  this.reader = null;

  /**
   * @type {import('../../types').FeedType} The type of feed to be sent.
   */
  this.type = null;

  /**
   * @type {import('../../types').SyncJobTransformerAdapter} The transformer to be used to process the data.
   */
  this.transformer = null;

  /**
   * @type {import('../../types').SyncJobBuildCustomApiPayloadAdapter} Function to build the custom API payload.
   */
  this.buildCustomApiPayload = null;

  /**
   * The date that the sync agent started the sync job.
   * Used to collect performance metrics.
   */
  this.startedAt = null;
};

/**
 * Creates a new sync agent to handle a chunk-oriented sync job.
 * @param {import('../../types').SyncAgentCreateArgs} args The create arguments.
 * @returns {SyncAgent} A new SyncAgent instance.
 */
SyncAgent.create = function (args) {
  for (var index = 0; index < REQUIRED_PARAMETERS.length; index += 1) {
    var parameter = REQUIRED_PARAMETERS[index];

    if (!args[parameter]) {
      throw new Error('SyncAgent: Missing required parameter ' + JSON.stringify(parameter));
    }
  }

  var syncAgent = new SyncAgent();

  syncAgent.buildCustomApiPayload = args.buildCustomApiPayload;
  syncAgent.transformer = args.transformer;
  syncAgent.parameters = args.parameters;
  syncAgent.startedAt = new Date();
  syncAgent.reader = args.reader;
  syncAgent.type = args.type;

  return syncAgent;
};

/**
 * @returns {number} The estimated total count of records to send.
 */
SyncAgent.prototype.getTotalCount = function () {
  var count = 0;

  /**
   * If the reader has a `getTotalCount` method, use it.
   */
  if (this.reader.getTotalCount) {
    count = this.reader.getTotalCount();
  } else {
    /**
     * Otherwise, read the records one by one until there are no more records.
     */
    var result = this.reader.readNextCountLine();

    while (result) {
      if (result && result.valid) {
        count += 1;
      }

      result = this.reader.readNextCountLine();
    }
  }

  /**
   * Then, reset the reader to its initial state to prepare for the next step.
   */
  if (this.reader.reset) {
    this.reader.reset();
  }

  logger.log('Calculated estimate total count of records to send. Result: ' + count);

  return count;
};

/**
 * @returns {dw.catalog.Product | null} The next record or null.
 */
SyncAgent.prototype.read = function () {
  var result = this.reader.readNextRecordLine();

  while (result) {
    if (result.valid) {
      return result;
    }

    result = this.reader.readNextRecordLine();
  }

  return null;
};

/**
 * @param {object} result The read result.
 * @returns {object} The processed record.
 */
SyncAgent.prototype.process = function (result) {
  return this.transformer(result.record, result.data);
};

/**
 * @param {dw.util.Collection} buffer The buffer to send.
 */
SyncAgent.prototype.write = function (buffer) {
  var payload = this.buildCustomApiPayload
    ? this.buildCustomApiPayload(this.parameters)
    : {};

  // Append the required parameters to the API payload.
  payload.credentials = this.parameters.credentials;
  payload.salesforceFeedId = this.salesforceFeedId;
  payload.records = buffer.toArray();
  payload.type = this.type;

  var response = sendDeltaV2(payload);

  if (!this.salesforceFeedId) {
    this.salesforceFeedId = getSalesforceFeedId(response);
    logger.log('Initialized the Salesforce feed ID: ' + JSON.stringify(this.salesforceFeedId));
  }

  if (!this.salesforceFeedId) {
    throw new Error('Error while obtaining Salesforce feed ID to send on next feed requests.');
  }

  this.sentChunksCount += 1;
};

SyncAgent.prototype.afterStep = function () {
  /**
   * Mark the Salesforce feed as completed if it exists.
   */
  if (this.salesforceFeedId) {
    var totalExecutionTimeMs = Math.abs(new Date() - this.startedAt);

    completeFeed({
      totalExecutionTimeMs: totalExecutionTimeMs,
      credentials: this.parameters.credentials,
      salesforceFeedId: this.salesforceFeedId,
      sentChunksCount: this.sentChunksCount
    });
  }

  /**
   * For product feeds that have been successfully sent, update the last sync date.
   * This allows us to perform partial syncs, sending only the records that
   * have been modified since the last sync ran - according to locale.
   */
  if (
    this.type === feedTypes.product
    && !this.parameters.hasFilters
    && this.salesforceFeedId
  ) {
    updateLastSyncDate({
      value: this.parameters.startedAt,
      locale: this.parameters.locale,
      jobID: this.parameters.jobID
    });
  }
};

module.exports = SyncAgent;
