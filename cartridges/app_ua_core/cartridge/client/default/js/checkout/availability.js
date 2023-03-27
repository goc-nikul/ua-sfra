/* eslint-disable spellcheck/spell-checker */
'use strict';

/**
 * Updates the product summary in checkout page
 * @param {Object} order - Order Model object
 *
 */
function updateOrderProductSummaryInformation(order) {
    var $productSummary = $('<div />');
    order.shipping.forEach(function (shipping) {
        shipping.productLineItems.items.forEach(function (lineItem) {
            var pli = $('[data-product-line-item=' + lineItem.UUID + ']');
            pli.find('.qty-card-quantity-count').html(lineItem.quantity);
            $productSummary.append(pli);
        });
    });
    $('.grand-total-label').html('(' + order.productQuantityTotal + ' Items)');
    $('.number-of-items-summary').html('(' + order.productQuantityTotal + ')');
    $('.product-summary-block').html($productSummary.html());
}

/**
 * Generates the modal window on the first call.
 *
 */
function getModalHtmlElement() {
    if ($('#checkoutAvailabilityModal').length !== 0) {
        $('#checkoutAvailabilityModal').remove();
    }
    var htmlString = '<!-- Modal -->'
        + '<div class="g-modal g-availability-modal" id="checkoutAvailabilityModal" tabindex="-1" role="dialog" aria-labelledby="checkoutAvailabilityModal">'
        + '		<div class="g-modal-dialog g-availability-modal-dialog" role="document">'
        + '			<div class="g-modal-content g-availability-modal-content">'
        + '			</div>'
        + '		</div>'
        + '</div>';

    $('body').append(htmlString);
}

/**
 * replaces the content in the modal window for product variation to be edited.
 * @param {string} availabilityHtml - url to be used to retrieve a new product model
 */
function fillModalElement(availabilityHtml) {
    $('.g-availability-modal-content').empty().html(availabilityHtml);
    $('#checkoutAvailabilityModal').modal('show');
}

/**
 * On closing of checkout availability modal need to redirect user to cart page.
 */
function onAvailabilityModalClose() {
    $('body').on('click', '#checkoutAvailabilityModal', function (e) {
        if (e.target === e.currentTarget) {
            var $this = $(this);
            var cartUrl = $this.find('.b-button-cart').attr('href');
            window.location.href = cartUrl;
        }
    });
}

module.exports = {
    getModalHtmlElement: getModalHtmlElement,
    fillModalElement: fillModalElement,
    updateOrderProductSummaryInformation: updateOrderProductSummaryInformation,
    onAvailabilityModalClose: onAvailabilityModalClose
};
