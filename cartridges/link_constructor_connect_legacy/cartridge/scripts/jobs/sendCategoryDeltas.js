var moduleName = 'sendCategoryDeltas.js';

function sendCategoryDeltas(parameters, stepExecution) {
  // Salesforce objects
  var Status = require('dw/system/Status');

  // Helper objects
  var XmlFileIterator = require('../helpers/xmlFileIterator');
  var logger = require('../helpers/logger');
  var config = require('../helpers/config');
  var files = require('../helpers/files');
  var api = require('../helpers/api');

  // Variables
  var filePath = stepExecution.jobExecution.context.filePath;
  var rootPath = stepExecution.jobExecution.context.rootPath;
  var xmlFileIterator = null;
  var credentials = null;
  var status = null;

  // Init logs
  logger.log(moduleName, 'info', 'Sending category deltas to Constructor.io...');
  logger.log(moduleName, 'info', 'Reading from file path: ' + filePath);

  // Set locale
  if (stepExecution.jobExecution.context.locale) {
    request.setLocale(stepExecution.jobExecution.context.locale);
  }

  // Get credentials
  credentials = config.getCredentialsOrNull(parameters.ApiKeyOverride);
  if (!credentials) {
    files.handleFileActionAfterSendingDeltas(
      parameters,
      rootPath,
      filePath,
      false
    );
    logger.log(moduleName, 'error', 'Credentials not set');
    return new Status(Status.ERROR);
  }

  // Send deltas
  xmlFileIterator = XmlFileIterator.create(filePath, 'category');

  status = api.sendDeltasFromXmlFile(
    api.feedTypes.category,
    credentials,
    xmlFileIterator,
    null,
    false
  );

  files.handleFileActionAfterSendingDeltas(
    parameters,
    rootPath,
    filePath,
    status.code.toLowerCase() === 'ok'
  );

  logger.log(moduleName, 'info', 'Finished sending category deltas to Constructor.io');
  return status;
}

module.exports.execute = sendCategoryDeltas;
