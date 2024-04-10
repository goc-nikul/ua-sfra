'use strict';

/**
 * Updates Promotion information in summary section
 * @param {Object} data - the order model
 */
function updatePromotionInformation(data) {
    if (data.totals.saveTotal && data.totals.saveTotal.formatted && data.totals.saveTotal.value > 0) {
        if ($('.b-order-saved-total').hasClass('hide')) {
            $('.b-order-saved-total').removeClass('hide');
        }

        $('.b-order-saved-total .order-summary_itemsvalue').empty()
        .append(data.totals.saveTotal.formatted);
    } else {
        $('.b-order-saved-total').addClass('hide');
    }
}

module.exports = {
    updatePromotionInformation: updatePromotionInformation
};
