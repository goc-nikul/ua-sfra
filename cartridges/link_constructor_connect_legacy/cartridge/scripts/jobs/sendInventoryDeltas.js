var moduleName = 'sendInventoryDeltas.js';

function sendInventoryDeltas(parameters, stepExecution) {
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
  logger.log(moduleName, 'info', 'Sending inventory deltas to Constructor.io...');
  logger.log(moduleName, 'info', 'Reading from file path: ' + filePath);

  // Get credentials
  credentials = config.getCredentialsOrNull(parameters.ApiKeyOverride);
  if (!credentials) {
    logger.log(moduleName, 'error', 'Credentials not set');
    files.handleFileActionAfterSendingDeltas(
      parameters,
      rootPath,
      filePath,
      false
    );
    return new Status(Status.ERROR);
  }

  // Send deltas
  xmlFileIterator = XmlFileIterator.create(filePath, 'inventory');

  status = api.sendDeltasFromXmlFile(
    api.feedTypes.inventory,
    credentials,
    xmlFileIterator,
    parameters.Section,
    stepExecution.jobExecution.context
  );

  files.handleFileActionAfterSendingDeltas(
    parameters,
    rootPath,
    filePath,
    status.code.toLowerCase() === 'ok'
  );

  logger.log(moduleName, 'info', 'Finished sending inventory deltas to Constructor.io');
  return status;
}

module.exports.execute = sendInventoryDeltas;
