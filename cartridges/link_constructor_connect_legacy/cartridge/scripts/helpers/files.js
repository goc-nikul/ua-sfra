var moduleName = 'files.js';

var File = require('dw/io/File');

/**
 * Returns the full file path for a given key and identifier.
 * @param {string} rootPath The root path to use.
 * @param {'products' | 'inventories' | 'categories' | 'category_sections' | 'facet_metadata'} key The file key. Identifies which records are being sent.
 * @returns The full file path.
 */
function getFilePath(rootPath, key) {
  // Generate a random identifier. This is used as a suffix to ensure that the files are unique.
  var identifier = Math.random().toString(36).substring(2);

  return File.IMPEX + rootPath + key + '_' + identifier + '.xml';
}

/**
 * Moves a file to a new location.
 * @param {*} filePath The current file path.
 * @param {*} newPath The new file path.
 */
function moveFile(filePath, newPath) {
  new File(filePath).renameTo(newPath);
}

/**
 * Ensures that a given folder exists.
 * @param {*} file The file to check.
 */
function ensureDirectoryExists(file) {
  if (!file.exists()) {
    file.mkdirs();
  }
}

/**
 * Checks if the Constructor folder exists, and creates it if it doesn't.
 * Returns false if the folder doesn't exist and couldn't be created.
 * @param {string} path The folder path.
 * @returns {boolean} True if the folder exists, false otherwise.
 */
function ensureConstructorFolderExists(path) {
  var folder = null;

  try {
    folder = new File(File.IMPEX + path);
    ensureDirectoryExists(folder);

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Removes a transient file.
 * @param {string} path The file path
 * @returns False if the file could not be deleted. True otherwise.
 */
function deleteFile(path) {
  var logger = require('./logger');
  var file = null;

  try {
    file = new File(path);

    if (file.exists()) {
      file.remove();
    }

    return true;
  } catch (error) {
    logger.log(moduleName, 'error', 'Unable to clear file: ' + path);
    logger.log(moduleName, 'error', error);

    return false;
  }
}

/**
 * Handles the action to be executed after sending deltas to Constructor.
 *
 * Depending on how the job is configured (via parameters), files can:
 *
 * - [default] ARCHIVE: Be archived (renamed with date and time, and moved to the archive folder).
 * - KEEP: Be kept in the same directory with no changes.
 * - DELETE: Be deleted.
 *
 * In case the job fails, the file is moved to the error folder.
 *
 * @param {object} parameters The job parameters.
 * @param {string} rootPath The root path to use.
 * @param {string} filePath The current file path.
 * @param {boolean} success True if the job succeeded, false otherwise.
 */
function handleFileActionAfterSendingDeltas(parameters, rootPath, filePath, success) {
  var archiveFileDirectory;
  var errorFileDirectory;
  var newFilePath;

  var rootFolderName = File.IMPEX + rootPath;
  var fileName = filePath.replace(rootFolderName, '');

  // Error scenario: move file to error folder
  if (!success) {
    newFilePath = new File(File.IMPEX + parameters.ErrorPath + '/' + fileName);
    errorFileDirectory = new File(File.IMPEX + parameters.ErrorPath);
    ensureDirectoryExists(errorFileDirectory);
    moveFile(filePath, newFilePath);
    return;
  }

  // Success scenario: keep file
  if (parameters.FileAction === 'KEEP') {
    return;
  }

  // Success scenario: delete file
  if (parameters.FileAction === 'DELETE') {
    deleteFile(filePath);
    return;
  }

  // Success scenario: archive file
  newFilePath = new File(File.IMPEX + parameters.ArchivePath + '/' + fileName);
  archiveFileDirectory = new File(File.IMPEX + parameters.ArchivePath);
  ensureDirectoryExists(archiveFileDirectory);
  moveFile(filePath, newFilePath);
}

module.exports = {
  handleFileActionAfterSendingDeltas: handleFileActionAfterSendingDeltas,
  ensureConstructorFolderExists: ensureConstructorFolderExists,
  getFilePath: getFilePath
};
