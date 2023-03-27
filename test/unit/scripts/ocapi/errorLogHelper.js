'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

describe('int_ocapi/cartridge/scripts/errorLogHelper.js', () => {
    var errorLogHelper = proxyquire('../../../../cartridges/int_ocapi/cartridge/scripts/errorLogHelper.js', {
        'dw/system/Status': function () {},
        'dw/system/Logger': {
            getLogger: function () {
                return {
                    error: function () {
                        return 'error';
                    }
                };
            }
        }
    });

    it('Testing handleOcapiHookErrorStatus', () => {
        var result = errorLogHelper.handleOcapiHookErrorStatus({}, 'customErrorCode', 'customErrorMessage');
        assert.isNotNull(result);
    });
});
