'use strict';

const Logger = require('dw/system/Logger');
const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

const preferencesUtil = require('app_ua_core/cartridge/scripts/utils/PreferencesUtil');
const mockData = require('./mockHelper');

const FedexAuthApi = LocalServiceRegistry.createService('int_fedex_rest.shipment.rest.auth', {
    createRequest: function (svc) {
        const fedexAPIUser = preferencesUtil.getValue('fedexAPIUser');
        const fedexAPIKey = preferencesUtil.getValue('fedexAPIKey');
        svc.setRequestMethod('POST');
        svc.addHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        var params = [];
        params.push('grant_type=client_credentials');
        params.push('client_id=' + fedexAPIUser);
        params.push('client_secret=' + fedexAPIKey);
        return params.join('&');
    },
    parseResponse: function (svc, response) {
        // Check 2xx response status
        if (/2\d{2}$/g.test(response.statusCode)) {
            return JSON.parse(response.text);
        }
        Logger.getLogger('Fedex').error('Fedex: Response status code {0}, response text {1}', response.statusCode, response.text);
        return null;
    },
    mockCall: function () {
        return {
            statusCode: 200,
            statusMessage: 'Success',
            text: JSON.stringify(mockData.fedexAuthMock)
        };
    }
});

const FedexLabelApi = LocalServiceRegistry.createService('int_fedex_rest.shipment.rest.label', {
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
        Logger.getLogger('Fedex').error('Fedex: Response status code {0}, response text {1}', response.statusCode, response.text);
        return null;
    },
    mockCall: function () {
        return {
            statusCode: 200,
            statusMessage: 'Success',
            text: JSON.stringify(mockData.fedexLabelMock)
        };
    }
});
const FedexApiMgr = {
    call: function (params) {
        const AuthAPI = FedexAuthApi;
        const LabelAPI = FedexLabelApi;
        const authResponse = AuthAPI.call(params);
        if (!authResponse.ok) {
            Logger.getLogger('Fedex').error('FedexAuth: Response statusCode "{0}" msg "{1}", response text "{2}"', authResponse.status, authResponse.msg, authResponse.errorMessage);
        }
        var labelResponse;
        if (authResponse.object && 'access_token' in authResponse.object) {
            labelResponse = LabelAPI.call({ params: params, accessToken: authResponse.object.access_token });
            if (!labelResponse.ok) {
                Logger.getLogger('Fedex').error('FedexLabel: Response statusCode "{0}" msg "{1}", response text "{2}"', labelResponse.status, labelResponse.msg, labelResponse.errorMessage);
            }
        }
        return LabelAPI.getResponse();
    }
};
module.exports = FedexApiMgr;
