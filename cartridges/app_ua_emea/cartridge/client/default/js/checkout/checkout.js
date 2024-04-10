'use strict';

var addressHelpers = require('./address');
var shippingHelpers = require('./shipping');
var availabilityHelper = require('org/checkout/availability');
var billingHelpers = require('./billing');
var summaryHelpers = require('./summary');
var formHelpers = require('org/checkout/formErrors');
var scrollAnimate = require('org/components/scrollAnimate');
var location = window.location;
var history = window.history;
var addressSuggestionHelpers = require('./qasAddressSuggesstion');
var clientSideValidation = require('../components/common/clientSideValidation');
var adyenCheckout = require('../adyen_checkout/adyenCheckout');

var isPaazlField = true;

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
                        } else {
                            // Errors on form re-enable next-step-button
                            $('.next-step-button button').removeAttr('data-clicked');
                            $('.next-step-button button').removeAttr('disabled');
                            $('.checkout-card-header').removeClass('pe-none');
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
                        var paazlPickUpPoint = $('.js-paazlwidget-form') && $('.js-paazlwidget-form').find('.pick-up-point-option.active').length > 0;
                        if (isShipToCollectionEnabled || paazlPickUpPoint) {
                            shippingFormData += '&shiptoCollectionPoint=true';
                        } else {
                            shippingFormData += '&shiptoCollectionPoint=false';
                        }
                        if (!paazlPickUpPoint) {
                            clientSideValidation.checkMandatoryField($form);
                        }

                        if ($('.b-shipping-method_column.selected:visible').length || $('.option .option__area.checked:visible').length || $('.point .point__label.checked:visible').length) {
                            if ($('.point .point__label.checked:visible').length && $('.postnumber__field:visible').length) {
                                var custNumber = $('.postnumber__field:visible').val();
                                isPaazlField = false;
                                if (custNumber === '') {
                                    $('#postnumber-input').focus();
                                    $('#postnumber-input').blur();
                                    $('.next-step-button button').removeAttr('data-clicked');
                                    return defer;
                                } else if ($('.postnumber__status__message').length) {
                                    $('.next-step-button button').removeAttr('data-clicked');
                                    return defer;
                                } else if ($('.postnumber__status--valid').length) {
                                    isPaazlField = true;
                                } else {
                                    setTimeout(function () {
                                        isPaazlField = true;
                                        $('.next-step-button button').removeAttr('data-clicked');
                                    }, 100);
                                }
                            }
                        } else if (paazlPickUpPoint && !$('.point .point__label.checked:visible').length && !$('.postnumber__status__message').length) {
                            var postCode = $('#pickUpPointPostalcode').val();
                            var $zipCodeInput = $('input#pickUpPointPostalcode');
                            if (!postCode) {
                                clientSideValidation.checkMandatoryField($form);
                            } else {
                                $zipCodeInput.addClass('is-invalid');
                                $zipCodeInput.parents('.form-group').addClass('error-field');
                                $('.pazzl-no-response').removeClass('hide');
                            }
                        } else {
                            return defer;
                        }

                        if (!$form.find('input.is-invalid').length && !$form.find('select.is-invalid').length && isPaazlField) {
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
                                                        summaryHelpers.updateOrderProductSummaryInformation(data.order, data.options);
                                                        availabilityHelper.updateOrderProductSummaryInformation(data.order, data.options);
                                                    }
                                                }
                                            });
                                        }
                                        // eslint-disable-next-line spellcheck/spell-checker
                                        if (window.dw && window.dw.applepay && window.ApplePaySession && window.ApplePaySession.canMakePayments()) {
                                            if (window.ApplePaySession) {
                                                members.handleNextStage(true);
                                                window.location.reload();
                                            }
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
                                        var isPaazlPickUpPoint = data.paazlShippingMethod && data.paazlShippingMethod.deliveryType === 'PICKUP_LOCATION';
                                        if (isShipToCollectionEnabled || isPaazlPickUpPoint) {
                                            if ($('.hal-active').length > 0 && $('#dwfrm_billing').is(':visible') && $('#billingAddressOne').val() === '') {
                                                $('#billingCountry  option[value="US"]').prop('selected', 'selected').change();
                                            }
                                            $('.make-ship-as-bill').attr('data-collection', true);
                                            if ($('#shippingAsBilling').is(':checked') === true && isPaazlPickUpPoint) {
                                                $('#shippingAsBilling').trigger('click');
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
                                                addressSuggestionHelpers.addressSuggestion(options);
                                                $('#qasBilling').val(true);
                                                return;
                                            }
                                        } else {
                                            $('.make-ship-as-bill').attr('data-collection', false);
                                        }

                                        if ($('.make-ship-as-bill').attr('data-collection') === true && $('#shippingAsBilling').is(':checked') === true && !isShipToCollectionEnabled) {
                                            $('#shippingAsBilling').trigger('click');
                                        }
                                        // Hide the coupon code form from checkout page shipping stage
                                        if ($('.b-promo_checkout').length > 0 && !$('.b-promo_checkout').hasClass('hide')) {
                                            $('.b-promo_checkout').addClass('hide');
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
                        } else {
                            // Errors on form re-enable next-step-button
                            $('.next-step-button button').removeAttr('data-clicked');
                            $('.next-step-button button').removeAttr('disabled');
                            $('.checkout-card-header').removeClass('pe-none');
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
                    clientSideValidation.checkMandatoryField($formBilling);
                    if ($formBilling.find('.js-billingZipCode').is(':visible')) {
                        clientSideValidation.validateZipCode('dwfrm_billing');
                    }
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
                    } else {
                        // Errors on form re-enable next-step-button
                        $('.next-step-button button').removeAttr('data-clicked');
                        $('.next-step-button button').removeAttr('disabled');
                        $('.checkout-card-header').removeClass('pe-none');
                    }

                    if ($('.data-checkout-stage').data('customer-type') === 'registered') {
                        // if payment method is credit card
                        if ($('.payment-information').data('payment-method-id') === 'CREDIT_CARD') {
                            if (!($('.payment-information').data('is-new-payment'))) {
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

                                paymentForm += '&storedPaymentUUID=' +
                                    $savedPaymentInstrument.data('uuid');

                                paymentForm += '&securityCode=' + cvvCode;
                            }
                        }
                    }

                    // var paymentID = $('.payment-information').data('payment-method-id');

                    if (!$formBilling.find('input.is-invalid').length && !$formBilling.find('select.is-invalid').length) {
                        submitPayment({ error: false, form: paymentForm });
                    }

                    /**
                     * Submit payment form
                     * @param {Object} args - Function arguments
                     */
                    function submitPayment(args) {
                        if (args.error) {
                            $('body').trigger('checkout:enableButton', '.next-step-button button');
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

                                            if (data.serverErrors.length) {
                                                data.serverErrors.forEach(function (error) {
                                                    $('.error-message').show();
                                                    $('.error-message-text').text(error);
                                                    scrollAnimate($('.error-message'));
                                                });
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

                                            setTimeout(function () {
                                                scrollAnimate($('.js-contact-info'));
                                            }, 300);

                                            if ($('.b-checkout_nextStep .submit-payment').is(':visible')) {
                                                defer.resolve(data);
                                            } else {
                                                defer.reject();
                                            }
                                        }
                                        // Hide the coupon code form from checkout page payment stage
                                        if ($('.b-promo_checkout').length > 0 && !$('.b-promo_checkout').hasClass('hide')) {
                                            $('.b-promo_checkout').addClass('hide');
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
                    // disable the placeOrder button here
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
                    var emailSignUp = $('#emailUpdates').is(':checked');
                    var isSubscribed = '?emailSignUp=' + emailSignUp;
                    var getDeviceID = '';
                    var transID = $('#devTID');
                    if (transID.length > 0 && transID.val().length > 0) {
                        getDeviceID = transID.val();
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

                                // PHX-177 Availability check
                                if (data.availabilityError) {
                                    availabilityHelper.getModalHtmlElement();
                                    availabilityHelper.fillModalElement(data.renderedTemplate);
                                    summaryHelpers.updateTotals(data.order.totals);
                                    summaryHelpers.updatePromotionSummaryInformation(data.order);
                                    availabilityHelper.updateOrderProductSummaryInformation(data.order, data.options);
                                    $button.find('.b-cart-loader').addClass('hide');
                                    defer.reject();
                                }
                                if (data.error) {
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
                                    }

                                    if (data.cartError) {
                                        window.location.href = data.redirectUrl;
                                        defer.reject();
                                    } else {
                                        // go to appropriate stage and display error message
                                        if (data.errorStage && data.errorStage.step && data.errorStage.step === 'paymentInstrument' && data.errorStage.reason && data.errorStage.reason === 'orderValueChanged') {
                                            $('body').trigger('checkout:updateCheckoutView', {
                                                order: data.order,
                                                customer: data.customer
                                            });
                                        }
                                        defer.reject(data);
                                    }
                                    $button.find('.b-cart-loader').addClass('hide');
                                } else if (data.adyenAction) {
                                    window.orderToken = data.orderToken;
                                    adyenCheckout.actionHandler(data.adyenAction);
                                    defer.resolve(data);
                                } else {
                                    // Changes due to SFRA cartridge upgrade!
                                    let redirect = $('<form>')
                                            .appendTo(document.body)
                                            .attr({
                                                method: 'POST',
                                                action: data.continueUrl
                                            });
                                    $('<input>')
                                    .appendTo(redirect)
                                    .attr({
                                        name: 'orderID',
                                        value: data.orderID,
                                        type: 'hidden'
                                    });

                                    $('<input>')
                                        .appendTo(redirect)
                                        .attr({
                                            name: 'orderToken',
                                            value: data.orderToken,
                                            type: 'hidden'
                                        });
                                    $('<input>')
                                        .appendTo(redirect)
                                        .attr({
                                            name: 'order_checkout_optin',
                                            value: data.order_checkout_optin,
                                            type: 'hidden'
                                        });
                                    redirect.trigger('submit');
                                    defer.resolve(data);
                                }
                                // Hide the coupon code form from checkout page place order stage
                                if ($('.b-promo_checkout').length > 0 && !$('.b-promo_checkout').hasClass('hide')) {
                                    $('.b-promo_checkout').addClass('hide');
                                }
                                $.spinner().stop();
                            },
                            error: function () {
                                // enable the placeOrder button here
                                $('body').trigger('checkout:enableButton', $('.next-step-button button'));
                                $button.find('.b-cart-loader').addClass('hide');
                            }
                        });
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
                // v6.3.0 has a new stage called 'customer' which is passed in by default during Checkout-Begin
                // UA has not upgraded the extended cartridges from the upgrade yet.
                if (members.currentStage < 0) {
                    members.currentStage = 0;
                }
                $(plugin).attr('data-checkout-stage', checkoutStages[members.currentStage]);

                //
                // Handle Payment option selection
                //
                $('input[name$="paymentMethod"]', plugin).on('change', function () {
                    $('.credit-card-form').toggle($(this).val() === 'CREDIT_CARD');
                });

                //
                // Handle Next State button click
                //
                $(plugin).on('click', '.next-step-button button', function () {
                    $('.next-step-button button').attr('data-clicked', 'true');
                    $('.next-step-button button').attr('disabled', 'disabled');
                    $('.checkout-card-header').addClass('pe-none');
                    members.nextStage();
                });

                $(window).on('load', function () {
                    if ($('#checkout-main').data('checkout-stage') === 'payment') {
                        scrollAnimate($('#payment'));
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

                    // Show the coupon form on shipping checkout stage
                    if ($('.b-promo_checkout').length > 0 && $('.b-promo_checkout').hasClass('hide')) {
                        $('.b-promo_checkout').removeClass('hide');
                    }
                });

                $('.payment-summary .edit-button', plugin).on('click', function () {
                    members.gotoStage('payment');
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

                    if ($('.g-adyen3ds-verification-modal').is(':visible')) {
                        location.reload(true);
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
                    $('.next-step-button button').removeAttr('disabled');
                    $('.checkout-card-header').removeClass('pe-none');
                });

                promise.fail(function (data) {
                    $('.next-step-button button').removeAttr('data-clicked');
                    $('.next-step-button button').removeAttr('disabled');
                    $('.checkout-card-header').removeClass('pe-none');
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
                    // move state back
                    members.currentStage--;
                    updateUrl(members.currentStage);
                    if (checkoutStages[members.currentStage] === 'shipping') {
                        if ($('.b-promo_checkout').length > 0 && $('.b-promo_checkout').hasClass('hide')) {
                            $('.b-promo_checkout').removeClass('hide');
                        }
                    }
                }

                $(plugin).attr('data-checkout-stage', checkoutStages[members.currentStage]);
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
            }
        };

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

        if (window.dw && window.dw.applepay && window.ApplePaySession && window.ApplePaySession.canMakePayments()) { // eslint-disable-line
            $('.apple-pay-container').addClass('apple-pay-btn');
            $('.applepay-tab-wrapper').addClass('mac-only'); // eslint-disable-line
            $('#applepay-content').addClass('mac-only');
        }

        $('body').on('click', '.g-tabs-link.nav-link', function () {
            var paymentInformation = $('.billing-nav.payment-information');
            var currentPayment = $(this).parent('.g-tabs-chip.nav-item').attr('data-method-id');
            paymentInformation.attr('data-payment-method-id', currentPayment);
        });
        if ($('.g-tabs-chip.applepay-tab-wrapper').attr('data-iscancel') === 'true') {
            $('.tab-pane.applepay-tab-wrapper .g-accordion-header').removeClass('collapsed');
            $('.tab-pane.applepay-tab-wrapper .g-accordion-content').addClass('show');
        }

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
            if (shipping.selectedShippingMethod) {
                $('.shipping-item .order-receipt-label').text('');
                $('.shipping-item .order-receipt-label').text((data.order.resources.shippingCost || 'Shipping') + ' (' + shipping.selectedShippingMethod.displayName + '):');
            }
            var currentStage = location.search.substring( // eslint-disable-line no-restricted-globals
                location.search.indexOf('=') + 1 // eslint-disable-line no-restricted-globals
            );

            if (currentStage === 'shipping') {
                adyenCheckout.renderGenericComponent();
            }
            billingHelpers.methods.updateBillingInformation(
                data.order,
                data.customer,
                data.options
            );
            billingHelpers.methods.updatePaymentInformation(data.order, data.options);
            summaryHelpers.updateOrderProductSummaryInformation(data.order, data.options);
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

    privacyPolicy: function () {
        $('body').on('keyup', '.b-checkout_privacy a', function (event) {
            var $activeLink = event.target;
            var key = event.which || event.keyCode;
            if (key === 32) {
                $activeLink.click();
            }
        });
    }
};

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
