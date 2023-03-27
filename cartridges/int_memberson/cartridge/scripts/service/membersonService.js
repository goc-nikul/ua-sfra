/* eslint-disable consistent-return */
'use strict';

// API includes
var Encoding = require('dw/crypto/Encoding');
var Bytes = require('dw/util/Bytes');

// Logger includes
var LOGGER = dw.system.Logger.getLogger('UAMemberson', 'UAMemberson');

// Helper Files
var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');

/**
 * Service for call the endPoint for the Memberson APIs
 * @returns {Object} return the response of the API
 */
function getMembersonAPI() {
    var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
    var membersonAPIUser = Encoding.toBase64(new Bytes(PreferencesUtil.getValue('membersonAPIUser')));
    var membersonAPIPassword = Encoding.toBase64(new Bytes(PreferencesUtil.getValue('membersonAPIPassword')));
    try {
        return LocalServiceRegistry.createService('memberson.http', {
            createRequest: function (svc, req) {
                svc.addHeader('SvcAuth', membersonAPIUser + ',' + membersonAPIPassword);
                svc.addHeader('Content-type', 'application/json');
                // Set Token into the header if it is available
                if (!empty(req.token)) {
                    svc.addHeader('Token', req.token);
                }
                // Set the URL
                var url = svc.configuration.credential.URL;
                if (!url.endsWith('/')) {
                    url += '/';
                }
                url += req.endpoint;
                svc.setURL(url);
                if (!empty(req.requestMethod)) {
                    svc.setRequestMethod(req.requestMethod);
                }
                if (!empty(req.requestBody)) {
                    return req.requestBody;
                }
            },
            parseResponse: function (service, response) {
                return response;
            }
        });
    } catch (e) {
        var msg = e.message;
        LOGGER.error('Error occurred within ua.memberson .service: {0}', msg);
    }
    return;
}
exports.getMembersonAPI = getMembersonAPI;
