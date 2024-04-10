var chai = require('chai');
var assert = chai.assert;

describe('transformCategory', function () {
    var transformCategory;
    var category;

    beforeEach(function () {
        transformCategory = require('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/categories/transformCategory');

        category = {
            ID: '123',
            parent: {
                ID: '456'
            },
            displayName: 'Category Name'
        };
    });

    it('should transform a category into the expected format', function () {
        var transformedData = transformCategory(category, {});

        assert.deepEqual(transformedData, {
            id: '123',
            parent_id: '456',
            name: 'Category Name',
            data: {}
        });
    });

    it('should handle categories without a parent', function () {
        category.parent = null;

        var transformedData = transformCategory(category, {});

        assert.deepEqual(transformedData, {
            id: '123',
            parent_id: null,
            name: 'Category Name',
            data: {}
        });
    });

    it('should handle categories without displayName', function () {
        category.displayName = null;

        var transformedData = transformCategory(category, {});

        assert.deepEqual(transformedData, {
            id: '123',
            parent_id: '456',
            name: '123',
            data: {}
        });
    });
});
