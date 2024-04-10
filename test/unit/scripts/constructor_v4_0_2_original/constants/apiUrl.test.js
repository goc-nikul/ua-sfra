'use strict';

var assert = require('chai').assert;

// Path to scripts
var apiUrl = require('../../../../../cartridges/link_constructor_connect/cartridge/scripts/constants/apiUrl');

describe('apiUrl', function () {
    describe('v2', function () {
        it('should have the correct value for productFeed', function () {
            assert.strictEqual(apiUrl.v2.productFeed, 'https://connect.cnstrc.com/v2/salesforce/feed/product');
        });

        it('should have the correct value for categoryFeed', function () {
            assert.strictEqual(apiUrl.v2.categoryFeed, 'https://connect.cnstrc.com/v2/salesforce/feed/category');
        });

        it('should have the correct value for completeFeed', function () {
            assert.strictEqual(apiUrl.v2.completeFeed, 'https://connect.cnstrc.com/v2/salesforce/complete_feed');
        });
    });
});
