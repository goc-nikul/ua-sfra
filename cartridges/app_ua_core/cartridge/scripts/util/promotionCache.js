/* global session */
'use strict';

var PromotionMgr = require('dw/campaign/PromotionMgr');
var collections = require('*/cartridge/scripts/util/collections');

var promotionCache = Object.create(null);

Object.defineProperty(promotionCache, 'promotions', {
    get: function () {
        var sessionPromoCache = JSON.parse(session.privacy.promoCache);
        if (sessionPromoCache !== null && sessionPromoCache.length) {
            return sessionPromoCache;
        }
        var activePromotions = PromotionMgr.activeCustomerPromotions.getProductPromotions();
        var promoIds = collections.map(activePromotions, function (promo) {
            return promo.ID;
        });

        session.privacy.promoCache = JSON.stringify(promoIds);
        return promoIds;
    }
});

module.exports = promotionCache;
