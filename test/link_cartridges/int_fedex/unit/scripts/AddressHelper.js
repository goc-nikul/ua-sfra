'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

// Path to scripts
var pathToCartridges = '../../../../../cartridges/';
var pathToLinkScripts = pathToCartridges + 'int_fedex/cartridge/scripts/';

// Path to test scripts
var pathToCoreMock = '../../../../mocks/';
var pathToLinkMock = '../../mock/';

describe('Fedex: util/AddressHelper test', () => {
    global.empty = (data) => {
        return !data;
    };

    var AddressHelper = proxyquire(pathToLinkScripts + 'util/AddressHelper', {
        'dw/crypto/MessageDigest': require(pathToCoreMock + 'dw/dw_crypto_MessageDigest'),
        'dw/crypto/Encoding': require(pathToCoreMock + 'dw/dw_crypto_Encoding'),
        'dw/util/Bytes': require(pathToCoreMock + 'dw/dw_util_Bytes'),
        'dw/system/Logger': require(pathToCoreMock + 'dw/dw_system_Logger'),
        'dw/system/Transaction': require(pathToCoreMock + 'dw/dw_system_Transaction'),
        'int_fedex/cartridge/scripts/init/FedExService': require(pathToLinkMock + 'scripts/FedExService'),
        'app_ua_core/cartridge/scripts/utils/PreferencesUtil': require(pathToCoreMock + 'scripts/PreferencesUtil')
    });

    it('Testing method: getAddressType', () => {
        var result;
        var CustomerAddress = require(pathToCoreMock + 'dw/dw_customer_CustomerAddress');
        var address = new CustomerAddress();
        address.city = 'London';

        // Case AddressType empty
        result = AddressHelper.getAddressType(address);
        assert.equal('RESIDENTIAL', result);

        // Case addressType exist
        address.custom.addressType = 'BUSINESS';
        result = AddressHelper.getAddressType(address);

        assert.equal('BUSINESS', result);
    });
});
