'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('Sample decorator', function () {
    var decorator = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/product/decorators/sampleDecorator.js', {
        'dw/web/URLUtils': {
            staticURL: function () {
                return {};
            }
        }
    });
    it('test Sample decorator', function () {
        var object = {
            minOrderQuantity: 1,
            maxOrderQuantity: 10,
            selectedQuantity: 2,
            id: 'someID'
        };
        decorator(object, 1, {}, []);
        assert.equal(object.id, 'someID');
    });
});
