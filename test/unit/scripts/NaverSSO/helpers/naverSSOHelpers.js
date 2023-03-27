'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var svc = {
    URL: '',
    method: 'GET',
    addHeader: function (key, value) {
        this.headers[key] = value;
    },
    setURL: function (url) {
        this.URL = url;
    },
    setRequestMethod: function (method) {
        this.method = method;
    },
    getConfiguration: () => {
        return {
            getCredential: () => {
                return URL;
            }
        };
    },
    headers: []
};

describe('app_ua_apac/cartridge/scripts/helpers/naversso/naverSSOHelpers.js', () => {
    var naverSSOHandler = {
        data: {},
        configObj: {},
        client: {
            text: '{"success":true,"message":"success"}'
        },
        mock: false,
        request: {},
        URL: ''
    };
    var PreferencesUtil = proxyquire('../../../../../cartridges/app_ua_core/cartridge/scripts/utils/PreferencesUtil', {
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
        'dw/system/System': require('../../../../mocks/dw/dw_system_System'),
        '~/cartridge/scripts/utils/JsonUtils': require('../../../../mocks/scripts/JsonUtils'),
        getValue: () => {
            var customData = 'test12345';
            return customData;
        }
    });
    var helperNaverSSO = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/naversso/naverSSOHelpers.js', {
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
        '*/cartridge/scripts/utils/PreferencesUtil': PreferencesUtil,
        'dw/svc/LocalServiceRegistry': {
            createService: (svcId, configObj) => {
                return {
                    call: (data) => {
                        naverSSOHandler.configObj = configObj;
                        naverSSOHandler.data = data;

                        configObj.createRequest(svc, {
                            naverSSOClientID: '1234test',
                            naverSSOClientSecret: 'test1234'
                        });

                        configObj.parseResponse(svcId, {
                            text: ''
                        });
                        var isOk = true;
                        return {
                            status: 'OK',
                            ok: isOk,
                            object:{
                                getText: function () {
                                    return '{"access_token": "AAAAPObpV_7bCKvHfFH0uVBm5IOSQentg9vlar8seBb__aMhfKmdA29_pk4sl8uAEtGUfiBMsl0CHWjItfx7dwwHnbg", "refresh_token": "qjEvBdAA2Bis2iiMf0qu9oSsSnsWKolXUmbtisnpffyL86oGvgLuRZtJvucKFOsmNW5vUaPTjqqxbGUvp5ZIRuAWbPjVcKuN6oPU3aKJIs838EKBMgeYsDddoipgXlkpAyKd","token_type": "bearer","expires_in": "3600"}';
                                }
                            },
                            error: isOk ? 200 : 400,
                            getRequestData: function () {
                                naverSSOHandler.request = naverSSOHandler.configObj.createRequest(svcId);
                                return naverSSOHandler.request;
                            },
                            getResponse: function () {
                                return naverSSOHandler.mock
                                    ? naverSSOHandler.configObj.mockCall(svc)
                                    : naverSSOHandler.configObj.parseResponse(svcId, naverSSOHandler.client);
                            }
                        };
                    }
                };
            }
        }
    });

    // Service with ERROR response
    var helperNaverSSOFailed = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/naversso/naverSSOHelpers.js', {
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
        '*/cartridge/scripts/utils/PreferencesUtil': PreferencesUtil,
        'dw/svc/LocalServiceRegistry': {
            createService: (svcId, configObj) => {
                return {
                    call: (data) => {
                        naverSSOHandler.configObj = configObj;
                        naverSSOHandler.data = data;

                        configObj.createRequest(svc, {
                            naverSSOClientID: '1234test',
                            naverSSOClientSecret: 'test1234'
                        });

                        configObj.parseResponse(svcId, {
                            text: ''
                        });
                        var isOk = true;
                        return {
                            status: 'ERROR',
                            ok: isOk,
                            object:{
                                getText: function () {
                                    return '{"access_token": "AAAAPObpV_7bCKvHfFH0uVBm5IOSQentg9vlar8seBb__aMhfKmdA29_pk4sl8uAEtGUfiBMsl0CHWjItfx7dwwHnbg", "refresh_token": "qjEvBdAA2Bis2iiMf0qu9oSsSnsWKolXUmbtisnpffyL86oGvgLuRZtJvucKFOsmNW5vUaPTjqqxbGUvp5ZIRuAWbPjVcKuN6oPU3aKJIs838EKBMgeYsDddoipgXlkpAyKd","token_type": "bearer","expires_in": "3600"}';
                                }
                            },
                            error: isOk ? 200 : 400,
                            getRequestData: function () {
                                naverSSOHandler.request = naverSSOHandler.configObj.createRequest(svcId);
                                return naverSSOHandler.request;
                            },
                            getResponse: function () {
                                return naverSSOHandler.mock
                                    ? naverSSOHandler.configObj.mockCall(svc)
                                    : naverSSOHandler.configObj.parseResponse(svcId, naverSSOHandler.client);
                            }
                        };
                    }
                };
            }
        }
    });

    var result;
    var queryStringObj = {};
    queryStringObj.code = 'test1233';
    queryStringObj.state = '1234test';
    it('Testing method: getNaverSSOToken', () => {
        try {
            result = helperNaverSSO.getNaverSSOToken(queryStringObj);
        } catch (e) {
            assert.equal('Naver SSO ClientID and ClientSecret is not configured', e.message);
        }
    });

    it('Testing method: getNaverUserInfo', () => {
        var authToken = 'etywqterq312rtret';
        result = helperNaverSSO.getNaverUserInfo(authToken);
        assert.isUndefined(result, 'result is defined');
    });

    // Mock for ERROR response from the service
    it('Testing method for ERROR response: getNaverSSOToken', () => {
        try {
            result = helperNaverSSOFailed.getNaverSSOToken(queryStringObj);
        } catch (e) {
            assert.equal('Naver SSO ClientID and ClientSecret is not configured', e.message);
        }
    });

    it('Testing method for ERROR response: getNaverUserInfo', () => {
        var authToken = 'etywqterq312rtret';
        result = helperNaverSSOFailed.getNaverUserInfo(authToken);
        assert.isDefined(result, 'result is defined');
    });

});
