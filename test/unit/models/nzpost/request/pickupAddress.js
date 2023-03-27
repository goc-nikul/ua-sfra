'use strict';

const {
    assert
} = require('chai');

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const PickupAddressModel = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/models/request/pickupAddress.js', {});

describe('int_nzpost/cartridge/models/request/pickupAddress.js', () => {

    it('Testing senderDetails model when warehouseAddress is null', () => {
        var pickupAddressModel = new PickupAddressModel();
        assert.isDefined(pickupAddressModel, 'senderDetails is not defined');
        assert.isNotNull(pickupAddressModel, 'senderDetails is null');
        assert.isUndefined(pickupAddressModel.street, 'street exists');
        assert.isUndefined(pickupAddressModel.floor, 'floor exists');
        assert.isUndefined(pickupAddressModel.suburb, 'suburb exists');
        assert.isUndefined(pickupAddressModel.city, 'city exists');
        assert.isUndefined(pickupAddressModel.country_code, 'country_code exists');
        assert.isUndefined(pickupAddressModel.postcode, 'postcode exists');
    });

    it('Testing senderDetails model when warehouseAddress is not null and postalCode is null', () => {
        var warehouseAddress = {
            address1: 'UAaddress1',
            address2: 'UAaddress2',
            suburb: 'UAsuburb',
            city: 'UAcity',
            countryCode: 'UAcountryCode',
            postalCode: null
        };
        var pickupAddressModel = new PickupAddressModel(warehouseAddress);
        assert.isDefined(pickupAddressModel, 'senderDetails is not defined');
        assert.isNotNull(pickupAddressModel, 'senderDetails is null');
        assert.equal(pickupAddressModel.street, 'UAaddress1');
        assert.equal(pickupAddressModel.floor, 'UAaddress2');
        assert.equal(pickupAddressModel.suburb, 'UAsuburb');
        assert.equal(pickupAddressModel.city, 'UAcity');
        assert.equal(pickupAddressModel.country_code, 'UAcountryCode');
        assert.equal(pickupAddressModel.postcode, '');
    });

    it('Testing senderDetails model when warehouseAddress is not null and postalCode is not null', () => {
        var warehouseAddress = {
            address1: 'UAaddress1',
            address2: 'UAaddress2',
            suburb: 'UAsuburb',
            city: 'UAcity',
            countryCode: 'UAcountryCode',
            postalCode: 'UA 1234'
        };
        var pickupAddressModel = new PickupAddressModel(warehouseAddress);
        assert.isDefined(pickupAddressModel, 'senderDetails is not defined');
        assert.isNotNull(pickupAddressModel, 'senderDetails is null');
        assert.equal(pickupAddressModel.street, 'UAaddress1');
        assert.equal(pickupAddressModel.floor, 'UAaddress2');
        assert.equal(pickupAddressModel.suburb, 'UAsuburb');
        assert.equal(pickupAddressModel.city, 'UAcity');
        assert.equal(pickupAddressModel.country_code, 'UAcountryCode');
        assert.equal(pickupAddressModel.postcode, 'UA1234');
    });

});
