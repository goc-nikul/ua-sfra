'use strict';

/**
 * Accertify service script, used to perform request to the Accertify and handle its response.
 */

/* API Includes */
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');
var Log = Logger.getLogger('int.accertify');

var COHelpers = require('app_ua_core/cartridge/scripts/checkout/checkoutHelpers');

/* eslint-disable consistent-return */
/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */

/**
 * Makes a call to Accertify service API
 * @param {dw.order.Order} order - Current order
 * @returns {Object} args - Service response
 */
function accertifyCall(order) {
    var args = {};

    Transaction.wrap(function () {
        var serviceResult = {};
        try {
            var service = require('int_accertify/cartridge/scripts/init/AccertifyService');
            serviceResult = service.call(order);

            if (serviceResult.status !== 'OK') {
                Log.error('Error: {0} : {1}', serviceResult.status, serviceResult.errorMessage);
                order.custom.accertifyRecCode = 'Error';

                if (serviceResult.status === 'ERROR' || serviceResult.status === 'SERVICE_UNAVAILABLE') {
                    args = 'SERVER_UNAVAILABLE';
                    return args;
                }
                return {};
            }

            args = service.getResponse();
        } catch (e) {
            Log.error('Error: {0}', e.message);
            return {};
        }
    });

    return args;
}

/**
 * Extract Accertify resolution code from the order
 * @param {dw.order.Order} order - Current order
 * @returns {string} - Accertify resolution code
 */
function _getAccertifyRecCodeFromOrder(order) {
    return ('accertifyRecCode' in order.custom) && order.custom.accertifyRecCode;
}

/**
 * Returns mapped Accertify resolution code
 * @param {string} accertifyRecCode - Code
 * @returns {string} - Accertify resolution code
 */
function _correctionAccertifyRecCode(accertifyRecCode) {
    return Resource.msg('accertify.accertifyRecCode.' + accertifyRecCode.toLowerCase(), 'accertify', null);
}

/**
 * Provide Accertify resolution code
 * @param {dw.order.Order} order - Current order
 * @returns {string} - Accertify resolution code
 */
function _getCode(order) {
    var accertifyRecCode = _getAccertifyRecCodeFromOrder(order);

    return accertifyRecCode ? _correctionAccertifyRecCode(accertifyRecCode) : null;
}

/**
 * Save notification in the Order
 * @param {dw.order.Order} order - Current order
 * @returns {string} - Accertify resolution code
 */
function getNotification(order) {
    var accertifyRecCode = _getCode(order);

    if (empty(accertifyRecCode)) {
        var accertifyNotification = accertifyCall(order);

        if (accertifyNotification === 'SERVER_UNAVAILABLE') {
            return accertifyNotification;
        }

        if (Object.keys(accertifyNotification).length) {
            var AccertifyOrderHelper = require('int_accertify/cartridge/scripts/util/AccertifyOrderHelper');
            var accertifyOrderHelper = new AccertifyOrderHelper();

            accertifyOrderHelper.addNotificationData(order, accertifyNotification);
            accertifyRecCode = _getCode(order);

            if (accertifyRecCode === 'review') {
                COHelpers.handleHoldStatus(order, true);
            }
        }
    }

    return accertifyRecCode;
}

module.exports = {
    getNotification: getNotification,
    accertifyCall: accertifyCall
};
