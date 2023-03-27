'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const Spy = require('../../helpers/unit/Spy');

// Path to test scripts
var pathToCoreMock = '../../mocks/';
var pathToCartridges = '../../../cartridges/';


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

describe('int_shoplinker/cartridge/scripts/ShoplinkerJob', function() {

    let ShoplinkerJob = proxyquire('../../../cartridges/int_shoplinker/cartridge/scripts/ShoplinkerJob', {
        'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
        'dw/system/Status': require('../../mocks/dw/dw_system_Status'),
        'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayListIterator'),
        '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
        'dw/catalog/CatalogMgr': require('../../mocks/shoplinker/dw_catalog_CatalogMgr'),
        'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
        '~/cartridge/scripts/Shoplinker': proxyquire('../../../cartridges/int_shoplinker/cartridge/scripts/Shoplinker', {
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
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
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
        }),
    });

    it('Testing method: execute for sent products', () => {
        var result = ShoplinkerJob.execute();
        assert.isDefined(result)
    });


    it('Testing method: execute for not sent products', () => {

        let ShoplinkerJob = proxyquire('../../../cartridges/int_shoplinker/cartridge/scripts/ShoplinkerJob', {
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Status': require('../../mocks/dw/dw_system_Status'),
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayListIterator'),
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'dw/catalog/CatalogMgr': require('../../mocks/shoplinker/dw_catalog_CatalogMgr'),
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            '~/cartridge/scripts/Shoplinker': proxyquire('../../../cartridges/int_shoplinker/cartridge/scripts/Shoplinker', {
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
                'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
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
                                    object: "<?xml version='1.0' encoding='EUC-KR' ?><ResultMessage><result>false</result><product_id>192564507269</product_id><message><![CDATA[success]]></message></ResultMessage>",
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
            }),
        });

        var result = ShoplinkerJob.execute();
        assert.isDefined(result)
    });
});
