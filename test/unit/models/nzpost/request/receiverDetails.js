'use strict';

const {
    assert
} = require('chai');

var proxyquire = require('proxyquire').noCallThru().preserveCache();

const ReceiverDetailsModel = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/models/request/receiverDetails.js', {});

describe('int_nzpost/cartridge/models/request/receiverDetails.js', () => {

    it('Testing receiverDetails without args', () => {
        var receiverDetails = new ReceiverDetailsModel();
        assert.isDefined(receiverDetails, 'receiverDetails not defined');
        assert.isNotNull(receiverDetails, 'receiverDetails is null');
        assert.isUndefined(receiverDetails.name, 'name exists');
        assert.isUndefined(receiverDetails.phone, 'phone exists');
        assert.isUndefined(receiverDetails.email, 'email exists');
    });

    it('Testing receiverDetails args', () => {
        var orderAddressMap = {
            name: 'UA',
            phone: '1234567890'
        };
        var receiverDetails = new ReceiverDetailsModel(orderAddressMap, 'customerservicenz@underarmour.com');
        assert.isDefined(receiverDetails, 'receiverDetails not defined');
        assert.isNotNull(receiverDetails, 'receiverDetails is null');
        assert.isDefined(receiverDetails.name, 'name exists');
        assert.isDefined(receiverDetails.phone, 'phone exists');
        assert.isDefined(receiverDetails.email, 'email exists');
        assert.equal(receiverDetails.name, 'UA');
        assert.equal(receiverDetails.phone, '1234567890');
        assert.equal(receiverDetails.email, 'customerservicenz@underarmour.com');
    });

});
