'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var Site = {
    current: {
        preferences: {
            custom: {}
        }
    }
};

describe('int_2c2p/cartridge/scripts/config/2c2Prefs.js', () => {


    it('Testing secret ID: 2c2p config if secret not exists', () => {
        var c2pConfig = proxyquire('../../../../../cartridges/int_2c2p/cartridge/scripts/config/2c2Prefs.js', {
            'dw/system/Site': Site
        });
        assert.isNull(c2pConfig.secret, 'secret is null');
    });
    
    it('Testing merchantID ID: 2c2p config if merchantID not exists', () => {
        var c2pConfig = proxyquire('../../../../../cartridges/int_2c2p/cartridge/scripts/config/2c2Prefs.js', {
            'dw/system/Site': Site
        });
        assert.isNull(c2pConfig.merchantID, 'secret is null');
    });
    
    it('Testing request3DS ID: 2c2p config if request3DS not exists', () => {
        var c2pConfig = proxyquire('../../../../../cartridges/int_2c2p/cartridge/scripts/config/2c2Prefs.js', {
            'dw/system/Site': Site
        });
        assert.isNull(c2pConfig.request3DS, 'secret is null');
    });
    
    it('Testing frontendReturnUrl ID: 2c2p config if frontendReturnUrl not exists', () => {
        var c2pConfig = proxyquire('../../../../../cartridges/int_2c2p/cartridge/scripts/config/2c2Prefs.js', {
            'dw/system/Site': Site
        });
        assert.isNull(c2pConfig.frontendReturnUrl, 'secret is null');
    });
    
    it('Testing backendReturnUrl ID: 2c2p config if backendReturnUrl not exists', () => {
        var c2pConfig = proxyquire('../../../../../cartridges/int_2c2p/cartridge/scripts/config/2c2Prefs.js', {
            'dw/system/Site': Site
        });
        assert.isNull(c2pConfig.backendReturnUrl, 'secret is null');
    });
    
    it('Testing configuration2C2P ID: 2c2p config if configuration2C2P not exists', () => {
        var c2pConfig = proxyquire('../../../../../cartridges/int_2c2p/cartridge/scripts/config/2c2Prefs.js', {
            'dw/system/Site': Site
        });
        assert.isNull(c2pConfig.configuration2C2P, 'secret is null');
    });
    
    it('Testing returnVersion ID: 2c2p config if returnVersion not exists', () => {
        var c2pConfig = proxyquire('../../../../../cartridges/int_2c2p/cartridge/scripts/config/2c2Prefs.js', {
            'dw/system/Site': Site
        });
        assert.equal(c2pConfig.returnVersion, '3.4');
    });
    
    it('Testing refundCancelMaxDays2C2 ID: 2c2p config if refundCancelMaxDays2C2 not exists', () => {
        var c2pConfig = proxyquire('../../../../../cartridges/int_2c2p/cartridge/scripts/config/2c2Prefs.js', {
            'dw/system/Site': Site
        });
        assert.equal(c2pConfig.refundCancelMaxDays2C2, '10');
    });
    
});
