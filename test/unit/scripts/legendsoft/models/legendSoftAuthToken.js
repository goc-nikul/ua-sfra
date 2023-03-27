'use strict';

/* eslint-disable */

const assert = require('chai').assert;
var sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var stubcreateCustomObject = sinon.stub();

global.empty = (data) => {
    return !data;
};

describe('int_legendsoft/cartridge/cripts/models/LegendSoftAuthToken', function () {

    var LegendSoftAuthToken = proxyquire('../../../../../cartridges/int_legendsoft/cartridge/scripts/models/legendSoftAuthToken.js', {
        'dw/customer/CustomerMgr': require('../../../../mocks/dw/dw_customer_CustomerMgr'),
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        'dw/object/CustomObjectMgr': {
            getCustomObject: () => null,
            createCustomObject: stubcreateCustomObject
        },
        '*/cartridge/scripts/helpers/hooks': function hookshelper() {
            return {
                access_token: ' testtoken',
                expires_in: new Date()
            }
        }

    });
    it('Testing for LegendSoftAuthToken : Should return null', () => {
        var result = new LegendSoftAuthToken();
        assert.isNull(result.token);
    });

    it('Testing for getValidToken : Should return valid access token', () => {
        stubcreateCustomObject.returns({
            custom: { token: '1231',
            expires: new Date(10000000000000)
        }
        });
        var result = new LegendSoftAuthToken().getValidToken();
        assert.isNotNull(result.accessToken, 'Should not be a null value')
        assert.equal(result.accessToken, '1231');
        stubcreateCustomObject.reset();
    });

    it('Testing for getValidToken : For empty token', () => {
        stubcreateCustomObject.returns({
            custom: {}
        });
        var result = new LegendSoftAuthToken().getValidToken();
        assert.isUndefined(result.token);
        stubcreateCustomObject.reset();
    });
    it('Testing for updateCachedTokenObject', () => {
        stubcreateCustomObject.returns({
            custom: {}
        });
        var result = new LegendSoftAuthToken();
        assert.isNull(result.token);
        stubcreateCustomObject.reset();
    });

});
