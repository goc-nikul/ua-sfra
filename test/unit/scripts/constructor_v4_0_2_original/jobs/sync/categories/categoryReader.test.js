const assert = require('chai').assert;
const proxyquire = require('proxyquire');

describe('CategoryReader', function () {
    let CategoryReader;

    beforeEach(function () {
        CategoryReader = proxyquire.noCallThru().load('../../../../../../../cartridges/link_constructor_connect/cartridge/scripts/jobs/sync/categories/categoryReader', {
            '*/cartridge/scripts/helpers/categories/queryCategories': function () {
                return [
                    { ID: '1', displayName: 'Category 1' },
                    { ID: '2', displayName: 'Category 2' },
                    { ID: '3', displayName: 'Category 3' }
                ];
            }
        });
    });

    describe('create', function () {
        it('should create a category reader', function () {
            const reader = CategoryReader.create();
            assert.strictEqual(reader.currentIndex, 0);
            assert.deepEqual(reader.categories, [
                { ID: '1', displayName: 'Category 1' },
                { ID: '2', displayName: 'Category 2' },
                { ID: '3', displayName: 'Category 3' }
            ]);
        });
    });

    describe('reset', function () {
        it('should reset the reader', function () {
            const reader = CategoryReader.create();
            reader.currentIndex = 2;
            reader.reset();
            assert.strictEqual(reader.currentIndex, 0);
        });
    });

    describe('getTotalCount', function () {
        it('should get the total count of categories', function () {
            const reader = CategoryReader.create();
            const totalCount = reader.getTotalCount();
            assert.strictEqual(totalCount, 3);
        });
    });

    describe('readNextRecordLine', function () {
        it('should read the next record line', function () {
            const reader = CategoryReader.create();
            const record1 = reader.readNextRecordLine();
            assert.strictEqual(reader.currentIndex, 1);
            assert.deepEqual(record1, {
                record: { ID: '1', displayName: 'Category 1' },
                valid: true,
                data: {}
            });
            const record2 = reader.readNextRecordLine();
            assert.strictEqual(reader.currentIndex, 2);
            assert.deepEqual(record2, {
                record: { ID: '2', displayName: 'Category 2' },
                valid: true,
                data: {}
            });
        });

        it('should return null when there are no more record lines to read', function () {
            const reader = CategoryReader.create();
            reader.readNextRecordLine();
            reader.readNextRecordLine();
            reader.readNextRecordLine();
            const recordLine = reader.readNextRecordLine();
            assert.strictEqual(recordLine, null);
        });
    });
});
