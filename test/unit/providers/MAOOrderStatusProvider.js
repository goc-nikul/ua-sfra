'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const collections = require('../../mocks/scripts/util/collections');

describe('app_ua_core/cartridge/providers/MAOOrderStatusProvider.js', function() {
    let Order = require('../../mocks/dw/dw_order_Order');

    let MAOOrderStatusProvider = proxyquire('../../../cartridges/app_ua_core/cartridge/providers/MAOOrderStatusProvider.js', {
        './AbstractOrderStatusProvider': require('../../mocks/scripts/AbstractProvider'),
        'dw/order/Order': Order,
        '../scripts/utils/Class': require('../../../cartridges/app_ua_core/cartridge/scripts/utils/Class'),
        '*/cartridge/scripts/checkout/checkoutHelpers': {
            setExportedStatus: function(order) {
                order.exportStatus = { value: Order.EXPORT_STATUS_READY };
                return;
            }
        },
        '*/cartridge/scripts/util/collections': collections
    });


    it('Testing method: handleReadyForExport', () => {
        let provider = new MAOOrderStatusProvider();
        let order = new Order();
        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
        order.setStatus(Order.ORDER_STATUS_OPEN);
        provider.order = order;
        provider.handleReadyForExport();
        assert.equal(Order.EXPORT_STATUS_READY, provider.order.exportStatus.value);

        order.setStatus(Order.ORDER_STATUS_NEW);
        provider.order = order;
        provider.handleReadyForExport();
        assert.equal(Order.EXPORT_STATUS_READY, provider.order.exportStatus.value);

        order.setStatus(Order.ORDER_STATUS_CREATED);
        provider.order = order;
        provider.handleReadyForExport();
        assert.equal(Order.EXPORT_STATUS_READY, provider.order.exportStatus.value);

        order.setStatus(Order.ORDER_STATUS_CANCELLED);
        order.setExportStatus('testValue');
        provider.order = order;
        provider.handleReadyForExport(); // Else test
        assert.equal('testValue', provider.order.exportStatus.value);

        order.getPaymentInstruments = function() {
            return [
               {
                custom: {
                    internalToken: 'internalToken'
                }
               }
            ]
        }
        provider.handleReadyForExport(); // Else test
        assert.equal('testValue', provider.order.exportStatus.value);

        order.getPaymentInstruments = function() {
            return [
               {
                custom: {
                    internalToken: null
                }
               }
            ]
        }
        provider.handleReadyForExport(); // Else test
        assert.equal('testValue', provider.order.exportStatus.value);
    });
});
