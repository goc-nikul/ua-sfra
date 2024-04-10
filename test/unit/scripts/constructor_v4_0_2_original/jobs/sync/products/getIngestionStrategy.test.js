const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru();

describe('getIngestionStrategy', function () {
    let getIngestionStrategy;

    beforeEach(function () {
        getIngestionStrategy = proxyquire('../../../../../../../cartridges/link_constructor_connect/cartridge/scripts/jobs/sync/products/getIngestionStrategy', {
            '*/cartridge/scripts/constants/ingestionStrategies': require('../../../../../../../cartridges/link_constructor_connect/cartridge/scripts/constants/ingestionStrategies'),
            '*/cartridge/scripts/helpers/logger': require('../../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/logger')
        });
    });

    it('should return FULL when ingestionStrategy is FULL without filters and lastSyncDate', function () {
        const params = {
            hasFilters: false,
            lastSyncDate: null,
            ingestionStrategy: 'FULL'
        };
        const result = getIngestionStrategy(params);
        assert.strictEqual(result, 'FULL');
    });

    it('should return DELTA when ingestionStrategy is FULL with filters', function () {
        const params = {
            hasFilters: true,
            lastSyncDate: null,
            ingestionStrategy: 'FULL'
        };
        const result = getIngestionStrategy(params);
        assert.strictEqual(result, 'DELTA');
    });

    it('should return DELTA when ingestionStrategy is FULL with lastSyncDate', function () {
        const params = {
            hasFilters: false,
            lastSyncDate: new Date(),
            ingestionStrategy: 'FULL'
        };
        const result = getIngestionStrategy(params);
        assert.strictEqual(result, 'DELTA');
    });

    it('should return DELTA when ingestionStrategy is DELTA', function () {
        const params = {
            hasFilters: false,
            lastSyncDate: null,
            ingestionStrategy: 'DELTA'
        };
        const result = getIngestionStrategy(params);
        assert.strictEqual(result, 'DELTA');
    });

    it('should return PATCH_DELTA_FAIL when ingestionStrategy is PATCH_DELTA_FAIL', function () {
        const params = {
            hasFilters: false,
            lastSyncDate: null,
            ingestionStrategy: 'PATCH_DELTA_FAIL'
        };
        const result = getIngestionStrategy(params);
        assert.strictEqual(result, 'PATCH_DELTA_FAIL');
    });

    it('should return PATCH_DELTA_CREATE when ingestionStrategy is PATCH_DELTA_CREATE', function () {
        const params = {
            hasFilters: false,
            lastSyncDate: null,
            ingestionStrategy: 'PATCH_DELTA_CREATE'
        };
        const result = getIngestionStrategy(params);
        assert.strictEqual(result, 'PATCH_DELTA_CREATE');
    });

    it('should return PATCH_DELTA_IGNORE when ingestionStrategy is PATCH_DELTA_IGNORE', function () {
        const params = {
            hasFilters: false,
            lastSyncDate: null,
            ingestionStrategy: 'PATCH_DELTA_IGNORE'
        };
        const result = getIngestionStrategy(params);
        assert.strictEqual(result, 'PATCH_DELTA_IGNORE');
    });
});
