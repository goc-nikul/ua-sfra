'use strict';


const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
describe('int_klarna_payments_custom/cartridge/scripts/common/klarnaPaymentsApiContext.js file test cases', () => {

    let klarnaPaymentAPIContext = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/common/klarnaPaymentsApiContext.js', {
        'dw/util/HashMap': require('../../../mocks/dw/dw_util_HashMap')
    });
    it('Test klarna getFlowApiUrls method', function () {
        var result = klarnaPaymentAPIContext.prototype.getFlowApiUrls();
        assert.isNotNull(result.get('updateSession'));
        assert.isDefined(result.get('updateSession'), 'updateSession defined value');
        assert.isNotNull(result.get('createCapture'));
        assert.isDefined(result.get('createCapture'), 'createCapture defined value');
        assert.isNotNull(result.get('vcnSettlement'));
        assert.isDefined(result.get('vcnSettlement'), 'vcnSettlement defined value');
        assert.isNotNull(result.get('acknowledgeOrder'));
        assert.isDefined(result.get('acknowledgeOrder'), 'acknowledgeOrder defined value');
        assert.isNotNull(result.get('getCompletedOrder'));
        assert.isDefined(result.get('getCompletedOrder'), 'getCompletedOrder defined value');
        assert.isNotNull(result.get('cancelOrder'));
        assert.isDefined(result.get('cancelOrder'), 'cancelOrder defined value');
        assert.isNotNull(result.get('createOrder'));
        assert.isDefined(result.get('createOrder'), 'createOrder defined value');
        assert.isNotNull(result.get('cancelAuthorization'));
        assert.isDefined(result.get('cancelAuthorization'), 'cancelAuthorization defined value');
        assert.isNotNull(result.get('getOrder'));
        assert.isDefined(result.get('getOrder'), 'getOrder defined value');
        assert.isNotNull(result.get('getSession'));
        assert.isDefined(result.get('getSession'), 'getSession defined value');
    });
});
