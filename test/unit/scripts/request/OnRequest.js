'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

var readStub = sinon.stub();
var deleteCookieStub = sinon.stub();
var getCustomPreferenceValueStub = sinon.stub();
var loginCustomerStub = sinon.stub();

var Site = {
    current: {
        preferences: null,
        getCustomPreferenceValue: getCustomPreferenceValueStub
    },
    getCurrent() {
        return {
            getID() {
                return 'KR';
            }
        };
    }
};
var preferences = {
    custom: {
        bfxIsEnabled: true,
        mapCookiesToSessionEnabled: true,
        cookieToSessionVariableMap: JSON.stringify({
            testCookie: 'testvalue'
        }),
        uaidmActiveSession: Date.now(),
        uaidmPersistantSession: 100,
        uaidmIsEnabled: true
    }
};

// cookie values
readStub.withArgs('UALogout').returns('UALogout');
readStub.withArgs('brooksBell').returns(true);
readStub.withArgs('UAExternalID').returns(true);
readStub.withArgs('UAActiveSession').returns(1234);
readStub.withArgs('testvalue').returns('WRETYU');
readStub.withArgs('UAExternalSizePreferences0').returns(JSON.stringify({
    ID: 'UA'
}));
readStub.withArgs('UAExternalSizePreferences1').returns();
readStub.withArgs('uaidm').returns('RESDTFD546');
readStub.withArgs('uatest').returns();
loginCustomerStub.returns(true);
deleteCookieStub.returns(true);

var cookieToSessionVariableMap = {
    cookie1: 'uaidm',
    cookie2: 'uatest'
};


var onRequest;
describe('app_ua_core/cartridge/scripts/request/OnRequest.js', () => {
    before(() => {
        onRequest = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/request/OnRequest.js', {
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Site': Site,
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/customer/CustomerMgr': {
                logoutCustomer: () => true
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: readStub,
                deleteCookie: deleteCookieStub,
                create: () => true
            },
            'plugin_ua_idm/cartridge/scripts/idmHelper.js': {
                loginCustomer() {
                    return true;
                }
            },
            '*/cartridge/scripts/helpers/accountHelpers': {
                deleteIDMCookies: function () { },
                deleteCookie: function (cookie) { } // eslint-disable-line no-unused-vars
            }
        });

        global.request = {
            geolocation: {
                countryCode: 'CA'
            },
            httpParameterMap: {
                country: {
                    value: 'CA'
                }
            },
            httpMethod: 'GET',
            httpURL: {
                toString() {
                    return 'https//sfcc.testurl.com';
                }
            }
        };

        global.session = {
            custom: {
                currentCountry: 'CA'
            },
            customer: {
                profile: {
                    email: 'test@test.com'
                }
            }
        };

        global.response = {
            redirect() {}
        };

        global.customer = {
            authenticated: true
        };
        global.dw = {
            system: {
                Logger: {
                    error: () => {

                    }
                }
            }
        };
    });

    it('OnRequest => Checking when borderFreeEnabledand, uaidmIsEnabled  and mapCookiesToSessionEnabled preferences enabled or disabled for the site', () => {
        var status = onRequest.onRequest();
        assert.isDefined(status);
        assert.isFalse(deleteCookieStub.withArgs('UALogout').called);
        assert.isFalse(getCustomPreferenceValueStub.withArgs('mapCookiesToSessionEnabled').called);
        Site.current.preferences = preferences;
        onRequest = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/request/OnRequest.js', {
            'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
            'dw/system/Site': Site,
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/customer/CustomerMgr': {
                logoutCustomer: () => true
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: readStub,
                deleteCookie: deleteCookieStub,
                create: () => true
            },
            'plugin_ua_idm/cartridge/scripts/idmHelper.js': {
                loginCustomer() {
                    return true;
                }
            },
            '*/cartridge/scripts/helpers/accountHelpers': {
                deleteIDMCookies: function () { },
                deleteCookie: function (cookie) { } // eslint-disable-line no-unused-vars
            }
        });
        getCustomPreferenceValueStub.withArgs('cookieToSessionVariableMap').returns(JSON.stringify(cookieToSessionVariableMap));
        status = onRequest.onRequest();
        assert.isDefined(status);
        assert.isNotNull(status);
        assert.isTrue(deleteCookieStub.withArgs('UALogout').called);
    });
    it('Test OnRequest: Check the behavior for country value from the request', () => {
        readStub.withArgs('UAExternalSizePreferences0').returns();
        var status = onRequest.onRequest();
        global.request = {
            geolocation: {
                countryCode: 'US'
            },
            httpParameterMap: {
                country: null
            },
            httpMethod: 'GET',
            httpURL: {
                toString() {
                    return 'https//testurl.com';
                }
            }
        };
        status = onRequest.onRequest();
        assert.isDefined(status);
        assert.isNotNull(status);
        readStub.withArgs('UAExternalSizePreferences0').returns(JSON.stringify({
            ID: 'UA'
        }));
    });
    it('Test OnRequest: Check the behavior if customer authenticated or not', () => {
        readStub.withArgs('UAActiveSession').returns(Date.now());
        var status = onRequest.onRequest();
        assert.isNotNull(status);
        global.customer = {
            authenticated: false
        };
        status = onRequest.onRequest();
        assert.isNotNull(status);
    });
    it('Test OnRequest: Check the behavior when unknown exeption occured   ', () => {
        readStub.withArgs('UAExternalSizePreferences1').returns('error string');
        readStub.withArgs('UAExternalID').returns('error string');
        var status = onRequest.onRequest();
        assert.isNotNull(status);
    });

    it('Test OnRequest: Check the behavior when sizePreferences is undefined', () => {
        readStub.withArgs('UAExternalSizePreferences0').returns();
        var status = onRequest.onRequest();
        assert.isDefined(status);
        assert.isNotNull(status);
    });

    it('Test OnRequest: Check the behavior when UAExternalID and UALogout cookie values are undefined', () => {
        readStub.withArgs('UAExternalID').returns();
        readStub.withArgs('UALogout').returns();
        var status = onRequest.onRequest();
        assert.isDefined(status);
        assert.isNotNull(status);
        assert.isFalse(loginCustomerStub.called);
    });

    it('Test OnRequest: Check the behavior when cookieToSessionVariableMap preference is null or empty', () => {
        readStub.reset();
        getCustomPreferenceValueStub.reset();
        getCustomPreferenceValueStub.withArgs('cookieToSessionVariableMap').returns(null);
        var status = onRequest.onRequest();
        assert.isDefined(status);
        assert.isNotNull(status);
        assert.isFalse(readStub.withArgs('uaidm').called);
    });

    it('Test OnRequest: Check the OnRequest file for different browsers account deletion behaviour', () => {
        global.request = {
            session: {
                custom: {
                    customerLoggedOut: false
                }
            }
        };
        global.customer = {
            profile: {
                email: null
            }
        };
        global.response = {
            redirect() {}
        };
        var status = onRequest.onRequest();
        assert.isNotNull(status);
    });

    it('OnRequest => Checking when no customer in session', () => {
        global.session = {
            custom: {
                currentCountry: 'CA'
            }
        };
        var status = onRequest.onRequest();
        assert.isDefined(status);
        assert.isNotNull(status);
    });
});
