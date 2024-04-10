'use strict';

/**
 * run the function addBackInStockDataEvent
 * @param data this is the data sent to the notifyMe service * 
 * @returns {Object} returns the status of the service
 */
function addBackInStockDataEvent(data) {
    /**
     * @type {dw.svc.Service}
     */
    var msgSvc = require('int_marketing_cloud').restService('dataEvents');
    var notifyMeKey = require('dw/system/Site').current.getCustomPreferenceValue('dataEventsKey');
    var result = msgSvc.call(notifyMeKey, data);

    if (!result || !result.ok && result.errorMessage) {
        throw new Error(result.errorMessage);
    }

    var obj = {
        status: result.ok ? 'OK' : 'ERROR'
    };

    return obj;
}


// non-hook exports
module.exports.addBackInStockDataEvent = addBackInStockDataEvent;
