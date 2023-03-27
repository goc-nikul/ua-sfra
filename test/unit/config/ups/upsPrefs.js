'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_ups/cartridge/configs/upsPrefs.js', () => {

    var Site = {
        current: {
            preferences: {
                custom: {}
            }
        }
    };

    var upspref = proxyquire('../../../../cartridges/int_ups/cartridge/configs/upsPrefs.js', {
        'dw/system/Site': Site
    });

    it('Testing upspref returnAddress for not exists', () => {
        assert.isNull(upspref.returnAddress);
    });

    it('Testing upspref returnAddress for exists', () => {
        Site.current.preferences.custom.returnAddress = 'returnAddress';
        upspref = proxyquire('../../../../cartridges/int_ups/cartridge/configs/upsPrefs.js', {
            'dw/system/Site': Site
        });
        assert.equal(upspref.returnAddress, 'returnAddress');
    });

    it('Testing upspref returnFromAddress for not exists', () => {
        assert.isNull(upspref.returnFromAddress);
    });

    it('Testing upspref returnFromAddress for not exists', () => {
        Site.current.preferences.custom.returnFromAddress = 'returnFromAddress';
        upspref = proxyquire('../../../../cartridges/int_ups/cartridge/configs/upsPrefs.js', {
            'dw/system/Site': Site
        });
        assert.equal(upspref.returnFromAddress, 'returnFromAddress');
    });

    it('Testing upspref returnShipperAddress for not exists', () => {
        assert.isNull(upspref.returnShipperAddress);
    });

    it('Testing upspref returnShipperAddress for not exists', () => {
        Site.current.preferences.custom.returnShipperAddress = 'returnShipperAddress';
        upspref = proxyquire('../../../../cartridges/int_ups/cartridge/configs/upsPrefs.js', {
            'dw/system/Site': Site
        });
        assert.equal(upspref.returnShipperAddress, 'returnShipperAddress');
    });

    it('Testing upspref countryOverride for not exists', () => {
        assert.isNull(upspref.countryOverride);
    });

    it('Testing upspref countryOverride for not exists', () => {
        Site.current.preferences.custom.countryOverride = 'countryOverride';
        upspref = proxyquire('../../../../cartridges/int_ups/cartridge/configs/upsPrefs.js', {
            'dw/system/Site': Site
        });
        assert.equal(upspref.countryOverride, 'countryOverride');
    });

    it('Testing upspref showOrderReference for not exists', () => {
        assert.equal(upspref.showOrderReference.length, 0);
    });

    it('Testing upspref showOrderReference for not exists', () => {
        Site.current.preferences.custom.showOrderReference = [{
            name: 'abcd'
        }];
        upspref = proxyquire('../../../../cartridges/int_ups/cartridge/configs/upsPrefs.js', {
            'dw/system/Site': Site
        });
        assert.equal(upspref.showOrderReference.length, 1);
    });

});
