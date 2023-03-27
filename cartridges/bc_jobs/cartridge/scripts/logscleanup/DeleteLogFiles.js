/*
 * copy logs file at impex location and  delete the log files at webdav log location through through job
 */

var Logger = require('dw/system/Logger');
var File = require('dw/io/File');
var Status = require('dw/system/Status');
var WebDAVClient = require('dw/net/WebDAVClient');
var Calendar = require('dw/util/Calendar');
var System = require('dw/system/System');

var StepUtil = require('bc_job_components/cartridge/scripts/util/StepUtil');

function execute  () {
    var args = arguments[0];

    if (StepUtil.isDisabled(args)) {
        return new Status(Status.OK, 'OK', 'Step disabled, skip it...');
    }
    var targetFolder = StepUtil.replacePathPlaceholders(args.TargetFolder);
    var filePattern = args.FilePattern;
    var noFilesFoundStatus = args.NoFileFoundStatus;
    var URLPath = args.urlPath;
    var useName = args.userName;
    var password = args.password;
    var daysToKeep = args.DaysToKeep;

    if (empty(URLPath) || empty(useName) || empty(password)) {
    	return new Status(Status.ERROR, 'ERROR', 'log files path or credentials parameters are missing');
    }   
    var oldCalendar = System.getCalendar();
    oldCalendar.add(Calendar.DAY_OF_YEAR, -1 * daysToKeep);
    oldCalendar.add(Calendar.MINUTE, -10);
    
    var targetDirectory = new File(targetFolder);
    
    if (targetDirectory.exists() && !targetDirectory.isDirectory()) {
        return new Status(Status.ERROR, 'ERROR', 'Target folder does not exist.');
    }   
    if (!targetDirectory.exists()) {
    	targetDirectory.mkdirs();
    }
    
    var webdavClientObj = new WebDAVClient(URLPath, useName, password);   
    try {
    	var files = webdavClientObj.propfind('/');
    	var IsLogFileDeleted = false;
    	if (!empty(files)) {   		
    		for each (var fileInfo  in files ) {
    			if (!fileInfo.directory) {
    				var fileName = fileInfo.name;
    				// check the file pattern
    				if (!empty(filePattern) && fileName.match(filePattern) !== null) {		        
    					var FileCreationDate = fileInfo.creationDate;
        				var fileCalendar = new Calendar(FileCreationDate);        				
                        if (fileCalendar.before(oldCalendar)) {                
            				// copy file to the impex location before deleting it.
                        	var TempfileName = fileInfo.path;
                        	TempfileName = fileInfo.name;
                        	var TempfileName = [targetDirectory.fullPath, TempfileName].join(File.SEPARATOR);
		                	var IsFileCopied = webdavClientObj.getBinary(fileInfo.name, new File(TempfileName));
            				// delete file from webdav location
		                	if (IsFileCopied) {
		                		var IsFileDeleted = webdavClientObj.del(fileName);             	
	                        	if (IsFileDeleted) {
	                        	   IsLogFileDeleted = true;
	                        	   Logger.info('file deleted : {1}',fileName);
	                        	} 
		                	}	 	
                        }
    			    }
    			}
    		}
    	}
    	if (!IsLogFileDeleted) {
            switch (noFilesFoundStatus) {
            case 'ERROR':
            	return new Status(Status.ERROR, 'ERROR', 'No files to delete.');
            default:
            	return new Status(Status.OK, 'NO_FILE_FOUND', 'No files to delete.');
           }
       }
       if (!webdavClientObj.succeeded()) {		
           return new Status( Status.ERROR, "DeleteLogFiles.js: Error while listing " + URLPath + ": " +
           webdavClientObj.statusCode + " " + webdavClientObj.statusText );
    	}
	} catch ( ex ) {		
    	return new Status( Status.ERROR, "DeleteLogFiles.js Error while listing : " + ex );
	} finally {
		webdavClientObj.close();
	}          
    return new Status(Status.OK);
};

module.exports.execute = execute;


