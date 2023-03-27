'use strict';

/* eslint-disable no-extend-native */
var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

// Path to scripts
var pathToCartridges = '../../../../cartridges/';
var pathToLinkScripts = pathToCartridges + 'int_shoplinker/cartridge/scripts/';

// Path to test scripts
var pathToCoreMock = '../../../mocks/';

var svc = {
    setRequestMethod: () => true,
    setURL: () => true,
    getConfiguration: () => {
        return {
            credential: {
                url: 'Shoplinker URL'
            }
        };
    }
};

describe('Shoplinker: Shoplinker test', () => {
    global.empty = (data) => {
        return !data;
    };

    var PreferencesUtil = proxyquire(pathToCartridges + 'app_ua_core/cartridge/scripts/utils/PreferencesUtil', {
        'dw/system/Site': require(pathToCoreMock + 'dw/dw_system_Site'),
        'dw/system/System': require(pathToCoreMock + 'dw/dw_system_System'),
        '~/cartridge/scripts/utils/JsonUtils': require(pathToCoreMock + 'scripts/JsonUtils')
    });

    var shopLinkerServiceHandler = {
        data: {},
        configObj: {},
        client: {
            text: '{"success":true,"message":"success"}'
        },
        mock: false,
        request: {},
        URL: ''
    };

    var Shoplinker = proxyquire(pathToLinkScripts + 'Shoplinker', {
        'dw/object/CustomObjectMgr': {
            getCustomObject: (customObjectName, objectID) => null,
            createCustomObject: () => {
                return {
                    custom: {},
                    getCustom: function () {
                        return {
                            custom: '{"material": "test-123","shoplinkerID":"test12345"}'
                        };
                    }
                };
            }
        },
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
        'dw/system/Transaction': require(pathToCoreMock + 'dw/dw_system_Transaction'),
        'dw/web/URLUtils': require(pathToCoreMock + 'dw/dw_web_URLUtils'),
        '*/cartridge/scripts/utils/PreferencesUtil': PreferencesUtil,
        'dw/svc/LocalServiceRegistry': {
            createService: (svcId, configObj) => {
                return {
                    call: (data) => {
                        shopLinkerServiceHandler.configObj = configObj;
                        shopLinkerServiceHandler.data = data;

                        var serviceParams = {
                            iteminfoURL: '',
                            endpointURL: ''
                        };

                        configObj.createRequest(svc, serviceParams);

                        configObj.parseResponse(svcId, {
                            text: ''
                        });
                        configObj.getResponseLogMessage({
                            text: ''
                        });
                        var isOk = true;
                        return {
                            status: 'OK',
                            ok: isOk,
                            object: "<?xml version='1.0' encoding='EUC-KR' ?><ResultMessage><result>true</result><product_id>192564507269</product_id><message><![CDATA[success]]></message></ResultMessage>",
                            error: isOk ? 200 : 400,
                            getRequestData: function () {
                                shopLinkerServiceHandler.request = shopLinkerServiceHandler.configObj.createRequest(svcId);
                                return shopLinkerServiceHandler.request;
                            },
                            getResponse: function () {
                                return shopLinkerServiceHandler.mock
                                    ? shopLinkerServiceHandler.configObj.mockCall(svc)
                                    : shopLinkerServiceHandler.configObj.parseResponse(svcId, shopLinkerServiceHandler.client);
                            }
                        };
                    }
                };
            }
        }
    });

    var products = ['886450928978', '886450929067', '888376015091'];

    it('Testing method: callG2', () => {
        global.XML = require(pathToCoreMock + 'dw/XML');
        var result = Shoplinker.callG2('1234237');
        assert.equal(true, result);
    });

    it('Testing method: callG3', () => {
        global.XML = require(pathToCoreMock + 'dw/XML');
        var result = Shoplinker.callG3(products);
        assert.equal(true, result);
    });

    it('Testing method: callG4', () => {
        global.XML = require(pathToCoreMock + 'dw/XML');
        var result = Shoplinker.callG4('1234237');
        assert.equal(true, result);
    });

    it('Testing method: callG5', () => {
        global.XML = require(pathToCoreMock + 'dw/XML');
        var result = Shoplinker.callG5('1234237');
        assert.equal(true, result);
    });

    it('Testing method: callG6', () => {
        global.XML = require(pathToCoreMock + 'dw/XML');
        var result = Shoplinker.callG6('1234237');
        assert.equal(true, result);
    });

    it('Testing method: callG7', () => {
        global.XML = require(pathToCoreMock + 'dw/XML');
        var result = Shoplinker.callG7('1234237');
        assert.equal(true, result);
    });


    var ShoplinkerServiceFailure = proxyquire(pathToLinkScripts + 'Shoplinker', {
        'dw/object/CustomObjectMgr': {
            getCustomObject: (customObjectName, objectID) => null,
            createCustomObject: () => {
                return {
                    custom: {},
                    getCustom: function () {
                        return {
                            custom: '{"material": "test-123","shoplinkerID":"test12345"}'
                        };
                    }
                };
            }
        },
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
        'dw/system/Transaction': require(pathToCoreMock + 'dw/dw_system_Transaction'),
        'dw/web/URLUtils': require(pathToCoreMock + 'dw/dw_web_URLUtils'),
        '*/cartridge/scripts/utils/PreferencesUtil': PreferencesUtil,
        'dw/svc/LocalServiceRegistry': {
            createService: () => {
                return {
                    call: () => {
                        var isOk = false;
                        return {
                            status: 'NOT_OK',
                            ok: isOk
                        };
                    }
                };
            }
        }
    });

    it('Shoplinke Services: Testing service failuer', () => {
        global.XML = require(pathToCoreMock + 'dw/XML');
        var result = ShoplinkerServiceFailure.callG7('1234237');
        assert.equal(false, result);
    });
});
