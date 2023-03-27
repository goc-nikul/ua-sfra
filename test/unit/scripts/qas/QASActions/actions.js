'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_QAS/cartridge/scripts/QASActions/actions', () => {

    var actions = proxyquire('../../../../../cartridges/int_QAS/cartridge/scripts/QASActions/actions.js', {
        './actions/AddressGet': function () {},
        './actions/AddressRefine': function () {},
        './actions/AddressSearch': function () {},
        './actions/AddressTypeDownSearch': function () {}
    });

    it('Test address get method', () => {
        assert.isDefined(actions.get, 'Address Get method should not be undefined');
        assert.isNotNull(actions.get, 'Address Get method should not be null');
    });

    it('Test address search method', () => {
        assert.isDefined(actions.search, 'Address search method should not be undefined');
        assert.isNotNull(actions.search, 'Address search method should not be null');
    });
});

