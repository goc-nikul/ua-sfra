'use strict';
var collections = require('*/cartridge/scripts/util/collections');

module.exports = function (object, promotions) {
    Object.defineProperty(object, 'promotions', {
        enumerable: true,
        value: promotions.length === 0 ? null : collections.map(promotions, function (promotion) {
            return {
                calloutMsg: promotion.calloutMsg ? promotion.calloutMsg.markup : '',
                details: promotion.details ? promotion.details.markup : '',
                enabled: promotion.enabled,
                id: promotion.ID,
                name: promotion.name,
                promotionClass: promotion.promotionClass,
                rank: promotion.rank,
                campaign: {
                    id: promotion.campaign.ID,
                    UUID: promotion.campaign.UUID,
                    description: promotion.campaign.description,
                    applicableInStore: promotion.campaign.applicableInStore,
                    applicableOnline: promotion.campaign.applicableOnline
                }
            };
        })
    });
};
