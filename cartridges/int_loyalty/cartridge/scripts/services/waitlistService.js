/**
 * SFMC Join waitlist for loyalty enrollment
 */
'use strict';

const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const LoggerHelper = require('*/cartridge/scripts/util/loggerHelper');

/**
 * Service obtaining SFMC token
 * @return {dw.svc.LocalServiceRegistry} - service marketingcloud.loyalty.auth
 */
function getToken() {
    return LocalServiceRegistry.createService('marketingcloud.loyalty.auth', {
        createRequest: function (svc) {
            svc.setRequestMethod('POST');
            svc.setAuthentication('NONE');
            svc.addHeader('Content-Type', 'application/json');

            const clientId = svc.getConfiguration().getCredential().getUser();
            const clientSecret = svc.getConfiguration().getCredential().getPassword();
            const waitlistAccountID = require('dw/system/Site').getCurrent().getCustomPreferenceValue('waitlistAccountID');

            const payloadObj = {
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret,
                account_id: waitlistAccountID
            };

            return JSON.stringify(payloadObj);
        },
        parseResponse: function (svc, response) {
            return response;
        },
        mockCall: function () {
            return {}; // TODO
        },
        filterLogMessage: function (logMsg) {
            return !empty(logMsg) ? LoggerHelper.maskSensitiveInfo(logMsg) : logMsg;
        }
    });
}

/**
 * Service adding customer mail to loyalty waitlist SFMC
 * @param {Object} params - service payload
 * @return {dw.svc.LocalServiceRegistry} - service 'marketingcloud.loyalty
 */
function setEvent(params) {
    return LocalServiceRegistry.createService('marketingcloud.loyalty', {
        createRequest: function (svc) {
            const bearer = 'Bearer ' + params.token;
            svc.setRequestMethod('POST');
            svc.setAuthentication('NONE');
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('Authorization', bearer);

            const payloadObject = {
                ContactKey: params.email,
                EventDefinitionKey: 'Enrollment_2_1_Waitlist',
                Data: {
                    email: params.email,
                    zipcode: params.zip,
                    channel: 'web',
                    subchannel: 'desktop',
                    createDate: new Date()
                }
            };

            return JSON.stringify(payloadObject);
        },
        parseResponse: function (svc, response) {
            return response;
        },
        mockCall: function () {
            return {}; // TODO
        },
        filterLogMessage: function (logMsg) {
            return !empty(logMsg) ? LoggerHelper.maskSensitiveInfo(logMsg) : logMsg;
        }
    });
}

module.exports = {
    getToken: getToken,
    setEvent: setEvent
};
