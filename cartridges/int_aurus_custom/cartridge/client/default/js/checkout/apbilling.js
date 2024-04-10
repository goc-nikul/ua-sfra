'use strict';

var base = require('org/checkout/billing');
var addressHelpers = require('org/checkout/address');


// Custom Aurus client side code
var aurusCheckout = require('../aurusCheckout');

/**
* Handles credit card number validation
* Overriding base cartrisge validation as there are no credit card numbers to process
* because form is an external iFrame
* @returns {number} returns zero
*/
base.handleCreditCardNumber = function () {
    return 0;
};

base.selectSavedPaymentInstrument = function () {
    $(document).on('click', '.saved-payment-instrument', function (e) {
        e.preventDefault();
        aurusCheckout.methods.getAurusSession('newCard');
        $('.saved-payment-security-code').val('');
        $('.saved-payment-instrument').removeClass('selected-payment');
        $(this).addClass('selected-payment');
        $(this).closest('.payment-form-fields').removeClass('error-payment-selection');
        $('.saved-payment-instrument .card-image').removeClass('checkout-hidden');
        $('.saved-payment-instrument .security-code-input').addClass('checkout-hidden');
        $('.saved-payment-instrument.selected-payment .card-image').addClass('checkout-hidden');
        $('.saved-payment-instrument.selected-payment .security-code-input').removeClass('checkout-hidden');
        $(this).parent('.store-payments-container').closest('.stored-payments').siblings('.row')
        .find('.add-payment')
        .removeClass('checkout-hidden');
        $(this).parent('.store-payments-container').closest('.user-payment-instruments').siblings('.credit-card-form')
        .addClass('checkout-hidden');
        $(this).closest('.payment-form-fields').find('.js-payment-selection-error').addClass('hide');
        $('.payment-information').attr('data-is-new-payment', false);
    });

    // if no default credit card is selected then select first credit card
    if ($('.saved-payment-instrument').length > 0 && $('.saved-payment-instrument.selected-payment').length <= 0) {
        if ($('.payment-information').attr('data-payment-method-id') === 'CREDIT_CARD' || $('.payment-information').attr('data-payment-method-id') === 'AURUS_CREDIT_CARD') {
            $('.saved-payment-instrument:first').trigger('click');
        }
    }
};

/**
* Attaches click event to add payment button
* Renders new iFrame session for new card submission
*/
base.addNewPaymentInstrument = function () {
    $('.btn.add-payment').on('click', function (e) {
        e.preventDefault();
        aurusCheckout.methods.getAurusSession('newCard');
        $('.payment-information').attr('data-is-new-payment', true);
        $('.credit-card-form').removeClass('checkout-hidden');
        $('.credit-card-form button').addClass('checkout-hidden');
        $(this).addClass('checkout-hidden');
        $(this).parent('.row').siblings('.stored-payments').find('.saved-payment-instrument')
        .removeClass('selected-payment');
    });
};

/**
* Attaches click event to cancel new payment button
* Renders saved card form into iFrame from Aurus
*/
base.cancelNewPayment = function () {
    $('.cancel-new-payment').on('click', function (e) {
        e.preventDefault();
        aurusCheckout.methods.getAurusSession();
        $('.payment-information').attr('data-is-new-payment', false);
        $('.user-payment-instruments').removeClass('checkout-hidden');
        $('.credit-card-form').addClass('checkout-hidden');
    });
};

/**
* updates the billing address form values within payment forms
* @param {Object} order - the order model
*/
function updateBillingAddressFormValues(order) {
    var billing = order.billing;
    if (!billing.billingAddress || !billing.billingAddress.address) return;

    var form = $('form[name=dwfrm_billing]');
    if (!form) return;

    $('input[name$=_firstName]', form).val(billing.billingAddress.address.firstName);
    $('input[name$=_lastName]', form).val(billing.billingAddress.address.lastName);
    $('input[name$=_address1]', form).val(billing.billingAddress.address.address1);
    $('input[name$=_address2]', form).val(billing.billingAddress.address.address2);
    $('input[name$=_city]', form).val(billing.billingAddress.address.city);
    $('input[name$=_postalCode]', form).val(billing.billingAddress.address.postalCode);
    $('select[name$=_stateCode],input[name$=_stateCode]', form)
        .val(billing.billingAddress.address.stateCode);
    $('select[name$=_country]', form).val(billing.billingAddress.address.countryCode.value);
    $('input[name$=_phone]', form).val(billing.billingAddress.address.phone);
    $('input[name$=_email]', form).val(order.orderEmail);

    if (billing.payment && billing.payment.selectedPaymentInstruments
        && billing.payment.selectedPaymentInstruments.length > 0) {
        var instrument = billing.payment.selectedPaymentInstruments[0];
        $('select[name$=expirationMonth]', form).val(instrument.expirationMonth);
        $('select[name$=expirationYear]', form).val(instrument.expirationYear);
        // Force security code and card number clear
        $('input[name$=securityCode]', form).val('');
    }
}


base.methods.updateBillingInformation = function (order, customer) {
    base.methods.updateBillingAddressSelector(order, customer);
    // update billing address form
    updateBillingAddressFormValues(order);

    // update billing address summary
    addressHelpers.methods.populateAddressSummary('.billing .address-summary',
        order.billing.billingAddress.address);
    // update billing parts of order summary
    $('.order-summary-email').text(order.orderEmail);

    if (order.billing.billingAddress.address) {
        $('.order-summary-phone').text(order.billing.billingAddress.address.phone);

        // Updating the firstName and lastName for the Hold at Location
        $('input[name$=_contactInfoFields_firstName]').val(order.billing.billingAddress.address.firstName);
        $('input[name$=_contactInfoFields_lastName]').val(order.billing.billingAddress.address.lastName);
    }
};

base.methods.updatePaymentInformation = function (order) {
    var $paymentSummary = $('.payment-details');
    var htmlToAppend = '';
    if (order.billing.payment && order.billing.payment.selectedPaymentInstruments && order.billing.payment.selectedPaymentInstruments.length > 0) {
        var payment;
        Object.keys(order.billing.payment.selectedPaymentInstruments).forEach(function (selectedPaymentInstrument) {
            payment = order.billing.payment.selectedPaymentInstruments[selectedPaymentInstrument];
            var paymentMethodType = $paymentSummary.data('gift-card-type');
            if (payment.paymentMethod === 'Paymetric' || payment.paymentMethod === 'AURUS_CREDIT_CARD') {
                htmlToAppend += `
        	 <span>
        	    ${payment.type} 
        	 </span>
        	 <div>
        	     ${payment.maskedCreditCardNumber}
        	 </div>
        	 <div>
        	     <span>
        	         ${payment.expirationMonth} / ${payment.expirationYear}
        	     </span>
        	 </div>
        	`;
            } else if (payment.paymentMethod === 'PayPal') {
                htmlToAppend += `
        	<div>
            	${payment.paymentMethod}
            </div>
            <div>
            	${payment.formattedAmount}
            </div>
        	`;
            } else if (payment.paymentMethod === 'GIFT_CARD') {
                htmlToAppend += `
                <div class="gift-card-type">
                    ${paymentMethodType}
                </div>
                <div class="gift-card-number">
                    '**** **** ****'${payment.maskedGcNumber}
                </div>
            	`;
            } else if (payment.paymentMethod === 'VIP_POINTS') {
                var allotmentPointsAppliedLabel = $paymentSummary.data('allotment-points-applied');
                htmlToAppend += `
                    <div class="vip-summary summary-details billing b-payment-summary_billing">
                        <div class="vip-points-applied">
                            <span>${allotmentPointsAppliedLabel} ${payment.formattedAmount}</span>
                        </div>
                    </div>
                    `;
            } else if (payment.paymentMethod === 'KLARNA_PAYMENTS') {
                htmlToAppend += '<div class="payment">';
                htmlToAppend += '<div class="method-name klarna-method-name">' + payment.name + '</div>';
                if (payment.categoryName) {
                    htmlToAppend += '<div class="category-name">' + payment.categoryName + '</div>';
                }
                if (typeof payment.amountFormatted !== 'undefined') {
                    htmlToAppend += '<div class="amount">' + payment.amountFormatted + ' ' + payment.klarnaSplitMsg + '</span>';
                }
                htmlToAppend += '</div>';
            } else if (payment.paymentMethod === 'AURUS_OXXO') {
                htmlToAppend += `
                <div>
                    ${payment.name}
                </div>
                <div>
                    ${payment.formattedAmount}
                </div>
                `;
            } else if (payment.paymentMethod === 'AURUS_SAFETYPAY') {
                htmlToAppend += `
                <div>
                    ${payment.name}
                </div>
                <div>
                    ${payment.formattedAmount}
                </div>
                `;
            }
        });
    }
    $paymentSummary.empty().append(htmlToAppend);
};

/**
* Ajax call to get Aurus Get Biller Token
* @returns {string} systemType
*/
function getPlatformName() {
    var systemType = '';
    var iOSversion = '';
    var isSafari = !!navigator.userAgent.match(/Version\/[\d.]+.*Safari/);
    if (/iP(hone|od|ad)/.test(navigator.platform)) {
        var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
        iOSversion = [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)];
    }
    if (typeof (iOSversion) !== 'undefined') {
        if (iOSversion[0] >= 5 && isSafari) {
            systemType = 'iOS';
        } else if (navigator.platform === 'MacIntel' && isSafari) {
            systemType = 'iOS';
        } else {
            systemType = '';
        }
    } else {
        systemType = '';
    }
    return systemType;
}

// Remove ApplePay if not using Apple device
var isSafari = getPlatformName();
if (isSafari === '') {
    $('#applepay').hide();
}

base.removePayment = function () {
    $('.remove-payment').on('click', function (e) {
        e.preventDefault();
        var url = $(this).data('url') + '?UUID=' + $(this).data('id');
        var savedlength = $('.remove-payment').closest('.saved-payment-instrument').length;
        var savedText = $('.t-payment-sc');
        var addPaymentButton = $('.js-add-payment');
        var paymentForm = $('.credit-card-form');
        var paymentFormCard = $('.b-credit-card-form');
        $('.payment-to-remove').empty().append($(this).data('card'));
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                $('#uuid-' + data.UUID).remove();
                if (data.message) {
                    var toInsert = '<div><h3>' +
                    data.message +
                    '</h3><div>';
                    $('.paymentInstruments').after(toInsert);
                }
                if (savedlength === 1) {
                    $('.payment-information').attr('data-is-new-payment', 'true');
                    aurusCheckout.methods.getAurusSession('newCard');
                    addPaymentButton.hide();
                    savedText.hide();
                    paymentForm.removeClass('checkout-hidden');
                    paymentFormCard.addClass('hide');
                }
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }
                $.spinner().stop();
            }
        });
    });
};

base.paymentTabs = function () {
    $('.payment-options .nav-item').on('click', function (e) {
        e.preventDefault();
        var methodID = $(this).data('method-id');

        $(this).closest('.payment-information').attr('data-payment-method-id', methodID);

        if (methodID === 'PayPal' && $('.js-payment-paypal-paid').hasClass('hide')) {
            $('.submit-payment').hide();
        } else {
            $('.submit-payment').show();
        }
    });
};

base.updateAltPaymentSession = function () {
    $('body').on('checkout:updateAltPaymentSession', function () {
        aurusCheckout.methods.getAurusAltPaymentSession();
    });
};

module.exports = base;
