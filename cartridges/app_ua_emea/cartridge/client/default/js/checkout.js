'use strict';

var processInclude = require('base/util');

var adyenCheckout = require('adyen/adyenCheckout');

$(document).ready(function () {
  // eslint-disable-line
    var name = 'paymentError';
    var error = new RegExp('[?&]'.concat(encodeURIComponent(name), '=([^&]*)')).exec(location.search // eslint-disable-line no-restricted-globals
    );
    var paymentStage = new RegExp('[?&]stage=payment([^&]*)').exec(location.search // eslint-disable-line no-restricted-globals
    );
    var isPayPal = new RegExp('[?&]isPayPal=true([^&]*)').exec(location.search // eslint-disable-line no-restricted-globals
    );

    if (error || paymentStage || isPayPal) {
        if (error) {
            $('.error-message').show();
            $('.error-message-text').text(decodeURIComponent(error[1]));
        }

        adyenCheckout.renderGenericComponent();
    }

    processInclude(require('./checkout/checkout'));
    // Include paazl client only when it is enabled
    if ($('#paazl-checkout').length > 0) processInclude(require('./checkout/paazl'));
    let methodID = $('.payment-options .nav-item .active').parent().attr('data-method-id');
    if (methodID) {
        $('#selectedPaymentOption').val(methodID);
    }

    if ($('.js-employee-terms-conditions').length > 0) {
        if ($('.js-employee-terms-conditions').is(':checked')) {
            $('.place-order').removeAttr('disabled');
        } else {
            $('.place-order').attr('disabled', 'disabled');
        }
    }

    $('.checkout-card-header').on('click', function () {
        $(this).parents('.card').prev().find('.btn-primary')
            .trigger('click');
    });
    if ($('.customer-phonenumber').length > 0) {
        $('.validatePhoneField').trigger('keyup');
    }
});
$('.payment-options .nav-link').click(function () {
    let methodID = $(this).parent().attr('data-method-id');
    if (methodID) {
        $('#selectedPaymentOption').val(methodID);
    }
});
