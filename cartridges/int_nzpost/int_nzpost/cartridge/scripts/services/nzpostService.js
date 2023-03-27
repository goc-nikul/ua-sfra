'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

/**
 * Fetches outh token service
 * @returns {Object} service object to fetch oAuth token
 */
function getOAuthTokenService() {
    return LocalServiceRegistry.createService('nzpost.http.token', {
        mockCall: function () {
            return {
                access_token: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IlRFU1QiLCJwaS5hdG0iOiIxIn0.eyJzY29wZSI6W10sImNsaWVudF9pZCI6IjYwZTVhYzA1NzNjNzQ4YjI4OWVkNjRmZGU5YmZkZGVmIiwiZXhwIjoxNjMwMDQ5NjA3fQ.SF7JRXHKuT-0M9F1sj9dMAD8QF3oOTpUUT2Ien-5d_A',
                token_type: 'Bearer',
                expires_in: 86399
            };
        },
        createRequest: function (svc) {
            var nzConfig = require('*/cartridge/config/nzConfig');
            svc.addParam('client_id', nzConfig.clientId);
            svc.addParam('client_secret', nzConfig.clientSecret);
            svc.addParam('grant_type', 'client_credentials');
        },
        parseResponse: function (svc, respone) {
            return respone;
        }
    });
}

/**
 * Forms a label service
 * @param {string} oAuthToken Auth token
 * @returns {Object} returns label service object
 */
function getParcelLabelService(oAuthToken) {
    return LocalServiceRegistry.createService('nzpost.http.label', {
        createRequest: function (svc, requestBody) {
            // Add Headers
            var nzConfig = require('*/cartridge/config/nzConfig');
            svc.addHeader('client_id', nzConfig.clientId);
            svc.addHeader('user_name', JSON.parse(nzConfig.nzpostConfigurations).username);
            svc.addHeader('Authorization', 'Bearer ' + oAuthToken);
            svc.addHeader('Content-Type', 'application/json');
            // Add request body if exists
            return requestBody ? JSON.stringify(requestBody) : null;
        },
        parseResponse: function (svc, respone) {
            return respone;
        }
    });
}

module.exports = {
    getOAuthTokenService: getOAuthTokenService,
    getParcelLabelService: getParcelLabelService
};
