'use strict';

/* eslint-disable new-cap */

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

// Path to scripts
var pathToCartridges = '../../../../../cartridges/';
var pathToLinkScripts = pathToCartridges + 'int_paymetric/cartridge/scripts/';

// Path to test scripts
var pathToCoreMock = '../../../../mocks/';
var pathToLinkMock = '../../mock/';

describe('Paymetric: payment/processor/paymetric test', () => {
    global.session = {
        custom: {},
        privacy: {
            activeOrder: ''
        }
    };

    var paymetric = proxyquire(pathToLinkScripts + 'hooks/payment/processor/paymetric', {
        'dw/order/PaymentMgr': require(pathToCoreMock + 'dw/dw_order_PaymentMgr'),
        'dw/order/OrderMgr': require(pathToCoreMock + 'dw/dw_order_OrderMgr'),
        'dw/system/Transaction': require(pathToCoreMock + 'dw/dw_system_Transaction'),
        '~/cartridge/scripts/util/PaymetricHelper': require(pathToLinkMock + 'scripts/PaymetricHelper')
    });

    it('Testing method: Handle', () => {
        var Basket = require(pathToCoreMock + 'dw/dw_order_Basket');
        var basket = new Basket();

        var paymentInformation = {
            paymentMethodID: {
                value: 'Paymetric'
            },
            payload: {
                value: 'test'
            }
        };

        var result = paymetric.Handle(basket, paymentInformation);
        assert.equal(false, result.error);
    });


    it('Testing method: Authorize', () => {
        global.session = {
            custom: {},
            privacy: {}
        };

        global.request = {
            getLocale: function () {
                return 'en_US';
            }
        };
        // Prepare payment instrument
        var PaymentInstrument = require(pathToCoreMock + 'dw/dw_order_PaymentInstrument');
        var paymentInstrument = new PaymentInstrument();

        var result = paymetric.Authorize('test', paymentInstrument);
        assert.equal(false, result.error);
    });
});
