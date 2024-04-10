'use strict';

var summaryHelpers = require('falcon/checkout/summary');
var promotionSummary = require('./promotionSummary');


/**
 * re-renders the order totals and the number of items in the cart
 * @param {Object} data - AJAX response from the server
 */
function updateDiscountTotals(data) {
    if (data.totals.totalDiscount.value > 0) {
        $('.order-summary_discount.order-discount').show();
        $('.order-summary_discount .order-discount-total').empty()
            .append('- ' + data.totals.totalDiscount.formatted);
    } else {
        $('.order-discount.order-summary_discount').addClass('hide-order-discount');
    }

    // update subtotal for APAC in order summary
    $('.order-summary_items .sub-total').empty().append(data.totals.subTotalWithoutAdjustments);
}

/**
 * updates promotion information in checkout summary
 * @param {Object} data - the order model
 */
function updatePromotionSummaryInformation(data) {
    promotionSummary.updatePromotionInformation(data);
}

summaryHelpers.updateDiscountTotals = updateDiscountTotals;
summaryHelpers.updatePromotionSummaryInformation = updatePromotionSummaryInformation;
module.exports = summaryHelpers;
