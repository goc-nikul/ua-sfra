'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var sinon = require('sinon');

var getCustomPreferenceValueStub = sinon.stub();

global.empty = (data) => {
    return !data;
};

// stubs returns
getCustomPreferenceValueStub.withArgs('firstDataAuthClientId').returns('test_client_id');
getCustomPreferenceValueStub.withArgs('firstDataAuthClientSecret').returns('test_secret key');
getCustomPreferenceValueStub.withArgs('firstDataAuthAudience').returns('testdata');
getCustomPreferenceValueStub.withArgs('firstDataAuthGrantType').returns('test type');
getCustomPreferenceValueStub.withArgs('firstDataMaxGiftcards').returns(3);
getCustomPreferenceValueStub.withArgs('firstDataAuthHostname').returns('test host');
getCustomPreferenceValueStub.withArgs('firstDataGraphQLApiUrl').returns(3);
getCustomPreferenceValueStub.withArgs('firstDataMaxGiftcards').returns(8);

describe('int_first_data/cartridge/scripts/firstDataPreferences.js', () => {
    it('should return empty object if prefernces are not present', () => {
        var firstDataPreferences = proxyquire('../../../../cartridges/int_first_data/cartridge/scripts/firstDataPreferences', {
            'dw/system/Site': {
                getCurrent() {
                    return {
                        getCustomPreferenceValue: getCustomPreferenceValueStub
                    };
                }
            }
        });
        assert.isDefined(firstDataPreferences);
        assert.deepEqual(firstDataPreferences, {});
    });

    it('should return object of prefrences value if prefernces are present', () => {
        var firstDataPreferences = proxyquire('../../../../cartridges/int_first_data/cartridge/scripts/firstDataPreferences', {
            'dw/system/Site': {
                getCurrent() {
                    return {
                        getCustomPreferenceValue: getCustomPreferenceValueStub,
                        preferences: {}
                    };
                }
            }
        });
        assert.isDefined(firstDataPreferences);
    });

    it('should return object of prefrences value if prefernces are present', () => {
        var firstDataPreferences = proxyquire('../../../../cartridges/int_first_data/cartridge/scripts/firstDataPreferences', {
            'dw/system/Site': {
                getCurrent() {
                    return {
                        getCustomPreferenceValue: getCustomPreferenceValueStub,
                        preferences: {}
                    };
                }
            }
        });
        assert.isDefined(firstDataPreferences);
        assert.isDefined(firstDataPreferences.clientId);
        assert.isDefined(firstDataPreferences.clientSecret);
        assert.isDefined(firstDataPreferences.grantType);
        assert.isDefined(firstDataPreferences.authHostname);
        assert.isDefined(firstDataPreferences.graphQLApiUrl);
        assert.isDefined(firstDataPreferences.maxGiftcards);
        assert.equal(firstDataPreferences.maxGiftcards, 8);

        getCustomPreferenceValueStub.withArgs('firstDataMaxGiftcards').returns(0);
        firstDataPreferences = proxyquire('../../../../cartridges/int_first_data/cartridge/scripts/firstDataPreferences', {
            'dw/system/Site': {
                getCurrent() {
                    return {
                        getCustomPreferenceValue: getCustomPreferenceValueStub,
                        preferences: {}
                    };
                }
            }
        });

        assert.isDefined(firstDataPreferences);
        assert.isDefined(firstDataPreferences.clientId);
        assert.isDefined(firstDataPreferences.clientSecret);
        assert.isDefined(firstDataPreferences.grantType);
        assert.isDefined(firstDataPreferences.authHostname);
        assert.isDefined(firstDataPreferences.graphQLApiUrl);
        assert.isDefined(firstDataPreferences.maxGiftcards);
        assert.equal(firstDataPreferences.maxGiftcards, 2);
    });
});
