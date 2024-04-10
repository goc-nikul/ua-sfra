require('dw-api-mock/demandware-globals');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;
const Cookies = require('dw/web/Cookies');

global.empty = (data) => {
    return !data;
};

describe('int_adobe_target/cartridge/scripts/adobeTargetDecision', function () {
    it('Testing method: getDecision', () => {
        const adobeTargetDecision = proxyquire(
            '../../../../cartridges/int_adobe_target/cartridge/scripts/adobeTargetDecision',
            {
                '~/cartridge/scripts/adobeTargetPreferences': require('../../../mocks/scripts/adobe_target/adobeTargetPreferences'),
                'int_adobe_target/cartridge/scripts/init/DeliveryService': require('../../../mocks/scripts/adobe_target/init/DeliveryService'),
                'int_adobe_target/cartridge/scripts/init/InsertionService': require('../../../mocks/scripts/adobe_target/init/InsertionService')
            }
        );

        global.request.getHttpCookies = () => {
            return new Cookies();
        };

        const customerGroups = [{ ID: 'testCustomerGroup' }];
        global.session.customer = {
            customerGroups
        };

        const testMboxId = 'testMboxId';
        let result;

        // Test not useCache
        result = adobeTargetDecision(testMboxId, false);
        assert.equal(result.name, testMboxId);

        // Test useCache
        result = adobeTargetDecision(testMboxId, true);
        assert.equal(result.name, testMboxId);

        result = adobeTargetDecision(testMboxId, true);
        assert.equal(result.name, testMboxId);
    });
});
