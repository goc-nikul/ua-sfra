'use strict';

/**
 * Pipelet for creation of kits feed
 * 
 * @output errorMessage : String
 */

/**
 * Require API dependencies
 */
const FileWriter = require('dw/io/FileWriter');
const ArrayList = require('dw/util/ArrayList');
var Status = require('dw/system/Status');

/* Require in dependencies */


function execute(args) {
    const Util = require('*/cartridge/scripts/utils/Util');
    const BorderfreeJobsModel = require('*/cartridge/scripts/models/BorderfreeJobs');
    var output = {};
    let file, fileWriter, headers;
    try {
       headers = Util.KIT_FEED_HEADERS;
       file = BorderfreeJobsModel.createFeedFile('kits');
       /* Create an output stream */
       fileWriter = new FileWriter(file, 'UTF-8');
       // add headers to file
       BorderfreeJobsModel.addHeadersToFeed(fileWriter, headers);
       // write kits info to file
       BorderfreeJobsModel.writeKitsFeedData(fileWriter);
       fileWriter.close();
    } catch(e) {
        output.errorMessage = 'Kits feed job failed due to Error:'+e.message;
        Util.log.error('{0} - {1}', e.message, e.stack);
        return new Status(Status.ERROR, 'ERROR', e);
    }
    return new Status(Status.OK, 'OK', '');
}

exports.execute = execute;
