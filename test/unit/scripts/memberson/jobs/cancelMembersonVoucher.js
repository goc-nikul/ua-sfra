'use strict';
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
const Spy = require('../../../../helpers/unit/Spy');
let spy = new Spy();
const sinon = require('sinon');


describe('int_memberson/cartridge/scripts/job/cancelMembersonVoucher.js', () => {
    // const mockOrderMgr = require('../../../../mocks/dw/dw_order_OrderMgr');
    // mockOrderMgr.processOrders = sinon.spy(() => { });
    var order = {
        getPaymentInstruments: (pmethod) => {
            return {
                length: 0
            };
        },
        orderNo: 'Test123',
        custom: {
            'Loyalty-VoucherName': 'Test1212',
            'Loyalty-VoucherCancelled': 'Test'
        }
    };

    var cancelMembersonVoucherHelper = proxyquire('../../../../../cartridges/int_memberson/cartridge/scripts/job/cancelMembersonVoucher.js', {
        'dw/order/Order': require('../../../../mocks/dw/dw_order_Order'),
        'dw/order/OrderMgr': {
            processOrders(field, value) {
                return field(order);
            }
        },
        'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/util/Calendar': require('../../../../mocks/dw/dw_util_Calendar'),
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        'dw/system/HookMgr': require('../../../../mocks/dw/dw_system_HookMgr'),
        'dw/object/CustomObjectMgr': {
            getCustomObject: () => null,
            createCustomObject: () => {
                return {
                    custom: {}
                };
            }
        },
        'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils')
    });
    it('executes with startDate and endDate parameters', () => {
        const params = {
            startDate: new Date('09/28/2022'),
            delayInHours: 2,
            endDate: null
        };
        var result = cancelMembersonVoucherHelper.execute(params);
        assert.isDefined(result);
    });
});
