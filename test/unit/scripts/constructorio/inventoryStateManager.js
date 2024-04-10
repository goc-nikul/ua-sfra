'use strict';

// Package includes
const assert = require('chai').assert;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

// Path to test scripts
const pathToCoreMock = '../../../mocks/';
const pathToTestFile = '../../../../cartridges/app_ua_core/cartridge/scripts/constructorio/inventoryStateManager.js';

let proxyquireData = {
    'dw/io/File': require(pathToCoreMock + 'dw/dw_io_File'),
    'dw/object/CustomObjectMgr': require(pathToCoreMock + 'dw/dw_object_CustomObjectMgr'),
    'dw/system/Transaction': require(pathToCoreMock + 'dw/dw_system_Transaction'),
    'dw/system/Logger': require(pathToCoreMock + 'dw/dw_system_Logger')
};

describe('cartridges/app_ua_core/cartridge/scripts/constructorio/inventoryStateManager.js - Test fromEntries() method', () => {
    var inventoryStateManager = proxyquire(pathToTestFile, proxyquireData);
    it('should convert an array of into an object', function () {
        const input = new Map([
            ['a', 1],
            ['b', 2],
            ['c', 3]
        ]);

        const result = inventoryStateManager.fromEntries(input);

        assert.deepEqual(result, {
            a: 1,
            b: 2,
            c: 3
        });
    });

    it('should handle an empty array', function () {
        const input = new Map();

        const result = inventoryStateManager.fromEntries(input);

        assert.deepEqual(result, {});
    });

    it('should handle duplicate keys and over write the last element', function () {
        const input = new Map([
            ['a', 1],
            ['b', 2],
            ['a', 3]
        ]);

        const result = inventoryStateManager.fromEntries(input);

        assert.deepEqual(result, {
            a: 3,
            b: 2
        });
    });
});

describe('cartridges/app_ua_core/cartridge/scripts/constructorio/inventoryStateManager.js - Test entries() method', () => {
    var inventoryStateManager = proxyquire(pathToTestFile, proxyquireData);
    it('should convert an object into an array', function () {
        const input = {
            a: 1,
            b: 2,
            c: 3
        };

        const result = inventoryStateManager.entries(input);

        assert.deepEqual(result, [
            ['a', 1],
            ['b', 2],
            ['c', 3]
        ]);
    });

    it('should accept an empty object as the input', function () {
        const input = {};

        const result = inventoryStateManager.entries(input);

        assert.deepEqual(result, []);
    });

    it('should handle objects with nested values', function () {
        const input = {
            a: {
                nested: 'value'
            },
            b: [1, 2, 3],
            c: true
        };

        const result = inventoryStateManager.entries(input);

        assert.deepEqual(result, [
            ['a', {
                nested: 'value'
            }],
            ['b', [1, 2, 3]],
            ['c', true]
        ]);
    });
});

describe('cartridges/app_ua_core/cartridge/scripts/constructorio/inventoryStateManager.js - Test checkLength() method', function () {
    let mapToStringStub;
    let inventoryStateManager;
    let inventory = new Map([
        ['a', 1],
        ['b', 2],
        ['c', 3]
    ]);

    beforeEach(function () {
        inventoryStateManager = proxyquire(pathToTestFile, proxyquireData);
        mapToStringStub = sinon.stub(inventoryStateManager, 'mapToString');
    });

    afterEach(function () {
        mapToStringStub.restore();
    });
    it('should return null when maxLen is not provided', function () {
        const result = inventoryStateManager.checkLength(inventory);
        assert.deepEqual(result, null);
    });

    it('should return "good" when the length is less than maxLen', function () {
        const maxLen = 100;
        const result = inventoryStateManager.checkLength(inventory, maxLen);

        assert.deepEqual(result, 'good');
    });

    it('should return "exceeded" when the length is equal to maxLen', function () {
        const maxLen = 1;
        const result = inventoryStateManager.checkLength(inventory, maxLen);

        assert.deepEqual(result, 'exceeded');
    });

    it('should return undefined for invalid maxLen values', function () {
        const maxLen = 'invalid';

        const result = inventoryStateManager.checkLength(inventory, maxLen);

        assert.deepEqual(result, undefined);
    });
});


describe('cartridges/app_ua_core/cartridge/scripts/constructorio/inventoryStateManager.js - Test more method', function () {
    var inventoryStateManager = proxyquire(pathToTestFile, proxyquireData);
    it('numberOfObjects() - should return the total number of items in the inventory map', () => {
        const inventory = new Map([
            ['inventory1', {
                item1: {},
                item2: {}
            }],
            ['inventory2', {
                item3: {},
                item4: {}
            }],
            ['inventory3', {
                item5: {}
            }]
        ]);

        let result = inventoryStateManager.numberOfObjects(inventory);

        assert.isNumber(result, 'Result should be a number');
        assert.equal(result, 8, 'Total number of items should be 8');

        result = inventoryStateManager.numberOfObjects(new Map());
        assert.equal(result, 0, 'Total number of items should be 0');
    });

    it('mergeDeltasFromJSONObj() - should merge deltas with the existing Map', () => {
        const initialInventory = new Map([
            ['inventory1', { variation1: {}, variation2: {} }],
            ['inventory2', { variation3: {} }]
        ]);

        const deltas = {
            inventory1: { variation1: { attribute1: 'value1' } },
            inventory3: { variation4: { attribute2: 'value2' } },
        };

        const result = inventoryStateManager.mergeDeltasFromJSONObj(initialInventory, deltas);

        assert.instanceOf(result, Map, 'Result should be an instance of Map');
        assert.equal(result.size, 3, 'Result should have 3 entries');

        assert.deepEqual(result.get('inventory1'), {
            variation1: { attribute1: 'value1' },
            variation2: {}
        }, 'inventory1 should be updated with the value from deltas');

        assert.deepEqual(result.get('inventory2'), { variation3: {} }, 'inventory2 should remain unchanged');

        assert.deepEqual(result.get('inventory3'), { variation4: { attribute2: 'value2' } }, 'inventory3 should be added');
    });

    it('cioExport() - should convert a map into an array', function () {
        const inventory = new Map([
            ['master1', { variant1: 10, variant2: 20 }],
            ['master2', { variant3: 30, variant4: 40 }]
        ]);

        // Expected output
        const expectedOutput = [
            { id: 'variant1', data: { facets: { currentHealth: [10] }, currentHealth: 10 } },
            { id: 'variant2', data: { facets: { currentHealth: [20] }, currentHealth: 20 } },
            { id: 'variant3', data: { facets: { currentHealth: [30] }, currentHealth: 30 } },
            { id: 'variant4', data: { facets: { currentHealth: [40] }, currentHealth: 40 } }
        ];

        const result = inventoryStateManager.cioExport(inventory);

        assert.deepEqual(result, expectedOutput);
    });
    it('getCustomObject() - should return existing customObject if it exists', function () {
        const existingCustomObject = { 'sample': 'sample' };

        proxyquireData['dw/object/CustomObjectMgr'] = {
            getCustomObject: () => {
                return existingCustomObject;
            }
        };
        inventoryStateManager = proxyquire(pathToTestFile, proxyquireData);

        const result = inventoryStateManager.getCustomObject();

        assert.strictEqual(result, existingCustomObject);
    });
    it('objAssign() - should correctly clone the object', function () {
        const target = { a: 1, b: 2 };
        const result = inventoryStateManager.objAssign(target);

        assert.deepEqual(result, target);
    });
});
