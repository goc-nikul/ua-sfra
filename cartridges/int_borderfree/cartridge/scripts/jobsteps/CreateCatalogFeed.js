'use strict';

/**
 * Pipelet for creation catalog feed
 * 
 * @output NonExistingAttributes : Array
 * @output WrongAttributesType : Array
 */

/**
 * Require API dependencies
 */
const FileWriter = require('dw/io/FileWriter');
var Status = require('dw/system/Status');


/* Require in dependencies */


function execute(args) {
    const Util = require('*/cartridge/scripts/utils/Util');
    const BorderfreeJobsModel = require('*/cartridge/scripts/models/BorderfreeJobs');
    const errorEmail = require('*/cartridge/scripts/SendErrorEmail');
    var output = {};
    let file, fileWriter, catalogMapping, headers;
    try {
       catalogMapping = BorderfreeJobsModel.getCatalogMappingJSON();
       headers = Object.keys(catalogMapping);
       //If we don't have a catalog mapping in site prefs we need stop creation of file
       if (headers.length == 0) {
           Util.log.error('There is no catalog mapping configured.');
           return PIPELET_ERROR;
       }
       
       file = BorderfreeJobsModel.createFeedFile('catalog');
       /* Create an output stream */
       fileWriter = new FileWriter(file, 'UTF-8');
       //Add header
       BorderfreeJobsModel.addHeadersToFeed(fileWriter, headers);
       //Write Catalog
       BorderfreeJobsModel.addProductDataToFeed(fileWriter, catalogMapping);
       //Close the stream
       fileWriter.close();
       //Get non existing attributes
       output.NonExistingAttributes = BorderfreeJobsModel.getNonExistingAttributes();
       //Get wrong attributes types 
       output.WrongAttributesType = BorderfreeJobsModel.getWrongAttributesType();
       errorEmail.execute(output);
    } catch(e) {
        Util.log.error('{0} - {1}', e.message, e.stack);
        //Get wrong attributes types 
        output.WrongAttributesType = BorderfreeJobsModel.getWrongAttributesType();
        return new Status(Status.ERROR, 'ERROR', e);
    }
    return new Status(Status.OK, 'OK', '');
}

exports.execute = execute;
