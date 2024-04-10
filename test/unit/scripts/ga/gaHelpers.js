'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const { findLastKey } = require('lodash');
var sinon = require('sinon');

describe('app_ua_core/cartridge/scripts/analytics/gaHelpers', function () {

    let basket = {
        getProductLineItems: () => ({
            index: 0,
            items: [{
                    productID: '1',
                    productName: 'Product 1'
                },
                {
                    productID: '2',
                    productName: 'Product 2'
                }
            ],
            iterator: function () {
                return {
                    hasNext: () => {
                        return this.index < this.items.length;
                    },
                    next: () => {
                        return this.items[this.index++];
                    }
                };
            }
        })
    };

    let gaHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/analytics/gaHelpers.js', {
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            'dw/order/BasketMgr': {
                getCurrentBasket: () => basket
            },
    });

    it('Testing method: getAction - Happy path', () => {
        let res = {
            action: true
        };
        assert.isTrue(gaHelpers.getAction(res));
    });

    it('Testing method: getAction - required param is missing', () => {
        let res = {};
        assert.equal(gaHelpers.getAction(res), '');
    }); 

    it('Testing method: getConfirmationDl - unable to retrieve order', () => {
        let res = {
            CurrentHttpParameterMap : {
                token: '123'
            },
        };
        assert.equal(gaHelpers.getConfirmationDl(res), false);
    }); 

    it('Testing method: getProductArrayFromList - should return an array of product line items', () => {
        const currentBasket = basket;

        const result = gaHelpers.getProductArrayFromList(currentBasket);
        assert.isArray(result);
        assert.lengthOf(result, 2);
        assert.deepEqual(result[0], { item_id: '1', item_name: 'Product 1' });
        assert.deepEqual(result[1], { item_id: '2', item_name: 'Product 2' });
    });

    it('Testing method: getLineItemByProduct - should return a product line item', () => {
        const product = {
            ID: '1',
            productName: 'Product 1'
        };
        const result = gaHelpers.getLineItemByProduct(product);

        assert.deepEqual(result, {
            productID: '1',
            productName: 'Product 1'
        });

      });

});