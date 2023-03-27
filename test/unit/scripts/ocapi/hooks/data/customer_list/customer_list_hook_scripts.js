'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

describe('int_ocapi/cartridge/hooks/data/customer_list', () => {
    var customerList = proxyquire('../../../../../../../cartridges/int_ocapi/cartridge/hooks/data/customer_list/customer_list_hook_scripts.js', {
        'dw/system/Status': function () {}
    });

    it('Testing addExternalProfile', () => {
        global.request.getHttpParameters = function () {
            return {
                containsKey: function () {
                    return {};
                },
                get: function () {
                    return {};
                }
            };
        };
        var customer = {
            getExternalProfile: function () {
                return null;
            },
            createExternalProfile: function () {
                return {};
            }
        };
        var result = customerList.afterPost(customer);
        assert.isNotNull(result);
    });
});
