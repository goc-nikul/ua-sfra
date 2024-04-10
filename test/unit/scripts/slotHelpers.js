'use strict';

const sinon = require('sinon');
const assert = require('assert');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

let stubSearchModel = sinon.stub();
stubSearchModel.returns({
    setSearchPhrase: function () {},
    search: function () {},
    getProductSearchHit: function () {},
    getProductSearchHits: function () {
        return {
            next: function () {
                return { firstRepresentedProductID: '12345' };
            },
            hasNext: function () {
                return true;
            }
        };
    },
    count: 1
});

describe('getProductSearchHit', () => {
    const { getProductSearchHit } = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/slotHelpers.js', {
        'dw/catalog/ProductSearchModel': stubSearchModel
    });
    it('should return product search hit for a given product', function () {
        const apiProduct = {
            ID: '12345'
        };
        const result = getProductSearchHit(apiProduct);
        assert.equal(result.firstRepresentedProductID, '12345');
    });

    it('should return undefined if there is no search hit for the product', function () {
        const apiProduct = {
            ID: '1223'
        };

        const result = getProductSearchHit(apiProduct);
        assert.equal(result, undefined);
    });
});
