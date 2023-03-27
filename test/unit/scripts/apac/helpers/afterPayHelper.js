'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();


describe('app_ua_apac/cartridge/scripts/helpers/afterPayHelper', function() {

    let afterPayHelper = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/afterPayHelper.js', {
        'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
        'dw/value/Money': require('../../../../mocks/dw/dw_value_Money'),
    });

    it('Testing method: getAfterPayInstallmentPrice', () => {
        var price = {
            value:100
        }
        var result = afterPayHelper.getAfterPayInstallmentPrice(price);
        assert.isNotNull(result)
    });

    it('Testing method: getAfterPayInstallmentPrice price->0', () => {
        var price = {
            value:0
        }
        var result = afterPayHelper.getAfterPayInstallmentPrice(price);
        assert.isNotNull(result)
        assert.equal(result, '$0')
    });
});
