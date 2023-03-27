'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var mockSuperModule = require('../../../../mockModuleSuperModule');
var baseDefaultModelMock = require('./baseModel');
var DefaultModel;
var ArrayList = require('../../../../mocks/dw/dw.util.Collection');

var productLineItems = new ArrayList ([{
    productID: '12345'
}]);

var paymentChannel = [{
	productID: '12345'
}];

var order = {
	    productLineItems: productLineItems,
		totalGrossPrice: {
			value:2
		},
		orderNo: '12345',
		currencyCode: 'USD',
	};

describe('int_2c2p/cartridge/models/request/paymentToken', () => {

    before(function () {
        mockSuperModule.create(baseDefaultModelMock);
    });

    it('Test default paymentToken 2c2p', () => {
        DefaultModel = proxyquire('../../../../../cartridges/int_2c2p/cartridge/models/request/paymentToken.js', {
             '*/cartridge/scripts/util/collections': require('../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/scripts/config/2c2Prefs': {
                merchantID : '12345',
                request3DS : '12345',
                frontendReturnUrl : '12345',
                backendReturnUrl : '12345',
                paymentChannel : paymentChannel
            },
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils')
        });
        var defaultModel = new DefaultModel(order);
        assert.isDefined(defaultModel, 'paymentToken 2c2p not be undefined');
    });

});
