'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/providers/NiceIDMobileAuthProvider', function () {

    let NiceIDMobileAuthProvider = proxyquire('../../../cartridges/app_ua_core/cartridge/providers/NiceIDMobileAuthProvider', {
        './AbstractMobileAuthProvider': require('../../mocks/scripts/AbstractProvider'),
        'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
        '*/cartridge/scripts/helpers/NiceIDHelpers': {
            isValidAuthToken: function () {
                return true;
            },
            generateAuthToken: function () { },
            getTokenCustomObject: function () {
                return {
                    custom: {
                        token: '1234'
                    }
                };
            },
            generateCryptoToken: function (val) {
                return val;
            },
            encryptData: function (val) {
                return val;
            },
            decryptReturnData: function () {
                return '{"ci":"1234","utf8_name":"test","mobileno":"01012341234","gender":"1","birthdate":"20100101"}';
            },
            getProfilesWithDuplicateCI: function () {
                return [{
                    email: 'test@test.com'
                }];
            },
            getDataFromSession: function () {
                return {
                    mobileAuthCI: '1234',
                    name: 'test',
                    gender: '1',
                    phone1: '010',
                    phone2: '1234',
                    phone3: '1234',
                    birthYear: '2010',
                    birthMonth: '1',
                    birthDay: '1'
                };
            },
            validateAge: function () {
                return true;
            }
        }
    });

    it('Testing method: getValidToken', () => {
        let provider = new NiceIDMobileAuthProvider();
        let result = provider.getValidToken();
        assert.equal(result.custom.token, '1234');
    });

    it('Testing method: getValidToken throw errors', () => {
        let NiceIDMobileAuthProvider = proxyquire('../../../cartridges/app_ua_core/cartridge/providers/NiceIDMobileAuthProvider', {
            './AbstractMobileAuthProvider': require('../../mocks/scripts/AbstractProvider'),
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            '*/cartridge/scripts/helpers/NiceIDHelpers': {
                isValidAuthToken: function () {
                    return false;
                },
                generateAuthToken: function () {
                    throw new Error('error');
                },
                getTokenCustomObject: function () {
                    return {
                        custom: {
                            token: '1234'
                        }
                    };
                },
                generateCryptoToken: function (val) {
                    throw new Error('error');
                },
                encryptData: function (val) {
                    throw new Error('error');
                },
                decryptReturnData: function () {
                    throw new Error('error');
                },
                getProfilesWithDuplicateCI: function () {
                    throw new Error('error');
                },
                getDataFromSession: function () {
                    throw new Error('error');
                },
                validateAge: function () {
                    throw new Error('error');
                }
            }
        });
        let provider = new NiceIDMobileAuthProvider();
        let result = provider.getValidToken();
        assert.equal(result.custom.token, '1234');

        provider.refreshToken();

        result = provider.getCryptoToken('1234');
        assert.equal(result, null);

        result = provider.encryptData('1234');
        assert.equal(result, null);

        result = provider.decryptData();
        assert.equal(result, null);

        result = provider.checkCIDuplication({
            ci: '1234'
        });
        assert.equal(result, null);

        result = provider.getDataFromSession();
        assert.equal(result, null);

        result = provider.validateAge();
        assert.equal(result, false);
    });

    it('Testing method: refreshToken', () => {
        let provider = new NiceIDMobileAuthProvider();
        provider.refreshToken();
    });

    it('Testing method: getCryptoToken', () => {
        let provider = new NiceIDMobileAuthProvider();
        let result = provider.getCryptoToken('1234');
        assert.equal(result, '1234');
    });

    it('Testing method: encryptData', () => {
        let provider = new NiceIDMobileAuthProvider();
        let result = provider.encryptData('1234');
        assert.equal(result, '1234');
    });

    it('Testing method: decryptData', () => {
        let provider = new NiceIDMobileAuthProvider();
        let result = provider.decryptData();
        assert.equal(result.ci, '1234');
        assert.equal(result.utf8_name, 'test');
        assert.equal(result.mobileno, '01012341234');
        assert.equal(result.gender, '1');
        assert.equal(result.birthdate, '20100101');
    });

    it('Testing method: checkCIDuplication', () => {
        let provider = new NiceIDMobileAuthProvider();
        let result = provider.checkCIDuplication({
            ci: '1234'
        });
        assert.isDefined(result);
        assert.equal(result[0].email, 'test@test.com');
    });

    it('Testing method: getDataFromSession', () => {
        let provider = new NiceIDMobileAuthProvider();
        let result = provider.getDataFromSession();
        assert.isDefined(result);
        assert.equal(result.mobileAuthCI, '1234');
        assert.equal(result.name, 'test');
        assert.equal(result.gender, '1');
        assert.equal(result.phone1, '010');
        assert.equal(result.phone2, '1234');
        assert.equal(result.phone3, '1234');
        assert.equal(result.birthYear, '2010');
        assert.equal(result.birthMonth, '1');
        assert.equal(result.birthDay, '1');
    });

    it('Testing method: validateAge', () => {
        let provider = new NiceIDMobileAuthProvider();
        let result = provider.validateAge();
        assert.equal(result, true);
    });
});
