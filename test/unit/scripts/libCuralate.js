'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/scripts/utils/libCuralate test', () => {
    var libCuralate = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/utils/libCuralate.js', {});

    it('Testing method: libCuralate prepareLocale', () => {
        assert.equal(libCuralate.prepareLocale('en_US'), 'en-US', 'Locale converted to en-US');
        assert.equal(libCuralate.prepareLocale('default'), 'en-US', 'Locale converted to en-US');
        assert.equal(libCuralate.prepareLocale('es_ES'), 'es-ES', 'Locale converted to es-ES');
    });
});
