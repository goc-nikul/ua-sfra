var getCredentialsOrNull = require('*/cartridge/scripts/helpers/config/getCredentialsOrNull');
var logger = require('*/cartridge/scripts/helpers/logger');

/**
 * @param {import('../../../types').SyncJobBaseParameters} rawParameters
 * @param {dw.job.JobStepExecution} stepExecution
 * @returns The parsed job parameters.
 */
module.exports = function parseBaseParameters(rawParameters, stepExecution) {
  // Initialize the parameters. Note that casing is important here.
  var parameters = {
    apiKeyOverride: rawParameters.ApiKeyOverride,
    jobID: stepExecution.jobExecution.jobID,
    locale: rawParameters.Locale,
    startedAt: new Date()
  };

  var credentials = getCredentialsOrNull(parameters.apiKeyOverride);

  if (!credentials) {
    throw new Error('Invalid credentials. Please check your configuration.');
  }

  if (parameters.locale) {
    /**
     * Request is a global object that is available in all job steps.
     * Using this, we can set the locale for the current request.
     *
     * @see https://salesforcecommercecloud.github.io/b2c-dev-doc/docs/current/scriptapi/html/index.html?target=class_dw_system_Request.html
     */
    request.setLocale(parameters.locale);
  }

  logger.log('Initialized base job parameters: ' + JSON.stringify(parameters));

  // Write credentials last to avoid leaking it in the logs.
  parameters.credentials = credentials;

  return parameters;
};
