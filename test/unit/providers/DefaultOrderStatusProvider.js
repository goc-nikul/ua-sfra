'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/providers/DefaultOrderStatusProvider', function() {
    let Order = require('../../mocks/dw/dw_order_Order');

    let DefaultOrderStatusProvider = proxyquire('../../../cartridges/app_ua_core/cartridge/providers/DefaultOrderStatusProvider', {
        './AbstractOrderStatusProvider': require('../../mocks/scripts/AbstractProvider'),
        'dw/order/Order': Order,
        '*/cartridge/scripts/checkout/checkoutHelpers': {
            setExportedStatus: function(order) {
                order.exportStatus = { value: Order.EXPORT_STATUS_READY };
                return;
            }
        }
    });

    it('Testing method: handleReadyForExport', () => {
        let provider = new DefaultOrderStatusProvider();
        let order = new Order();
        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
        order.setStatus(Order.ORDER_STATUS_OPEN);
        provider.order = order;
        provider.handleReadyForExport();
        assert.equal(Order.EXPORT_STATUS_READY, provider.order.exportStatus.value);

        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
        order.setStatus(Order.ORDER_STATUS_NEW);
        provider.order = order;
        provider.handleReadyForExport();
        assert.equal(Order.EXPORT_STATUS_READY, provider.order.exportStatus.value);

        order.setPaymentStatus(Order.ORDER_STATUS_CANCELLED);
        order.setExportStatus('testValue');
        provider.order = order;
        provider.handleReadyForExport(); // Else test
        assert.equal('testValue', provider.order.exportStatus.value);
    });
});
