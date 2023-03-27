'use strict';


const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var brauzBookaSessionHelper;
describe('app_ua_apac/cartridge/scripts/utils/brauzBookaSessionHelper', function () {
    var Site = {
        current: {
            preferences: {
                custom: {}
            }
        },
        getCurrent: function () {
            return '';
        }
    };
    brauzBookaSessionHelper = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/utils/brauzBookaSessionHelper.js', {
        'dw/system/Site': Site,
        '*/cartridge/scripts/utils/PreferencesUtil': {
            isCountryEnabled: function(param) {
                return true;
            }
        }
    });

    it('Testing for customerProfileDataObj', () => {
        var isRegisteredCustomer = global.customer.registered;
        global.customer.registered = true;
        var req = {
            currentCustomer: {
                profile: {
                    firstName: 'Foo',
                    lastName: 'Moo',
                    email: 'moo@underarmour.com',
                    phone: '1234567891'
                }
            }
        };
        var result = brauzBookaSessionHelper.customer(req);
        assert.isNotNull(result);
        global.customer.registered = isRegisteredCustomer;
    });

    it('Testing for customerProfileDataObj - empty Profile', () => {
        var isRegisteredCustomer = global.customer.registered;
        global.customer.registered = true;
        var req = {
            currentCustomer: {
                profile: {
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: ''
                }
            }
        };
        var result = brauzBookaSessionHelper.customer(req);
        assert.isNotNull(result);
        global.customer.registered = isRegisteredCustomer;
    });

    it('Testing for customerProfileDataObj if customer is not registred or empty profile', () => {
        var isRegisteredCustomer = global.customer.registered;
        global.customer.registered = false;
        var req = {
            currentCustomer: {
                profile: null
            }
        };
        var result = brauzBookaSessionHelper.customer(req);
        assert.isNull(result);
        global.customer.registered = isRegisteredCustomer;
    });

    it('Testing for getBookSessionSDK', () => {
        brauzBookaSessionHelper = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/utils/brauzBookaSessionHelper.js', {
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function () { return true; }
                    };
                },
                current: {
                    preferences: {
                        custom: { bookSessionSDK: 'bookSessionSDK' }
                    }
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': {
                isCountryEnabled: function(param) {
                    return true;
                }
            }
        });

        var result = brauzBookaSessionHelper.bookSessionSDK;
        assert.isTrue(result);
    });

    it('Testing for getBrauzGroupNumber', () => {
        brauzBookaSessionHelper = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/utils/brauzBookaSessionHelper.js', {
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function () { return true; }
                    };
                },
                current: {
                    preferences: {
                        custom: { bsgroupNumber: 'bookSessionSDK' }
                    }
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': {
                isCountryEnabled: function(param) {
                    return true;
                }
            }
        });

        var result = brauzBookaSessionHelper.bsgroupNumber;
        assert.isTrue(result);
    });
});

