'use strict';

const StringUtils = require('dw/util/StringUtils');
const Calendar = require('dw/util/Calendar');
const File = require('dw/io/File');
const Site = require('dw/system/Site');
const Status = require('dw/system/Status');
const Logger = require('dw/system/Logger').getLogger('Bazaarvoice', 'bvDownloadFeeds.js');

const BV_Constants = require('bc_bazaarvoice/cartridge/scripts/lib/libConstants').getConstants();
const BVHelper = require('bc_bazaarvoice/cartridge/scripts/lib/libBazaarvoice').getBazaarVoiceHelper();


function execute (parameters, stepExecution) {
	try {
		var serviceID = "bazaarvoice.sftp.import." + Site.current.ID;
        var fpath = BV_Constants.RatingsFeedPath;
		if(empty(fpath)){
			throw new Error('BV_Constants.RatingsFeedPath is null or empty! Verify the configuration in libConstants.ds');
		}

		var calendar = new Calendar(new Date())
		calendar.add(Calendar.DAY_OF_MONTH, -1);

		var fname = 'fileName' in parameters && parameters.fileName ?
					parameters.fileName :
					StringUtils.format('bv_underarmour_incremental_standard_client_feed_{0}.xml.gz', StringUtils.formatCalendar(calendar, 'yyyyMMdd'));

		if (!fname) {
			throw new Error( fname + ' is null or empty! Verify the configuration in libConstants.ds');
		}
		
		var ftpClient = require('~/cartridge/scripts/services/ServiceMgr').getFTPService(serviceID);
		var result = ftpClient.enterDirectory(fpath);
		
		if(!result.isOk()) {
			throw new Error('Error while accessing folder on BV FTP Server.');
		} 
		
		//make sure the directories have been made
		var tempPath = [File.TEMP, 'bv', 'ratings'].join(File.SEPARATOR);
		var tempFile = new File(tempPath);
		tempFile.mkdirs();
		
		//create the file for downloading
		tempPath = [File.TEMP, 'bv', 'ratings', fname].join(File.SEPARATOR);
		tempFile = new File(tempPath);
        var downloadResult = ftpClient.downloadFile(fpath + File.SEPARATOR + fname, tempFile);
		
        if(downloadResult !== undefined && downloadResult) {
        	//gunzip
        	tempPath = [File.TEMP, 'bv', 'ratings'].join(File.SEPARATOR);
        	tempFile.gunzip(new File(tempPath));
        	
        	var fnameRenamed = fname.replace('.gz', '');
        	//need to rename the file after gunzip to remove the .gz 
        	tempPath = [File.TEMP, 'bv', 'ratings', fnameRenamed].join(File.SEPARATOR);
        	tempFile = new File(tempPath);
        	
        	if(!tempFile.exists()) {
        		throw new Error('GUNZIP of ' + fname + ' was unsuccessful. File does not exist.');
        	}
        } else {
        	Logger.info('Download failed: ' + result.msg);
    		return new Status(Status.ERROR, 'ERROR', result.msg);
        }
	} catch(e) {
		Logger.error('Exception caught: ' + e.message);
		return new Status(Status.ERROR, 'ERROR', e.message);
	}
	
	return new Status(Status.OK);
}

exports.execute = execute;
