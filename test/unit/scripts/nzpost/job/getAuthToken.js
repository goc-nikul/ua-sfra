'use strict';

const {
    assert
} = require('chai');

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_nzpost/cartridge/scripts/job/getAuthToken.js', () => {

    it('Testing getAuthToken if access token is null', () => {
        var authToken = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/job/getAuthToken.js', {
            'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
            '*/cartridge/scripts/helpers/nzPostHelpers': {
                getOAuthToken: () => {
                    return {
                        access_token: null
                    }
                }
            },
            '*/cartridge/scripts/helpers/customObjectHelpers': {
                saveAuthToken: () => {}
            }
        });
        var authStatus = authToken.getAuthToken();
        assert.isNotNull(authStatus.OK, 'authToken is null');
    });

    it('Testing getAuthToken if access token is null', () => {
        var authToken = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/job/getAuthToken.js', {
            'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
            '*/cartridge/scripts/helpers/nzPostHelpers': {
                getOAuthToken: () => {
                    return {
                        access_token: 'ABCD'
                    }
                }
            },
            '*/cartridge/scripts/helpers/customObjectHelpers': {
                saveAuthToken: () => {}
            }
        });
        var authStatus = authToken.getAuthToken();
        assert.isNotNull(authStatus.OK, 'authToken is null');
    });

});
