'use strict';

var assert = require('assert');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var ArrayList = require('../../../../../mocks/scripts/util/dw.util.Collection');

describe('stringToArrayList', function () {
    var stringToArrayList;

    beforeEach(function () {
        stringToArrayList = proxyquire('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/utils/stringToArrayList', {
            'dw/util/ArrayList': ArrayList
        });
    });

    it('should convert a string separated by comma into an ArrayList', function () {
        var value = 'foo, bar, baz';
        var expected = ['foo', 'bar', 'baz'];

        var result = stringToArrayList(value);

        // Ensure the result is converted to a native JavaScript array for comparison
        assert.deepStrictEqual(result.toArray(), expected);
    });

    it('should handle an empty string', function () {
        var value = '';
        var expected = [];

        var result = stringToArrayList(value);

        // Ensure the result is converted to a native JavaScript array for comparison
        assert.deepStrictEqual(result.toArray(), expected);
    });

    it('should handle a string with leading/trailing spaces', function () {
        var value = '  foo, bar, baz  ';
        var expected = ['foo', 'bar', 'baz'];

        var result = stringToArrayList(value);

        // Ensure the result is converted to a native JavaScript array for comparison
        assert.deepStrictEqual(result.toArray(), expected);
    });

    it('should handle a string with no commas', function () {
        var value = 'foo';
        var expected = ['foo'];

        var result = stringToArrayList(value);

        // Ensure the result is converted to a native JavaScript array for comparison
        assert.deepStrictEqual(result.toArray(), expected);
    });
});
