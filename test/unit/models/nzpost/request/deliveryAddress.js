'use strict';

const {
    assert
} = require('chai');

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

const DeliveryAddressModel = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/models/request/deliveryAddress.js', {});

describe('int_nzpost/cartridge/models/request/deliveryAddress.js', () => {

    it('Testing Delivery address without args', () => {
        var deliveryAddress = new DeliveryAddressModel();
        assert.isNotNull(deliveryAddress, 'deliveryAddress is null');
        assert.isDefined(deliveryAddress, 'deliveryAddress is not defined');
    });

    it('Testing Delivery address model when Address is not null and postalCode is null', () => {
        var orderAddressMap = {
            address1: 'UAaddress1',
            address2: 'UAaddress2',
            suburb: 'UAsuburb',
            city: 'UAcity',
            countryCode: 'UAcountryCode',
            postalCode: null
        };
        var deliveryAddress = new DeliveryAddressModel(orderAddressMap);
        assert.isDefined(deliveryAddress, 'senderDetails is not defined');
        assert.isNotNull(deliveryAddress, 'senderDetails is null');
        assert.equal(deliveryAddress.street, 'UAaddress1');
        assert.equal(deliveryAddress.floor, 'UAaddress2');
        assert.equal(deliveryAddress.suburb, 'UAsuburb');
        assert.equal(deliveryAddress.city, 'UAcity');
        assert.equal(deliveryAddress.country_code, 'UAcountryCode');
        assert.equal(deliveryAddress.postcode, '');
    });

    it('Testing Delivery address model when Address is not null and postalCode is null', () => {
        var orderAddressMap = {
            address1: 'UAaddress1',
            address2: 'UAaddress2',
            suburb: 'UAsuburb',
            city: 'UAcity',
            countryCode: 'UAcountryCode',
            postalCode: 'UA 1234'
        };
        var deliveryAddress = new DeliveryAddressModel(orderAddressMap);
        assert.isDefined(deliveryAddress, 'senderDetails is not defined');
        assert.isNotNull(deliveryAddress, 'senderDetails is null');
        assert.equal(deliveryAddress.street, 'UAaddress1');
        assert.equal(deliveryAddress.floor, 'UAaddress2');
        assert.equal(deliveryAddress.suburb, 'UAsuburb');
        assert.equal(deliveryAddress.city, 'UAcity');
        assert.equal(deliveryAddress.country_code, 'UAcountryCode');
        assert.equal(deliveryAddress.postcode, 'UA1234');
    });

});
