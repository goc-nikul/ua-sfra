'use strict';

const assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

class cartModel {
    constructor() {
        this.srEligible = true;
    }
}

global.empty = (data) => {
    return !data;
};

var ShopRunner = proxyquire('../../../../cartridges/plugin_shoprunner/cartridge/scripts/ShopRunner', {
    'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
    '*/cartridge/models/cart': cartModel,
    'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
    'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
    'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
    'int_shoprunner/cartridge/scripts/checkout/GetShopRunnerToken': {
        getToken: function () {
            return 'someToken';
        }
    },
    'int_shoprunner/cartridge/scripts/checkout/SaveShopRunnerOrderToken': {
        saveToken: function () {
            return true;
        }
    },
    'int_shoprunner/cartridge/scripts/checkout/CheckCartEligibility': {
        checkEligibility: function () {
            return true;
        }
    }
});

describe('plugin_shoprunner/cartridge/scripts/ShopRunner test', () => {
    it('Testing method: CheckoutMethod', () => {
        var session = {
            custom: {}
        };
        global.session = session;
        global.session.custom = {
            srtoken: 'someToken'
        };
        var result = ShopRunner.CheckoutMethod(); // eslint-disable-line
        assert.equal(result, true);
    });
    it('Testing method: EligibleBasket', () => {
        var session = {
            custom: {}
        };
        global.session = session;
        global.session.custom = {
            srtoken: 'someToken'
        };
        var result = ShopRunner.EligibleBasket(); // eslint-disable-line
        assert.equal(result, true);
    });
    it('Testing method: placeOrderAppend', () => {
        var res = {
            getViewData: function () {
                return {
                    orderID: 'someID'
                };
            }
        };
        var result = ShopRunner.PlaceOrderAppend(res); // eslint-disable-line
    });
});
