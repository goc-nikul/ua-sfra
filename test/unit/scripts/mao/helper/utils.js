'use strict';

// Package includes
const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

// Path to test scripts
const pathToTestFile = '../../../../../cartridges/int_mao/cartridge/scripts/helper/utils.js';

let proxyquireData = {};

describe('cartridges/int_mao/cartridge/scripts/helper/utils.js - Test more method', function () {
    let utils = proxyquire(pathToTestFile, proxyquireData);

    it('arrayChangeKeyCase() - test method', function () {
        const input = { firstName: 'John', lastName: 'Doe' };

        assert.deepEqual(utils.arrayChangeKeyCase(input), {
            firstname: 'John',
            lastname: 'Doe'
        }, 'should change keys to lowercase by default');

        assert.deepEqual(utils.arrayChangeKeyCase({
            FirstName: 'John',
            LastName: 'Doe'
        }, 'CASE_UPPER'), {
            FIRSTNAME: 'John',
            LASTNAME: 'Doe'
        }, 'should change keys to upper case');

        assert.deepEqual(utils.arrayChangeKeyCase({}), {}, 'should be able to handle empty object');

        assert.deepEqual(utils.arrayChangeKeyCase('I am a string'), false, 'should be false when input is not an object');
    });

    it('ksort() - test method', function () {
        assert.deepEqual(utils.ksort({
            2: 'c',
            1: 'b',
            0: 'a'
        }), {
            0: 'a',
            1: 'b',
            2: 'c'
        }, 'should sort the object correctly');

        assert.deepEqual(utils.ksort({
            'c': 2,
            'b': 1,
            'a': 0
        }), {
            'a': 0,
            'b': 1,
            'c': 2
        }, 'should sort object with alphabet keys');

        assert.deepEqual(utils.ksort({}), {}, 'should handle an empty object');
    });

    it('urlencode() - test method', function () {
        assert.strictEqual(utils.urlencode('Hello, I am a string!'), 'Hello%2C%20I%20am%20a%20string%21', 'should encode a string');
        assert.strictEqual(utils.urlencode('Hello**I AM ~A~ STRING'), 'Hello%2A%2AI%20AM%20%7EA%7E%20STRING', 'should be able to handle special characters');
        assert.strictEqual(utils.urlencode(''), '', 'should be able to handle an empty string');
    });
    it('parseUrl() - test method', function () {
        const url = 'https://www.ua.com/mens?query=123';

        assert.deepEqual(utils.parseUrl(url, 'query'), 'query=123', 'should extract the requests parameter correctly');

        assert.deepEqual(utils.parseUrl(url, 'path'), '/mens', 'should extract the url path correctly');

        assert.deepEqual(utils.parseUrl(''), {}, 'should handle an empty URL');
    });
    it('parseStr() - test method', function () {
        assert.deepEqual(utils.parseStr('prefn1=size&prefv1=3.5'), {
            prefn1: 'size',
            prefv1: '3.5'
        }, 'should parse the string and return an object');

        assert.deepEqual(utils.parseStr('color=light%20blue&color2=dark%20blue'), {
            color: 'light blue',
            color2: 'dark blue'
        }, 'should parse the encoded string and return an object');

        assert.deepEqual(utils.parseStr(''), {}, 'should handle an empty string and return an object');
    });
    it('httpBuildQuery() - test method', function () {
        const formdata = {
            pid: 'abc123',
            color: 'Light Blue',
            size: 10
        };
        const expectedQueryString = 'pid=abc123&color=Light%20Blue&size=10';

        const result = utils.httpBuildQuery(formdata);

        assert.strictEqual(result, expectedQueryString, 'should return a URL encoded query string');

        assert.strictEqual(utils.httpBuildQuery({}), '', 'should handle an empty object');
    });
});

