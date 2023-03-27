'use strict';

const {
    assert
} = require('chai');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const sinon = require('sinon');

var callHookStub = sinon.stub();

describe('int_ocapi/cartridge/hooks/shop/basket/updateShipment.js', () => {

    var updateShipment = proxyquire('../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/basket/updateShipment.js', {
        '~/cartridge/scripts/paymentHelper': {
            autoAdjustBasketPaymentInstruments: () => ''
        },
        '~/cartridge/scripts/basketHelper': {
            manageKlarnaSession: () => ''
        },
        'dw/system/HookMgr': {
            callHook: callHookStub
        },
        'dw/system/Status': require('../../../../../mocks/dw/dw_system_Status'),
        '*/cartridge/scripts/util/DeliveryHelper': {
            getShippingDeliveryDates: () => [{
                time: '11'
            }, {
                time: '22'
            }]
        },
        'int_shoprunner/cartridge/scripts/ShopRunnerAuth': {
            validate: () => {
                return {
                    signin: false
                };
            }
        },
        'dw/system/Transaction': {
             wrap: () => {
                return;
             }
        }
    });

    it('Testing method: afterPUT', () => {
        var basket = new (require('../../../../../mocks/dw/dw_order_Basket'))();
        var shipment = new (require('../../../../../mocks/dw/dw_order_Shipment'))();
        assert.doesNotThrow(() => updateShipment.afterPUT(basket, shipment));
    });

    it('Testing method: afterPATCH', () => {
        var basket = new (require('../../../../../mocks/dw/dw_order_Basket'))();
        var shipment = new (require('../../../../../mocks/dw/dw_order_Shipment'))();
        assert.doesNotThrow(() => updateShipment.afterPATCH(basket, shipment));
    });

    it('afterPUT throws error with invalid shoprunner token', () => {
        var basket = new (require('../../../../../mocks/dw/dw_order_Basket'))();
        var shipment = new (require('../../../../../mocks/dw/dw_order_Shipment'))();
        basket.custom = {
            sr_token: 'invalid'
        };
        assert.throws(() => { updateShipment.afterPUT(basket, shipment)});
    });

});
