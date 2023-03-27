'use strict';

/* eslint-disable */

var assert = require('chai').assert;

describe('app_ua_core/cartridge/models/product/decorators/badges', () => {
    var decorator = require('../../../cartridges/app_ua_core/cartridge/models/product/decorators/badges');

    it('Testing method: badges', () => {
        var apiProduct = {
            custom: {
                exclusive: false,
                productTileBottomLeftBadge: true,
                productTileUpperLeftBadge: false,
                outletProductTileUpperLeftBadge: true,
                productTileUpperLeftFlameIconBadge: true
            }
        };
        var obj = {};
        decorator(obj, apiProduct);
        assert.deepEqual(obj, {
            exclusive: false,
            productTileBottomLeftBadge: true,
            productTileUpperLeftBadge: false,
            outletProductTileUpperLeftBadge: true,
            productTileUpperLeftFlameIconBadge: true
        });
    });
});
