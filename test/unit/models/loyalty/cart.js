'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../mockModuleSuperModule');
var baseCartModelMock = require('../../../mocks/loyalty/baseCart');
var sinon = require('sinon')

var LoyaltyCartModel;
describe('Loyalty: cartModel test', function() {
    before(function () {
        mockSuperModule.create(baseCartModelMock);
        LoyaltyCartModel = proxyquire('../../../../cartridges/int_loyalty/cartridge/models/cart.js', {
            '*/cartridge/scripts/utils/PreferencesUtil': require('../../../../test/mocks/scripts/PreferencesUtil')
        });
    });

    after(function () {
        mockSuperModule.remove();
    });

    it('Test Loyalty CartModel', () => {
        let basketMock = {}
        basketMock.custom = [];
        basketMock.custom.loyaltyPointsBalance = 5000;

        let cart = new LoyaltyCartModel(basketMock);
        assert.equal(cart.loyaltyPointsBalance, 5000);
    });
})
