
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const currentSite = require('../../dw/dw_system_Site').getCurrent();
let MAOPreferences = {
    MaoDomTokenChildOrgUsername: currentSite.getCustomPreferenceValue('MaoDomTokenChildOrgUsername'),
    MaoDomTokenChildOrgPassword: currentSite.getCustomPreferenceValue('MaoDomTokenChildOrgPassword'),
    MaoDomSaveOrderEndpointUrl: currentSite.getCustomPreferenceValue('MaoDomSaveOrderEndpointUrl'),
    MaoViewDefinition: currentSite.getCustomPreferenceValue('maoViewDefinition'),
    MaoAvailabilityEndpointUrl: currentSite.getCustomPreferenceValue('MaoAvailabilityEndpointUrl'),
    MaoAuthTokenEndpointUrl: currentSite.getCustomPreferenceValue('MaoAuthTokenEndpointUrl')
};

var MAOServiceHandler = {
    data: {},
    configObj: {},
    client: {
        text: '{"success":true,"message":"success"}'
    },
    mock: true,
    requestData: {},
    URL: ''
};

var service = {
    configuration: {
        credential: {
            URL: 'URL',
            user: '111',
            password: '222'
        }
    },
    URL: null,
    headers: [],
    method: 'POST',
    auth: 'NONE',
    addHeader: function (key, value) {
        this.headers[key] = value;
    },
    setRequestMethod: function (method) {
        this.method = method;
    },
    setURL: function (url) {
        this.URL = url;
    },
    setAuthentication: function (auth) {
        this.auth = auth;
    }
};


function proxyModel() {
    // require('../../../../cartridges/int_mao/cartridge/scripts/services/MaoService')
    return proxyquire('../../../../cartridges/int_mao/cartridge/scripts/services/MaoService',
        {
            '~/cartridge/scripts/MaoPreferences': MAOPreferences,
            'dw/svc/LocalServiceRegistry': {
                createService: function (serviceId, configObj) {
                    return {
                        call: function () {
                            MAOServiceHandler.configObj = configObj;
                            var isOk = true;
                            var statusCheck = true;
                            return {
                                ok: isOk,
                                object: {
                                    status: isOk && statusCheck ? 'SUCCESS' : 'ERROR'
                                },
                                error: isOk ? 200 : 400
                            };
                        },
                        getRequestData: function (params, endPointUrl) {
                            if (params && params.endPointUrl) {
                                MAOServiceHandler.requestData = MAOServiceHandler.configObj.createRequest(service, params, endPointUrl);
                            } else {
                                MAOServiceHandler.requestData = MAOServiceHandler.configObj.createRequest(service, params);
                            }
                            
                            return MAOServiceHandler.requestData;
                        },
                        getResponse: function (params) {
                            return params === true
                                ? MAOServiceHandler.configObj.mockCall()
                                : MAOServiceHandler.configObj.parseResponse(service, MAOServiceHandler.client);
                        },
                        getCredentialID: function () {
                            return serviceId;
                        },
                        getMessage: function (response) {
                            return {
                                logResponse: MAOServiceHandler.configObj.filterLogMessage(response),
                            };
                        },
                        getErrorMessage: function (response) {
                            var obj = {};
                            obj.a = { b: obj };
                            return {
                                logResponse: MAOServiceHandler.configObj.filterLogMessage(obj),
                                // logResponse: MAOServiceHandler.configObj.getResponseLogMessage(response)
                            };
                        }
                    };
                }
            },
            '*/cartridge/scripts/util/loggerHelper.js': {
                maskSensitiveInfo: function (logMsg) {
                    return logMsg;
                }
            },
            'int_mao/cartridge/scripts/availability/MAOAvailabilityHelper': {
                parseResponse: function (response) {
                    return response;
                }
            },
            'dw/util/StringUtils': {
                format: function (input) {
                    return input;
                }
            },
            'dw/crypto/Encoding': {
                toURI: function (input) {
                    return input;
                }
            }
        });
}

module.exports = proxyModel();

