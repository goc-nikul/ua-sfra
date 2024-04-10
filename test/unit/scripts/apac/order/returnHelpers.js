'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var Order = require('../../../../mocks/dw/dw_order_Order');

describe('app_ua_apac/cartridge/scripts/order/returnHelpers.js', () => {
    var helperReturn = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/order/returnHelpers.js', {
        '*/cartridge/scripts/utils/PreferencesUtil': require('../../../../mocks/scripts/PreferencesUtil'),
        'dw/util/Calendar': require('../../../../mocks/dw/dw_util_Calendar'),
        'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
        'dw/object/CustomObjectMgr': {
            getCustomObject: function () {
                return {
                    getCustom: function () {
                        return {
                            'countryID': 'SG',
                            'returnMethod-1': {
                                displayValue: 'test',
                                value: 'test'
                            },
                            'returnMethod1Courierservice': 'Test',
                            'returnMethod1DateRange': '{"daysstartFrom": 2, "daysEndTill": 7, "weekendsoff": true}',
                            'returnMethod1TimeSlots': ['09:00-18:00'],
                            'returnMethod1PublicHolidayList': []
                        };
                    }
                };
            }
        }
    });

    it('Testing method: getCustomObject', () => {
        var result = helperReturn.getCustomObject('ReturnMethodsConfigurations', 'SG');
    });

    it('Testing method: getReturnMethodsConfigurations', () => {
        var customObject = helperReturn.getCustomObject('ReturnMethodsConfigurations', 'SG');
        var result = helperReturn.getReturnMethodsConfigurations(customObject);
    });
});
