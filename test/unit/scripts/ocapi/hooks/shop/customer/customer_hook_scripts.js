'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

describe('int_ocapi/cartridge/hooks/shop/customer/customer_hook_scripts.js', () => {
    var customerHookScript = proxyquire('../../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/customer/customer_hook_scripts.js', {
        'dw/system/Status': function () {},
        '*/cartridge/scripts/util/collections': require('../../../../../../mocks/scripts/util/collections'),
        '~/cartridge/scripts/basketHelper': {
            updateResponse: function () {
                return {};
            }
        }
    });

    it('Testing modifyGETResponse_v2', () => {
        var customerBasketsResultResponse = {
            baskets: [{}]
        };
        var result = customerHookScript.modifyGETResponse_v2(customer, customerBasketsResultResponse);
        assert.isNotNull(result);
    });
});
