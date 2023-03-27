'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var sinon = require('sinon');

// stub
var callStub = sinon.stub();

var serviceMock = {
    getConfiguration() {
        return {
            credential: {
                URL: ' https:/ua_coupontest.com'
            }
        };
    },
    addHeader() { },
    setRequestMethod() { },
    setURL() { }
};

var params = {
    couponId: 'coupn23432',
    token: '234hsfjwosjhf234'
};

describe('int_ocapi/cartridge/scripts/services/CouponAuthCheckService.js', () => {
    var CouponAuthCheckService = proxyquire('../../../../../cartridges/int_ocapi/cartridge/scripts/services/CouponAuthCheckService', {
        'dw/svc/LocalServiceRegistry': {
            createService: function (svcId, callbackObj) {
                callbackObj.createRequest(serviceMock, params);
                callbackObj.parseResponse(serviceMock, params);
                return {
                    call: callStub
                };
            }
        }
    });

    it('should return false when service response status is not OK', () => {
        callStub.returns({
            status: 'ERROR',
            error: 500
        });
        var result = CouponAuthCheckService.call(params);
        assert.isDefined(result);
        assert.isFalse(result);
        callStub.reset();
    });

    it('should return true when service response error code is 404', () => {
        callStub.returns({
            status: 'ERROR',
            error: 404
        });
        var result = CouponAuthCheckService.call(params);
        assert.isDefined(result);
        assert.isTrue(result);
        callStub.reset();
    });

    it('should return true when service response status is OK', () => {
        callStub.returns({
            status: 'OK',
            error: 200
        });
        var result = CouponAuthCheckService.call(params);
        assert.isDefined(result);
        assert.isTrue(result);
        callStub.reset();
    });
});
