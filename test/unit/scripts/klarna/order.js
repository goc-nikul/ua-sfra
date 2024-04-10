'use strict';


const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var base = module.superModule;
base.Address = function () {};

describe('int_klarna_payments_custom/cartridge/scripts/payments/model/request/order.js file test cases', () => {
    var klarnaOrderModel = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/payments/model/request/order', {
        '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
            basketHasOnlyBOPISProducts: function () {
                return false;
            }
        }
    });
    it('Testing method: KlarnaPaymentsOrderModel', () => {
        var Order = require('../../../mocks/dw/dw_order_Order');
        var order = new Order();
        order.custom.isCommercialPickup = false;
        var klarnaOrder = new klarnaOrderModel.KlarnaPaymentsOrderModel(order);

        assert.isDefined(klarnaOrder.purchase_country, 'purchase_country defined');
        assert.isDefined(klarnaOrder.purchase_currency, 'purchase_currency defined');
        assert.isDefined(klarnaOrder.locale, 'locale defined');
        assert.isDefined(klarnaOrder.order_amount, 'order_amount defined');
        assert.isDefined(klarnaOrder.billing_address, 'billing_address defined');
        assert.isDefined(klarnaOrder.order_tax_amount, 'order_tax_amount defined');
        assert.isDefined(klarnaOrder.order_lines, 'order_lines defined');
        assert.isDefined(klarnaOrder.merchant_reference1, 'merchant_reference1 defined');
        assert.isDefined(klarnaOrder.merchant_reference2, 'merchant_reference2 defined');
        assert.isDefined(klarnaOrder.options, 'options defined');
        assert.isDefined(klarnaOrder.merchant_urls, 'merchant_urls defined');
        assert.isDefined(klarnaOrder.merchant_data, 'merchant_data defined');
    });
});
