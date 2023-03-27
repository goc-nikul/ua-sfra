'use strict';

const assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var Site = require('../../../mocks/dw/dw_system_Site');

var OnSession = proxyquire('../../../../cartridges/int_shoprunner/cartridge/scripts/OnSession', {
    'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
    'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
    'int_shoprunner/cartridge/scripts/DeleteShopRunnerCookie.ds': {
        deleteCookie: function () {
            return true;
        }
    }
});

describe('int_shoprunner/cartridge/scripts/OnSession test', () => {
    it('Testing method: onSession', () => {
        OnSession.onSession();
        assert.equal(true, Site.getCurrent().getCustomPreferenceValue('sr_enabled'));
    });
});
