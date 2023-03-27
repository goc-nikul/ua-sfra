'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/providers/FedExAddressTypeProvider', function() {

    let FedExAddressTypeProvider = proxyquire('../../../cartridges/app_ua_core/cartridge/providers/FedExAddressTypeProvider', {
        './AbstractAddressTypeProvider': require('../../mocks/scripts/AbstractProvider'),
        'int_fedex/cartridge/scripts/util/AddressHelper': {
            getAddressType: function() {
                return 'testType'
            }
        }
    });

    let provider = new FedExAddressTypeProvider();

    it('Testing method: addressType', () => {
        let result = provider.addressType();
        assert.equal('testType', result);
    });
});
