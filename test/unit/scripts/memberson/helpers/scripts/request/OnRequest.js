'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();


var onRequest;
describe('int_memberson/cartridge/scripts/request/OnRequest.js', () => {
    onRequest = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/request/OnRequest.js', {
        'dw/web/URLUtils': require('../../../../../../mocks/dw/dw_web_URLUtils'),
        'dw/system/HookMgr': {
            hasHook: function () {
                return true;
            },
            callHook: function () {
                return {
                    error: false,
                    membersonEnabled: true
                };
            }
        },
        '*/cartridge/scripts/helpers/membersonHelpers': {
            validateUserForMemberson: () => {
                return true;
            }
        }
    });

    it('Test OnRequest: Check the OnRequest file for memberson', () => {
        global.request = {
            httpPath: 'Test',
            session: {
                customer: {
                    authenticated: true,
                    profile: {
                        email: 'test@test.com',
                        birthday: '',
                        custom: {
                            'Loyalty-OptStatus': true,
                            'Loyalty-ID': '',
                            'birthYear': ''
                        }
                    }
                }
            }
        };
        global.session.custom.customerCountry = 'US';
        global.response = {
            redirect() {}
        };
        var status = onRequest.onRequest();
        assert.isNotNull(status);
    });
});
