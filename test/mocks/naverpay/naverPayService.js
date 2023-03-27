'use strict';

/* eslint-disable */

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var svc = {
    URL: '',
    method: 'POST',
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
            credential: () => {
                return URL;
            }
        };
    },
    headers: []
};

var naverPayServiceHandler = {
    data: {},
    configObj: {},
    client: {
        text: '{"success":true,"message":"success"}'
    },
    mock: false,
    request: {},
    URL: ''
};
function proxyModel() {
    return proxyquire('../../../cartridges/int_naverpay/cartridge/scripts/service/naverPayService.js',
        {
            'dw/svc/LocalServiceRegistry': {
                createService: (svcId, configObj) => {
                    return {
                        call: (data) => {
                            naverPayServiceHandler.configObj = configObj;
                            naverPayServiceHandler.data = data;
                            var serviceParams = {
                                paymentKey: 'test1234'
                            };
                            configObj.createRequest(svc, serviceParams);
                            configObj.parseResponse(svc, {
                                text: ''
                            });
                            var isOk = true;
                            return {
                                status: 'OK',
                                object: {
                                    getText: function () {
                                        return '{ "status": "testtt" }';
                                    }
                                },
                                error: isOk ? 200 : 400,
                                getClient: function () {
                                    return {
                                        statusCode: 200,
                                        getText: function () {
                                            return '{ "status": "testtt" }';
                                        }
                                    };
                                }
                            };
                        }
                    };
                }
            },
            'dw/util/StringUtils': require('../dw/dw_util_StringUtils'),
            'dw/system/Site': require('../dw/dw_system_Site')
        });
}

module.exports = proxyModel();
