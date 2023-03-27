'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;

var SEOUtilsHelper;
describe('app_ua_emea/cartridge/scripts/utils/SEOUtilsHelper.js', () => {
    var result;
    it('should return false when unknown exeption occured', () => {
        SEOUtilsHelper = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/utils/SEOUtilsHelper.js', {
            'dw/system/Site': {
                getCurrent() {
                    return {
                        getCustomPreferenceValue: () => 'error string'
                    };
                }
            }
        });
        result = SEOUtilsHelper.isShopAllCategory('mens');
        assert.isDefined(result);
        assert.isFalse(result);
        result = SEOUtilsHelper.isShopAllCategory('womens');
        assert.isDefined(result);
        assert.isFalse(result);
    });

    it('should return true  when categoryID present in the preferences', () => {
        SEOUtilsHelper = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/utils/SEOUtilsHelper.js', {
            'dw/system/Site': {
                getCurrent() {
                    return {
                        getCustomPreferenceValue: () => JSON.stringify({
                            categoriesIDsWithGender: [{ categoryID: 'womens' }, { categoryID: 'mens' }]
                        })
                    };
                }
            }
        });
        result = SEOUtilsHelper.isShopAllCategory('mens');
        assert.isDefined(result);
        assert.isTrue(result);
    });
});

