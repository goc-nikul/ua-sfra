'use strict';
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
const Spy = require('../../../../helpers/unit/Spy');
let spy = new Spy();
const sinon = require('sinon');


describe('int_memberson/cartridge/scripts/service/membersonService.js', () => {
    // const mockOrderMgr = require('../../../../mocks/dw/dw_order_OrderMgr');
    // mockOrderMgr.processOrders = sinon.spy(() => { });
    class Bytes {
        constructor(secretKey) {
            this.secretKey = secretKey;
        }
        toString() {
            return this.secretKey;
        }
    }

    var svc = {
        setRequestMethod: () => null,
        setURL: () => null,
        addHeader: () => null,
        configuration: {
            credential: {
                URL: 'URL',
                user: '111',
                password: '222'
            }
        }
    };

    var params = {
        url: null,
        token: 'testtt',
        requestMethod: 'Testt',
        requestBody: 'test123'
    };

    var LocalServiceRegistryStub = sinon.stub().returns({
        createService: (svcId, callback) => {
            callback.createRequest(svc, params);
            return callback.parseResponse();
        }
    });

    var membersonAPI = proxyquire('../../../../../cartridges/int_memberson/cartridge/scripts/service/membersonService.js', {
        'dw/crypto/Encoding': {
            toBase64: function(input) {
                return input;
            }
        },
        'dw/util/Bytes': Bytes,
        'dw/svc/LocalServiceRegistry': new LocalServiceRegistryStub(),
        'dw/order/Order': require('../../../../mocks/dw/dw_order_Order'),
        'dw/order/OrderMgr': {
            getOrder: function (orderNo) {
                return {
                    custom: {
                        'Loyalty-ID': 'Testtt1',
                        'Loyalty-VoucherName': 'Test-Test123'
                    }
                };
            }
        },
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/util/Calendar': require('../../../../mocks/dw/dw_util_Calendar'),
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        'dw/system/HookMgr': require('../../../../mocks/dw/dw_system_HookMgr'),
        '*/cartridge/scripts/helpers/emailHelpers': require('../../../../mocks/scripts/emailHelpers'),
        '*/cartridge/scripts/utils/PreferencesUtil': require('../../../../mocks/scripts/PreferencesUtil'),
        'dw/object/CustomObjectMgr': {
            getAllCustomObjects: () => {
                var cnt = 0;
                return {
                    getCount: () => 1,
                    hasNext: () => {
                        cnt++;
                        return cnt === 1;
                    },
                    next: () => {
                        return {
                            custom: {
                                membersonOrderNumber: 'DEVOC-00050451',
                                voucherCode: 'Test4321',
                                voucherCancellationStatus: 'Test'
                            }
                        };
                    }
                };
            },
            remove: () => ''
        },
        'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils')
    });
    it('Test for memberson API', () => {
        var result = membersonAPI.getMembersonAPI();
        assert.isUndefined(result);
    });
});
