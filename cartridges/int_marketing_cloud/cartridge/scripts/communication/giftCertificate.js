'use strict';

/**
 * @module communication/giftCertificate
 */

const addDataExtensions = require('./util/send').addDataExtensions;
const hookPath = 'app.communication.giftCertificate.';

/**
 * Trigger a gift certificate notification
 * @param {SynchronousPromise} promise
 * @param {module:communication/util/trigger~CustomerNotification} data
 * @returns {SynchronousPromise}
 */
function sendCertificate(promise, data) {
	var Logger = require('dw/system/Logger');
	try {
		data.localeData = data.params.Order.custom.customerLocale.split('_');
		return addDataExtensions(hookPath + 'sendCertificate', promise, data);
	} catch(ex) {
		Logger.error('Failed to send order confimation email for the order {0} and the error is {1}', data.params.Order.orderNo, ex.message);
	}
}

module.exports = require('dw/system/HookMgr').callHook(
    'app.communication.handler.initialize',
    'initialize',
    require('./handler').handlerID,
    'app.communication.giftCertificate',
    {
        sendCertificate: sendCertificate
    }
);
