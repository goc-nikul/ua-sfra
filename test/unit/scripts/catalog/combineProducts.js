'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

// Path to test scripts
var pathToCoreMock = '../../../mocks/';

describe('cartridges/bc_jobs/cartridge/scripts/export/combineProducts.js file test cases', () => {
    var combineProducts = proxyquire('../../../../cartridges/bc_jobs/cartridge/scripts/export/combineProducts.js', {
        'dw/util/StringUtils': require(pathToCoreMock + 'dw/dw_util_StringUtils'),
        'dw/io/File': require(pathToCoreMock + 'dw/dw_io_File'),
        'dw/system/Status': require(pathToCoreMock + 'dw/dw_system_Status'),
        'dw/catalog/ProductMgr': require(pathToCoreMock + 'dw/dw_catalog_ProductMgr'),
        'dw/system/Logger': require(pathToCoreMock + 'dw/dw_system_Logger'),
        '~/cartridge/scripts/utils/CatalogXmlWriter': {}
    });

    it('transformString() should transform string to array format', function () {
        let str = '103=White,102=Black';
        let result = combineProducts.transformCoToArray('color', str);
        const expected = [{
            variationId: 'color',
            items: [{
                name: 'White',
                value: '103'
            }, {
                name: 'Black',
                value: '102'
            }]
        }];
        assert.deepEqual(result, expected);
    });

    it('should transform input string to array of objects', () => {
        const variationAttrId = 'product123';
        const inputString = '100=Black,102=White,103=Green';

        const result = combineProducts.transformCoToArray(variationAttrId, inputString);

        assert.isArray(result, 'Result should be an array');
        assert.lengthOf(result, 1, 'Result array should have one element');
        assert.property(result[0], 'variationId', 'Result should have property "variationId"');
        assert.property(result[0], 'items', 'Result should have property "items"');

        const items = result[0].items;
        assert.isArray(items, 'Items should be an array');
        assert.lengthOf(items, 3, 'Items array should have three elements');

        // Assuming order of items matters
        assert.deepEqual(items[0], { name: 'Black', value: '100' }, 'First item should be { name: "Black", value: "100" }');
        assert.deepEqual(items[1], { name: 'White', value: '102' }, 'Second item should be { name: "White", value: "102" }');
        assert.deepEqual(items[2], { name: 'Green', value: '103' }, 'Third item should be { name: "Green", value: "103" }');
    });
});

