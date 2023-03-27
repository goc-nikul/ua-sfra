'use strict';

var addressHelpers = require('./address');
var shippingHelpers = require('./shipping');
var availabilityHelper = require('./availability');
var summaryHelpers = require('./summary');
var formHelpers = require('./formErrors');
var scrollAnimate = require('../components/scrollAnimate');
var addressSuggestionHelpers = require('./qasAddressSuggesstion');
var clientSideValidation = require('../components/common/clientSideValidation');
var isAurusEnabled = $('.payment-information').attr('data-isaurusenabled') === 'true';
var billingHelpers;
var aurusCheckout;

const ToastMessage = require('org/components/common/ToastMessage');

if (isAurusEnabled) {
    billingHelpers = require('int_aurus_custom/checkout/apbilling');
    aurusCheckout = require('int_aurus_custom/aurusCheckout');
} else {
    billingHelpers = require('./billing');
}

/* eslint-disable no-use-before-define */
/* eslint-disable no-inner-declarations */
/* eslint-disable no-param-reassign */

/**
 * Create the jQuery Checkout Plugin.
 *
 * This jQuery plugin will be registered on the dom element in checkout.isml with the
 * id of "checkout-main".
 *
 * The checkout plugin will handle the different state the user interface is in as the user
 * progresses through the varying forms such as shipping and payment.
 *
 * Billing info and payment info are used a bit synonymously in this code.
 *
 */
(function ($) {
    $.fn.checkout = function () { // eslint-disable-line
        var plugin = this;

        //
        // Collect form data from user input
        //
        var formData = {
            // Shipping Address
            shipping: {},

            // Billing Address
            billing: {},

            // Payment
            payment: {},

            // Gift Codes
            giftCode: {}
        };

        //
        // The different states/stages of checkout
        //
        var checkoutStages = [
            'shipping',
            'payment',
            'placeOrder',
            'submitted'
        ];

        // Variable to store flag for cart without product line items
        // eslint-disable-next-line spellcheck/spell-checker
        var productLineItemExist = $('#checkout-main').data('productlineitemexist');

        if (!productLineItemExist) {
            if ($('#shippingAsBilling').is(':checked')) {
                $('#shippingAsBilling').removeAttr('checked');
                $('.b-billing_shipAsBilllabel').addClass('hide');
                if ($('.billing-address-block').find('.billing-address-section').length === 0) {
                    $('.billing-address-block.b-billing-address').addClass('display-billing-fields');
                    billingHelpers.methods.clearBillingForms();
                }
            }
        }
        var onlyBopisitemExist = $('#checkout-main').data('onlybopisitemexist');
        var adresses = $('#checkout-main').data('customer-address');
        var currentPayment = $('.payment-information').data('payment-method-id');

        if (currentPayment !== 'PayPal' && currentPayment !== 'DW_APPLE_PAY') {
            if (onlyBopisitemExist || ($('.b-checkout_page').attr('data-onlyegiftcard') === 'true')) {
                $('.b-billing_firstline, .billing-address-block, .billing-address').removeClass('hide');
                $('.billing-address-block').addClass('display-billing-fields');
                billingHelpers.methods.clearBillingForms();
                var currentCountry = $('#selectedCountry').val();
                if (currentCountry === 'CA' || currentCountry === 'US') {
                    $('#billingCountry option[value="' + currentCountry + '"]').prop('selected', 'selected').change();
                    if ($('#dwfrm_billing').length > 0) {
                        $('#dwfrm_billing').find('select[name$="_addressFields_country"]').trigger('blur');
                    }
                }
                if (adresses) {
                    $('.billing-address-block').removeClass('display-billing-fields');
                    if ($('.employee-address-selector').find('.default-address').length > 0) {
                        $('.make-ship-as-bill').addClass('hide');
                    }
                }
            } else {
                $('.billing-address-block').removeClass('display-billing-fields');
                $('.make-ship-as-bill').removeClass('hide');
            }
        } else {
            $('.b-billing_firstline, .billing-address-block').addClass('hide');
        }

        /**
         * Updates the URL to determine stage
         * @param {number} currentStage - The current stage the user is currently on in the checkout
         */
        function updateUrl(currentStage) {
            $('body').trigger('checkout:stageChange', {
                stageLabel: checkoutStages[currentStage],
                stageEnum: currentStage
            });
            history.pushState(checkoutStages[currentStage], document.title, location.pathname + '?stage=' + checkoutStages[currentStage] + '#' + checkoutStages[currentStage]);
        }

        //
        // Local member methods of the Checkout plugin
        //
        var members = {

            // initialize the currentStage variable for the first time
            currentStage: 0,

            /**
             * Set or update the checkout stage (AKA the shipping, billing, payment, etc... steps)
             * @returns {Object} a promise
             */
            updateStage: function () {
                var stage = checkoutStages[members.currentStage];
                var defer = $.Deferred(); // eslint-disable-line

                if (stage === 'shipping') {
                    //
                    // Clear Previous Errors
                    //
                    formHelpers.clearPreviousErrors('.shipping-form');

                    //
                    // Submit the Shipping Address Form
                    //
                    window.notSubmitShippingForm = false;
                    var isMultiShip = $('#checkout-main').hasClass('multi-ship');
                    var formSelector = isMultiShip ?
                        '.multi-shipping .active form' : '.single-shipping .shipping-form';
                    var $form = $(formSelector);

                    if (isMultiShip && !$form.length) {
                        // in case the multi ship form is already submitted
                        var url = $('#checkout-main').attr('data-checkout-get-url');
                        clientSideValidation.checkMandatoryField($form);
                        if (!$form.find('input.is-invalid').length && !$form.find('select.is-invalid').length) {
                            if ($('.js-shiptooffice').hasClass('active') && $('.shipping-address-section-selected').find('.default-office-address.default-address').length < 1) {
                                $('.next-step-button button').removeAttr('data-clicked');
                                $('.js-shipto-office-error').removeClass('hide');
                                scrollAnimate($('.js-shipto-office-error'));
                            } else {
                                $('.js-shipto-office-error').addClass('hide');
                                $.ajax({
                                    url: url,
                                    method: 'GET',
                                    success: function (data) {
                                        // enable the next:Payment button here
                                        $('body').trigger('checkout:enableButton', '.next-step-button button');
                                        if (!data.error) {
                                            if (window.sitePreferences && window.sitePreferences.isBOPISEnabled) {
                                                window.shipmentMergedBOPIS = data.shipmentMerged;
                                                window.basketHasOnlyBOPISProducts = data.basketHasOnlyBOPISProducts;
                                            }
                                            if (data.basketHasOnlyBOPISProducts) {
                                                window.basketHasOnlyBOPISProducts = data.basketHasOnlyBOPISProducts;
                                                $('body').trigger('checkout:updateCheckoutView', {
                                                    order: data.order,
                                                    customer: data.customer
                                                });
                                                defer.resolve();
                                            } else {
                                                shippingHelpers.methods.shippingFormResponse(defer, data);
                                            }
                                        } else if ($('.shipping-error .alert-danger').length < 1) {
                                            var errorMsg = data.message;
                                            var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
                                                'fade show" role="alert">' +
                                                '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
                                                '<span aria-hidden="true">&times;</span>' +
                                                '</button>' + errorMsg + '</div>';
                                            $('.shipping-error').append(errorHtml);
                                            if ($('.b-shipping-multi-shipping #multiShipCheck').is(':checked')) {
                                                $('.multi-shipping .selectedStore').closest('.shipping-form').each(function () {
                                                    if ($(this).find('.js-primary-pickup input[value=""]').length > 0 && $(this).find('.multi-ship-action-buttons .btn-edit-multi-ship').is(':visible')) {
                                                        $(this).find('.multi-ship-action-buttons .btn-edit-multi-ship').trigger('click');
                                                    }
                                                });
                                            }
                                            scrollAnimate($('.shipping-error'));
                                            defer.reject();
                                        }
                                    },
                                    error: function () {
                                        // enable the next:Payment button here
                                        $('body').trigger('checkout:enableButton', '.next-step-button button');
                                        // Server error submitting form
                                        defer.reject();
                                    }
                                });
                            }
                        }
                    } else {
                        $('#shippingAddressUseAsBillingAddress').val($('#shippingAsBilling').is(':checked'));
                        var shippingFormData = $form.serialize();

                        $('body').trigger('checkout:serializeShipping', {
                            form: $form,
                            data: shippingFormData,
                            callback: function (data) {
                                shippingFormData = data;
                            }
                        });
                        var productsInfo = [];
                        $('.gift-item').each(function () {
                            if ($(this).is(':checked') || ($(this).hasClass('selected') && $(this).hasClass('clear-item'))) {
                                var prodInfo = {};
                                prodInfo.pid = $(this).data('pid');
                                prodInfo.qty = $(this).data('qty');
                                prodInfo.clearItem = false;
                                if (!$(this).is(':checked') && $(this).hasClass('selected') && $(this).hasClass('clear-item')) {
                                    prodInfo.clearItem = true;
                                }
                                productsInfo.push(prodInfo);
                            }
                        });
                        if (productsInfo.length > 0) {
                            shippingFormData += '&selected_gift_items=' + JSON.stringify(productsInfo);
                        }
                        var isShipToCollectionEnabled = $('#ship-to-collectionPoint').is(':checked');
                        if (isShipToCollectionEnabled) {
                            shippingFormData += '&shiptoCollectionPoint=true';
                        } else {
                            shippingFormData += '&shiptoCollectionPoint=false';
                        }
                        clientSideValidation.checkMandatoryField($form);
                        if (!$form.find('input.is-invalid').length && !$form.find('select.is-invalid').length) {
                            if ($('.js-shiptooffice').hasClass('active') && $('.shipping-address-section-selected').find('.default-office-address.default-address').length < 1) {
                                $('.next-step-button button').removeAttr('data-clicked');
                                $('.js-shipto-office-error').removeClass('hide');
                                scrollAnimate($('.js-shipto-office-error'));
                            } else {
                                $('.js-shipto-office-error').addClass('hide');
                                $.ajax({
                                    url: $form.attr('action'),
                                    type: 'post',
                                    data: shippingFormData,
                                    success: function (data) {
                                        // enable the next:Payment button here
                                        $('body').trigger('checkout:enableButton', '.next-step-button button');
                                        if (data.order && productsInfo && productsInfo.length > 0) {
                                            $.ajax({
                                                url: $('.b-checkout_right_summary_container').data('url'),
                                                success: function (response) {
                                                    if (data && data.order) {
                                                        $('.b-checkout_right_summary_container').empty().html(response);
                                                        summaryHelpers.updateTotals(data.order.totals);
                                                        summaryHelpers.updatePromotionSummaryInformation(data.order);
                                                        updateVipData(data);
                                                        summaryHelpers.updateOrderProductSummaryInformation(data.order, data.options);
                                                        availabilityHelper.updateOrderProductSummaryInformation(data.order, data.options);
                                                    }
                                                }
                                            });
                                        }
                                        // eslint-disable-next-line spellcheck/spell-checker
                                        if (window.dw && window.dw.applepay && window.ApplePaySession && window.ApplePaySession.canMakePayments()) {
                                            if (window.ApplePaySession) {
                                                $('.b-checkout_nextStep.next-step-button').addClass('b-hide-nextstep');
                                                // members.handleNextStage(true);
                                                $('.contact-info').addClass('hide');
                                                scrollAnimate($('.b-shipping-section'));
                                                setTimeout(function () {
                                                    var isShipToCollectionEnabled = $('#ship-to-collectionPoint', this.$el).is(':checked');
                                                    if (isShipToCollectionEnabled) {
                                                        var nextStageUrl = window.location.href;
                                                        window.location.assign(nextStageUrl);
                                                    } else {
                                                        window.location.reload();
                                                    }
                                                }, 300);
                                            }
                                        }
                                        if (!(data.order.enableGiftCardPaymentForVIP) && data.order.isVipUser) {
                                            $('.js-giftcard-container').hide();
                                        }
                                        updateVipData(data);
                                        if ($('.js-giftcard-form').length > 0) {
                                            var giftCardFormInstance = $('.js-giftcard-form').data().cmpInstance;
                                            giftCardFormInstance.handleGiftCardSectionDisplay(data);
                                        }
                                        if (data.order && data.order.hasEGiftCards) {
                                            $('.paypal-tab, .g-tabs-chip.klarna-payment-item, .g-accordion-item.klarna_payments-content, .applepay-tab, .g-accordion-item.paypal-content, .g-accordion-item.applepay-tab-wrapper').addClass('hide');
                                            $('.nav-item.paymetric-tab a.nav-link').trigger('click');
                                            // When selected method is hidden, preselect the first visible method
                                            if ($('.nav-item a.nav-link.active[aria-selected="true"]:visible').length === 0) {
                                                $('.nav-item a.nav-link:visible').first().trigger('click');
                                            }
                                        }
                                        if (data.basketHasOnlyBOPISProducts) {
                                            window.basketHasOnlyBOPISProducts = data.basketHasOnlyBOPISProducts;
                                        }
                                        shippingHelpers.methods.shippingFormResponse(defer, data);

                                        if (data.order && data.order.billing && data.order.billing.payment) {
                                            if (data.order.billing.payment.isAlreadyPaidFromPayPal) {
                                                $('.js-payment-paypal-paid').removeClass('hide');
                                                $('.js-payment-paypal-new').addClass('hide');
                                            } else {
                                                $('.js-payment-paypal-paid').addClass('hide');
                                                $('.js-payment-paypal-new').removeClass('hide');
                                            }
                                        }

                                        if ($('#shippingAsBilling').is(':checked') === false && $('.billing-address-section.default-address').length === 0) {
                                            $('.b-billing_heading_line').addClass('display-required-text');
                                            $('.billing-address-block').addClass('display-billing-fields');
                                        }
                                        if ($(window).width() < 1024) {
                                            $('.tab-pane.active .g-accordion-header').removeClass('collapsed');
                                            $('.tab-pane.active .g-accordion-content').addClass('show');
                                        }

                                        var isShipToCollectionEnabled = $('#ship-to-collectionPoint').is(':checked'); // eslint-disable-line
                                        if (isShipToCollectionEnabled) {
                                            if ($('.hal-active').length > 0 && $('#dwfrm_billing').is(':visible') && $('#billingAddressOne').val() === '') {
                                                $('#billingCountry  option[value="US"]').prop('selected', 'selected').change();
                                            }
                                            $('.make-ship-as-bill').attr('data-collection', true);
                                            $('.js-giftcard-container').addClass('hide');
                                            if (window.sitePreferences.qasAddressSuggestion) {
                                                var options = {
                                                    token: document.querySelector('#qasToken').value,
                                                    elements: {
                                                        input: document.querySelector("input[name='dwfrm_billing_addressFields_address1']"),
                                                        countryList: document.querySelector('#billingCountry').value,
                                                        addressLine1: document.querySelector("input[name='dwfrm_billing_addressFields_address1']"),
                                                        addressLine2: document.querySelector("input[name='dwfrm_billing_addressFields_address2']"),
                                                        locality: document.querySelector("input[name='dwfrm_billing_addressFields_city']"),
                                                        province: document.querySelector('#billingState'),
                                                        postalCode: document.querySelector("input[name='dwfrm_billing_addressFields_postalCode']")
                                                    }
                                                };
                                                if (window.sitePreferences.qasCurrentLocation) {
                                                    options.elements.location = window.sitePreferences.qasCurrentLocation;
                                                }
                                                addressSuggestionHelpers.addressSuggestion(options);
                                                $('#qasBilling').val(true);
                                                return;
                                            }
                                        } else {
                                            $('.make-ship-as-bill').attr('data-collection', false);
                                            $('.js-giftcard-container').removeClass('hide');
                                        }

                                        if ($('.make-ship-as-bill').attr('data-collection') === true && $('#shippingAsBilling').is(':checked') === true && !isShipToCollectionEnabled) {
                                            $('#shippingAsBilling').trigger('click');
                                        }
                                        if (($('.js-giftCard-section').is(':checked')) && $('.gift_card_applied_amount.active').length === 0) {
                                            $('.s-giftcard__formFields').removeClass('hide');
                                        } else {
                                            $('.s-giftcard__formFields').addClass('hide');
                                        }
                                        if (data.order && (data.order.hasBopisItems || data.order.hasEGiftCards)) {
                                            $('.applepay-tab, .g-accordion-item.applepay-tab-wrapper').addClass('hide');
                                        }
                                    },
                                    error: function (err) {
                                        // enable the next:Payment button here
                                        $('body').trigger('checkout:enableButton', '.next-step-button button');
                                        if (err.responseJSON && err.responseJSON.redirectUrl) {
                                            window.location.href = err.responseJSON.redirectUrl;
                                        }
                                        // Server error submitting form
                                        defer.reject(err.responseJSON);
                                    }
                                });
                            }
                        }
                    }
                    return defer;
                } else if (stage === 'payment') {
                    //
                    // Submit the Billing Address Form
                    //
                    formHelpers.clearPreviousErrors('.payment-form');
                    if ($('.data-checkout-stage').data('customer-type') === 'registered') {
                        if ($('.b-checkout_save-form input.b-checkout_save-account').is(':checked')) {
                            $('span input#saveAddressToAccount').prop('checked', true);
                        }
                    }

                    $('#dwfrm_billing .billing-address-block :input').each(function (i) {
                        var elem = $('#dwfrm_billing .billing-address-block :input')[i];
                        if (($(elem).attr('type') === 'text') && !$(elem).val() && $(elem).attr('value')) {
                            $(elem).val($(elem).attr('value'));
                        } else if ($(elem).find('option').length && !$(elem).val()) {
                            $(elem).find('option').each(function (o) {
                                var option = $(elem).find('option')[o];
                                if (typeof $(option).attr('selected') !== 'undefined' && $(option).attr('selected') !== false) {
                                    $(elem).val($(option).val());
                                }
                            });
                        }
                    });

                    var billingAddressForm = $('#dwfrm_billing .billing-address-block :input').serialize();

                    $('body').trigger('checkout:serializeBilling', {
                        form: $('#dwfrm_billing .billing-address-block'),
                        data: billingAddressForm,
                        callback: function (data) {
                            if (data) {
                                billingAddressForm = data;
                            }
                        }
                    });

                    var activeTabId = $('.tab-pane.active').attr('id');
                    var paymentInfoSelector = '#dwfrm_billing .' + activeTabId + ' .payment-form-fields :input';
                    var paymentInfoForm = $(paymentInfoSelector).serialize();

                    $('body').trigger('checkout:serializeBilling', {
                        form: $(paymentInfoSelector),
                        data: paymentInfoForm,
                        callback: function (data) {
                            if (data) {
                                paymentInfoForm = data;
                            }
                        }
                    });
                    var sameAsShipping = $('.make-ship-as-bill :input');
                    var sameAsShippingForm = $(sameAsShipping).serialize();

                    var paymentForm = billingAddressForm + '&' + sameAsShippingForm + '&' + paymentInfoForm;

                    var billingValidAvailable = $('#dwfrm_billing .billing-address-block').find('#validate-Billing-Form');
                    var billingValidURL = '';
                    if (billingValidAvailable.length === 1) {
                        billingValidURL = billingValidAvailable.attr('data-actionUrl');
                    }

                    var $formBilling = $('form[name=dwfrm_billing]');
                    var savedCreditCardInfo = '';
                    clientSideValidation.checkMandatoryField($formBilling);
                    if (!$formBilling.find('input.is-invalid').length && !$formBilling.find('select.is-invalid').length) {
                        if (billingValidURL) {
                            $.ajax({
                                url: billingValidURL,
                                method: 'POST',
                                data: paymentForm,
                                success: function (data) {
                                    // enable the next:Place Order button here
                                    $('body').trigger('checkout:enableButton', '.next-step-button button');
                                    // look for field validation errors
                                    if (data.error) {
                                        if (data.fieldErrors.length) {
                                            data.fieldErrors.forEach(function (error) {
                                                if (Object.keys(error).length) {
                                                    formHelpers.loadFormErrors('.payment-form', error);
                                                }
                                            });
                                        }

                                        if (data.serverErrors.length) {
                                            data.serverErrors.forEach(function (error) {
                                                $('.error-message').show();
                                                $('.error-message-text').text(error);
                                                scrollAnimate($('.error-message'));
                                            });
                                        }
                                        defer.reject();
                                    }
                                }
                            });
                        }
                    }

                    if ($('.data-checkout-stage').data('customer-type') === 'registered') {
                        // if payment method is credit card
                        if ($('.payment-information').attr('data-payment-method-id') === 'CREDIT_CARD' || $('.payment-information').attr('data-payment-method-id') === 'AURUS_CREDIT_CARD') {
                            if (!($('.payment-information').data('is-new-payment')) || $('.payment-information').attr('data-is-new-payment') === 'false') {
                                var cvvCode = $('.saved-payment-instrument.' +
                                    'selected-payment .saved-payment-security-code').val();

                                if (cvvCode === '') {
                                    var cvvElement = $('.saved-payment-instrument.' +
                                        'selected-payment ' +
                                        '.form-control');
                                    cvvElement.addClass('is-invalid');
                                    scrollAnimate(cvvElement);
                                    defer.reject();
                                    return defer;
                                }

                                var $savedPaymentInstrument = $('.saved-payment-instrument' +
                                    '.selected-payment'
                                );
                                if ($savedPaymentInstrument.length > 0) {
                                    paymentForm += '&storedPaymentUUID=' +
                                    $savedPaymentInstrument.data('uuid');
                                } else {
                                    paymentForm += '&storedPaymentUUID=' +
                                    $('#paymentCardSelector option:selected').data('uuid');
                                }
                                paymentForm += '&securityCode=' + cvvCode;
                            }
                        }
                    }

                    var paymentID = $('.payment-information').attr('data-payment-method-id');
                    if ($('.saved-payment-instrument').length > 0 && $('.saved-payment-instrument.selected-payment').length > 0) {
                        savedCreditCardInfo = JSON.parse($('.saved-payment-instrument.selected-payment').attr('data-card'));
                        // returns the month (from 0 to 11)
                        var currentMonth = parseInt(new Date().getMonth() + 1, 10);
                        // returns the year (four digits)
                        var currentYear = parseInt((new Date().getFullYear()).toString().substr(2, 2), 10);
                        var savedCreditCardExpirationYear = parseInt(savedCreditCardInfo.creditCardExpirationYear.toString().substr(2, 2), 10);
                        var savedCreditCardExpirationMonth = savedCreditCardInfo.creditCardExpirationMonth;
                        if ((savedCreditCardExpirationYear === currentYear && savedCreditCardExpirationMonth < currentMonth) || (savedCreditCardExpirationYear < currentYear) || (savedCreditCardExpirationMonth > 12) || (savedCreditCardExpirationYear > (currentYear + 20)) || (savedCreditCardExpirationYear === (currentYear + 20) && savedCreditCardExpirationMonth > currentMonth)) {
                            $('.store-payments-container .selected-payment').addClass('expired');
                            submitPayment({ error: true, msg: 'Please delete Expiry Card and Add new Credit Card' });
                        }
                    }
                    var completeGCPay = false;
                    if ($('.payment-information').hasClass('gc-pay')) {
                        completeGCPay = true;
                    }
                    var completeVipPay = false;
                    if ($('.payment-information').hasClass('vip-pay')) {
                        completeVipPay = true;
                    }

                    if (!$formBilling.find('input.is-invalid').length && !$formBilling.find('select.is-invalid').length) {
                        if (paymentID === 'GIFT_CARD' || completeGCPay || paymentID === 'VIP_POINTS' || completeVipPay) {
                            submitPayment({ error: false, form: paymentForm });
                        } else if (paymentID === 'Paymetric' && !($('.saved-payment-instrument.selected-payment.expired').is(':visible'))) {
                            // Trigger payment method validation
                            $('body').trigger('checkout:paymentSubmitted:' + paymentID.toLowerCase(), {
                                form: paymentForm,
                                callback: submitPayment
                            });
                        } else if (paymentID === 'AURUS_CREDIT_CARD') {
                            if ($('.data-checkout-stage').data('customer-type') === 'registered' && $('.payment-information').attr('data-is-new-payment') === 'false') {
                                paymentForm += '&dwfrm_billing_creditCardFields_ott=';
                                submitPayment({ error: false, form: paymentForm });
                            }
                            // Function loads iFrame and iFrame events for Aurus OTT and pre-auth
                            aurusCheckout.methods.getCardToken();
                        } else if (paymentID === 'PayPal') {
                            var paymentUrl = $('#dwfrm_billing').attr('action') + '?hasPaypalToken=true';
                            submitPayment({ error: false, form: paymentForm, url: paymentUrl });
                        } else if (paymentID === 'klarna_pay_over_time' || paymentID === 'klarna_pay_later' || paymentID === 'KLARNA_PAYMENTS') {
                            submitPayment({ error: false, form: paymentForm });
                        }
                    }

                    /**
                     * Submit payment form
                     * @param {Object} args - Function arguments
                     */
                    function submitPayment(args) {
                        if (args.error) {
                            $('body').trigger('checkout:enableButton', '.next-step-button button');
                            // eslint-disable-next-line spellcheck/spell-checker
                            var position;
                            if ($('.js-paymetricError').is(':visible')) {
                                position = $('#paymetricError').offset().top - $('.l-header-section_bottom').outerHeight();
                            } else {
                                position = $('.b-payment-tab').offset().top - $('.l-header-section_bottom').outerHeight();
                            }
                            if (window.matchMedia('(max-width: 1024px)').matches) {
                                $('.tab-pane.paymetric-content .g-accordion-header').removeClass('collapsed');
                                $('.tab-pane.paymetric-content .g-accordion-content').addClass('show');
                            }
                            $('html, body').animate({
                                scrollTop: position
                            }, 500);
                            $('.payment-form-fields').removeClass('error-payment-selection');
                            $('.payment-form-fields').find('.js-payment-selection-error').addClass('hide');
                            if ($('.user-payment-instruments .js-add-payment').is(':visible') && $('.store-payments-container .selected-payment').length === 0) {
                                $('.payment-form-fields').addClass('error-payment-selection');
                                $('.payment-form-fields').find('.js-payment-selection-error').removeClass('hide');
                            }
                            defer.reject({
                                errorMessage: args.msg
                            });
                        } else {
                            var billingUrl = args.url ? args.url : $('#dwfrm_billing').attr('action');
                            // eslint-disable-next-line spellcheck/spell-checker
                            var addressID = $formBilling.attr('data-addr-id');
                            if ($formBilling.attr('data-address-mode') === 'details') {
                                billingUrl = billingUrl + '?addressID=' + addressID;
                            }
                            clientSideValidation.checkMandatoryField($formBilling);
                            if (!$formBilling.find('input.is-invalid').length && !$formBilling.find('select.is-invalid').length) {
                                $.ajax({
                                    url: billingUrl,
                                    method: 'POST',
                                    data: args.form,
                                    success: function (data) {
                                        // look for field validation errors
                                        if (data.error) {
                                            if (data.fieldErrors.length) {
                                                data.fieldErrors.forEach(function (error) {
                                                    if (Object.keys(error).length) {
                                                        formHelpers.loadFormErrors('.payment-form', error);
                                                    }
                                                });
                                            }

                                            if (Array.isArray(data.serverErrors) && data.serverErrors.length) {
                                                data.serverErrors.forEach(function (error) {
                                                    $('.error-message').show();
                                                    $('.error-message-text').text(error);
                                                    scrollAnimate($('.error-message'));
                                                });
                                            } else if (!Array.isArray(data.serverErrors) && data.serverErrors) {
                                                $('.error-message').show();
                                                $('.error-message-text').text(data.serverErrors);
                                                scrollAnimate($('.error-message'));
                                            }

                                            if (data.cartError) {
                                                window.location.href = data.redirectUrl;
                                            }

                                            defer.reject();
                                        } else {
                                            //
                                            // Populate the Address Summary
                                            //
                                            $('body').trigger('checkout:updateCheckoutView', {
                                                order: data.order,
                                                customer: data.customer
                                            });

                                            if (data.renderedPaymentInstruments) {
                                                $('.stored-payments').empty().html(
                                                    data.renderedPaymentInstruments
                                                );
                                            }
                                            if (data.order && data.order.billing && data.order.billing.payment && data.order.billing.payment.selectedPaymentInstruments.length > 0) {
                                                var paymentMethod = data.order.billing.payment.selectedPaymentInstruments[0].paymentMethod;
                                                $('.payment-paypal').removeAttr('id').attr('id', paymentMethod);
                                            }
                                            $('select.billingCountry').removeAttr('name').attr('name', 'dwfrm_billing_addressFields_country');
                                            if (data.customer.registeredUser &&
                                                data.customer.customerPaymentInstruments.length
                                            ) {
                                                $('.cancel-new-payment').removeClass('checkout-hidden');
                                            }

                                            if ($('.js-employee-terms-conditions').length > 0) {
                                                setTimeout(function () {
                                                    if ($('.js-employee-terms-conditions').is(':checked')) {
                                                        $('.place-order').removeAttr('disabled');
                                                    } else {
                                                        $('.place-order').attr('disabled', 'disabled');
                                                    }
                                                }, 300);
                                            }

                                            if ($('.js-vip-click').length > 0) {
                                                setTimeout(function () {
                                                    if ($('.js-vip-click').is(':checked')) {
                                                        $('.place-order').removeAttr('disabled');
                                                        $('.klarna-place-order').removeAttr('disabled');
                                                    } else {
                                                        $('.place-order').attr('disabled', 'disabled');
                                                        $('.klarna-place-order').attr('disabled', 'disabled');
                                                    }
                                                }, 300);
                                            }

                                            var isShipToCollectionEnabled = $('#ship-to-collectionPoint').is(':checked'); // eslint-disable-line
                                            if (isShipToCollectionEnabled) {
                                                $('.contact-info-block').find('.js-contact_collectionPoint').removeClass('hide');
                                                var getStateCode = $('#dwfrm_billing').find('select[name$="_states_stateCode"]').val();
                                                $('body').find('#getStateCode').val(getStateCode);
                                            } else if (data.order.hasBopisItems) {
                                                $('.contact-info-block').find('.js-contact_collectionPoint').removeClass('hide');
                                                $('.contact-info-block').find('.js-orderinfo-update').addClass('hide');
                                            } else {
                                                $('.contact-info-block').find('.js-contact_collectionPoint').addClass('hide');
                                            }
                                            if (data.paymentMethod && data.paymentMethod.value === 'KLARNA_PAYMENTS' && isAurusEnabled) {
                                                aurusCheckout.methods.getAurusAltPaymentSession('sessionOnly');
                                                if ($('.next-step-button .place-order').hasClass('g-button_tertiary')) {
                                                    $('.next-step-button .place-order').removeClass('g-button_tertiary');
                                                    $('.next-step-button .place-order').addClass('g-button_primary--black');
                                                    $('.next-step-button .place-order').text($('.place-order').attr('data-klarna-placeorder'));
                                                }
                                            } else if (data.paymentMethod && data.paymentMethod.value === 'AURUS_CREDIT_CARD' && isAurusEnabled) {
                                                $('.next-step-button .place-order').addClass('g-button_tertiary');
                                                $('.next-step-button .place-order').removeClass('g-button_primary--black');
                                                $('.next-step-button .place-order').text($('.place-order').attr('data-placeorder'));
                                            }

                                            setTimeout(function () {
                                                scrollAnimate($('.js-contact-info'));
                                            }, 300);

                                            if ($('.b-checkout_nextStep .submit-payment').is(':visible')) {
                                                defer.resolve(data);
                                            } else {
                                                defer.reject();
                                            }
                                        }
                                    },
                                    error: function (err) {
                                        // enable the next:Place Order button here
                                        $('body').trigger('checkout:enableButton', '.next-step-button button');
                                        var error = err.responseJSON.message;
                                        if (error) {
                                            $('.error-message').show();
                                            $('.error-message-text').text(error);
                                            scrollAnimate($('.error-message'));
                                        }
                                        if (err.responseJSON && err.responseJSON.redirectUrl) {
                                            window.location.href = err.responseJSON.redirectUrl;
                                        }
                                    }
                                });
                            }
                        }
                    }
                    return defer;
                } else if (stage === 'placeOrder') {
                    var form = $('.contact-info-block');
                    clientSideValidation.checkMandatoryField(form);
                    if (!form.find('input.is-invalid').length) {
                        var paymentMethodID = $('.payment-information').attr('data-payment-method-id');
                        if ((paymentMethodID === 'klarna_pay_over_time' || paymentMethodID === 'KLARNA_PAYMENTS' || paymentMethodID === 'klarna_pay_later') && isAurusEnabled) {
                            $('.next-step-button button').attr('data-clicked', 'true');
                            var sessionID = $('input[name="dwfrm_klarna_AuruspayKlarnaSessionID"]').val();
                            if (sessionID !== '') {
                                aurusCheckout.methods.getAltPaymentsConsumerObject(sessionID);
                            } else {
                                aurusCheckout.methods.getAurusAltPaymentSession();
                            }
                        } else {
                            $('body').trigger('checkout:placeOrderMethod');
                        }
                    }
                    return defer;
                }
                var p = $('<div>').promise(); // eslint-disable-line
                setTimeout(function () {
                    p.done(); // eslint-disable-line
                }, 500);
                return p; // eslint-disable-line
            },

            /**
             * Initialize the checkout stage.
             *
             * TODO: update this to allow stage to be set from server?
             */
            initialize: function () {
                // set the initial state of checkout
                members.currentStage = checkoutStages
                    .indexOf($('.data-checkout-stage').data('checkout-stage'));
                $(plugin).attr('data-checkout-stage', checkoutStages[members.currentStage]);

                // get iframe for Aurus alt payments
                if (checkoutStages[members.currentStage] === 'payment' && isAurusEnabled) {
                    aurusCheckout.methods.getAurusAltPaymentSession();
                }

                //
                // Handle Payment option selection
                //
                $('input[name$="paymentMethod"]', plugin).on('change', function () {
                    $('.credit-card-form').toggle($(this).val() === 'CREDIT_CARD');
                });

                $('body').on('checkout:goToStage', function (e, data) {
                    $('.next-step-button button').attr('data-clicked', 'false');
                    members.gotoStage(data.stage);
                });

                //
                // Handle Next State button click
                //
                $(plugin).on('click', '.next-step-button button, .checkout-card-header', function () {
                    $('.next-step-button button').attr('data-clicked', 'true');
                    members.nextStage();
                });

                $(window).on('load', function () {
                    if ($('#checkout-main').data('checkout-stage') === 'payment') {
                        if ($('#checkout-main').data('onlybopisitemexist')) {
                            scrollAnimate($('#checkout-main'));
                        } else {
                            scrollAnimate($('#payment'));
                        }
                        if ($('.hal-active').length > 0 && $('#dwfrm_billing').is(':visible') && $('#billingAddressOne').val() === '') {
                            $('#billingCountry  option[value="US"]').prop('selected', 'selected').change();
                        }
                        if ($('#ship-to-collectionPoint').is(':checked')) {
                            $('#dwfrm_billing').find('select[name$="addressFields_country"]').trigger('change');
                            $('#dwfrm_billing').find('select[name$="addressFields_country"]').trigger('blur');
                            var stateCode = $('#getStateCode').val();
                            if (stateCode.length > 0 && stateCode !== null && stateCode !== undefined && stateCode !== 'null') {
                                $('#dwfrm_billing').find('select[name$="_states_stateCode"]').val(stateCode).change();
                                $('#dwfrm_billing').find('input[name$="_states_stateCode"]').val(stateCode);
                                $('#dwfrm_billing').find('select[name$="_states_stateCode"]').trigger('blur');
                            }
                            if (window.sitePreferences.qasAddressSuggestion) {
                                var options = {
                                    token: document.querySelector('#qasToken').value,
                                    elements: {
                                        input: document.querySelector("input[name='dwfrm_billing_addressFields_address1']"),
                                        countryList: document.querySelector('#billingCountry').value,
                                        addressLine1: document.querySelector("input[name='dwfrm_billing_addressFields_address1']"),
                                        addressLine2: document.querySelector("input[name='dwfrm_billing_addressFields_address2']"),
                                        locality: document.querySelector("input[name='dwfrm_billing_addressFields_city']"),
                                        province: document.querySelector('#billingState'),
                                        postalCode: document.querySelector("input[name='dwfrm_billing_addressFields_postalCode']")
                                    }
                                };
                                if (window.sitePreferences.qasCurrentLocation) {
                                    options.elements.location = window.sitePreferences.qasCurrentLocation;
                                }
                                addressSuggestionHelpers.addressSuggestion(options);
                                $('#qasBilling').val(true);
                                return;
                            }
                        }
                    } else if ($('#checkout-main').data('checkout-stage') === 'placeOrder') {
                        scrollAnimate($('.js-contact-info'));
                    }
                });

                //
                // Handle Edit buttons on shipping and payment summary cards
                //
                $('.shipping-summary .edit-button', plugin).on('click', function () {
                    var siteValue = $('.edit-button.b-shipping-summary_edit').attr('data-currentsite') ? $('.edit-button.b-shipping-summary_edit').attr('data-currentsite') : '';
                    if ($('#paymetricError').length > 0) {
                        $('#paymetricError').css('display', 'none');
                    }
                    if (!$('#checkout-main').hasClass('multi-ship')) {
                        window.addressVerificationDone = false;
                        $('body').trigger('shipping:selectSingleShipping');
                        members.gotoStage('shipping');
                    } else if (window.sitePreferences && window.sitePreferences.isBOPISEnabled && window.shipmentMergedBOPIS) {
                        var url = $('#checkout-main').attr('data-replace-shipping-url');
                        $.ajax({
                            url: url,
                            method: 'GET',
                            success: function (data) {
                                // replace multi-ship data after merging the shipments
                                if (data.renderedTemplate) {
                                    $('.shipping-section.b-shipping-section').html(data.renderedTemplate);
                                    window.shipmentMergedBOPIS = false;
                                }
                                members.gotoStage('shipping');
                            }
                        });
                    } else {
                        members.gotoStage('shipping');
                    }
                    if ($('#ship-to-collectionPoint').is(':checked')) {
                        $('.ship-options').find('.g-radio').trigger('click');
                    }
                    if ($(window).width() < 1024 && siteValue === 'CA') {
                        $('.tab-pane.active .g-accordion-header').addClass('collapsed');
                        $('.tab-pane.active .g-accordion-content').removeClass('show');
                    }
                    $('.next-step-button').find('.js-paypal-button').addClass('hide');
                    $('.next-step-button').find('.applepay-button-display').addClass('hide');
                });

                $('.payment-summary .edit-button', plugin).on('click', function () {
                    members.gotoStage('payment');
                    var $submitPayment = $('button[value="submit-payment"]');
                    if ($('.data-checkout-stage').data('customer-type') === 'guest') {
                        if ($('#shippingAsBilling').is(':checked') === true) {
                            $('.b-billing_heading_line').removeClass('display-required-text');
                            $('.billing-address-block').removeClass('display-billing-fields');
                        }
                    }
                    if (!$('#shippingAsBilling').is(':checked') && $('.nav-item.paypal-tab a.nav-link').hasClass('active')) {
                        $('#shippingAsBilling').trigger('click');
                    } else if ($('#shippingAsBilling').is(':checked') && $('.nav-item.paypal-tab a.nav-link').hasClass('active')) {
                        $('.billing-address-block .addressSelector').find('.billing-address-option[data-addr-id=""]').trigger('click');
                    }
                    if ($('.js-add-payment.checkout-hidden').length) {
                        $('.saved-payment-instrument').removeClass('selected-payment');
                    }
                    if ($('#paymetricError').length > 0) {
                        $('#paymetricError').css('display', 'none');
                    }
                    if ($('#shippingAsBilling').is(':checked') === false) {
                        $('.b-billing_heading_line').addClass('display-required-text');
                        $('.billing-address-block').addClass('display-billing-fields');
                    }
                    if ($('#ship-to-collectionPoint').is(':checked')) {
                        $('#dwfrm_billing').find('select[name$="addressFields_country"]').trigger('change');
                        $('#dwfrm_billing').find('select[name$="addressFields_country"]').trigger('blur');
                        var stateCode = $('#getStateCode').val();
                        if (stateCode.length > 0) {
                            $('#dwfrm_billing').find('select[name$="_states_stateCode"]').val(stateCode).change();
                            $('#dwfrm_billing').find('input[name$="_states_stateCode"]').val(stateCode);
                            $('#dwfrm_billing').find('select[name$="_states_stateCode"]').trigger('blur');
                        }
                        if ($('#shippingAsBilling').is(':checked') === false) {
                            if ($('#checkout-main').data('customer-address') === true) {
                                $('.b-billing_heading_line').removeClass('display-required-text');
                                $('.billing-address-block').removeClass('display-billing-fields');
                            } else {
                                $('.b-billing_heading_line').addClass('display-required-text');
                                $('.billing-address-block').addClass('display-billing-fields');
                            }
                        }
                    }
                    if ($('.billing-nav.payment-information .nav-item .nav-link').hasClass('active') && ($('.payment-information').data('payment-method-id') === 'PayPal' && $('.is-already-paid-from-paypal').val() === 'true')) {
                        $submitPayment.text($submitPayment.attr('data-payment-paypal'));
                    } else {
                        $submitPayment.text($submitPayment.attr('data-payment-contact'));
                    }
                });

                //
                // remember stage (e.g. shipping)
                //
                updateUrl(members.currentStage);

                //
                // Listen for forward/back button press and move to correct checkout-stage
                //
                $(window).on('popstate', function (e) {
                    //
                    // Back button when event state less than current state in ordered
                    // checkoutStages array.
                    //
                    if (e.state === null ||
                        checkoutStages.indexOf(e.state) < members.currentStage) {
                        members.handlePrevStage(false);
                    } else if (checkoutStages.indexOf(e.state) > members.currentStage) {
                        // Forward button  pressed
                        members.handleNextStage(false);
                    }
                    if (checkoutStages[members.currentStage] === 'payment' && ($('#ship-to-collectionPoint').is(':checked') || $('#checkout-main').data('onlybopisitemexist'))) {
                        $('.b-billing_heading_line').addClass('display-required-text');
                        $('.billing-address-block').addClass('display-billing-fields');
                    }
                    if (checkoutStages[members.currentStage] === 'shipping') {
                        $('.next-step-button').find('.js-paypal-button').addClass('hide');
                        $('.next-step-button').find('.applepay-button-display').addClass('hide');
                    }
                });

                //
                // Set the form data
                //
                plugin.data('formData', formData);

                /* PHX-1830: Mobile Checkout Order Summary Redesign */
                $(document).on('click', '.b-checkout_sticky-applypromo', function (e) {
                    window.scrollTo(0, 0);
                    if ($(e.target).hasClass('sticky-applypromo-text')) {
                        setTimeout(function () {
                            var fixedHeadersHeight = $('.l-header-section_bottom').outerHeight() + $('.b-checkout_sticky-applypromo').outerHeight() + 40;
                            var position = $('.b-promo_input').offset().top - fixedHeadersHeight;
                            $('html, body').animate({
                                scrollTop: position
                            }, 500, 'swing', function () {
                                $('.coupon-code-field#couponCode').focus();
                            });
                        }, 500);
                    }
                    if ($(this).attr('aria-expanded') === 'true') {
                        $('.b-checkout_right').css('margin-bottom', '0');
                    } else {
                        $('.b-checkout_right').css('margin-bottom', '3rem');
                    }
                });
                $(window).scroll(function () {
                    var currentScroll = $(document).scrollTop();
                    if (currentScroll > 0) {
                        $('.b-checkout_sticky-applypromo').css('position', 'relative');
                    } else {
                        $('.b-checkout_sticky-applypromo').css('position', 'fixed');
                    }
                });
            },

            /**
             * The next checkout state step updates the css for showing correct buttons etc...
             */
            nextStage: function () {
                var promise = members.updateStage();

                promise.done(function () {
                    // Update UI with new stage
                    members.handleNextStage(true);
                    $('.next-step-button button').removeAttr('data-clicked');
                });

                promise.fail(function (data) {
                    $('.next-step-button button').removeAttr('data-clicked');
                    // show errors
                    if (data) {
                        if (data.errorStage) {
                            members.gotoStage(data.errorStage.stage);

                            if (data.errorStage.step === 'billingAddress') {
                                var $billingAddressSameAsShipping = $(
                                    'input[name$="_shippingAddressUseAsBillingAddress"]'
                                );
                                if ($billingAddressSameAsShipping.is(':checked')) {
                                    $billingAddressSameAsShipping.prop('checked', false);
                                }
                            }
                        }

                        if (data.errorMessage) {
                            $('.error-message').show();
                            $('.error-message-text').text(data.errorMessage);
                            scrollAnimate($('.error-message'));
                            $('body').trigger('checkout:error', data.errorMessage);
                        }
                    }
                });
            },

            /**
             * The next checkout state step updates the css for showing correct buttons etc...
             *
             * @param {boolean} bPushState - boolean when true pushes state using the history api.
             */
            handleNextStage: function (bPushState) {
                if (members.currentStage < checkoutStages.length - 1) {
                    // move stage forward
                    members.currentStage++;

                    //
                    // show new stage in url (e.g.payment)
                    //
                    if (bPushState) {
                        updateUrl(members.currentStage);
                    }
                }

                // Set the next stage on the DOM
                $(plugin).attr('data-checkout-stage', checkoutStages[members.currentStage]);
                if (checkoutStages[members.currentStage] === 'payment' && isAurusEnabled) {
                    aurusCheckout.methods.getAurusAltPaymentSession();
                }
                hideOrShowSubmitPayment();
            },

            /**
             * Previous State
             */
            handlePrevStage: function () {
                if (members.currentStage > 0) {
                    if (productLineItemExist === 'false' && members.currentStage !== 1) {
                        // move state back
                        members.currentStage--;
                    }
                    if (checkoutStages[members.currentStage] === 'payment' && $('#checkout-main').data('onlybopisitemexist')) {
                        window.location.href = $('#checkout-main').data('cart-url');
                    } else {
                        // move state back
                        members.currentStage--;
                        updateUrl(members.currentStage);
                    }
                }

                $(plugin).attr('data-checkout-stage', checkoutStages[members.currentStage]);
                if (checkoutStages[members.currentStage] === 'payment' && isAurusEnabled) {
                    aurusCheckout.methods.getAurusAltPaymentSession();
                }
                hideOrShowSubmitPayment();
            },

            /**
             * Use window history to go to a checkout stage
             * @param {string} stageName - the checkout state to goto
             */
            gotoStage: function (stageName) {
                members.currentStage = checkoutStages.indexOf(stageName);
                if (productLineItemExist === 'false' && members.currentStage === 0) {
                    members.currentStage++;
                }
                updateUrl(members.currentStage);
                $(plugin).attr('data-checkout-stage', checkoutStages[members.currentStage]);

                if ($('#' + stageName).length > 0) {
                    scrollAnimate($('#' + stageName));
                }
                if (checkoutStages[members.currentStage] === 'payment' && isAurusEnabled) {
                    aurusCheckout.methods.getAurusAltPaymentSession();
                }
                hideOrShowSubmitPayment();
            }
        };

        /**
         * Hide or show submit payment button logic
         */
        function hideOrShowSubmitPayment() {
            var currentPaymentMethod = $('.g-tabs-link.nav-link.active').parent('.g-tabs-chip.nav-item').attr('data-method-id');
            var $submitPayment = $('.next-step-button').find('.submit-payment');
            if (!isAurusEnabled) {
                return;
            } else if (checkoutStages[members.currentStage] === 'placeOrder' || checkoutStages[members.currentStage] === 'shipping') {
                $submitPayment.css('display', 'none');
            } else if (currentPaymentMethod !== 'PayPal' || currentPaymentMethod !== 'DW_APPLE_PAY') {
                $submitPayment.css('display', 'block');
            } else if (currentPaymentMethod === 'PayPal' && $('.is-already-paid-from-paypal').val() === 'true') {
                $submitPayment.css('display', 'block');
                $submitPayment.text($submitPayment.attr('data-payment-paypal'));
            }
        }


        //
        // Initialize the checkout
        //
        members.initialize();

        return this;
    };
}(jQuery));

var exports = {
    initialize: function () {
        $('#checkout-main').checkout();

        $('.l-header-checkout-logo a').focus();
        if (isAurusEnabled) {
            // Get and sets the iFrame src url for credit card checkout
            aurusCheckout.methods.getAurusSession();
        }

        // hiding continue to contact button if PayPal is selected on page load
        if ($('.billing-nav.payment-information .nav-item .nav-link').hasClass('active') && ($('.payment-information').data('payment-method-id') === 'PayPal' && $('.is-already-paid-from-paypal').val() === 'false') && $('#checkout-main').data('checkout-stage') !== 'shipping') {
            if (isAurusEnabled) $('.next-step-button').find('.submit-payment').css('display', 'none');
            else $('.next-step-button').find('.submit-payment').addClass('hide');
            $('.next-step-button').find('.js-paypal-button').removeClass('hide');
        }

        if (window.dw && window.dw.applepay && window.ApplePaySession && window.ApplePaySession.canMakePayments()) { // eslint-disable-line
            $('.apple-pay-container').addClass('apple-pay-btn');
            $('.applepay-tab-wrapper').addClass('mac-only'); // eslint-disable-line
            $('#applepay-content').addClass('mac-only');
            if ($('.payment-information').data('payment-method-id') === 'DW_APPLE_PAY') {
                if (isAurusEnabled) $('.next-step-button').find('.submit-payment').css('display', 'none');
                else $('.next-step-button').find('.submit-payment').addClass('hide');
                $('.next-step-button').find('.applepay-button-display').removeClass('hide');
            } else {
                if (isAurusEnabled && $('#checkout-main').attr('data-checkout-stage') === 'payment' && $('.payment-information').data('payment-method-id') !== 'PayPal') {
                    $('.next-step-button').find('.submit-payment').css('display', 'block');
                } else {
                    $('.next-step-button').find('.submit-payment').removeClass('hide');
                }
                $('.next-step-button').find('.applepay-button-display').addClass('hide');
            }
            if ($('#checkout-main').attr('data-checkout-stage') === 'shipping') {
                $('.next-step-button').find('.applepay-button-display').addClass('hide');
            }
        }

        $('body').on('click', '.g-tabs-link.nav-link', function () {
            var paymentInformation = $('.billing-nav.payment-information');
            var currentPayment = $(this).parent('.g-tabs-chip.nav-item').attr('data-method-id');
            var $submitPayment = $('button[value="submit-payment"]');
            paymentInformation.attr('data-payment-method-id', currentPayment);
            paymentInformation.data('payment-method-id', currentPayment);
            if (currentPayment !== 'klarna_pay_over_time' || isAurusEnabled) {
                updatePaymentMethod(currentPayment);
            }
            if ($('.is-already-paid-from-paypal').val() === 'false' && currentPayment === 'PayPal') {
                if (isAurusEnabled) $('.next-step-button').find('.submit-payment').css('display', 'none');
                else $('.next-step-button').find('.submit-payment').addClass('hide');
                $('.next-step-button').find('.js-paypal-button').removeClass('hide');
            } else {
                if (isAurusEnabled) $('.next-step-button').find('.submit-payment').css('display', 'block');
                else $('.next-step-button').find('.submit-payment').removeClass('hide');
                $('.next-step-button').find('.js-paypal-button').addClass('hide');
            }
            if (window.dw && window.dw.applepay && window.ApplePaySession && window.ApplePaySession.canMakePayments()) { // eslint-disable-line
                if (currentPayment === 'DW_APPLE_PAY') {
                    if (isAurusEnabled) $('.next-step-button').find('.submit-payment').css('display', 'none');
                    else $('.next-step-button').find('.submit-payment').addClass('hide');
                    $('.next-step-button').find('.applepay-button-display').removeClass('hide');
                } else {
                    if (isAurusEnabled && currentPayment !== 'PayPal') $('.next-step-button').find('.submit-payment').css('display', 'block');
                    else $('.next-step-button').find('.submit-payment').removeClass('hide');
                    $('.next-step-button').find('.applepay-button-display').addClass('hide');
                }
            }
            if ($('.is-already-paid-from-paypal').val() === 'true' && currentPayment === 'PayPal') {
                $submitPayment.text($submitPayment.attr('data-payment-paypal'));
            } else {
                $submitPayment.text($submitPayment.attr('data-payment-contact'));
            }
            $('.submit-payment').prop('disabled', false);
        });
        if ($('.g-tabs-chip.applepay-tab-wrapper').attr('data-iscancel') === 'true') {
            $('.tab-pane.applepay-tab-wrapper .g-accordion-header').removeClass('collapsed');
            $('.tab-pane.applepay-tab-wrapper .g-accordion-content').addClass('show');
        }

        $('body').on('click', '.b-payment-tab_content .b-payment-accordion-head', function () {
            if ($(window).width() < 1023) {
                var methodID = $(this).data('method-id');
                var $submitPayment = $('button[value="submit-payment"]');
                $('.billing-nav.payment-information').attr('data-payment-method-id', methodID);
                $('.tab-pane').removeClass('active');
                $(this).closest('.tab-pane').addClass('active');
                $(this).closest('.tab-pane').find('.g-accordion-content :input').removeAttr('disabled');
                $('.billing-nav.payment-information .nav-item .nav-link').removeClass('active');
                $('.billing-nav.payment-information .nav-item[data-method-id=' + methodID + '] .nav-link').addClass('active');
                // hiding continue to contact button for PayPal
                if ($('.is-already-paid-from-paypal').val() === 'false' && methodID === 'PayPal') {
                    $('.next-step-button').find('.submit-payment').addClass('hide');
                    $('.next-step-button').find('.applepay-button-display').addClass('hide');
                    $('.next-step-button').find('.js-paypal-button').removeClass('hide');
                } else if (window.dw && window.dw.applepay && window.ApplePaySession && window.ApplePaySession.canMakePayments()) { // eslint-disable-line
                    if (methodID === 'DW_APPLE_PAY') {
                        $('.next-step-button').find('.submit-payment').addClass('hide');
                        $('.next-step-button').find('.applepay-button-display').removeClass('hide');
                        $('.next-step-button').find('.js-paypal-button').addClass('hide');
                    } else {
                        if (isAurusEnabled) {
                            $('.next-step-button').find('.submit-payment').css('display', 'block');
                        }

                        $('.next-step-button').find('.submit-payment').removeClass('hide');

                        $('.next-step-button').find('.js-paypal-button').addClass('hide');
                        $('.next-step-button').find('.applepay-button-display').addClass('hide');
                    }
                } else {
                    $('.next-step-button').find('.js-paypal-button').addClass('hide');
                    $('.next-step-button').find('.applepay-button-display').addClass('hide');

                    if (isAurusEnabled) {
                        $('.next-step-button').find('.submit-payment').css('display', 'block');
                    }

                    $('.next-step-button').find('.submit-payment').removeClass('hide');
                }
                if ($('.is-already-paid-from-paypal').val() === 'true' && methodID === 'PayPal') {
                    $submitPayment.text($submitPayment.attr('data-payment-paypal'));
                } else {
                    $submitPayment.text($submitPayment.attr('data-payment-contact'));
                }
                if (methodID !== 'klarna_pay_over_time' || isAurusEnabled) {
                    updatePaymentMethod(methodID);
                }
            }
        });

        /**
         * Updates the Geo Location information to send request to QAS
         */
        function updateUserGeoLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.watchPosition(showPosition);
            }
            /**
            *@param {Object} position -  coordinates object
            */
            function showPosition(position) {
                let latitude = position.coords.latitude + ',';
                let longitude = '-' + position.coords.longitude;
                $('#geoLocationDetails').attr('value', latitude + longitude);
            }
        }
        billingHelpers.methods.updateStateOptions();
        if (window.sitePreferences.qasAddressSuggestion) {
            var onlyEGC = $('.b-checkout_page').attr('data-onlyegiftcard') === 'true';
            if (onlyEGC) {
                var currentCountry = $('#selectedCountry').val();
                if (currentCountry === 'CA' || currentCountry === 'US') {
                    $('#billingCountry option[value="' + currentCountry + '"]').prop('selected', 'selected').change();
                    var $billingForm = $('#dwfrm_billing');
                    if ($billingForm.length > 0) {
                        $billingForm.find('select[name$="_addressFields_country"]').trigger('blur');
                    }
                }
            }
            var options = {
                token: document.querySelector('#qasToken').value,
                elements: {
                    input: document.querySelector('input[name$=_address1]'),
                    countryList: document.querySelector('#billingCountry').value,
                    addressLine1: document.querySelector('input[name$=_address1]'),
                    addressLine2: document.querySelector('input[name$=_address2]'),
                    locality: document.querySelector('input[name$=_city]'),
                    province: $('.shipping-form').is(':visible') ? document.querySelector('#shippingStatedefault') : document.querySelector('#billingState'),
                    postalCode: document.querySelector('input[name$=_postalCode]')
                }
            };
            if (window.sitePreferences.qasCurrentLocation) {
                updateUserGeoLocation();
                options.elements.location = window.sitePreferences.qasCurrentLocation;
            }
            addressSuggestionHelpers.addressSuggestion(options);
            $('#qasShipping').val(true);

            // Hide autocomplete until a manual input is made. If no keyup has happened, then its autofill and no QAS should load
            $('input[name$=_address1]').on('input', function () {
                $(this).parents('.form-group').addClass('manual-input-init');
            });
        }
    },

    updateCheckoutView: function () {
        $('body').on('checkout:updateCheckoutView', function (e, data) {
            shippingHelpers.methods.updateMultiShipInformation(data.order);
            updateVipData(data);
            summaryHelpers.updateTotals(data.order.totals);
            summaryHelpers.updatePromotionSummaryInformation(data.order);
            summaryHelpers.updateShippingSummarySection(data.order.shipping);
            var shipping = data.order.shipping[0];
            data.order.shipping.forEach(function (shipping) { // eslint-disable-line
                shippingHelpers.methods.updateShippingInformation(
                    shipping,
                    data.order,
                    data.customer,
                    data.options
                );
            });
            if (data.order.vertexTaxCalculated) {
                $('.sales-tax-item .order-receipt-label').text(data.order.resources.salesTax + ':');
                $('.grand-total-element .order-receipt-label').text(data.order.resources.total + ':');
            }
            if (shipping.selectedShippingMethod) {
                $('.shipping-item .order-receipt-label').text('');
                $('.shipping-item .order-receipt-label').text((data.order.resources.shippingCost || 'Shipping') + ' (' + shipping.selectedShippingMethod.displayName + '):');
            }
            billingHelpers.methods.updateBillingInformation(
                data.order,
                data.customer,
                data.options
            );
            billingHelpers.methods.updatePaymentInformation(data.order, data.options);
            summaryHelpers.updateOrderProductSummaryInformation(data.order, data.options);

            setTimeout(function () {
                $('body').trigger('components:init');
            }, 500);
        });
    },

    fucusOutSelectBox: function () {
        $('body').on('change', 'select', function () {
            $(this).focus();
        });
    },

    enableButton: function () {
        $('body').on('checkout:enableButton', function (e, button) {
            $(button).prop('disabled', false);
        });
    },

    vipTermsConditions: function () {
        $('body').on('click', '.js-vip-terms-click', function (e) {
            e.preventDefault();
            $('.vip-terms-wrapper').toggleClass('hide');
        });

        $('body').on('click', '.js-vip-click', function () {
            if ($('.js-vip-click').is(':checked') === true) {
                $('.place-order').prop('disabled', false);
                $('.klarna-place-order').prop('disabled', false);
            } else {
                $('.place-order').prop('disabled', true);
                $('.klarna-place-order').prop('disabled', true);
            }
        });
    },

    giftCardPayment: function () {
        $('body').on('click', '.js-giftCard-section', function (e) {
            if (!($('.js-giftCard-section').is(':checked')) && ($('.s-giftcard_section_ajax .b-giftcard_applied_list').length > 0)) {
                e.preventDefault();
                $('.gift-card-payment').spinner().start();
                var removeAllGCUrl = $('.js-giftCard-section').attr('data-removeallgcurl');
                $.ajax({
                    url: removeAllGCUrl,
                    type: 'post',
                    success: function (response) {
                        if ($('.js-giftcard-form').length > 0) {
                            var giftCardFormInstance = $('.js-giftcard-form').data().cmpInstance;
                            giftCardFormInstance.handleGiftCardSectionDisplay(response);
                            $('.gift-card-payment').spinner().stop();
                        }
                        if (!$('.remove-link.anchorLinks').length) {
                            $('.paypal-tab, .g-tabs-chip.klarna-payment-item, .g-accordion-item.klarna_payments-content, .applepay-tab, .g-accordion-item.paypal-content, .g-accordion-item.applepay-tab-wrapper').removeClass('hide');
                            $('.js-giftCard-section').prop('checked', false);
                        }
                        $('body').trigger('checkout:updateCheckoutView', {
                            order: response.order,
                            customer: response.customer
                        });
                    },
                    error: function () {
                        $('.gift-card-payment').spinner().stop();
                    }
                });
            }
            var $giftcardFields = $('.s-giftcard__formFields');
            if (!($('.js-giftCard-section').is(':checked')) || $('.gift_card_applied_amount.active').length > 0) {
                $giftcardFields.addClass('hide');
            } else {
                $giftcardFields.removeClass('hide');
            }
        });

        $('body').on('click', '.apply_another_gc', function (e) {
            e.preventDefault();
            var $giftcardFields = $('.s-giftcard__formFields');
            var $this = $(this).closest('.s-giftcard_apply_another_gc');
            if ($this.hasClass('active')) {
                $this.removeClass('active');
                $this.addClass('hide');
                $giftcardFields.removeClass('hide');
            } else {
                $giftcardFields.addClass('hide');
            }
        });

        $('body').on('click', '.s-giftcard__section .remove-link', function (e) {
            e.preventDefault();
            $('.gift-card-payment').spinner().start();
            var data = {
                maskedgckastfournumber: $(this).attr('data-maskedgckastfournumber'),
                token: $('input[name$=_token]').val()
            };
            $.ajax({
                url: $(this).attr('href'),
                type: 'post',
                data: data,
                success: function (response) {
                    if ($('.js-giftcard-form').length > 0) {
                        var giftCardFormInstance = $('.js-giftcard-form').data().cmpInstance;
                        giftCardFormInstance.handleGiftCardSectionDisplay(response);
                        $('.gift-card-payment').spinner().stop();
                    }
                    if (!$('.remove-link.anchorLinks').length) {
                        $('.paypal-tab, .g-tabs-chip.klarna-payment-item, .g-accordion-item.klarna_payments-content, .applepay-tab, .g-accordion-item.paypal-content, .g-accordion-item.applepay-tab-wrapper').removeClass('hide');
                        $('.js-giftCard-section').prop('checked', false);
                        $('.b-checkout_subheader-express-login').removeClass('hide');
                    }

                    if (response.order.vipPoints && response.order.vipPoints.partialPointsApplied) {
                        $('.g-tabs-chip.klarna-payment-item, .g-accordion-item.klarna_payments-content').addClass('hide');
                        $('.b-checkout_subheader-express-login').addClass('hide');
                    }
                    $('body').trigger('checkout:updateCheckoutView', {
                        order: response.order,
                        customer: response.customer
                    });
                },
                error: function () {
                    $('.gift-card-payment').spinner().stop();
                }
            });
        });
    },
    privacyPolicy: function () {
        $('body').on('keyup', '.b-checkout_privacy a', function (event) {
            var $activeLink = event.target;
            var key = event.which || event.keyCode;
            if (key === 32) {
                $activeLink.click();
            }
        });
    },
    placeOrderMethod: function () {
        $('body').on('checkout:placeOrderMethod', function (e, defer) { // eslint-disable-line
            // disable the placeOrder button here
            if (typeof defer === 'undefined') {
                defer = $.Deferred(); // eslint-disable-line
            }
            var contactInfoForm = $('.contact-info-block :input').serialize();
            $('body').trigger('checkout:serializeBilling', {
                form: $('.contact-info-block'),
                data: contactInfoForm,
                callback: function (data) {
                    if (data) {
                        contactInfoForm = data;
                    }
                }
            });
            var paymentMethodID = $('.payment-information').attr('data-payment-method-id');
            if ((paymentMethodID === 'klarna_pay_over_time' || paymentMethodID === 'klarna_pay_later' || paymentMethodID === 'KLARNA_PAYMENTS') && isAurusEnabled) {
                contactInfoForm = contactInfoForm + '&dwfrm_klarna_AuruspayKlarnaOtt=' + $('input[name="dwfrm_klarna_AuruspayKlarnaOtt"]').val();
            }
            var emailSignUp = $('#emailUpdates').is(':checked');
            var isSubscribed = '?emailSignUp=' + emailSignUp;
            var getDeviceID = '';
            var transID = $('#devTID');
            if (transID.length > 0 && transID.val().length > 0) {
                getDeviceID = transID.val();
                // eslint-disable-next-line no-prototype-builtins, no-underscore-dangle
            } else if (window.hasOwnProperty('_bcn') && window._bcn.hasOwnProperty('dvc')) {
                // eslint-disable-next-line no-underscore-dangle
                getDeviceID = window._bcn.dvc.getTID();
            }
            var getTID = '&getTID=' + getDeviceID;
            var form = $('.contact-info-block');
            var $button = $('.place-order');
            clientSideValidation.checkMandatoryField(form);
            if (!form.find('input.is-invalid').length) {
                $button.find('.b-cart-loader').removeClass('hide');
                $.ajax({
                    url: $button.data('action') + isSubscribed + getTID,
                    data: contactInfoForm,
                    method: 'POST',
                    success: function (data) {
                        // enable the placeOrder button here
                        $('body').trigger('checkout:enableButton', '.next-step-button button');

                        if (data && data.errorEstimateMsg) {
                            new ToastMessage(data.errorEstimateMsg, {
                                duration: 3000,
                                type: 'error'
                            }).show();
                        }

                        // PHX-177 Availability check
                        if (data.availabilityError) {
                            availabilityHelper.getModalHtmlElement();
                            availabilityHelper.fillModalElement(data.renderedTemplate);
                            summaryHelpers.updateTotals(data.order.totals);
                            summaryHelpers.updatePromotionSummaryInformation(data.order);
                            updateVipData(data);
                            availabilityHelper.updateOrderProductSummaryInformation(data.order, data.options);
                            availabilityHelper.onAvailabilityModalClose();
                            $button.find('.b-cart-loader').addClass('hide');
                            defer.reject();
                        }
                        if (data.error) {
                            if (isAurusEnabled) {
                                aurusCheckout.methods.getAurusSession('newCard');
                                $('body').trigger('checkout:goToStage', { stage: 'payment' });
                            }

                            if (data.fieldErrors && data.fieldErrors.length) {
                                data.fieldErrors.forEach(function (error) {
                                    if (Object.keys(error).length) {
                                        formHelpers.loadFormErrors('.b-contact-info', error);
                                    }
                                });
                            }

                            if (data.serverErrors && data.serverErrors.length) {
                                data.serverErrors.forEach(function (error) {
                                    $('.error-message').show();
                                    $('.error-message-text').text(error);
                                    scrollAnimate($('.error-message'));
                                });
                            } else if (data.errorMessage) {
                                $('.error-message').show();
                                $('.error-message-text').text(data.errorMessage);
                                scrollAnimate($('.error-message'));
                                $('body').trigger('checkout:error', data.errorMessage);
                            }
                            if (data.cartError) {
                                window.location.href = data.redirectUrl;
                                defer.reject();
                            } else {
                                // go to appropriate stage and display error message
                                defer.reject(data);
                            }
                            $button.find('.b-cart-loader').addClass('hide');
                        } else {
                            var continueUrl = data.continueUrl;
                            var urlParams = {
                                ID: data.orderID,
                                token: data.orderToken,
                                order_checkout_optin: data.order_checkout_optin
                            };

                            continueUrl += (continueUrl.indexOf('?') !== -1 ? '&' : '?') +
                                Object.keys(urlParams).map(function (key) {
                                    return key + '=' + encodeURIComponent(urlParams[key]);
                                }).join('&');

                            window.location.href = continueUrl;
                            defer.resolve(data);
                        }
                    },
                    error: function () {
                        // enable the placeOrder button here
                        $('body').trigger('checkout:enableButton', $('.next-step-button button'));
                        $button.find('.b-cart-loader').addClass('hide');
                    }
                });
            }

            return defer;
        });
    },

    onKeyUpFormInputs: function () {
        $('.js-checkout-forms').on('keyup', 'input:visible, select:visible', function (e) {
            if (e.keyCode === 13) {
                var $this = $(this);
                var $form = $this.closest('form');
                var inputs = $form.find('input[enterkeyhint="go"], select[enterkeyhint="go"]');
                var next = inputs.eq(inputs.index(this) + 1);
                if (next.length) {
                    next.focus();
                }
                if (validateForm(inputs)) {
                    $this.blur();
                    if ($('#checkout-main').attr('data-checkout-stage') === 'payment' && !next.hasClass('billingCountry')) {
                        $('.next-step-button .submit-payment').click();
                    } else if ($('#checkout-main').attr('data-checkout-stage') === 'placeOrder') {
                        $('.next-step-button .place-order').click();
                    }
                } else if ($this.hasClass('shippingZipCode')) {
                    $this.blur();
                    if ($('#checkout-main').attr('data-checkout-stage') === 'shipping') {
                        $('.next-step-button .submit-shipping').click();
                    }
                }
                return false;
            }
            return true;
        });
    }
};

/**
 * updating Vip points is vip user
 *
 * @param {string} data of the current form
 */
function updateVipData(data) {
    if (data.order && data.order.vipRenderedTemplate) {
        // eslint-disable-next-line spellcheck/spell-checker
        if (data.order && data.order.vipPoints && data.order.vipPoints.pointsApplied) {
            $('.payment-information').addClass('vip-pay');
            $('.b-payment-tab').addClass('hide');
            $('.b-payment-info').find('.card-body').addClass('hide');
            $('.summary-billing-section').addClass('hide');
            $('.b-payment-heading').addClass('hide');
            $('.b-checkout_subheader-express-login').addClass('hide');
            $('.b-checkout_subheader-express-login').addClass('vip-user');
            $('.js-giftcard-container').hide();
        } else if (data.order && data.order.vipPoints && data.order.vipPoints.partialPointsApplied && !$('.payment-information').hasClass('gc-pay')) {
            $('.payment-information').removeClass('vip-pay');
            $('.b-payment-tab').removeClass('hide');
            $('.b-payment-info').find('.card-body').removeClass('hide');
            $('.summary-billing-section').removeClass('hide');
            $('.b-payment-heading').removeClass('hide');
            if (data.order.enableGiftCardPaymentForVIP) {
                $('.js-giftcard-container').show();
            }
        }
        $('.js-vip-container').removeClass('hide').html(data.order.vipRenderedTemplate);
        $('.g-tabs-chip.klarna-payment-item').addClass('hide');
    } else if (!$('.payment-information').hasClass('gc-pay')) {
        $('.js-vip-container').addClass('hide').html('');
        $('.payment-information').removeClass('vip-pay');
        // eslint-disable-next-line spellcheck/spell-checker
        $('.b-payment-tab').removeClass('hide');
        $('.b-payment-info').find('.card-body').removeClass('hide');
        $('.summary-billing-section').removeClass('hide');
        $('.b-payment-heading').removeClass('hide');
        if (!($('.b-checkout_subheader-express-login').hasClass('vip-with-klarna') && $('.b-checkout_subheader-express-login').find('.klarna-button').hasClass('hide'))) {
            $('.b-checkout_subheader-express-login').removeClass('hide');
        }
        if (data.order && data.order.isVipUser && !data.order.isVIPOrder && !data.order.hasGiftCards) {
            $('.g-tabs-chip.klarna-payment-item').removeClass('hide');
        }
        var klarnaMinimumThreshold = $('.klarna-min-threshold').length > 0 ? $('.klarna-min-threshold').val() : 1000;
        var klarnaMaximumThreshold = $('.klarna-max-threshold').length > 0 ? $('.klarna-max-threshold').val() : 100000;
        if ($('.payment-information').hasClass('gc-pay-applied') || (data.order.totals.klarnaTotal < klarnaMinimumThreshold || data.order.totals.klarnaTotal > klarnaMaximumThreshold)) {
            $('.g-tabs-chip.klarna-payment-item').addClass('hide');
            $('.b-checkout_subheader-express-login').addClass('hide');
        }

        if ($('.gift_card_applied_amount.active').length > 0 && !($('.b-checkout_subheader-express-login').hasClass('hide'))) {
            $('.b-checkout_subheader-express-login').addClass('hide');
        }

        $('.b-checkout_subheader-express-login.vip-user').removeClass('vip-user');
    }
    if (data.order && data.order.vipPoints) {
        $('.vip-itemsvalue.available-points').html(data.order.vipPoints.availablePoints);
        $('.vip-itemsvalue.amount-applied').html(data.order.vipPoints.usedPoints);
        $('.vip-itemsvalue.remaining-points').html(data.order.vipPoints.remainingPoints);
    }

    if (data.order && data.order.isEmployee) {
        $('.js-giftcard-container').hide();
    }

    if (data.order && data.order.isVIPOrder) {
        if (data.order.vipPoints.partialPointsApplied) {
            $('.vip-points-ordersummary').removeClass('hide');
            $('.vip-points-ordersummary').addClass('active');
            $('.js-gift_card_applied_amount').addClass('vip-points-active');
            $('.vip-points-ordersummary .vip-points').text('- ' +
                data.order.vipPoints.usedPoints);
        } else {
            $('.vip-points-ordersummary').addClass('hide');
            $('.js-gift_card_applied_amount').removeClass('vip-points-active');
            $('.vip-points-ordersummary').removeClass('active');
        }
    }
}

/**
 * checking if all the fields are filled or not
 *
 * @param {string} inputs of the current form
 *
 * @returns {boolean} a value true/false
 */
function validateForm(inputs) {
    var isValid = true;
    var $inputs = $(inputs).filter(':not(.shippingAddressTwo, .billingAddressTwo)');
    $inputs.each((index, input) => {
        if ($(input).val() === '') {
            isValid = false;
        }
    });
    return isValid;
}

/**
 * updating payment methods after selecting payment options.
 *
 * @param {string} selectedPaymentMethod - payment method
 */
function updatePaymentMethod(selectedPaymentMethod) {
    var url = $('.payment-information').attr('data-action-url');
    url += '?PaymentMethod=' + selectedPaymentMethod;
    $('.b-payment-tab_content').spinner().start();
    $.ajax({
        url: url,
        dataType: 'json',
        type: 'POST',
        success: function (data) {
            if (data.error) {
                window.location.href = data.redirectUrl;
            } else {
                if (data.order && data.order.billing && data.order.billing.payment) {
                    if (data.order.billing.payment.isAlreadyPaidFromPayPal) {
                        $('.js-payment-paypal-paid').removeClass('hide');
                        $('.js-payment-paypal-new').addClass('hide');
                    } else {
                        $('.js-payment-paypal-paid').addClass('hide');
                        $('.js-payment-paypal-new').removeClass('hide');
                    }
                }
                $('body').trigger('checkout:updateCheckoutView', {
                    order: data.order,
                    customer: data.customer
                });
            }
            $('.b-payment-tab_content').spinner().stop();
        }
    });
}

[billingHelpers, shippingHelpers, addressHelpers].forEach(function (library) {
    Object.keys(library).forEach(function (item) {
        if (typeof library[item] === 'object') {
            exports[item] = $.extend({}, exports[item], library[item]);
        } else {
            exports[item] = library[item];
        }
    });
});

var counter = 0;
$('.shippingFirstName, .shippingLastName, .shippingAddressOne, .shippingAddressTwo, .shippingAddressCity, .billingFirstName, .billingLastName, .billingAddressOne, .billingAddressTwo, .billingAddressCity').on('keydown', function (e) {
    if (e.which === 32 || e.keyCode === 32) {
        counter += 1;
        if (counter > 1) {
            e.preventDefault();
        }
    } else {
        counter = 0;
    }
});

module.exports = exports;
