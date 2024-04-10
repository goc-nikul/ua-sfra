'use strict';

const {
    assert
} = require('chai');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_ocapi/cartridge/hooks/shop/basket/basket_item_hook_scripts.js', () => {
    var basketItemHookScripts = proxyquire('../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/basket/basket_item_hook_scripts.js', {
        'dw/system/Status': require('../../../../../mocks/dw/dw_system_Status'),
        'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
        'dw/system/Site': require('../../../../../mocks/dw/dw_system_Site'),
        '*/cartridge/scripts/errorLogHelper': {
            handleOcapiHookErrorStatus: () => ''
        }
    });

    global.empty = (params) => !params;

    it('Testing method: beforePATCH', () => {
        var basket = new (require('../../../../../mocks/dw/dw_order_Basket'))();

        var itemId = '1234';

        global.request = {
            httpPath: '/baskets/{basket_id}/items/' + itemId
        };

        basket.productLineItems = [{
            UUID: itemId,
            setPriceValue: function (v) {
                this.priceValue = v;
            },
            priceValue: 30
        }];
        basket.productLineItems.forEach(i => {
            // eslint-disable-next-line no-param-reassign
            i.setPriceValue = i.setPriceValue.bind(i);
        });
        var item = {
            item_id: itemId,
            product_id: '883814258849', // this is the egiftcard product id
            c_gcAmount: 29.99
        };
        basketItemHookScripts.beforePATCH(basket, item);

        assert.equal(basket.productLineItems[0].priceValue, item.c_gcAmount);
    });
});
