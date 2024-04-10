'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_earlyaccess/cartridge/scripts/hooks/earlyAccessHooks', () => {
    var earlyAccessHooks = proxyquire('../../../../../../../cartridges/int_earlyaccess/cartridge/scripts/hooks/earlyAccessHooks', {
        'dw/system/Logger': require('../../../../../../mocks/dw/dw_system_Logger'),
        'dw/web/URLUtils': require('../../../../../../mocks/dw/dw_web_URLUtils'),
        '*/cartridge/scripts/helpers/earlyAccessHelpers': {
            checkEarlyAccess: function (product) {
                if (product.ID === '12345') {
                    return {
                        isEarlyAccessProduct: false,
                        hideProduct: false
                    };
                }
                return {
                    isEarlyAccessProduct: true,
                    hideProduct: false,
                    isEarlyAccessCustomer: true,
                    customerGroupId: 'test',
                    eaContent: 'test content',
                    earlyAccessBadge: 'early access badge',
                    isLoggedIn: true,
                    earlyAccessUrl: 'Account-CheckEarlyAccess?pid=54321'
                };
            }
        }
    });

    var product = {
        ID: '12345'
    };

    var earlyAccessProduct = {
        ID: '54321'
    };

    it('Testing method: check isEarlyAccessCustomer Function with normal product', () => {
        var earlyAccess = earlyAccessHooks.isEarlyAccessCustomer(product);
        assert.isNotNull(earlyAccess, 'null');
        assert.isFalse(earlyAccess.isEarlyAccessProduct);
        assert.isFalse(earlyAccess.hideProduct);
    });

    it('Testing method: check isEarlyAccessCustomer Function with early access product', () => {
        var earlyAccess = earlyAccessHooks.isEarlyAccessCustomer(earlyAccessProduct);
        assert.isNotNull(earlyAccess, 'null');
        assert.isTrue(earlyAccess.isEarlyAccessProduct);
        assert.isFalse(earlyAccess.hideProduct);
        assert.isTrue(earlyAccess.isEarlyAccessCustomer);
        assert.equal(earlyAccess.customerGroupId, 'test');
        assert.equal(earlyAccess.eaContent, 'test content');
        assert.equal(earlyAccess.earlyAccessBadge, 'early access badge');
        assert.isTrue(earlyAccess.isLoggedIn);
        assert.equal(earlyAccess.earlyAccessUrl, 'Account-CheckEarlyAccess?pid=54321');
    });
});
