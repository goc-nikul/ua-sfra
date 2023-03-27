'use strict';


/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

var apiWishlistMock;

describe('app_ua_core/cartridge/models/account/decorators/wishlist.js', function () {
    var wishlist = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/account/decorators/wishlist.js', {
        '*/cartridge/models/productListItem': function () {
            return;
        }
    });

    it('should create a property on the passed in object called wishlist', function () {
        var object = {};
        apiWishlistMock = {
            items: []
        };
        wishlist(object, apiWishlistMock);
        assert.property(object, 'wishlist');
    });

    it('should create a property that has no more than 2 items in it if there are more than two items in the wishlist', function () {
        var object = {};
        apiWishlistMock = {
            items: [{}, {}, {}]
        };
        wishlist(object, apiWishlistMock);
        assert.equal(object.wishlist.length, 3);
    });

    it('should create a property on the passed in object called wishlist with 1 entry if wishlist only has 1 item', function () {
        var object = {};
        apiWishlistMock = {
            items: [{}]
        };
        wishlist(object, apiWishlistMock);
        assert.equal(object.wishlist.length, 1);
    });
});