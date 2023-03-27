'use strict';

/**
 * Controller that handles the Accertify functionality
 *
 * @module controllers/Accertify
 */

/* SFRA modules */
var server = require('server');

/* API includes */
var Logger = require('dw/system/Logger');
var Log = Logger.getLogger('int.accertify');

/* eslint-disable no-undef */

/**
 * Endpoint which used to save Fraud Analyst resolution response message in custom object "AccertifyNotify"
 */
server.post('Notify', function (req, res, next) {
    const StringUtils = require('dw/util/StringUtils');
    const Site = require('dw/system/Site');
    try {
        var responseMessage = req.body;
        const isAuthEnabled = Site.getCurrent().getCustomPreferenceValue('accertifyNotifyIsAuthEnabled');
        if (isAuthEnabled) {
            const userName = Site.getCurrent().getCustomPreferenceValue('accertifyNotifyUser');
            const password = Site.getCurrent().getCustomPreferenceValue('accertifyNotifyPassword');
            const authType = 'Basic';
            var authorization = req.httpHeaders.get('x-is-authorization');
            var authString = authType + ' ' + StringUtils.encodeBase64(userName + ':' + password);
            // Security Check | Basic Authorization
            if (!authString.equals(authorization)) {
                res.setStatusCode(401);
                res.json({
                    error: 'Error Code : 401 | Access Denied',
                    message: 'Invalid User Name Or Password'
                });
                return next();
            }
        }
        if (!empty(responseMessage)) {
            var AccertifyOrderHelper = require('int_accertify/cartridge/scripts/util/AccertifyOrderHelper');
            var accertifyOrderHelper = new AccertifyOrderHelper();
            var accertifyNotification = accertifyOrderHelper.parseAccertifyNotification(responseMessage);
            if (('accertifyTransactionID' in accertifyNotification) && !empty(accertifyNotification.accertifyTransactionID)) {
                accertifyOrderHelper.createCustomObject(accertifyNotification);
                res.json({
                    accepted: 'accepted'
                });
            } else {
                res.setStatusCode(400);
                Log.error('Invalid data');
                res.json({
                    error: true,
                    message: 'Invalid data'
                });
            }
        } else {
            Log.error('Empty request body.');
            res.setStatusCode(400);
            res.json({
                error: true,
                message: 'Empty request body.'
            });
        }
    } catch (e) {
        Log.error('Something went wrong! | Error :: {0}', e.message);
        res.setStatusCode(500);
        res.json({
            error: true,
            message: 'Something went wrong!'
        });
    }
    return next();
});

module.exports = server.exports();
