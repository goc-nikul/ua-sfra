
const ImportUtils = require('bc_jobs/cartridge/scripts/import/Utils');
const XmlReaderUtils = require('bc_jobs/cartridge/scripts/import/XmlReaderUtils');
const File = require('dw/io/File');
const FileReader = require('dw/io/FileReader');
const XMLStreamReader = require('dw/io/XMLStreamReader');
const XMLStreamConstants = require('dw/io/XMLStreamConstants');
const Logger = require('dw/system/Logger').getLogger('OrderExportLog','OrderExportLog');

var executeLog = function executeLog(args) {

  var filesParam = {
    Directory: ImportUtils.getWorkingFolder(args.FilePath),
    OnlyFiles: true,
    FilePattern: args.filePattern
  };
  try {
    var files = ImportUtils.getFilesFromDirectory(filesParam);
    while (files.length > 0) {
      var file = files.pop();
      var fileReader = new FileReader(file);
      var xmlStreamReader = new XMLStreamReader(fileReader);
      while (xmlStreamReader.hasNext()) {
        if (xmlStreamReader.next() == XMLStreamConstants.START_ELEMENT) {
          var localElementName = xmlStreamReader.getLocalName();
          if (localElementName == "order") {
            var myObject = xmlStreamReader.getXMLObject();
            var orderID = myObject.attribute('order-no');
            Logger.info('Order {0} export completed successfully', orderID);
          }
        }
      }
      xmlStreamReader.close();
      fileReader.close();
    }
  } catch (error) {
    Logger.error("Logging failed due to {0}", error);
  }
}

exports.executeLog = executeLog;