'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');
var getValidTokenStub = sinon.stub();
var getCustomPreferenceValueStub = sinon.stub();

var Site = {
    current: {
        preferences: {
            custom: {
                filePathForTokenRefesh: 'testpath'
            }
        },
        getCustomPreferenceValue: getCustomPreferenceValueStub

    }
};

var TokenHelper = function () {
    this.getValidToken = getValidTokenStub;
    this.refreshToken = () => {
        return this.getValidToken();
    };
};

global.empty = (data) => {
    return !data;
};

describe('app_ua_core/cartridge/scripts/jobs/refreshAccessTokens.js', () => {
    var RefreshAccessTokens = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/jobs/refreshAccessTokens.js', {
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
        'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
        'dw/system/Site': Site,
        'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList'),
        'int_marketing_cloud/cartridge/scripts/models/authToken.js': TokenHelper,
        'int_mao/cartridge/scripts/MAOAuthTokenHelper.js': TokenHelper,
        'int_VIP/cartridge/scripts/util/VIPAuthTokenHelper.js': TokenHelper,
        'int_first_data/cartridge/scripts/firstDataAuthTokenHelper.js': TokenHelper
    });

    it('Testing Job: when unknown exception occured', () => {
        getCustomPreferenceValueStub.returns('');
        getValidTokenStub.throws(new Error('Custom Error Check'));
        var status = RefreshAccessTokens.execute({
            tokenRefreshTime: 10
        });
        assert.isNotNull(status, 'status is null');
        assert.isDefined(status, 'status is undefined');
        getCustomPreferenceValueStub.reset();
        getValidTokenStub.reset();
    });

    it('Testing Job: when no exception occured', () => {
        getCustomPreferenceValueStub.returns('int_marketing_cloud/cartridge/scripts/models/authToken.js');
        getValidTokenStub.returns({
            token: 'US45skaafekdDfsg',
            expires: new Date().getTime()
        });
        var status = RefreshAccessTokens.execute();
        assert.isNotNull(status, 'status is null');
        assert.isDefined(status, 'status is undefined');
        getCustomPreferenceValueStub.reset();
        getValidTokenStub.reset();
    });

    it('Testing Job:for token expiry time', () => {
        getValidTokenStub.returns({
            token: 'US45skaafekdDfsg',
            expires: new Date('2022-08-12').getTime()
        });
        var status = RefreshAccessTokens.execute({
            tokenRefreshTime: 10
        });
        assert.isNotNull(status, 'status is null');
        assert.isDefined(status, 'status is undefined');
        getValidTokenStub.reset();
    });
});
