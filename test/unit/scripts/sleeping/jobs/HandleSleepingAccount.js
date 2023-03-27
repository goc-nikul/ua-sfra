'use strict';
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
const Spy = require('../../../../helpers/unit/Spy');
let spy = new Spy();
class EmailProvider {
    constructor() {
        this.emailObj = {};
    }

    get(type, emailObj) {
        this.emailObj = emailObj;
        return this;
    }

    send() {
        return spy.use(this.emailObj);
    }
}

describe('plugin_sleepingaccount/cartridge/scripts/jobs/HandleSleepingAccount.js', () => {
    // Cover Notify Customer from script
    var params = {
        sleepingAccountNotificationDays: '5',
        sleepingAccountCutoffDays: '10'
    };
    var lastLoginTime = new Date();
    lastLoginTime.setDate(lastLoginTime.getDate() - params.sleepingAccountNotificationDays);
    var profile = {
        lastLoginTime: lastLoginTime,
        custom: {
            isSleptAccount: '',
            smsOptIn: '',
            sleepingEmailNotification: ''
        }
    };
    var emailHelpers = proxyquire('../../../../../cartridges/app_ua_core/cartridge/scripts/helpers/emailHelpers.js', {
        'app_storefront_base/cartridge/scripts/helpers/emailHelpers': require('../../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/helpers/emailHelpers.js')
    });
    var sleepingSFMCEmailHelpers = proxyquire('../../../../../cartridges/plugin_sleepingaccount/cartridge/scripts/helpers/sleepingSFMCEmailHelpers.js', {
        'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
        'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
        'dw/util/Calendar': require('../../../../mocks/dw/dw_util_Calendar'),
        '*/cartridge/scripts/helpers/emailHelpers.js': emailHelpers,
        '*/cartridge/modules/providers': new EmailProvider()

    });
    var sleepingAccountHelper = proxyquire('../../../../../cartridges/plugin_sleepingaccount/cartridge/scripts/jobs/HandleSleepingAccount.js', {
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/util/Calendar': require('../../../../mocks/dw/dw_util_Calendar'),
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        'dw/customer/CustomerMgr': {
            processProfiles(field, value) {
                return field(profile);
            }
        },
        'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
        '~/cartridge/scripts/helpers/sleepingSFMCEmailHelpers.js': sleepingSFMCEmailHelpers
    });
    var result;
    it('Testing method: handleSleepingAccount(With Sent notificaion customer)', () => {
        result = sleepingAccountHelper.execute(params);
        assert.isDefined(result);
    });

    // Cover Deactivate Customer from script
    var deactivateLastLoginTime = new Date();
    deactivateLastLoginTime.setDate(deactivateLastLoginTime.getDate() - params.sleepingAccountCutoffDays);
    var deactivateProfile = {
        lastLoginTime: deactivateLastLoginTime,
        custom: {
            isSleptAccount: '',
            smsOptIn: '',
            sleepingEmailNotification: ''
        }
    };
    var deactivateSleepingAccountHelper = proxyquire('../../../../../cartridges/plugin_sleepingaccount/cartridge/scripts/jobs/HandleSleepingAccount.js', {
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/util/Calendar': require('../../../../mocks/dw/dw_util_Calendar'),
        'dw/customer/CustomerMgr': {
            processProfiles(field, value) {
                return field(deactivateProfile);
            }
        },
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site')
    });
    it('Testing method: handleSleepingAccount(With Sent Deactivate customer)', () => {
        result = deactivateSleepingAccountHelper.execute(params);
        assert.isDefined(result);
    });
});
