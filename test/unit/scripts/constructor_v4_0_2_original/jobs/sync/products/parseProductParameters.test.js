const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru();

describe('parseProductParameters', function () {
    let parseProductParameters;

    beforeEach(function () {
        // Mocks for the dependencies
        const getLastSyncDateMock = function () { return new Date('2020-01-01T00:00:00.000Z'); };
        const stringToArrayListMock = function (input) { return input ? input.split(',') : []; };
        const parseBaseParametersMock = function () {
            return {
                startedAt: new Date('1970-01-01T00:00:00.000Z'),
                apiKeyOverride: 'api-key-override',
                jobID: 'job-id',
                locale: 'locale',
                credentials: {
                    apiKey: 'api-key',
                    apiToken: 'api-token'
                }
            };
        };
        const mergeMock = function (a, b) {
            var merged = Object.assign({}, a);
            Object.keys(b).forEach(function (key) {
                merged[key] = b[key];
            });

            return merged;
        };

        parseProductParameters = proxyquire('../../../../../../../cartridges/link_constructor_connect/cartridge/scripts/jobs/sync/products/parseProductParameters', {
            '*/cartridge/scripts/helpers/config/lastSyncDate/getLastSyncDate': getLastSyncDateMock,
            '*/cartridge/scripts/helpers/utils/stringToArrayList': stringToArrayListMock,
            '*/cartridge/scripts/jobs/sync/parseBaseParameters': parseBaseParametersMock,
            '*/cartridge/scripts/helpers/utils/merge': mergeMock,
            '*/cartridge/scripts/helpers/logger': require('../../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/logger')
        });
    });

    it('parses product parameters correctly with filters provided', function () {
        const rawParameters = {
            'Filters.Ids': '1,2,3',
            'Filters.SearchPhrase': 'search phrase',
            'Filters.CategoryId': 'category-id',
            IncludeMasterProductsOutOfStock: true,
            PartialByLastSyncDate: true,
            SendOfflineVariants: true,
            IngestionStrategy: 'FULL',
            Section: 'products'
        };

        const result = parseProductParameters(rawParameters, {});

        assert.isTrue(result.hasFilters, 'hasFilters should be true when filters are provided');
        assert.isArray(result.ids, 'ids should be an array');
        assert.equal(result.ids.length, 3, 'ids array should have 3 elements');
        assert.equal(result.searchPhrase, 'search phrase', 'searchPhrase should match');
        assert.equal(result.categoryId, 'category-id', 'categoryId should match');
    });

    it('defaults hasFilters to false if no filters are provided', function () {
        const rawParameters = {
            IncludeMasterProductsOutOfStock: true,
            PartialByLastSyncDate: false,
            SendOfflineVariants: false,
            IngestionStrategy: 'FULL',
            Section: 'products'
        };

        const result = parseProductParameters(rawParameters, {});

        assert.isTrue(result.hasFilters, 'hasFilters should be false when no filters are provided');
    });

    it('handles partialByLastSyncDate flag correctly', function () {
        const rawParameters = {
            PartialByLastSyncDate: true,
            IngestionStrategy: 'FULL',
            Section: 'products'
        };

        const result = parseProductParameters(rawParameters, {});

        assert.instanceOf(result.lastSyncDate, Date, 'lastSyncDate should be a Date instance when PartialByLastSyncDate is true');
    });
});
