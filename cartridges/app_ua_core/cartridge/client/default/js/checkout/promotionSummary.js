'use strict';

/**
 * updates coupon section
 * @param {Object} data - the order model
 */
function updateCouponHTML(data) {
    $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
    // eslint-disable-next-line spellcheck/spell-checker
    $('.idme-content').empty().append(data.totals.idmePromosHtml);
}

/**
 * updates coupon section
 * @param {Object} items - Total model
 * @returns {string} html - Coupon HTML content in string format
 */
function createCouponCodeStructure(items) {
    var html = '';
    if (items.totals && items.totals.couponsSavedAmount && items.totals.couponsSavedAmount.value !== 0) {
        var promoCodeText = items.totals.couponsSavedAmount.multipleCouponsApplied ? items.resources.multiplePromoResourceMessage : items.resources.promoResourceMessage;
        html += `<div class="order-summary_promo order-summary_items order-summary_discount b-coupons_price coupon-price-adjustment bfx-remove-element">
                <span class="order-summary_itemsattr">
                <span class="promo-code_calloutmsg order-receipt-label">${promoCodeText}</span>
                </span>
                <span class="order-summary_itemsvalue">
                <span class="text-right bfx-price promo-discount-total"> ${items.totals.couponsSavedAmount.formatted} </span>
                </span>
         </div>`;
    }
    return html;
}

/**
 * Updates Promotion information in summary section
 * @param {Object} data - the order model
 */
function updatePromotionInformation(data) {
    if (!data.totals) {
        return;
    }

    if (data.totals.couponsSavedAmount) {
        $('.b-promo-outer-class').empty()
        .html(createCouponCodeStructure(data));
    }

    if (data.showSavingExperience) {
        if ($('.b-order-saved-total').hasClass('hide')) {
            $('.b-order-saved-total').removeClass('hide');
        }

        if (!data.totals.saveTotal.value) {
            $('.b-order-emea-saved-total').addClass('hide');
        }

        if (data.totals.saveTotal && data.totals.saveTotal.formatted) {
            $('.b-order-saved-total .order-summary_itemsvalue').empty()
            .append(data.totals.saveTotal.formatted);
        }
    } else {
        $('.b-order-saved-total').addClass('hide');
    }

    updateCouponHTML(data);
}

module.exports = {
    updatePromotionInformation: updatePromotionInformation
};
