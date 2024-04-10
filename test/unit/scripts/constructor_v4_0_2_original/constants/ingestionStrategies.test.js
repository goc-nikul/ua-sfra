'use strict';

var assert = require('chai').assert;

var ingestionStrategies = require('../../../../../cartridges/link_constructor_connect/cartridge/scripts/constants/ingestionStrategies');

describe('ingestionStrategies', function () {
    it('should have the correct value for full', function () {
        assert.strictEqual(ingestionStrategies.full, 'FULL');
    });

    it('should have the correct value for delta', function () {
        assert.strictEqual(ingestionStrategies.delta, 'DELTA');
    });

    it('should have the correct value for patchDeltaFail', function () {
        assert.strictEqual(ingestionStrategies.patchDeltaFail, 'PATCH_DELTA_FAIL');
    });

    it('should have the correct value for patchDeltaCreate', function () {
        assert.strictEqual(ingestionStrategies.patchDeltaCreate, 'PATCH_DELTA_CREATE');
    });

    it('should have the correct value for patchDeltaIgnore', function () {
        assert.strictEqual(ingestionStrategies.patchDeltaIgnore, 'PATCH_DELTA_IGNORE');
    });
});

