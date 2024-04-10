'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
describe('int_klarna_payments_custom/cartridge/scripts/payments/requestBuilder/shipmentItem.js file test cases', () => {
    it('Test method build', function () {
        let ShipItem = proxyquire('../../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/payments/requestBuilder/shipmentItem.js', {
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/order/ShippingLocation': {},
            '*/cartridge/scripts/payments/builder': {},
            '*/cartridge/scripts/payments/model/request/session': {},
            '*/cartridge/scripts/util/klarnaPaymentsConstants': proxyquire('../../../../../cartridges/int_klarna_payments_sfra/cartridge/scripts/util/klarnaPaymentsConstants.js',{}),
            '*/cartridge/scripts/util/klarnaHelper': {
                isOMSEnabled: function () {
                    return false;
                },
                isTaxationPolicyNet: function () {
                    return false;
                },
                getDiscountsTaxation: function () {
                    return 'price';
                }
            }

        });
        ShipItem.prototype.superModuleBuild =  function () {
           return this;
        }
        const LineItemCtnr = require('../../../../mocks/dw/dw_order_LineItemCtnr');
        var ArrayList = require('../../../../mocks/dw/dw_util_ArrayList');
        var lineItemCtnr = new LineItemCtnr();
        var shipment = lineItemCtnr.getDefaultShipment();
        shipment.productLineItems = new ArrayList({
            custom: {
                sku: '1330767-408-3',
                giftCard: {
                    value: 'NONE'
                }
            },
            ID: '123458',
            name: 'test'
        });
        let KlarnaShipmentItem = new ShipItem();
        KlarnaShipmentItem.item = {};
        KlarnaShipmentItem.isMerchantDataAvailable = true;
        var result = KlarnaShipmentItem.build(shipment, 'order');
        assert.isDefined(result.merchant_data, 'merchant_data defined');
    });
});
