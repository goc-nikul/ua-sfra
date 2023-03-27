'use strict';

/* API Includes */
var Logger = require('dw/system/Logger').getLogger('UA-NaverSSO');

// Helpers
var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
var service;

/**
 * Function to get service for naver SSO
 * @param {Object} parameterObj - Object of querystring
 * @returns {Object} = Return service object
 */
function getNaverssoService(parameterObj) {
    var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

    try {
        service = LocalServiceRegistry.createService('naversso.http.token', {
            createRequest: function (svc, req) {
                svc.addHeader('Content-type', 'application/json');
                svc.setRequestMethod('GET');
                var naverSSOClientID = PreferencesUtil.getValue('naverSSOClientID');
                var naverSSOClientSecret = PreferencesUtil.getValue('naverSSOClientSecret');

                if (!empty(naverSSOClientID) && !empty(naverSSOClientSecret)) {
                    var svcCredentials = svc.getConfiguration().getCredential();
                    var url = svcCredentials.URL;
                    url += '?client_id=' + naverSSOClientID
                            + '&client_secret=' + naverSSOClientSecret
                            + '&grant_type=authorization_code'
                            + '&state=' + parameterObj.state
                            + '&code=' + parameterObj.code;
                    svc.setURL(url);
                } else {
                    throw new Error('Naver SSO ClientID and ClientSecret is not configured');
                }

                return req;
            },
            parseResponse: function (svc, response) {
                return response;
            }
        });
    } catch (e) {
        Logger.error('Error occurred within naversso.http.token.service:', e.message);
    }
    return service;
}

/**
 * Function to get service for naver SSO User Info
 * @param {Object} authToken - auth token for getting user info
 * @returns {Object} = Return service object
 */
function getNaverUserInfoService(authToken) {
    var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
    try {
        service = LocalServiceRegistry.createService('naversso.http.userinfo', {
            createRequest: function (svc, req) {
                svc.addHeader('Content-type', 'application/json');
                svc.setRequestMethod('GET');
                svc.addHeader('Authorization', 'Bearer ' + authToken);
                return req;
            },
            parseResponse: function (svc, response) {
                return response;
            }
        });
    } catch (e) {
        Logger.error('Error occurred within naversso.http.token.service:', e.message);
    }
    return service;
}

// Function to get the access Token from the naver
exports.getNaverSSOToken = function (qstringObj) {
    var naverSSOAccessToken = null;
    if (!empty(qstringObj)) {
        var naverSSOTokenService = getNaverssoService(qstringObj);
        // call Payment Cancelation API
        var naverSSOAccessTokenServiceResponse = naverSSOTokenService.call();
        if (naverSSOAccessTokenServiceResponse.status === 'OK') {
            var responseObject = naverSSOAccessTokenServiceResponse.object;
            var responseTextObject = JSON.parse(responseObject.getText());
            naverSSOAccessToken = responseTextObject.access_token;
        } else {
            Logger.error('NaverSSOToken: get AccessToken Failed');
            return naverSSOAccessToken;
        }
    }
    return naverSSOAccessToken;
};

// Function to get naver user info
exports.getNaverUserInfo = function (authToken) {
    var naverUserInfo = null;
    if (!empty(authToken)) {
        var naverUserInfoService = getNaverUserInfoService(authToken);
        // call Payment Cancelation API
        var naverUserInfoServiceResponse = naverUserInfoService.call();
        if (naverUserInfoServiceResponse.status === 'OK') {
            var responseObject = naverUserInfoServiceResponse.object;
            var responseTextObject = JSON.parse(responseObject.getText());
            naverUserInfo = responseTextObject.response;
        } else {
            Logger.error('NaverUserInfo: get user info Failed');
            return naverUserInfo;
        }
    }
    return naverUserInfo;
};
