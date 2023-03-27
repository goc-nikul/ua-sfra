/* global $ */

$(function () {
    $('body').on('product:afterAttributeSelect', function (e, response) {
        if (response.data.product.price.sales && document.getElementsByTagName('klarna-placement').length > 0) {
            var quantity = $('select.js-quantity-select').val() || 1;
            document.getElementsByTagName('klarna-placement')[0].setAttribute('data-purchase-amount', Math.round(quantity * response.data.product.price.sales.value * 100));
            window.KlarnaOnsiteService.push({
                eventName: 'refresh-placements'
            });
        }
    });
});
