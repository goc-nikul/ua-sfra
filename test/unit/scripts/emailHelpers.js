'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/scripts/helpers/emailHelpers test', () => {

    let emailHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/emailHelpers', {
        'app_storefront_base/cartridge/scripts/helpers/emailHelpers': {
            emailTypes: {}
        }
    });

    it('Testing property: emailTypes', () => {
        var result = emailHelpers.emailTypes;

        assert.equal(result.possibleFraudNotification, 7);
        assert.equal(result.invoiceConfirmation, 8);
    });
});
