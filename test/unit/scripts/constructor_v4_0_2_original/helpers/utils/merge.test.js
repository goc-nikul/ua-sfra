'use strict';

var assert = require('assert');

describe('merge', function () {
    var merge;

    beforeEach(function () {
        merge = require('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/utils/merge');
    });

    it('should merge two objects correctly', function () {
        var obj1 = { a: 1, b: 2 };
        var obj2 = { c: 3, d: 4 };
        var expected = {
            a: 1, b: 2, c: 3, d: 4
        };

        var result = merge(obj1, obj2);

        assert.deepStrictEqual(result, expected);
    });

    it('should overwrite existing properties in the target object', function () {
        var obj1 = { a: 1, b: 2 };
        var obj2 = { b: 3, c: 4 };
        var expected = { a: 1, b: 3, c: 4 };

        var result = merge(obj1, obj2);

        assert.deepStrictEqual(result, expected);
    });

    it('should handle empty objects', function () {
        var obj1 = {};
        var obj2 = { a: 1, b: 2 };
        var expected = { a: 1, b: 2 };

        var result = merge(obj1, obj2);

        assert.deepStrictEqual(result, expected);
    });
});
