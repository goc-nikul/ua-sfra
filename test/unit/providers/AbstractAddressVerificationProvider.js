'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var Site = require('../../mocks/dw/dw_system_Site');
var currentSite = Site.getCurrent();

class QASAddressVerificationProvider {
	enabledInBM() {
		return true;
	}
}
function EmptyModel() {
    return {
        enabledInBM: function () {
            return {};
        }
    }
}
describe('app_ua_core/cartridge/providers/AbstractAddressVerificationProvider', function() {

    let AbstractAddressVerificationProvider = proxyquire('../../../cartridges/app_ua_core/cartridge/providers/AbstractAddressVerificationProvider', {
        '../scripts/utils/Class': require('../../../cartridges/app_ua_core/cartridge/scripts/utils/Class'),
        'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
        './QASAddressVerificationProvider': QASAddressVerificationProvider
    });

    let provider = new AbstractAddressVerificationProvider();

    it('Testing method: init', () => {
        provider.init();
        assert.equal('object', typeof provider.options);
        assert.equal('object', typeof provider.params);
    });

    it('Testing method: getMock', () => {
        let result = provider.getMock();
        assert.equal(true, result.hasOwnProperty('enabledInBM'));
        assert.equal(true, result.hasOwnProperty('get'));
        assert.equal(true, result.hasOwnProperty('search'));
        assert.equal(true, result.hasOwnProperty('update'));
        assert.equal(true, result.hasOwnProperty('typeDownSearch'));


        assert.equal(false, result.enabledInBM());

        var getResult = result.get();
        assert.equal(false, getResult.success);

        var searchResult = result.search();
        assert.equal(false, searchResult.success);

        var searchResult = result.search();
        assert.equal('None', searchResult.status);

        var updateResult = result.update();
        assert.equal(true, updateResult.hasOwnProperty('address'));

        var typeDownSearchResult = result.typeDownSearch();
        assert.equal(false, typeDownSearchResult.success);
    });
    it('Testing method: get', () => {
        let result = provider.get();
        assert.isObject(result);

        var tempResult;
        currentSite.preferenceMap.addressVerificationProvider =  'QAS';
        tempResult = provider.get();

        currentSite.preferenceMap.addressVerificationProvider =  '';
        tempResult = provider.get();
    });

    it('Testing method: get, enabledInBM is false', () => {

        AbstractAddressVerificationProvider = proxyquire('../../../cartridges/app_ua_core/cartridge/providers/AbstractAddressVerificationProvider', {
            '../scripts/utils/Class': require('../../../cartridges/app_ua_core/cartridge/scripts/utils/Class'),
            'dw/system/Site':  {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function () {
                            return {
                                value: 'test'
                            }
                        }
                    }
                }
            },
            './QASAddressVerificationProvider': QASAddressVerificationProvider,
            './testAddressVerificationProvider': EmptyModel,
        });
        provider = new AbstractAddressVerificationProvider();
        let result = provider.get();
        assert.isObject(result);

        var tempResult;
        currentSite.preferenceMap.addressVerificationProvider =  'QAS';
        tempResult = provider.get();

        currentSite.preferenceMap.addressVerificationProvider =  '';
        tempResult = provider.get();
    });
});
