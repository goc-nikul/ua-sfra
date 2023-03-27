'use strict';

/**
 * Provides a unified logging interface for the entire library.
 * @module int_s3/Logger.getLogger
 */
exports.getLogger = function () {
	return require('dw/system/Logger').getLogger('s3tc', 'S3TransferClient');
};
