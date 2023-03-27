'use strict';

var assert = require('chai').assert;

global.empty = (data) => {
    return !data;
};


var paymentTokens = require('../../../../mocks/2c2p/paymentToken');

describe('paymentTokens Method Test Cases', () => {
    var payload = '{"Test":"Test"}';
    it('paymentTokens should be initialized- Should returns the succsess status', function () {
        var result = paymentTokens(payload);
        assert.isNotNull(result);
        assert.equal(result.error, 200);
        assert.equal(result.object.status, 'SUCCESS');
        result = result.getRequestData();
        assert.isDefined(result);
    });

    it('paymentTokens should be initialized- Should returns the success  response from service', function () {
        var result = paymentTokens(payload);
        result = result.getResponse();
        assert.equal(result, '{"success":true,"message":"success"}');
    });

});
