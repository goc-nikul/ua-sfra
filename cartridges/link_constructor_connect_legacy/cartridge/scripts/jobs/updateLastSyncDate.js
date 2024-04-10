/**
 * Updates a last sync date (without filters) config for a given job.
 * @param {*} parameters The job parameters.
 * @param {*} stepExecution The job step execution.
 * @returns The job status.
 */
function updateLastSyncDate(parameters, stepExecution) {
  var Status = require('dw/system/Status');
  var config = require('../helpers/config');

  var hasFilters = stepExecution.jobExecution.context.hasFilters;
  var locale = stepExecution.jobExecution.context.locale;

  /**
   * We only want to update the last sync date if there are no filters.
   * If a sync has been performed with filters, we'll ignore it and wait for a full sync.
   */
  if (!hasFilters) {
    config.updateLastSyncDate(
      stepExecution.jobExecution.context.startedAt,
      stepExecution.jobExecution.jobID,
      locale
    );
  }

  return new Status(Status.OK);
}

module.exports.execute = updateLastSyncDate;
