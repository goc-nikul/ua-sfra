'use strict';
/**
 * re-renders the shipping bar and update the message
 * @param {Object} freeShippingBar - updated shipping bar data for the cart
 */
function updateShippingBar(freeShippingBar) {
    var html = '';
    var width = '0%';
    var isShippingbarPresent = $('.shipping-bar-container').find('.b-header_progress-bar');

    if (isShippingbarPresent.length > 0) {
        width = $(isShippingbarPresent).find('.meter span').attr('data-bar-width');

        $('.shipping-bar-container').empty();
    }

    if (freeShippingBar && !$.isEmptyObject(freeShippingBar)) {
        html += '<div class="shipping-bar-content">';
        html += '<div class="b-header_progress-bar">';
        html += `<h4 class="${freeShippingBar.approachingFreeShippingPercentage === '100' ? 't-order_greentick' : 't-orderamount'}"><span></span><p>${freeShippingBar.freeShippingCalloutMsg}</p></h4>`;
        html += `<div class="meter nostripes ${freeShippingBar.approachingFreeShippingPercentage === '100' ? 'green' : 'black'}">`;
        html += `<span style="width: ${freeShippingBar.approachingFreeShippingPercentage ? freeShippingBar.approachingFreeShippingPercentage : '0'}%" data-bar-width="${freeShippingBar.approachingFreeShippingPercentage + '%'}" data-previous-bar-width="${width}"></span>`;
        html += '</div>';
        html += '</div>';
        html += '</div>';

        $('.shipping-bar-container').append(html);
        $('.shipping-bar-container').trigger('update:animateShippingProgressBar');
    }
}

/**
 * Check shipping promo in totals and hide show freeshipping bar accordingly
 * @param {Object} totals - Totals object from cart
 */
function getShippingPromo(totals) {
    var shipPromo = totals.discounts.find(function (discount) {
        if (discount.promotionClass === 'SHIPPING') {
            return true;
        }

        return false;
    });

    if (totals.totalShippingCostNonFormated !== 0 && (totals.totalShippingCost === totals.shippingLevelDiscountTotal.formatted || (!$.isEmptyObject(shipPromo) && shipPromo.promoDiscount.formatted === ('-' + totals.totalShippingCost)))) {
        $('.shipping-bar-container').addClass('d-none');
    } else {
        $('.shipping-bar-container').removeClass('d-none');
    }
}

module.exports = {
    methods: {
        updateShippingBar: updateShippingBar,
        getShippingPromo: getShippingPromo
    }
};
