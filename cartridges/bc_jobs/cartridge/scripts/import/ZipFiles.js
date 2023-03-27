'use strict';
var ArrayList = require('dw/util/ArrayList'),
	File = require('dw/io/File'),
	Site = require('dw/system/Site'),
	StringUtils = require('dw/util/StringUtils'),
	System = require('dw/system/System'),
	Logger = require('dw/system/Logger'),
	Status = require('dw/system/Status');

const DELETE = 'DELETE',
	 KEEP_ON_SERVER = 'KEEP_ON_SERVER',
	 SINGLE_ARCHIVE_FILE = 'SINGLE_ARCHIVE_FILE',
	 MULTIPLE_ARCHIVE_FILES = 'MULTIPLE_ARCHIVE_FILES',
	 tempFolderPrefix = 'tempFolder_',
     MAX_FILES_TO_ARCHIVE = 19000;


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

function clearTemp() {
	var tempFolder = new File(File.TEMP + File.SEPARATOR),
		emptyTempFolderName = new RegExp("^"+ tempFolderPrefix + ".*$"),
		fileList = getFilesFromDirectory(tempFolder, emptyTempFolderName).iterator(),
		file;

	while (fileList.hasNext()) {
		file = fileList.next();
		if (file.isDirectory() && file.getName().indexOf(emptyTempFolderName) !== -1) {
			file.remove();
		}
	}
}

function deleteDirectory(file) {
	if (!file.isDirectory()) {
		return false;
	}

	var fileNames = file.list(),
		result;

	for each (var fileName in fileNames) {
		var filePath = file.getFullPath() + File.SEPARATOR + fileName,
			processedFile = new File(filePath);

		if (processedFile.isDirectory()) {
			deleteDirectory(processedFile);
		} else {
			processedFile.remove();
		}
	}

	result = file.remove();
	return result;
}

function findFileDirectory (file){
	var filePath = file.getFullPath(),
		lastSlashIndex = filePath.lastIndexOf('/'),
		directoryPath  = filePath.substring(0, lastSlashIndex),
		directory = new File(directoryPath);
	
	return directory;
}

function copyFile(sourceString, targetString) {
	var source = new File(sourceString),
		target = new File(targetString),
		targetPath = '',
		targetFolder = '',
		sourceFile,
		targetZipFileName,
		targetZipped,
		targetDirectory;

	if (!source.isDirectory() && !target.isDirectory()) {
		targetPath = target.fullPath.split(File.SEPARATOR);
		targetPath.pop();
		targetFolder = targetPath.join(File.SEPARATOR);
		(new File(targetFolder)).mkdirs();
		source.copyTo(target);
	} else {
		target.mkdirs();
		sourceFile = source;

		targetZipFileName = target.fullPath + ".zip";
		targetZipped = new File(targetZipFileName);
		sourceFile.zip(targetZipped);

		targetDirectory = findFileDirectory(targetZipped);

		targetZipped.unzip(targetDirectory);
		targetZipped.remove();
	}
}

function zipFiles(fileInfoList, targetFolder, deleteFile) {
	var targetDir = File.IMPEX + File.SEPARATOR + targetFolder,
		files = fileInfoList.iterator(),
		file;
	
	while (files.hasNext()){
		file = files.next();
    	file.zip(new File(targetDir + File.SEPARATOR + file.name + ".zip"));
    	if (deleteFile){
    		file.isDirectory() ? deleteDirectory(file) : file.remove();
    	}
	}
	
	return true;
}

function zipFilesSingleArchive(fileList, targetFolder, deleteFile) {

	var archiveFolderRelative = targetFolder,
		archiveFolder = new File(File.IMPEX + File.SEPARATOR + archiveFolderRelative + File.SEPARATOR),
		filesToArchive = fileList && fileList.iterator(),
		fileArchiveDestination = null,
		zipFile = null,
		tempfolderName = Site.getCurrent().ID  + "_" + StringUtils.formatCalendar(System.getCalendar(), "yyyyMMddHHmmssSSS"),
		resultTmpDel;
	
	if (!archiveFolder.exists()) {
		archiveFolder.mkdirs();
	}

	var tempFolder = new File(File.TEMP + File.SEPARATOR + tempFolderPrefix + tempfolderName + File.SEPARATOR);
	
	if (!tempFolder.exists()) {
		tempFolder.mkdirs();
	}
	const filesToLog = [];
	
    if (filesToArchive.hasNext()) {
        while (filesToArchive.hasNext()) {
            let fileToArchive = filesToArchive.next();
            fileArchiveDestination = new File(tempFolder.getFullPath() + fileToArchive.name);
            if (deleteFile) {
                if (fileToArchive.isDirectory()) {
                    copyFile(fileToArchive.getFullPath(), fileArchiveDestination.getFullPath());
                    deleteDirectory(fileToArchive);
                } else {
                    fileToArchive.renameTo(fileArchiveDestination)
                }
            } else {
                copyFile(fileToArchive.getFullPath(), fileArchiveDestination.getFullPath());
            }
			//log archive path
			filesToLog.push(fileToArchive.name);
        }

        zipFile = new File(archiveFolder.fullPath + tempfolderName + ".zip");
        tempFolder.zip(zipFile);
		Logger.info("ZipFiles.js: Archive: {0}", archiveFolder.fullPath + tempfolderName + ".zip");

    }
	resultTmpDel = deleteDirectory(tempFolder);
	//log the count of files to be archived as well as the file names 
	Logger.info("ZipFiles.js: Total files to archive: {0}", filesToLog.length);
	if (!resultTmpDel) {
		Logger.error("ZipFiles.js: Can't delete temp directory, pattern includes system files: {0}", tempFolder.getFullPath());
	}
}

function run(args) {
	var deleteFile = args.deleteFile === DELETE ? true : false,
		targetFolder = args.targetFolder || args.sourceFolder,
		fileList = args.fileList ? args.fileList : getFilesFromDirectory(args.sourceFolder, args.filePattern),
		singleFile = args.singleFile === SINGLE_ARCHIVE_FILE ? true : false;

	clearTemp();
	
	try{
		if(singleFile) {
			zipFilesSingleArchive(fileList, targetFolder, deleteFile);
		} else {
			zipFiles(fileList, targetFolder, deleteFile);
		}
				
	}catch(e){
		Logger.error("ZipFiles.js: Error zipping files: {0}", e);
		return new Status(Status.ERROR,"ZIP_ERROR","File zipping failed");
	}

	return new Status(Status.OK);
}

module.exports.execute = run;