'use strict';

const { assert } = require('chai');

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

const LineItemCtnr = require('../../../../../mocks/dw/dw_order_LineItemCtnr');

var basketHelpers = proxyquire('../../../../../../cartridges/int_ocapi/cartridge/scripts/basketHelper.js', {
    'dw/system/Site': require('../../../../../mocks/dw/dw_system_Site'),
    'dw/system/Logger': require('../../../../../mocks/dw/dw_system_Logger'),
    'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
    '*/cartridge/scripts/util/collections' : require('../../../../../mocks/scripts/util/collections'),
    '*/cartridge/scripts/errorLogHelper': {},
    'dw/system/Transaction': require('../../../../../mocks/dw/dw_system_Transaction')
});

describe('int_mao/cartridge/scripts/UACAPI/helpers/order/basketHelper.js', () => {

    it('Testing method: isCCPaymentInstrumentRequest when paymentInstrumentRequest is CC', () => {

        assert.isTrue(basketHelpers.isCCPaymentInstrumentRequest({
            'paymentMethodId': 'AURUS_CREDIT_CARD'
        }), 'isCCPaymentInstrumentRequest is not detecting AURUS CC payment.');
        assert.isTrue(basketHelpers.isCCPaymentInstrumentRequest({
            'paymentMethodId': 'Paymetric'
        }), 'isCCPaymentInstrumentRequest is not detecting Paymentric CC payment.');
    });

    it('Testing method: isCCPaymentInstrumentRequest when paymentInstrumentRequest is not CC', () => {

        assert.isFalse(basketHelpers.isCCPaymentInstrumentRequest(null), 'isCCPaymentInstrumentRequest is not false when parameter is null');
        assert.isFalse(basketHelpers.isCCPaymentInstrumentRequest({
            'paymentMethodId': 'PayPal'
        }), 'isCCPaymentInstrumentRequest is detecting Paypal as CC.');
    });
});
