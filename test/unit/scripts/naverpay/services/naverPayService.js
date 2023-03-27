'use strict';

const assert = require('chai').assert;

var naverPaySvc = require('../../../../mocks/naverpay/naverPayService');

describe('int_naverpay/cartridge/scripts/service/naverPayService.js', () => {
    it('Testing method: paymentService', () => {
        var result = naverPaySvc.paymentService.call({
            paymentKey: 'test12344'
        });
        assert.isDefined(result);
    });

    it('Testing method: cancelService', () => {
        var result = naverPaySvc.cancelService.call({
            paymentKey: 'test12344',
            body: '{ "test": "test" }'
        });
        assert.isDefined(result);
    });
});

