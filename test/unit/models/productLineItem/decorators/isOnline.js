'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

const isOnline = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/productLineItem/decorators/isOnline.js',{});

describe('app_ua_core/cartridge/models/productLineItem/decorators/isOnline', () => {


    var lineItemMock = {
        product: {
            online: true
        }
    };

    var lineItemMock2 = {};

    it('should return true property for passed in object', () => {
        var object = {};
        new isOnline(object, lineItemMock);
        assert.equal(object.isOnline, true);
    });

    it('should return false property for passed in object', () => {
        var object = {};
        new isOnline(object);
        assert.equal(object.isOnline, false);
    });
});