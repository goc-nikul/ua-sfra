'use strict';

/* eslint-disable */

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var aupostServiceHandler = {
    data: {},
    configObj: {},
    client: {
        text: '{"success":true,"message":"success"}'
    },
    mock: false,
    request: {},
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
    method: 'GET',
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
    },
    client:{
        setTimeout: function(time) {
            this.time = time;
        },
        open: function(client,url) {
            this.client = client;
        },
        sendAndReceiveToFile: function(client) {
            this.client = client;
        }
    }
};

class Bytes {
    constructor(secretKey) {
        this.secretKey = secretKey;
    }
    toString() {
        return this.secretKey;
    }
}

class File {
    constructor(filePath) {
        this.filePath = filePath;
    }
}
function proxyModel() {
    return proxyquire('../../../cartridges/int_aupost/cartridge/scripts/svc/downloadAUPostlabelService.js',
        {
            'dw/svc/LocalServiceRegistry': {
                createService: function (serviceId, configObj) {
                    return {
                        call: function (data) {
                            aupostServiceHandler.configObj = configObj;
                            aupostServiceHandler.data = data;
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
                        getRequestData: function () {
                            aupostServiceHandler.request = aupostServiceHandler.configObj.createRequest(service);
                            return aupostServiceHandler.request;
                        },
                        getResponse: function () {
                            return aupostServiceHandler.mock
                                ? aupostServiceHandler.configObj.mockCall(svc)
                                : aupostServiceHandler.configObj.parseResponse(service, aupostServiceHandler.client);
                        },
                        getCredentialID: function () {
                            return serviceId;
                        },
                        getMessage: function (response) {
                            return {
                                requestData: aupostServiceHandler.configObj.getRequestLogMessage(aupostServiceHandler.request),
                                logResponse: aupostServiceHandler.configObj.getResponseLogMessage(response)
                            };
                        },
                        getErrorMessage: function (response) {
                            var obj = {};
                            obj.a = { b: obj };
                            return {
                                requestData: aupostServiceHandler.configObj.getRequestLogMessage(obj),
                                logResponse: aupostServiceHandler.configObj.getResponseLogMessage(response)
                            };
                        }
                    };
                }
            },
            'dw/system/Logger': {
                getLogger: function (param1, param2) {
                    return {
                        info: function (text, param) {
                            return text;
                        }
                    };
                }
            },
            'dw/util/Bytes': Bytes,
            'dw/crypto/Encoding': {
                toBase64: function (input) {
                    return input;
                }
            },
           'dw/io/File': File
        });
}

module.exports = proxyModel();
