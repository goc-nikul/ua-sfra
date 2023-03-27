'use strict';

const sinon = require('sinon');
const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var buildRequestJSONStub = sinon.stub();
var serviceCallStub = sinon.stub();
var filterStoreSearchStub = sinon.stub();

describe('Testing int_brandify/cartridge/scripts/storeLocator/brandifyStoreHelper.js', () => {

    var brandifyStoreHelper = proxyquire('../../../../../cartridges/int_brandify/cartridge/scripts/storeLocator/brandifyStoreHelper.js', {
        '*/cartridge/scripts/BrandifyUtils': {
            buildRequestJSON: buildRequestJSONStub,
            filterStoreSearch: filterStoreSearchStub
        },
        '*/cartridge/scripts/services/BrandifyService': {
            call: serviceCallStub
        }
    });

    it('Testing method: getStoresByPostalCode', () => {
        filterStoreSearchStub.returns({
            name: 'store1'
        });
        assert.deepEqual(brandifyStoreHelper.getStoresByPostalCode(), {
            name: 'store1'
        });
        filterStoreSearchStub.resetBehavior();
    });

    it('Testing method: getStoresByCoordinates', () => {
        filterStoreSearchStub.returns({
            name: 'store1'
        });
        assert.deepEqual(brandifyStoreHelper.getStoresByCoordinates(), {
            name: 'store1'
        });
        filterStoreSearchStub.resetBehavior();
    });

});
