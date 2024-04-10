'use strict';


const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var Basket = require('../../../mocks/dw/dw_order_Basket');

var base = module.superModule;
base.Address = function () {}

describe('int_klarna_payments_custom/cartridge/scripts/payments/model/request/session.js file test cases', () => {
    var sessionModel = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/payments/model/request/session', {
    });
    it('Testing method: KlarnaPaymentsSessionModel isCommercialPickup is false', () => {
        var basket = new Basket();
        basket.custom.isCommercialPickup = false;
        let session = new sessionModel.KlarnaPaymentsSessionModel(false, basket);

        assert.isDefined(session.purchase_country, 'purchase_country defined');
        assert.isDefined(session.purchase_currency, 'purchase_currency defined');
        assert.isDefined(session.locale, 'locale defined');
        assert.isDefined(session.order_amount, 'order_amount defined');
        assert.isDefined(session.order_tax_amount, 'order_tax_amount defined');
        assert.isDefined(session.order_lines, 'order_lines defined');
        assert.isDefined(session.merchant_reference2, 'merchant_reference1 defined');
        assert.isDefined(session.merchant_reference2, 'merchant_reference2 defined');
        assert.isDefined(session.options, 'options defined');
        assert.isDefined(session.merchant_data, 'merchant_urls defined');
    });
    it('Testing method: KlarnaPaymentsSessionModel isCommercialPickup is true ', () => {
        var basket = new Basket();
        basket.custom.isCommercialPickup = true;
        let session = new sessionModel.KlarnaPaymentsSessionModel(true, basket);

        assert.isDefined(session.purchase_country, 'purchase_country defined');
        assert.isDefined(session.purchase_currency, 'purchase_currency defined');
        assert.isDefined(session.locale, 'locale defined');
        assert.isDefined(session.order_amount, 'order_amount defined');
        assert.isDefined(session.billing_address, 'billing_address defined');
        assert.isDefined(session.order_tax_amount, 'order_tax_amount defined');
        assert.isDefined(session.order_lines, 'order_lines defined');
        assert.isDefined(session.merchant_reference2, 'merchant_reference1 defined');
        assert.isDefined(session.merchant_reference2, 'merchant_reference2 defined');
        assert.isDefined(session.options, 'options defined');
        assert.isDefined(session.merchant_data, 'merchant_urls defined');
    });
});
