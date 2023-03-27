'use strict';

/**
 * Pipevar for downloading order status feed from  SFTP
 * 
 * 
 */

/**
 * Require API dependencies
 */
const FTPClient = require('dw/net/FTPClient');
const SFTPClient = require('dw/net/SFTPClient');
const CSVStreamReader = require('dw/io/CSVStreamReader');
const FileReader = require('dw/io/FileReader');
const FileWriter = require('dw/io/FileWriter');
const Logger = require('dw/system/Logger');
const Calendar = require('dw/util/Calendar');
const File = require('dw/io/File');
const StringUtils = require('dw/util/StringUtils');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');


/* Require in dependencies */



function execute(args)
{
 
	// read parameters
	const Site = require('dw/system/Site');
	const Util = require('*/cartridge/scripts/utils/Util');

    var orderStatusFeedHost = Util.VALUE.ORDER_STATUS_FEED_SFTP_HOST;
    var orderStatusHostUser = Util.VALUE.ORDER_STATUS_FEED_SFTP_USER_NAME;
    var orderStatusHostPwd = Util.VALUE.ORDER_STATUS_FEED_SFTP_PASSWORD;
    var orderStatusFeedSrc = Util.VALUE.ORDER_STATUS_FEED_SRC_FOLDER;
    var siteId = Site.getCurrent().getID();
    var feedImportFolder = Util.VALUE.ORDER_STATUS_FILE_IMPORT_FOLDER;
    var orderStatusFileName = '';
    var sftpTimeout = Util.VALUE.SFTP_TIMEOUT;

    if ( empty( orderStatusFeedHost ) ) {
         Logger.error('emtpy host location');
        return PIPELET_ERROR;
    }

    if ( empty( orderStatusHostUser ) )  {
    	Logger.error( "Empty host user");
    	return PIPELET_ERROR;
    }

    if ( empty( orderStatusHostPwd ) ) {
    	Logger.error( "Empty host password");
    	return PIPELET_ERROR;
    }

    if (empty(sftpTimeout)) {
        sftpTimeout = 10000;
    }

    if ( empty( orderStatusFeedSrc ) ) {
    	Logger.error( "Empty src directory");
    	return PIPELET_ERROR;
    }
  
	// connect to remote and download file.
    var localfile;
    try {
        var sftpClientObject, result, localfile, isDownloaded;
        sftpClientObject = new dw.net.SFTPClient();
        sftpClientObject.setTimeout(sftpTimeout);

        result = sftpClientObject.connect(orderStatusFeedHost, orderStatusHostUser, orderStatusHostPwd);

        // traverse to destination folder
        if (!result) {
            Logger.error( "Error while connecting to host " + orderStatusFeedHost);
            return PIPELET_NEXT;
        }
        if (sftpClientObject.connected) {
                sftpClientObject.cd(orderStatusFeedSrc);
            } else{
                Logger.error( "Error while connecting to host " + orderStatusFeedHost);
                return PIPELET_NEXT;
            }

			var filePattern = "^.*\.csv$";
			
			// download file
			// local directory which contains order status files
			var downloadPath = File.IMPEX+feedImportFolder;
			var localDir = new File(downloadPath);
			
			// check if import directory exists if not create it.
			if (!localDir.exists()){
				if(!localDir.mkdirs()){
					sftpClient.disconnect();
					return PIPELET_ERROR;
				}
			}
			
			//copying process
	   	 	var copyResult = copyFilesToTarget(sftpClientObject, orderStatusFeedSrc, filePattern);
			
			// disconnect
			sftpClientObject.disconnect();
			
			for each ( var localFileObj in localDir.listFiles() ) {
				// now process downloaded file
				if(!localFileObj.isDirectory()) {
					var isProcessed = processFeed(localFileObj);
					
					if(isProcessed) {
						// archiveFile after processing it
						archiveFile(localFileObj);
					}
				}
    		}
	
    }catch (ex){
        Logger.error(ex.toString() + ' in ' + ex.fileName + ':' + ex.lineNumber);
        return PIPELET_ERROR;
    }
	
	return PIPELET_NEXT;
}

function getCurrentDateString() {
    // current date/time
    var calendar= new Calendar();
    // for data exchanges use GMT
    calendar.timeZone = "GMT";
    var dateString = StringUtils.formatCalendar(calendar, "MMddyyhhmmss");
    return dateString;
}

function processFeed(orderStatusFeed){
	
	try {
		var csvReader  = new CSVStreamReader(new FileReader(orderStatusFeed));
		var line, order, shipmentObj , items, item, key, i, j, orderId;
		var keys = [];
		var readKeys = false;
		var orderIdKey = 'orderId';
		var itemIdKey = 'itemId';
		var quantityKey = 'quantity';
		
		while (line = csvReader.readNext()){
			if(!readKeys){
				for(j=0;j<line.length;j++){
					keys.push(StringUtils.trim(line[j]));
				}
				readKeys = true;
			}else{
				// check if previous order Id matches with current order id , then keep reading otherwise update the order with data read so far
				shipmentObj = {};
				items = [];
				item = {};
				for(i=0;i<line.length;i++){
					 // if key is itemId or quantity accordingly push to item object
					 if(keys[i] === itemIdKey || keys[i] === quantityKey){
						 item[keys[i]] = StringUtils.trim(line[i]);
					 } else if(keys[i] === orderIdKey){
						 // load order if value belongs to order key
						 orderId = StringUtils.trim(line[i]);
						 order = OrderMgr.getOrder(orderId); //orderId
					 } else {
						 shipmentObj[keys[i]] = StringUtils.trim(line[i]);
					 }
				}
				//append item to shipment data
				items.push(item);
				shipmentObj["items"] = items;
				if(order != null){
					updateBfxShipmentData(order,shipmentObj);
				}else{
					Logger.error( "Invalid Order in feed "+orderId);
				}
			}
		}
		return true;
		
	}catch (ex){
		var err = ex;
		Logger.error( "Error while reading csv file "+ex);
		return false;
	}
	
}

/**
 *
 * @param {dw.order.Order} order
 * @param {Object} shipmentdata
 */
function updateBfxShipmentData(order, shipmentdata) {
     if(!empty(shipmentdata)) {
        Transaction.wrap(function () {
            var newBFNotification = dw.object.CustomObjectMgr.getCustomObject('BorderfreePendingShipmentNotifications', shipmentdata.parcelId);
            if(empty(newBFNotification)) {
                newBFNotification = dw.object.CustomObjectMgr.createCustomObject('BorderfreePendingShipmentNotifications', shipmentdata.parcelId);
                newBFNotification.custom.parcelID = shipmentdata.parcelId;
                newBFNotification.custom.orderID  = order.orderNo;
                newBFNotification.custom.bfxShipmentData = JSON.stringify(shipmentdata);
            } else {
                let additionalItemJSON = JSON.parse(newBFNotification.custom.bfxShipmentData);
                
                for each (let item in shipmentdata.items) {
                	additionalItemJSON.items.push(item);
                }
                
                newBFNotification.custom.bfxShipmentData = JSON.stringify(additionalItemJSON);
                
            }
            
         });
     }
}

function getdateTime()
{
	var stamp = "";	
	var calendar= new Calendar();
	calendar.timeZone = "GMT";
    stamp =  calendar.getTime();
	return stamp;
}

function archiveFile (orderShipmentFile){
	const Util = require('*/cartridge/scripts/utils/Util');
	var feedImportFolder = Util.VALUE.ORDER_STATUS_FILE_IMPORT_ARCHIVE_FOLDER;
	var archiveFile,archiveFileString;
	var archivePath = File.IMPEX+feedImportFolder;
	var localDir = new File(archivePath);
	// check if import directory exists if not create it.
	if (!localDir.exists()){
		if(!localDir.mkdirs()){
			return PIPELET_ERROR;
		}
	}

	archiveFileString = feedImportFolder + File.SEPARATOR + orderShipmentFile.name;
    
    archiveFile = new File(File.IMPEX + archiveFileString);
    
    orderShipmentFile.renameTo(archiveFile);
}

/**
*	Copy (and delete) files from a remote FTP-Folder locally
*	@param ftpClient 	: Object 	FTP Client used
*	@param sourceFolder : String 	source Folder
*	@param filePattern 	: String 	The pattern for the filenames
*	@param deleteFile 	: Boolean 	Flag if files should be deleted after successful copying 
*	
*	@returns Boolean If files were found at the specified location.
**/
function copyFilesToTarget( ftpClient : Object, sourceFolder : string, filePattern : string) : boolean
{
	var regExp : RegExp = new RegExp(filePattern);
	var fileInfoList : Array = ftpClient.list();
	var result : boolean = false;	
	
	if(fileInfoList != null && fileInfoList.length > 0)
	{
		for(var i : Number = 0; i < fileInfoList.length; i++)
		{
			var fileInfo : FTPFileInfo = fileInfoList[i];
			if(regExp.test(fileInfo.name))
			{
				copyFileToTargetFolder(ftpClient, fileInfo.name);
				result = true;
			}
		}
	}
	return result;
}

/**
*	Copy (and delete) a file from a remote FTP-Folder locally
*	@param ftpClient 	: Object 	FTP Client used
*	@param fileName 	: String 	The file to copy
*
**/
function copyFileToTargetFolder(ftpClient : Object, fileName : string)
{
	const Util = require('*/cartridge/scripts/utils/Util');
	var feedImportFolderLocation = Util.VALUE.ORDER_STATUS_FILE_IMPORT_FOLDER;
	
	var fullFilePath = File.IMPEX + feedImportFolderLocation + fileName;
    new File(File.IMPEX + feedImportFolderLocation).mkdirs();
    file = new File(fullFilePath);
    file.createNewFile();
    	
	ftpClient.getBinary(fileName, file);

	//delete file on SFTP
	ftpClient.del(fileName);
}

exports.execute = execute;
