'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/providers/AccertifyFraudScreenProvider', function() {

    let AccertifyFraudScreenProvider = proxyquire('../../../cartridges/app_ua_core/cartridge/providers/AccertifyFraudScreenProvider', {
        './AbstractFraudScreenProvider': require('../../mocks/scripts/AbstractProvider'),
        'int_accertify/cartridge/scripts/hooks/AccertifyCalls': {
            getNotification: function() {
                return true;
            }
        }
    });

    it('Testing method: handleReadyForExport', () => {
        let provider = new AccertifyFraudScreenProvider();

        let result = provider.validate();

        assert.equal(true, result);
    });
});
