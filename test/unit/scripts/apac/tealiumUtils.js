'use strict';


const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../mockModuleSuperModule');

var tealiumUtils;
function Base() { }
describe('app_ua_apac/cartridge/scripts/tealiumUtils', function () {
    before(function () {
        mockSuperModule.create(Base);
        tealiumUtils = proxyquire('../../../../cartridges/app_ua_apac/cartridge/scripts/tealiumUtils', {
        });
    });

    it('Testing for cleanMoney - tealiumUtils $1.000,00 CAD to 1,000.00', () => {
        tealiumUtils = proxyquire('../../../../cartridges/app_ua_apac/cartridge/scripts/tealiumUtils', {
        });
        var dirtyValue = '$1.000,00 CAD';
        var result = tealiumUtils.cleanMoney(dirtyValue);
        assert.equal(result, '1,000.00');
    });

    it('Testing for cleanMoney - tealiumUtils $4.00 to 4.00', () => {
        tealiumUtils = proxyquire('../../../../cartridges/app_ua_apac/cartridge/scripts/tealiumUtils', {
        });
        var dirtyValue = '$4.00';
        var result = tealiumUtils.cleanMoney(dirtyValue);
        assert.equal(result, '4.00');
    });
});

