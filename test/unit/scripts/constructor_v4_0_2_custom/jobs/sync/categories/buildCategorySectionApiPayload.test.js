const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru();

describe('buildCategoryApiPayload', function () {
    let buildCategoryApiPayload;

    beforeEach(function () {
        // Mock the ingestionStrategies module
        buildCategoryApiPayload = proxyquire('../../../../../../../cartridges/link_constructor_connect_custom/cartridge/scripts/jobs/sync/categories/buildCategorySectionApiPayload', {
            '*/cartridge/scripts/constants/ingestionStrategies': {
                full: 'FULL',
                section: 'Categories'
            }
        });
    });

    it('should return the correct API payload with ingestion strategy set to full', function () {
        const options = {};
        const result = buildCategoryApiPayload(options);

        assert.deepEqual(result, {
            strategy: 'FULL',
            section: 'Categories'
        });
    });
});
