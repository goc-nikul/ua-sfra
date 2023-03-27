'use strict';

const assert = require('chai').assert;

var tossPaymentSvc = require('../../../../mocks/toss/tossPaymentService');

describe('int_custom_tosspayments/cartridge/scripts/service/tossPaymentService.js', () => {
    it('Testing method: paymentService', () => {
        var result = tossPaymentSvc.paymentService.call({
            paymentKey: 'test12344'
        });
        assert.isDefined(result);
    });

    it('Testing method: cancelService', () => {
        var result = tossPaymentSvc.cancelService.call({
            paymentKey: 'test12344',
            body: '{ "test": "test" }'
        });
        assert.isDefined(result);
    });
});

