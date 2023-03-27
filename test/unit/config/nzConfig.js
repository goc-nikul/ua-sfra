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

describe('int_nzpost/int_nzpost/cartridge/config/nzConfig.js', () => {


    it('Testing client ID: nz config if client not exists', () => {
        var nzConfig = proxyquire('../../../cartridges/int_nzpost/int_nzpost/cartridge/config/nzConfig.js', {
            'dw/system/Site': Site
        });
        assert.isNotNull(nzConfig.clientId, 'clientId is null');
        assert.isDefined(nzConfig.clientId, 'clientId is not defined');
    });

    it('Testing client ID: nz config if client exists', () => {
        Site.current.preferences.custom = {
            nzpostClientID: '1234'
        };
        var nzConfig = proxyquire('../../../cartridges/int_nzpost/int_nzpost/cartridge/config/nzConfig.js', {
            'dw/system/Site': Site
        });
        assert.isNotNull(nzConfig.clientId, 'clientId is null');
        assert.isDefined(nzConfig.clientId, 'clientId is not defined');
        assert.equal(nzConfig.clientId, '1234');
        delete Site.current.preferences.custom.nzpostClientID;
    });

    it('Testing nzpostSecretKey: nz config if nzpostSecretKey not exists', () => {
        var nzConfig = proxyquire('../../../cartridges/int_nzpost/int_nzpost/cartridge/config/nzConfig.js', {
            'dw/system/Site': Site
        });
        assert.isNotNull(nzConfig.clientSecret, 'nzpostSecretKey is null');
        assert.isDefined(nzConfig.clientSecret, 'nzpostSecretKey is not defined');
    });

    it('Testing nzpostSecretKey: nz config if nzpostSecretKey exists', () => {
        Site.current.preferences.custom = {
            nzpostSecretKey: '12345'
        };
        var nzConfig = proxyquire('../../../cartridges/int_nzpost/int_nzpost/cartridge/config/nzConfig.js', {
            'dw/system/Site': Site
        });
        assert.isNotNull(nzConfig.clientSecret, 'nzpostSecretKey is null');
        assert.isDefined(nzConfig.clientSecret, 'nzpostSecretKey is not defined');
        assert.equal(nzConfig.clientSecret, '12345');
        delete Site.current.preferences.custom.nzpostSecretKey;
    });

    it('Testing nzpostConfigurations: nz config if nzpostConfigurations not exists', () => {
        var nzConfig = proxyquire('../../../cartridges/int_nzpost/int_nzpost/cartridge/config/nzConfig.js', {
            'dw/system/Site': Site
        });
        assert.isNotNull(nzConfig.nzpostConfigurations, 'nzpostConfigurations is null');
        assert.isDefined(nzConfig.nzpostConfigurations, 'nzpostConfigurations is not defined');
    });

    it('Testing nzpostSecretKey: nz config if nzpostConfigurations exists', () => {
        Site.current.preferences.custom = {
            nzpostConfigurations: '123456'
        };
        var nzConfig = proxyquire('../../../cartridges/int_nzpost/int_nzpost/cartridge/config/nzConfig.js', {
            'dw/system/Site': Site
        });
        assert.isNotNull(nzConfig.nzpostConfigurations, 'nzpostConfigurations is null');
        assert.isDefined(nzConfig.nzpostConfigurations, 'nzpostConfigurations is not defined');
        assert.equal(nzConfig.nzpostConfigurations, '123456');
        delete Site.current.preferences.custom.nzpostConfigurations;
    });

});
