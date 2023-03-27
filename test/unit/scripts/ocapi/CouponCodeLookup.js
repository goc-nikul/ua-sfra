'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

describe('int_ocapi/cartridge/scripts/CouponCodeLookup.js', () => {
    var CouponCodeLookup = proxyquire('../../../../cartridges/int_ocapi/cartridge/scripts/CouponCodeLookup.js', {
        'dw/campaign/CouponMgr': {
            getCouponByCode: function () {
                return {
                    ID: 'testID'
                };
            }
        }
    });

    it('Testing getCouponId', () => {
        var result = CouponCodeLookup.getCouponId('couponCode');
        assert.equal(result, 'testID');
    });

    it('Testing getCouponId --> getCouponByCode return null', () => {
        CouponCodeLookup = proxyquire('../../../../cartridges/int_ocapi/cartridge/scripts/CouponCodeLookup.js', {
            'dw/campaign/CouponMgr': {
                getCouponByCode: function () {
                    return null;
                }
            }
        });
        var result = CouponCodeLookup.getCouponId('couponCode');
        assert.isNull(result);
    });
});
