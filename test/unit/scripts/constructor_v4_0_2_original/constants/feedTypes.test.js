'use strict';

var assert = require('chai').assert;

var feedTypes = require('../../../../../cartridges/link_constructor_connect/cartridge/scripts/constants/feedTypes');

describe('feedTypes', function () {
    it('should have the correct value for product', function () {
        assert.strictEqual(feedTypes.product, 'product');
    });

    it('should have the correct value for category', function () {
        assert.strictEqual(feedTypes.category, 'category');
    });
});
