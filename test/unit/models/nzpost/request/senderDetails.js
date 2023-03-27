'use strict';

const {
    assert
} = require('chai');

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

const SenderDetailsModel = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/models/request/senderDetails.js', {});

describe('int_nzpost/cartridge/models/request/senderDetails.js', () => {

    it('Testing senderDetails model when warehouseAddress is null', () => {
        var senderDetails = new SenderDetailsModel();
        assert.isDefined(senderDetails, 'senderDetails is not defined');
        assert.isNotNull(senderDetails, 'senderDetails is null');
        assert.isUndefined(senderDetails.name, 'name exists');
        assert.isUndefined(senderDetails.phone, 'phone exists');
    });

    it('Testing senderDetails model when warehouseAddress is not null', () => {
        var warehouseAddress = {
            name: 'UA',
            phone: '1234567890'
        };
        var senderDetails = new SenderDetailsModel(warehouseAddress);
        assert.isDefined(senderDetails, 'senderDetails is not defined');
        assert.isNotNull(senderDetails, 'senderDetails is null');
        assert.isDefined(senderDetails.name, 'name is not defined');
        assert.isDefined(senderDetails.phone, 'phone is not defined');
        assert.equal(senderDetails.name, 'UA');
        assert.equal(senderDetails.phone, '1234567890');
    });

});
