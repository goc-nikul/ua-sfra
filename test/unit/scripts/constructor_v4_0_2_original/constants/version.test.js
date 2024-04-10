'use strict';

var assert = require('chai').assert;

// Path to scripts
var version = require('../../../../../cartridges/link_constructor_connect/cartridge/scripts/constants/version');

describe('version', function () {
    it('should have the correct value', function () {
        assert.strictEqual(version, '4.0.2');
    });
});
