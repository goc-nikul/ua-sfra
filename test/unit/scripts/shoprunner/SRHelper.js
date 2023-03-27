'use strict';

const assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const ShippingMgr = require('../../../mocks/dw/dw_order_ShippingMgr');

var SRHelper = proxyquire('../../../../cartridges/plugin_shoprunner/cartridge/scripts/SRHelper', {
    'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
    'int_shoprunner/cartridge/scripts/checkout/GetApplicableShippingMethods': {
        getMethods: function () {
            return ShippingMgr.getAllShippingMethods();
        }
    },
    'int_shoprunner/cartridge/scripts/DeleteShopRunnerCookie': {
        deleteCookie: function () {
            return true;
        }
    },
    'int_shoprunner/cartridge/scripts/checkout/CheckCartEligibility': {
        checkEligibility: function () {
            return true;
        }
    }
});

describe('int_shoprunner/cartridge/scripts/SRHelper test', () => {
    it('Testing method: GetApplicableShippingMethods', () => {
        var result = SRHelper.GetApplicableShippingMethods(); // eslint-disable-line
        assert.equal(result.length > 0, true);
    });
    it('Testing method: DeleteShopRunnerCookie', () => {
        SRHelper.DeleteShopRunnerCookie(); // eslint-disable-line
    });
    it('Testing method: CheckCartEligibility', () => {
        var result = SRHelper.CheckCartEligibility(); // eslint-disable-line
        assert.equal(result, true);
    });
});
