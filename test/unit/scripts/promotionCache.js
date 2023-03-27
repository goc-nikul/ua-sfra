'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/scripts/util/promotionCache test', () => {
    var promotionCache = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/util/promotionCache', {
        'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
        '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections')
    });

    global.session = {
        privacy: {
            promoCache: '{}'
        }
    };

    it('Testing handler', () => {
        global.session.privacy = {
            promoCache: '{}'
        };
        assert.equal(true, Array.isArray(promotionCache.promotions), 'check list of the active promotion IDs'); // [ 'testID' ]
    });

    it('Testing handler', () => {
        global.session.privacy = {
            promoCache: '["val1", "val2"]'
        };
        assert.equal(true, Array.isArray(promotionCache.promotions), 'check list of the active promotion IDs'); // [ 'val1', 'val2' ]
    });
});
