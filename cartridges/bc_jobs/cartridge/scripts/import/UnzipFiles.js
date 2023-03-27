'use strict';
var ArrayList = require('dw/util/ArrayList'),
	File = require('dw/io/File'),
	Logger = require('dw/system/Logger'),
	Status = require('dw/system/Status');

const DELETE = 'DELETE',
     MAX_FILES_TO_ARCHIVE = 10000;


function getFilesFromDirectory(sourceFolder, filePattern) {
	var fileList = new ArrayList(),
		theDir = new File(File.IMPEX + File.SEPARATOR + sourceFolder),
        regExp = new RegExp(filePattern),
        filesCounter = 0;
	
    fileList.addAll(theDir.listFiles(function (file) {
        //prevent quota violation if too many files
        if (filesCounter > MAX_FILES_TO_ARCHIVE) {
            return false;
        }
        filesCounter++;

        if (!empty(filePattern)) {
            return regExp.test(file.name);
        }
        return true;
    }));
	     
	return fileList;
}

function unzipFiles(fileInfoList, targetFolder, deleteFile) {
	var targetDir = File.IMPEX + File.SEPARATOR + targetFolder,
		files = fileInfoList.iterator(),
		file;
	
	while (files.hasNext()){
		file = files.next();
    	//file.zip(new File(targetDir + File.SEPARATOR + file.name + ".zip"));
    	file.unzip(new File(targetDir + File.SEPARATOR));
    	if (deleteFile){
    		file.isDirectory() ? deleteDirectory(file) : file.remove();
    	}
	}
	
	return true;
}


function run(args) {
	var deleteFile = args.deleteFile === DELETE ? true : false,
		targetFolder = args.targetFolder || args.sourceFolder,
		fileList = getFilesFromDirectory(args.sourceFolder, args.filePattern);
	
	try{
			unzipFiles(fileList, targetFolder, deleteFile);
	}catch(e){
		Logger.error("UnzipFiles.js: Error unzipping files: {0}", e);
		return new Status(Status.ERROR,"ZIP_ERROR","File unzipping failed");
	}

	return new Status(Status.OK);
}

module.exports.execute = run;