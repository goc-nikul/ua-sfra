const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru();

describe('buildProductApiPayload', function () {
    let buildProductApiPayload;

    beforeEach(function () {
        buildProductApiPayload = proxyquire('../../../../../../../cartridges/link_constructor_connect/cartridge/scripts/jobs/sync/products/buildProductApiPayload', {
            '*/cartridge/scripts/jobs/sync/products/getIngestionStrategy': (params) => params.ingestionStrategy
        });
    });

    it('should return the correct API payload', function () {
        const params = {
            hasFilters: true,
            lastSyncDate: '2022-01-01',
            section: 'products',
            ingestionStrategy: 'PATCH_DELTA_FAIL'
        };
        const result = buildProductApiPayload(params);
        assert.deepEqual(result, {
            strategy: 'PATCH_DELTA_FAIL',
            hasFilters: true,
            lastSyncDate: '2022-01-01',
            section: 'products'
        });
    });

    it('should default hasFilters to false if not provided', function () {
        const params = {
            lastSyncDate: '2022-01-01',
            section: 'products',
            ingestionStrategy: 'PATCH_DELTA_FAIL'
        };
        const result = buildProductApiPayload(params);
        assert.strictEqual(result.hasFilters, false);
    });
});
