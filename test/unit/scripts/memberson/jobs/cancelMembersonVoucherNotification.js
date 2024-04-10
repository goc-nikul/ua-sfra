'use strict';
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
const Spy = require('../../../../helpers/unit/Spy');
let spy = new Spy();
const sinon = require('sinon');


describe('int_memberson/cartridge/scripts/job/cancelMembersonVoucherNotification.js', () => {
    // const mockOrderMgr = require('../../../../mocks/dw/dw_order_OrderMgr');
    // mockOrderMgr.processOrders = sinon.spy(() => { });

    var cancelMembersonVoucherNotificationHelper = proxyquire('../../../../../cartridges/int_memberson/cartridge/scripts/job/cancelMembersonVoucherNotification.js', {
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
    it('Test for cancelMembersonVoucherNotification', () => {
        const params = {
            senderEmail: 'test.test@test.com'
        };
        var result = cancelMembersonVoucherNotificationHelper.execute(params);
        assert.isDefined(result);
    });
});
