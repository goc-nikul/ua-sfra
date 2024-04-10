const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

describe('int_ocapi/cartridge/hooks/shop/customer/customer_address_hook_script.js', () => {
    const filePath = '../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/customer/customer_address_hook_script.js';
    const Status = require('../../../../../mocks/dw/dw_system_Status');
    var proxyquireData = {
        'dw/system/Status': Status,
        'dw/system/Site': require('../../../../../mocks/dw/dw_system_Site'),
        '*/cartridge/scripts/util/collections': require('../../../../../mocks/scripts/util/collections'),
        '*/cartridge/scripts/addressHelper': {
            validateAddress: function () {
                return {
                    error: true
                };
            },
            deleteInvalidAddressFromProfile: function () {
                return true;
            }
        },
        '*/cartridge/scripts/utils/PreferencesUtil': {
            getValue: function () {
                return true;
            }
        }
    };

    var address = {
        ID: '123',
        firstName: 'James',
        lastName: '',
        address1: '10 Oxford St',
        address2: 'suite 20',
        city: 'London',
        postalCode: '12345',
        countryCode: {
            value: 'NZ'
        },
        phone: '603-333-1212',
        stateCode: 'NH',
        suburb: ''
    };

    var customerAddressResultResponse = {
        _type: 'customer_address_result',
        data: [
            address
        ]
    };

    it('Testing method: modifyGETResponse --> delete address from response', () => {
        var testFile = proxyquire(filePath, proxyquireData);
        var result = testFile.modifyGETResponse(customerAddressResultResponse);
        global.request = {
            session: {
                customer: {
                    ID: '123'
                }
            }
        };

        assert.equal(Status.OK, result.status);
        assert.isTrue(customerAddressResultResponse.data.length === 0);
    });

    it('Testing method: modifyGETResponse --> no error when there is no address', () => {
        var testFile = proxyquire(filePath, proxyquireData);

        assert.doesNotThrow(() => testFile.modifyGETResponse({
            data: null
        }));

        assert.doesNotThrow(() => testFile.modifyGETResponse({
            data: []
        }));
    });
});
