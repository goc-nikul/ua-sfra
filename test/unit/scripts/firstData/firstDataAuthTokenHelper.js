'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var sinon = require('sinon');

// stubs
var validateServiceResponseStub = sinon.stub();
var getCustomObjectStub = sinon.stub();
var createCustomObjectStub = sinon.stub();
class TimezoneHelper {
    getCurrentSiteTime() {
        return new Date();
    }
}

class Calendar {
    constructor(date) {
        this.date = date;
        this.DATE = 5;
        this.DAY_OF_WEEK = 7;
        this.SATURDAY = 7;
        this.SUNDAY = 1;
    }

    add(field, value) {
        if (field === this.DATE) {
            this.date.setDate(this.date.getDate() + value);
        }
    }

    before() {
        return false;
    }

    toTimeString() {
        return this.date;
    }

    get() {
        return 2;
    }
    getTime() {
        return {
            toISOString() {
                return {};
            }
        };
    }
}

describe('int_first_data/cartridge/scripts/firstDataAuthTokenHelper.js', () => {
    Calendar.prototype.before = () => true;
    var AuthToken = proxyquire('../../../../cartridges/int_first_data/cartridge/scripts/firstDataAuthTokenHelper', {
        'dw/util/Calendar': Calendar,
        '*/cartridge/scripts/util/TimezoneHelper': TimezoneHelper,
        '~/cartridge/scripts/firstDataPreferences': {
            authHostname: 'https://testurl.com',
            clientId: 'testid'
        },
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
        'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
        'dw/object/CustomObjectMgr': {
            getCustomObject: getCustomObjectStub,
            createCustomObject: createCustomObjectStub

        },
        '*/cartridge/scripts/firstDataHelper': {
            validateServiceResponse: validateServiceResponseStub,
            getAuthAccessToken() { return { object: { text: JSON.stringify({ expires_in: '12123', access_token: 'test token', token_type: 'test', scope: 'site' }) } }; }
        }
    });

    createCustomObjectStub.returns({
        getCustom: function () {
            return {};
        }
    });
    var result;
    it('Testing AuthToken: should return token as null', () => {
        var AuthTokenObj = new AuthToken();
        assert.isDefined(AuthTokenObj);
        assert.isDefined(AuthTokenObj.token);
        assert.isNull(AuthTokenObj.token);
    });

    it('Testing getValidToken: should log the error message and return false', () => {
        validateServiceResponseStub.returns(false);
        var AuthTokenObj = new AuthToken();
        result = AuthTokenObj.getValidToken();
        assert.isDefined(result);
        assert.isFalse(result);
    });

    it('Testing getValidToken: should generate the new token from auth request if token is not valid', () => {
        validateServiceResponseStub.returns(true);
        var AuthTokenObj = new AuthToken();
        result = AuthTokenObj.getValidToken();
        assert.isDefined(result);
    });

    it('Testing getValidToken: should not createthe new token from auth request if token is valid', () => {
        getCustomObjectStub.returns({ getCustom() { return { token: '{"accessToken":"test token"}', expires: '12431' }; } });
        var AuthTokenObj = new AuthToken();
        result = AuthTokenObj.getValidToken();
        assert.isDefined(result);
    });

    it('Testing isValidAuth: should return true if token is valid ', () => {
        var AuthTokenObj = new AuthToken();
        result = AuthTokenObj.isValidAuth();
        assert.isDefined(result);
    });

    it('Testing refreshToken: should update the token if token is expired', () => {
        var AuthTokenObj = new AuthToken();
        result = AuthTokenObj.refreshToken();
        assert.isDefined(AuthTokenObj.token);
    });

    it('Testing refreshToken: should not update the token if token is not expired', () => {
        validateServiceResponseStub.returns(false);
        var AuthTokenObj = new AuthToken();
        result = AuthTokenObj.refreshToken();
        assert.isNull(AuthTokenObj.token);
    });
});
