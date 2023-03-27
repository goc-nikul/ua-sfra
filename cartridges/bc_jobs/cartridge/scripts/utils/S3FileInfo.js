'use strict';

/**
 * S3FileInfo class provides an interface for reading & writing information about an object reference on the S3 service.
 * @class
 */
function S3FileInfo () {
	/**
	 * @type {Boolean}
	 */
	this.directory = null;
	/**
	 * @type {String}
	 */
	this.name = "";
	/**
	 * @type {String}
	 */
	this.standardizedFilename = "";
	/**
	 * @type {Number}
	 */
	this.size = null;
	/**
	 * @type {Date}
	 */
	this.timestamp = null;
}

/**
 * Retreives the directory
 * @returns {Boolean}
 */
S3FileInfo.prototype.getDirectory = function () {
	return this.directory;
};

/**
 * Retreives the name
 * @returns {String}
 */
S3FileInfo.prototype.getName = function () {
	return this.name;
};

/**
 * Retreives the standardizedFilename
 * @returns {String}
 */
S3FileInfo.prototype.getStandardizedFilename = function () {
	return this.standardizedFilename;
};

/**
 * Retreives the size
 * @returns {Number}
 */
S3FileInfo.prototype.getSize = function () {
	return this.size;
};

/**
 * Retreives the timestamp
 * @returns {Date}
 */
S3FileInfo.prototype.getTimestamp = function () {
	return this.timestamp;
};

/**
 * Sets the directory attribute
 * @param {Boolean} isDirectory
 */
S3FileInfo.prototype.setDirectory = function (isDirectory) {
	this.directory = isDirectory;
};

/**
 * Sets the name
 * @param {String} name
 */
S3FileInfo.prototype.setName = function (name) {
	this.name = name;
};

/**
 * Sets the standardizedFilename
 * @param {String} name
 * @param {String} delimiter
 */
S3FileInfo.prototype.setStandardizedFilename = function (name, delimiter) {
	var standardizedFilename = name.split(delimiter);
	standardizedFilename = standardizedFilename[standardizedFilename.length-1];

	this.standardizedFilename = standardizedFilename;
};

/**
 * Sets the size
 * @param {Number} size
 */
S3FileInfo.prototype.setSize = function (size) {
	this.size = size;
};

/**
 * Sets the timestamp
 * @param {Date} date
 */
S3FileInfo.prototype.setTimestamp = function (date) {
	this.timestamp = date;
};

/** @module int_s3/S3FileInfo */
module.exports = S3FileInfo;