'use strict';

var formHelpers = require('./formErrors');
var base = require('base/checkout/billing');

/**
 * Get Success_url from Atome create Order API through AJAX call from Atome payment button on checkout
 * On success API response , Open Atome Lightbox to start Payment
 */
base.paymentTabs = function () {
    $('.payment-options .nav-item').on('click', function (e) {
        e.preventDefault();
        var methodID = $(this).data('method-id');
        $('input[name*="billing_paymentMethod"]').val(methodID);
        $('.payment-information').data('payment-method-id', methodID);
        formHelpers.clearPreviousErrors('.payment-form');

        if (methodID === 'ATOME_PAYMENT') {
            $('.atome-payment-content').addClass('active');
            $('.credit-card-content').removeClass('active');

        	$('.dwfrm_billing_creditCardFields_cardNumber,.dwfrm_billing_creditCardFields_expirationMonth, .dwfrm_billing_creditCardFields_expirationYear, .dwfrm_billing_creditCardFields_securityCode, .form-group.cardNumber,.bankTransfer').hide();
        	$('#credit-card-content .user-payment-instruments.container').addClass('checkout-hidden');
        	$('.credit-card-form').removeClass('checkout-hidden');
            $('.btn.btn-block.cancel-new-payment, .save-credit-card.custom-control.custom-checkbox ').hide();
            $('.saved-payment-security-code').hide();
        	$('.next-step-button .submit-payment').attr('id', 'showSubmitPayment');
        } else if (methodID === 'CREDIT_CARD') {
            $('.atome-payment-content').removeClass('active');
            $('.credit-card-content').addClass('active');

            $('.dwfrm_billing_creditCardFields_cardNumber,.dwfrm_billing_creditCardFields_expirationMonth, .dwfrm_billing_creditCardFields_expirationYear, .dwfrm_billing_creditCardFields_securityCode, .form-group.cardNumber').show();

        	$('.next-step-button .submit-payment').attr('id', 'showSubmitPayment');
        }
    });
};

module.exports = base;
