'use strict';

const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

/**
 * Get token service
 * @returns {Object} returns service object
 */
function getTokenService() {
    return LocalServiceRegistry.createService('int_legendsoft', {
        createRequest: function (svc) {
            var credentials = svc.getConfiguration().getCredential();
            svc.setRequestMethod('POST');
            svc.addHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            svc.setURL(credentials.getURL() + '/Token');
            var params = [];
            params.push('username=' + credentials.getUser());
            params.push('grant_type=password');
            params.push('password=' + credentials.getPassword());
            return params.join('&');
        },
        parseResponse: function (svc, response) {
            return response.getText();
        }
    });
}

/**
 * Get postal code service
 * @returns {Object} returns postal code service
 */
function getPostalCodeService() {
    return LocalServiceRegistry.createService('int_legendsoft', {
        createRequest: function (svc, params) {
            svc.setRequestMethod('GET');
            svc.addHeader('Authorization', 'Bearer ' + params.token);
            svc.setURL(svc.configuration.credential.URL + '/api/TownShip/GetAll/' + params.postalCode);
        },
        parseResponse: function (svc, response) {
            return response.getText();
        }
    });
}

module.exports = {
    tokenService: getTokenService,
    postalCodeService: getPostalCodeService
};
