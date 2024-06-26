'use strict';

const File = require('dw/io/File');
const Site = require('dw/system/Site');
const Status = require('dw/system/Status');
const Logger = require('dw/system/Logger').getLogger('Bazaarvoice', 'bvUploadFeed.js');

const BV_Constants = require('bc_bazaarvoice/cartridge/scripts/lib/libConstants').getConstants();
const BVHelper = require('bc_bazaarvoice/cartridge/scripts/lib/libBazaarvoice').getBazaarVoiceHelper();

function execute(parameters, stepExecution) {
	var enabled = parameters.Enabled;
	if(!enabled) {
		Logger.info('Upload step is not enabled, skipping....');
		return;
	}
		
	try {
		var type = parameters.FeedType;
		var pattern, remotePath, localPath;
		
		switch(type) {
			case 'Purchase':
				pattern = BV_Constants.PurchaseFeedPrefix + '_' + Site.current.ID;
				remotePath = BV_Constants.PurchaseFeedPath;
				localPath = BV_Constants.PurchaseFeedLocalPath;
				break;
				
			case 'Product':
			default:
				pattern = BV_Constants.ProductFeedPrefix + '_' + Site.current.ID;
				remotePath = BV_Constants.ProductFeedPath;
				localPath = BV_Constants.ProductFeedLocalPath;
				break;
		}
				
		var fileregex = new RegExp('^' + pattern + '_\\d{14}\\.xml$');
		var localPathFile = new File([File.TEMP, localPath].join(File.SEPARATOR));
		var localFiles = localPathFile.listFiles(function(f) {
			return fileregex.test(f.name);
		});

		var serviceID = "bazaarvoice.sftp.export." + Site.current.ID;

		var ftpClient = require('~/cartridge/scripts/services/ServiceMgr').getFTPService(serviceID);
		var result = ftpClient.enterDirectory(remotePath);
		
    	if(!result.isOk()) {
    		Logger.error('Problem testing sftp server. path: {0}, result: {1}', remotePath, result.msg);
            return new Status(Status.ERROR);
    	}
    	
    	result = ftpClient.listRemoteFiles(remotePath, fileregex);
		
    	if (!empty(result)) {
		    for(var i = 0; i < result.length; i++) {
			    var f = result[i];
        	    if (fileregex.test(f) === true) {
        	    	var removeResult = ftpClient.removeRemoteFile(remotePath + '/' + f);
        		    if(!removeResult.isOk()) {
        			    Logger.error('Problem deleting existing file: ' + result.msg);
        		    }
        	    }
            }
	    }
        
        for(var i = 0; i < localFiles.length; i++) {
        	var file = localFiles[i];
        	result = ftpClient.uploadFile(remotePath + '/', file);
            if(!result.isOk()) {
            	Logger.error('Problem uploading file: ' + result.msg);
            	return new Status(Status.ERROR);
            } else {
            	file.remove();
            }
        }
        
	}
	catch(ex) {
		Logger.error('Exception caught during product feed upload: {0}', ex.message);
        return new Status(Status.ERROR);
	}
	finally {
		
	}
	
	return new Status(Status.OK);
}

module.exports.execute = execute;