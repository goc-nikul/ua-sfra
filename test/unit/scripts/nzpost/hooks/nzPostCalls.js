'use strict';

const { assert } = require('chai');

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var order = {
    orderNo: '12345',
    customerEmail: 'testing@ua.com'
};

describe('int_nzpost/cartridge/scripts/hooks/nzPostCalls.js', () => {

    it('Testing method shippingLabelAndTrackingNumber if consignmentId not exists', () => {
        var nzPostCalls = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/hooks/nzPostCalls.js', {
            '*/cartridge/scripts/helpers/nzPostHelpers': {
                getConsignmentId: () => null
            }
        });
        var shippingLabelAndTrackingNumber = nzPostCalls.shippingLabelAndTrackingNumber(order);
        assert.isDefined(shippingLabelAndTrackingNumber, 'nzPostCalls is not defined');
        assert.isNotNull(shippingLabelAndTrackingNumber, 'nzPostCalls is null');
        assert.isFalse(shippingLabelAndTrackingNumber.isReturnCase);
        assert.isDefined(shippingLabelAndTrackingNumber.errorDescription, 'shippingLabelAndTrackingNumber exists');
    });

    it('Testing method shippingLabelAndTrackingNumber if consignmentId exists but tracking number not exists', () => {
        var nzPostCalls = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/hooks/nzPostCalls.js', {
            '*/cartridge/scripts/helpers/nzPostHelpers': {
                getConsignmentId: () => 'ABCD',
                getLabelStatusAndTrackingNumber: () => null
            }
        });
        var shippingLabelAndTrackingNumber = nzPostCalls.shippingLabelAndTrackingNumber(order);
        assert.isDefined(shippingLabelAndTrackingNumber, 'nzPostCalls is not defined');
        assert.isNotNull(shippingLabelAndTrackingNumber, 'nzPostCalls is null');
        assert.isDefined(shippingLabelAndTrackingNumber.ConsignmentID, 'consignmentId is not defined');
        assert.isNotNull(shippingLabelAndTrackingNumber.ConsignmentID, 'consignmentId should not be null');
        assert.isDefined(shippingLabelAndTrackingNumber.errorDescription, 'shippingLabelAndTrackingNumber exists');
        assert.isTrue(shippingLabelAndTrackingNumber.isReturnCase);
        assert.isTrue(shippingLabelAndTrackingNumber.isError);
    });

    it('Testing method shippingLabelAndTrackingNumber if consignmentId exists but tracking number exists', () => {
        var nzPostCalls = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/hooks/nzPostCalls.js', {
            '*/cartridge/scripts/helpers/nzPostHelpers': {
                getConsignmentId: () => 'ABCD',
                getLabelStatusAndTrackingNumber: () => '12345',
                getPrintLabel: () => 'PrintLabel'
            }
        });
        var shippingLabelAndTrackingNumber = nzPostCalls.shippingLabelAndTrackingNumber(order);
        assert.isDefined(shippingLabelAndTrackingNumber, 'nzPostCalls is not defined');
        assert.isNotNull(shippingLabelAndTrackingNumber, 'nzPostCalls is null');
        assert.isDefined(shippingLabelAndTrackingNumber.ConsignmentID, 'consignmentId is not defined');
        assert.isNotNull(shippingLabelAndTrackingNumber.ConsignmentID, 'consignmentId should not be null');
        assert.isUndefined(shippingLabelAndTrackingNumber.errorDescription, 'shippingLabelAndTrackingNumber exists');
        assert.isTrue(shippingLabelAndTrackingNumber.isReturnCase);
        assert.isFalse(shippingLabelAndTrackingNumber.isError);
        assert.equal(shippingLabelAndTrackingNumber.shipLabel, 'PrintLabel');
    });

});
