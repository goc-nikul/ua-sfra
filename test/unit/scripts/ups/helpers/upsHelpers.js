'use strict';

const sinon = require('sinon');
const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var callStub = sinon.stub();

describe('int_ups/cartridge/scripts/helpers/upsHelpers.js', () => {
    var upsHelpers = proxyquire('../../../../../cartridges/int_ups/cartridge/scripts/helpers/upsHelpers.js', {
        '*/cartridge/scripts/service/upsServiceHelpers': {
            shipmentShipRequest: () => {
                return {
                    call: callStub
                };
            }
        },
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger')
    });

    it('Testing method: fetchShippingAndTrackingNumber valid response', () => {
        callStub.returns({
            ok: true,
            object: 'ABC'
        });
        assert.equal(upsHelpers.fetchShippingAndTrackingNumber(), 'ABC');
        callStub.resetBehavior();
    });

    it('Testing method: fetchShippingAndTrackingNumber', () => {
        callStub.throwsException(new Error('Test'));
        assert.isNull(upsHelpers.fetchShippingAndTrackingNumber());
        callStub.resetBehavior();
    });
});
