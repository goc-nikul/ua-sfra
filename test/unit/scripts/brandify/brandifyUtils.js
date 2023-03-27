'use strict';

var sinon = require('sinon');
const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var getStoreStub = sinon.stub();

class HashSet {
    add() {
        return true;
    }
}

describe('int_brandify/cartridge/scripts/BrandifyUtils.js', () => {

    var brandifyUtils = proxyquire('../../../../cartridges/int_brandify/cartridge/scripts/BrandifyUtils.js', {
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
        '*/cartridge/scripts/BrandifyPreferences': '',
        'dw/catalog/StoreMgr': {
            getStore: getStoreStub
        },
        '*/cartridge/models/stores': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/store'),
        'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
        'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
        'dw/util/HashSet': HashSet
    });

    it('Testing method: getStoreCountryCode', () => {
        global.request = {
            locale: {
                countryCode: 'US'
            },
            geolocation: {
                countryCode: 'CA'
            }
        };
        assert.equal(brandifyUtils.getStoreCountryCode(), 'CA')
    });

    it('Testing method: buildRequestJSON', () => {
        assert.doesNotThrow(() => {
            brandifyUtils.buildRequestJSON();
        });
    });

    it('Testing method: filterStoreSearch', () => {
        assert.doesNotThrow(() => brandifyUtils.filterStoreSearch());
        var response = {
            object: {
                statusCode: 200,
                text: 'invalid_response'
            }
        };
        brandifyUtils.filterStoreSearch(response);
        response.object.text = '{"response": {"collection": [{"stnum": "123"}]}}';
        getStoreStub.returns('123');
        brandifyUtils.filterStoreSearch(response, 10, '12345');
        brandifyUtils.filterStoreSearch(response, 10, null, 'lat', 'long');
        getStoreStub.resetBehavior();
    });

});
