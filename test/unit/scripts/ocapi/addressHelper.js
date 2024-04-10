const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

describe('int_ocapi/cartridge/scripts/addressHelper.js', () => {
    const Constants = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/constants/constants.js', {});
    const testFile = '../../../../cartridges/int_ocapi/cartridge/scripts/addressHelper.js';
    var proxyquireData = {
        '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
        'dw/system/Logger': {
            getLogger: function () {
                return {
                    error: function () {
                        return 'error';
                    }
                };
            }
        },
        '*/cartridge/scripts/constants/constants': Constants,
        '*/cartridge/scripts/checkout/checkoutHelpers': {
            checkEmptyEmojiNonLatinChars: function () {
                return {
                    error: true
                };
            }
        },
        '*/cartridge/scripts/utils/checkCrossSiteScript': {
            crossSiteScriptPatterns: function () {
                return {
                    loginEmail: 'error'
                };
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
        countryCode: { value: 'NZ' },
        phone: '603-333-1212',
        stateCode: 'NH',
        suburb: ''
    };

    it('Testing method: validateAddress ', () => {
        proxyquireData['*/cartridge/scripts/checkout/checkoutHelpers'] = {
            checkEmptyEmojiNonLatinChars: function () {
                return {
                    error: true
                };
            }
        };
        var addressHelper = proxyquire(testFile, proxyquireData);
        assert.isNotNull(addressHelper.validateAddress(address));
    });
    it('Testing method: validateAddress --> error from crossSiteScriptPatterns()', () => {
        proxyquireData['*/cartridge/scripts/utils/checkCrossSiteScript'] = {
            crossSiteScriptPatterns: function () {
                return {
                    error: 'crossSiteScriptPatterns'
                };
            }
        };
        proxyquireData['*/cartridge/scripts/checkout/checkoutHelpers'] = {
            checkEmptyEmojiNonLatinChars: function () {
                return {};
            }
        };

        var addressHelper = proxyquire(testFile, proxyquireData);
        var result = addressHelper.validateAddress(address);

        assert.isNotNull(result);
        assert.equal('crossSiteScriptPatterns', result.error);
    });

    it('Testing method: deleteInvalidAddressFromProfile', () => {
        var addressHelper = proxyquire(testFile, proxyquireData);

        var profile = {
            addressBook: {
                addresses: [
                    address
                ],
                removeAddress: function (cAddress) {
                    this.addresses.forEach((value, key) => {
                        if (this.addresses[key].ID === cAddress.ID) {
                            this.addresses.splice(key, 1);
                        }
                    });
                }
            },
            profile: {
                firstName: 'John',
                lastName: 'Snow',
                email: 'jsnow@starks.com'
            },
            raw: {
                authenticated: true,
                registered: true
            }
        };

        addressHelper.deleteInvalidAddressFromProfile(profile);
        assert.isTrue(profile.addressBook.addresses.length === 0);
    });
});
