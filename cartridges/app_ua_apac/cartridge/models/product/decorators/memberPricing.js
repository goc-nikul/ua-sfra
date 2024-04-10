'use strict';

var ContentMgr = require('dw/content/ContentMgr');

/**
 * Returns text to be displayed in CTA to unlock member price
 * @returns {string} CTA text
 */
function getUnlockCTAText() {
    var Resource = require('dw/web/Resource');
    var content = ContentMgr.getContent('member-pricing-cta-unlock');
    var text = Resource.msg('button.unlockaccess', 'common', null);
    if (!empty(content) && content.custom.body && content.custom.body.markup) {
        text = content.custom.body.markup;
    }
    return text;
}

/**
 * Returns text to be displayed above the add to cart or unlock access CTAs
 * @param {boolean} memberPricePromotionEligible If member price promotion is applicable
 * @returns {string} text to be displayed
 */
function getTextAboveCTA(memberPricePromotionEligible) {
    var content = null;
    if (!(session.customer.registered && session.customer.authenticated)) {
        content = ContentMgr.getContent('member-pricing-unlock-message');
    } else if (memberPricePromotionEligible) {
        content = ContentMgr.getContent('member-pricing-eligible-message');
    } else {
        content = ContentMgr.getContent('member-pricing-not-eligible-message');
    }

    if (!empty(content) && content.custom.body && content.custom.body.markup) {
        return content.custom.body.markup;
    }
    return '';
}

/**
 * Returns the pricing information along with the badge to be displayed
 * @param {dw.campaign.Promotion} memberPromotion Member Promotion
 * @param {dw.catalog.Product} apiProduct product
 * @returns {Object} pricing object containing promotional price, formatted price string and html containing formatted price and badge
 */
function getPricing(memberPromotion, apiProduct) {
    var StringUtils = require('dw/util/StringUtils');
    var Resource = require('dw/web/Resource');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var promotionalPrice = memberPromotion.getPromotionalPrice(apiProduct);
    var formattedPrice = StringUtils.formatMoney(promotionalPrice);
    var badgeContent = ContentMgr.getContent('member-pricing-badge');
    var badgeString = Resource.msg('memberpricing.badge.text', 'memberPricing', null);
    if (!empty(badgeContent) && badgeContent.custom.body && badgeContent.custom.body.markup) {
        badgeString = badgeContent.custom.body.markup;
    }
    return {
        promotionalPrice: promotionalPrice,
        formattedPrice: formattedPrice,
        priceHtml: renderTemplateHelper.getRenderedHtml(
            { formattedPrice: formattedPrice, badge: badgeString },
            'product/components/pricing/memberPricing'
        ),
        badgeHtml: renderTemplateHelper.getRenderedHtml(
            { badge: badgeString },
            'product/components/pricing/memberPricingBadge'
        )
    };
}

/**
 *  check if product has member pricing and return member pricing price
 * @param {Object} object - product or productLineItem model Object
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @return {string} member price
 */
function getMemberPrice(object, apiProduct) {
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var memberPromotion;
    var memberPromoApplied;
    var activeProductPromotions = PromotionMgr.getActivePromotions().getProductPromotionsForDiscountedProduct(
        apiProduct
    );
    if (apiProduct.master) {
        var collections = require('*/cartridge/scripts/util/collections');
        var ProductFactory = require('*/cartridge/scripts/factories/product');
        var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
        var variants = apiProduct.getVariants();
        var memberPriceVariants = [];
        collections.forEach(variants, function (v) {
            if (
                v.isVariant() &&
                v.onlineFlag &&
                v.availabilityModel.availability !== 0 &&
                v.availabilityModel.orderable &&
                !productHelper.isHiddenProduct(v)
            ) {
                var variant = ProductFactory.get({ pid: v.ID, pview: 'tile' });
                var memberPricing = variant.memberPricing;
                if (memberPricing.hasMemberPrice && memberPricing.pricing.promotionalPrice.available) {
                    memberPriceVariants.push(variant);
                }
            }
        });

        return {
            hasMemberPrice: !!memberPriceVariants.length,
            memberPriceVariants: memberPriceVariants
        };
    } else if (!activeProductPromotions.empty) {
        var productPromotionsArr = activeProductPromotions.toArray();
        memberPromotion = productPromotionsArr.find((promo) => promo.custom.isMemberPricingPromo === true);
        if (!empty(memberPromotion)) {
            if ('appliedPromotions' in object && object.appliedPromotions) {
                var appliedPromotions = object.appliedPromotions;
                memberPromoApplied = appliedPromotions.some((x) => x.id === memberPromotion.ID);
            }
            var applicableMemberPricePromotions = PromotionMgr.getActiveCustomerPromotions().getProductPromotionsForDiscountedProduct(
                apiProduct
            );
            var memberPricePromotionEligible = false;
            if (!applicableMemberPricePromotions.empty) {
                memberPricePromotionEligible = applicableMemberPricePromotions
                    .toArray()
                    .some((promo) => promo.custom.isMemberPricingPromo === true);
            }
            var textAboveCTA = getTextAboveCTA(memberPricePromotionEligible);
            var customer = session.customer;
            var pricing = getPricing(memberPromotion, apiProduct);
            return {
                hasMemberPrice: !!pricing.promotionalPrice.available,
                memberPricingTextAboveCTA: textAboveCTA,
                memberPricingUnlockCTA: getUnlockCTAText(),
                memberPromoApplied: memberPromoApplied,
                memberPromotion: memberPromotion,
                memberPromoEligible: memberPricePromotionEligible,
                guestUser: !(customer.registered && customer.authenticated),
                pricing: pricing
            };
        }
    }
    return {
        hasMemberPrice: false,
        memberPricingUnlockCTA: getUnlockCTAText()
    };
}

module.exports = function (object, product) {
    Object.defineProperty(object, 'memberPricing', {
        enumerable: true,
        value: getMemberPrice(object, product)
    });
};
