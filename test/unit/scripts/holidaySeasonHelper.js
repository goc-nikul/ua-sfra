'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/scripts/helpers/holidaySeasonHelper file test cases', () => {
    it('getReturnPeriod method test case with confirming holiday return period', () => {
        let holidaySeasonHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/holidaySeasonHelper.js', {
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/order/OrderMgr': require('../../mocks/dw/dw_order_OrderMgr')
        });

        let result = holidaySeasonHelper.getReturnPeriod('12345');
        assert.equal(result, 90);
    });

    it('setHolidaySeason method test case with active holiday season', () => {
        // Setting Active Start date and end date holiday season for custom preference value.
        let date = new Date();
        date.setDate(date.getDate() + 1);
        let holidayEnd = (date.getMonth() + 1) + '-' + date.getDate();
        date.setDate(date.getDate() - 2);
        let holidayStart = (date.getMonth() + 1) + '-' + date.getDate();
        let Site = require('../../mocks/dw/dw_system_Site');
        Site.current.preferenceMap.returnsConfiguration = '{ "holidayStart": "' + holidayStart + '", "holidayEnd": "' + holidayEnd + '", "holidayReturnPeriod": 90, "nonHolidayReturnPeriod": 60 }';

        let holidaySeasonHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/holidaySeasonHelper.js', {
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': Site,
            'dw/order/OrderMgr': require('../../mocks/dw/dw_order_OrderMgr'),
            'dw/util/Calendar': require('../../mocks/dw/dw_util_Calendar'),
            'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction')
        });

        let order = require('../../mocks/dw/dw_order_OrderMgr').getOrder();
        delete order.custom.holidaySeason;
        holidaySeasonHelper.setHolidaySeason(order);
        assert.equal(order.custom.holidaySeason, true);
    });

    it('setHolidaySeason method test case with non holiday season', () => {
        // Setting Non Active Start date and end date holiday season for custom preference value.
        let date = new Date();
        date.setMonth(date.getMonth() - 1);
        let holidayEnd = (date.getMonth() + 1) + '-' + date.getDate();
        date.setMonth(date.getMonth() - 1);
        let holidayStart = (date.getMonth() + 1) + '-' + date.getDate();
        let Site = require('../../mocks/dw/dw_system_Site');
        Site.current.preferenceMap.returnsConfiguration = '{ "holidayStart": "' + holidayStart + '", "holidayEnd": "' + holidayEnd + '", "holidayReturnPeriod": 90, "nonHolidayReturnPeriod": 60 }';

        let holidaySeasonHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/holidaySeasonHelper.js', {
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': Site,
            'dw/order/OrderMgr': require('../../mocks/dw/dw_order_OrderMgr'),
            'dw/util/Calendar': require('../../mocks/dw/dw_util_Calendar'),
            'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction')
        });

        let order = require('../../mocks/dw/dw_order_OrderMgr').getOrder();
        delete order.custom.holidaySeason;
        holidaySeasonHelper.setHolidaySeason(order);
        assert.equal(order.custom.holidaySeason, false);
    });
});
