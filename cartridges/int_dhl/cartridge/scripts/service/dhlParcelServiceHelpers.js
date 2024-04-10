'use strict';

const Logger = require('dw/system/Logger');
const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

const preferencesUtil = require('app_ua_core/cartridge/scripts/utils/PreferencesUtil');
const mockData = require('./mockHelper');

const DHLParcelAuthApi = LocalServiceRegistry.createService('int_dhl.parcel.rest.auth', {
    createRequest: function (svc) {
        const dhlParcelAPIUser = preferencesUtil.getValue('dhlParcelAPIUser');
        const dhlParcelAPIKey = preferencesUtil.getValue('dhlParcelAPIKey');
        svc.setRequestMethod('POST');
        svc.addHeader('Content-Type', 'application/json');
        const request = JSON.stringify({
            userId: dhlParcelAPIUser,
            key: dhlParcelAPIKey
        });
        return request;
    },
    parseResponse: function (svc, response) {
        // Check 2xx response status
        if (/2\d{2}$/g.test(response.statusCode)) {
            return JSON.parse(response.text);
        }
        Logger.getLogger('DHLParcel').error('DHLParcel: Response status code {0}, response text {1}', response.statusCode, response.text);
        return null;
    },
    mockCall: function () {
        return {
            statusCode: 200,
            statusMessage: 'Success',
            text: JSON.stringify(mockData.dhlAuthMock)
        };
    }
});

const DHLParcelLabelApi = LocalServiceRegistry.createService('int_dhl.parcel.rest.label', {
    createRequest: function (svc, { params, accessToken }) {
        svc.setRequestMethod('POST');
        svc.addHeader('Authorization', 'Bearer ' + accessToken);
        svc.addHeader('Content-Type', 'application/json');
        return JSON.stringify(params);
    },
    parseResponse: function (svc, response) {
        // Check 2xx response status
        if (/2\d{2}$/g.test(response.statusCode)) {
            return JSON.parse(response.text);
        }
        Logger.getLogger('DHLParcel').error('DHLParcel: Response status code {0}, response text {1}', response.statusCode, response.text);
        return null;
    },
    mockCall: function () {
        return {
            statusCode: 201,
            statusMessage: 'Success',
            text: JSON.stringify(mockData.dhlLabelMock)
        };
    }
});
const DHLParcelApiMgr = {
    call: function (params) {
        const AuthAPI = DHLParcelAuthApi;
        const LabelAPI = DHLParcelLabelApi;
        const authResponse = AuthAPI.call(params);
        if (!authResponse.ok) {
            Logger.getLogger('DHLParcel').error('DHLParcelAuth: Response statusCode "{0}" msg "{1}", response text "{2}"', authResponse.status, authResponse.msg, authResponse.errorMessage);
        }
        var labelResponse;
        if (authResponse.object && 'accessToken' in authResponse.object) {
            labelResponse = LabelAPI.call({ params: params, accessToken: authResponse.object.accessToken });
            if (!labelResponse.ok) {
                Logger.getLogger('DHLParcel').error('DHLParcelLabel: Response statusCode "{0}" msg "{1}", response text "{2}"', labelResponse.status, labelResponse.msg, labelResponse.errorMessage);
            }
        }
        return LabelAPI.getResponse();
    }
};
module.exports = DHLParcelApiMgr;
