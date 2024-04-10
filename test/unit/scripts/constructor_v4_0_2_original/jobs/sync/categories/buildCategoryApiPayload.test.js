const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru();

describe('buildCategoryApiPayload', function () {
    let buildCategoryApiPayload;

    beforeEach(function () {
        // Mock the ingestionStrategies module
        buildCategoryApiPayload = proxyquire('../../../../../../../cartridges/link_constructor_connect/cartridge/scripts/jobs/sync/categories/buildCategoryApiPayload', {
            '*/cartridge/scripts/constants/ingestionStrategies': {
                full: 'FULL'
            }
        });
    });

    it('should return the correct API payload with ingestion strategy set to full', function () {
        const options = {};
        const result = buildCategoryApiPayload(options);

        assert.deepEqual(result, {
            strategy: 'FULL'
        });
    });
});
