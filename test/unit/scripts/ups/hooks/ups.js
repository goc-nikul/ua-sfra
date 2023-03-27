'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_ups/cartridge/scripts/hooks/ups.js', () => {

    var ups = proxyquire('../../../../../cartridges/int_ups/cartridge/scripts/hooks/ups.js', {
        '*/cartridge/scripts/helpers/upsHelpers': {
            fetchShippingAndTrackingNumber: () => 'ABCD'
        }
    });

    it('Testing method shippingLabelAndTrackingNumber', () => {
        assert.equal(ups.shippingLabelAndTrackingNumber(), 'ABCD');
    });

});
