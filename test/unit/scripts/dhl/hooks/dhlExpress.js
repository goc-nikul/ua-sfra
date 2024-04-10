'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_dhl/cartridge/scripts/hooks/dhlExpress.js', () => {
    var dhlExpress = proxyquire('../../../../../cartridges/int_dhl/cartridge/scripts/hooks/dhlExpress.js', {
        '*/cartridge/scripts/helpers/dhlHelpers': proxyquire('../../../../../cartridges/int_dhl/cartridge/scripts/helpers/dhlHelpers.js', require('../helpers/dhlHelpers'))
    });


    it('Testing method: dhlExpress hook', function () {
        var Order = require('../../../../mocks/dw/dw_order_Order');
        var order = new Order();
        assert.doesNotThrow(() => dhlExpress.shippingLabelAndTrackingNumber(order));
    });
});
