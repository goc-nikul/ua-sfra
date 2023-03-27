'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_ocapi/cartridge/hooks/shop/basket/basketPayment.js', () => {

    var basketPayment = proxyquire('../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/basket/basketPayment.js', {
        'dw/system/Status': require('../../../../../mocks/dw/dw_system_Status'),
        '~/cartridge/scripts/paymentHelper': {
            updatePaymentInstrument: () => true,
            patchPaymentInstrument: () => true,
            adjustPaymentInstrument: () => true,
            modifyPaymentResponse: () => true
        },
        '*/cartridge/scripts/basketHelper': {
            manageKlarnaSession: () => true,
            updateResponse: () => true,
            isCCPaymentInstrumentRequest: () => true,
            removeCCPaymentInstruments: () => true
        },
        '*/cartridge/scripts/helpers/sitePreferencesHelper': {
            isAurusEnabled: () => true
        },
        '~/cartridge/scripts/basketHelper': {
            manageKlarnaSession: () => true,
            updateResponse: () => true
        }
    });

    it('Testing method: beforePOST', () => {
        assert.isTrue(basketPayment.beforePOST());
    });

    it('Testing method: beforePATCH', () => {
        assert.isTrue(basketPayment.beforePATCH());
    });

    it('Testing method: afterPOST', () => {
        var paymentInstrumentRequest = {
            credit_card_token: '1234'
        };
        assert.isTrue(basketPayment.afterPOST(null, paymentInstrumentRequest));
    });

    it('Testing method: afterPATCH', () => {
        assert.deepEqual(basketPayment.afterPATCH(), {});
    });

    it('Testing method: modifyPOSTResponse', () => {
        assert.isTrue(basketPayment.modifyPOSTResponse());
    });

});
