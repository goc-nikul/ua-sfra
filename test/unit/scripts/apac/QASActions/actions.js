'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../../mockModuleSuperModule');
var actions

function BaseActions() {}

function AddressGet() {}

function AddressSearch() {}


describe('app_ua_apac/cartridge/scripts/QASActions/actions', () => {

    before(function () {
        mockSuperModule.create(BaseActions);
        actions = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/QASActions/actions.js', {
            '*/cartridge/scripts/QASActions/actions/AddressGet': AddressGet,
            '*/cartridge/scripts/QASActions/actions/AddressSearch': AddressSearch
        });
    });

    it('Test address get method', () => {
        assert.isDefined(actions.get, 'Address Get method should not be undefined');
        assert.isNotNull(actions.get, 'Address Get method should not be null');
        assert.instanceOf(actions.get, AddressGet);
    });

    it('Test address search method', () => {
        assert.isDefined(actions.search, 'Address search method should not be undefined');
        assert.isNotNull(actions.search, 'Address search method should not be null');
        assert.instanceOf(actions.search, AddressSearch);
    });

});
