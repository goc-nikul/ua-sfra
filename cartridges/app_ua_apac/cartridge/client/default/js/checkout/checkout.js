'use strict';

var addressHelpers = require('./address');
var shippingHelpers = require('falcon/checkout/shipping');
var shippingHelpersAPAC = require('./shipping');
var availabilityHelper = require('org/checkout/availability');
var billingHelpers = require('./billing');
var summaryHelpers = require('falcon/checkout/summary');
var formHelpers = require('org/checkout/formErrors');
var scrollAnimate = require('org/components/scrollAnimate');
var addressSuggestionHelpers = require('./qasAddressSuggesstion');
var clientSideValidation = require('org/components/common/clientSideValidation');

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

        /**
         * to check value is inside select option list or not
         * @param {Object} select - select dom element
         * @param {string} value - value to check
         * @returns {boolean} value is on select option list or not
         */
        function dropDownValuecheck(select, value) {
            var isIN = select.find('option[value="' + value + '"]').length;
            var result = false;

            if (isIN > 0) {
                result = true;
            }

            return result;
        }

        /**
         * update phone number on billing stage
         * @param {Object} order - order object from response
         * @param {Object} customerData - customerData object from response
         * @param {Object} address - address object from response
         * @param {Object} profile - profile object from response
         * @param {boolean} showSplitPhoneMobileField - split phone field is enable or not
         */
        function presetPhone(order, customerData, address, profile, showSplitPhoneMobileField) {
            if (showSplitPhoneMobileField) {
                var selectPhone1 = $('#billingPhone1');
                selectPhone1.val((order.billing.billingAddress.address.phone1 && order.billing.billingAddress.address.phone !== address.phone) ? order.billing.billingAddress.address.phone1 : ((customerData && dropDownValuecheck(selectPhone1, customerData.phoneMobile1)) ? customerData.phoneMobile1 : '')).change();
                $('#billingPhone2').val((order.billing.billingAddress.address.phone2 && order.billing.billingAddress.address.phone !== address.phone) ? order.billing.billingAddress.address.phone2 : (customerData ? customerData.phoneMobile2 : ''));
                $('#billingPhone3').val((order.billing.billingAddress.address.phone3 && order.billing.billingAddress.address.phone !== address.phone) ? order.billing.billingAddress.address.phone3 : (customerData ? customerData.phoneMobile3 : ''));
            } else {
                $('#billingPhone').val((order.billing.billingAddress.address.phone) ? order.billing.billingAddress.address.phone : (profile ? profile.phone : ''));
            }
        }

        /**
         * update phone number on billing stage for same as shipping
         * @param {Object} address - address object from response
         * @param {number} billFirstLength - #billingFirstName field in dom
         * @param {boolean} showSplitPhoneMobileField - split phone field is enable or not
         */
        function setBillingSameasShipping(address, billFirstLength, showSplitPhoneMobileField) {
            $('#billingLastName').val(address.lastName);
            if (billFirstLength > 0) {
                $('#billingFirstName').val(address.firstName);
            }

            if (showSplitPhoneMobileField) {
                $('#billingPhone1').val(address.phone1).change();
                $('#billingPhone2').val(address.phone2);
                $('#billingPhone3').val(address.phone3);
            } else {
                $('#billingPhone').val(address.phone);
            }
        }

        /**
         * update Email on billing stage
         * @param {Object} order - order object from response
         * @param {Object} customerData - customerData object from response
         * @param {Object} profile - profile object from response
         * @param {boolean} showSplitEmailField - split email field is enable or not
         * @param {Object} basketEmail - basketEmail object from response
         */
        function presetEmail(order, customerData, profile, showSplitEmailField, basketEmail) {
            if (showSplitEmailField) {
                $('.billingEmailaddressName').val((basketEmail.emailaddressName) ? basketEmail.emailaddressName : (customerData ? customerData.emailaddressName : ''));
                var selectElement = $('.billingEmailaddressDomainSelect');
                selectElement.val((basketEmail.emailaddressDomainSelect) ? (dropDownValuecheck(selectElement, basketEmail.emailaddressDomainSelect) ? basketEmail.emailaddressDomainSelect : '') : ((customerData && dropDownValuecheck(selectElement, customerData.emailaddressDomain)) ? customerData.emailaddressDomainSelect : ''));
                $('.billingEmailaddressDomain').val((basketEmail.emailaddressDomain) ? basketEmail.emailaddressDomain : (customerData ? customerData.emailaddressDomain : ''));
            } else {
                $('#billingEmail').val(order.customerEmail ? order.customerEmail : (profile ? profile.email : ''));
            }
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
                                            shippingHelpersAPAC.methods.shippingFormResponse(defer, data);
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
                        if (window.sitePreferences && window.sitePreferences.isKRCustomCheckoutEnabled) {
                            var empCountry = $form.find('#shippingCountrydefault');
                            if (empCountry && empCountry.hasClass('emp-country-kr')) {
                                var empCountryOption = $form.find('#shippingCountrydefault option:first').val();
                                var empCountyName = empCountry.attr('name');
                                if (empCountyName && empCountryOption && !shippingFormData.includes(empCountyName)) {
                                    shippingFormData += '&' + empCountyName + '=' + empCountryOption;
                                }
                            }
                        }
                        shippingFormData += '&shiptoCollectionPoint=false';
                        if (window.sitePreferences && window.sitePreferences.isKRCustomCheckoutEnabled && (!window.sitePreferences.isShowOnlyLastNameAsNameFieldEnabled || window.sitePreferences.showSplitPhoneMobileField)) {
                            var firstName = $form.find('#shippingFirstNamedefault');
                            var phone3 = $form.find('#phone3');
                            var phone1 = $form.find('#phone1');
                            var phone1Val = $('.default-address .shipping-address-option').attr('data-phone1');
                            var valInDropDown = dropDownValuecheck(phone1, phone1Val);

                            if ((!firstName.val() || (phone3.length > 0 && phone3.val().length > 4) || !valInDropDown) && !$('.shipping-address .delivery-content').children().is(':visible')) {
                                $form.attr('data-validation-error', 'error');
                                $form.attr('data-address-mode', 'details');
                                $('.default-address .btn-show-details').trigger('click');
                                if (!valInDropDown) {
                                    phone1.val('').change();
                                } else {
                                    phone1.val($('.default-address .shipping-address-option').attr('data-phone1')).change();
                                }
                            }
                        }
                        clientSideValidation.checkMandatoryField($form);

                        if (!$form.find('input.is-invalid').length && !$form.find('select.is-invalid').length) {
                            if (window.sitePreferences && window.sitePreferences.isKRCustomCheckoutEnabled && $('.data-checkout-stage').data('customer-type') === 'registered' && $('#shipmentSelector-default').children().length > 0) {
                                $form.attr('data-validation-error', 'no-error');
                                $form.attr('data-address-mode', 'customer');
                            }

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

                                    shippingHelpersAPAC.methods.shippingFormResponse(defer, data);

                                    if (data.order && data.order.billing && data.order.billing.payment) {
                                        if (data.order.billing.payment.isAlreadyPaidFromPayPal) {
                                            $('.js-payment-paypal-paid').removeClass('hide');
                                            $('.js-payment-paypal-new').addClass('hide');
                                        } else {
                                            $('.js-payment-paypal-paid').addClass('hide');
                                            $('.js-payment-paypal-new').removeClass('hide');
                                        }
                                    }

                                    if ($('#shippingAsBilling').is(':checked') === false) {
                                        $('.b-billing_heading_line').addClass('display-required-text');
                                        $('.billing-address-block').addClass('display-billing-fields');
                                    }
                                    if ($(window).width() < 1024) {
                                        $('.tab-pane.active .g-accordion-header').removeClass('collapsed');
                                        $('.tab-pane.active .g-accordion-content').addClass('show');
                                    }
                                    $('.make-ship-as-bill').attr('data-collection', false);
                                    if ($('.make-ship-as-bill').attr('data-collection') === true && $('#shippingAsBilling').is(':checked') === true) {
                                        $('#shippingAsBilling').trigger('click');
                                    }

                                    if (data.isKRCustomCheckoutEnabled) {
                                        $('.billing-address-block').addClass('display-billing-fields');
                                        $('#billingZipCode').val(data.address.postalCode);
                                        $('#billingAddressOne').val(data.address.address1);
                                        $('#billingAddressTwo').val(data.address.address2);

                                        var billFirstLength = $('#billingFirstName').length;
                                        if (data.customer.registeredUser) {
                                            if (!data.shippingBillingSame) {
                                                $('#billingLastName').val(((data.order.billing.billingAddress.address.lastName) && (data.order.billing.billingAddress.address.lastName !== data.address.lastName)) ? data.order.billing.billingAddress.address.lastName : data.customer.profile.lastName);
                                                if (billFirstLength > 0) {
                                                    $('#billingFirstName').val(((data.order.billing.billingAddress.address.firstName) && (data.order.billing.billingAddress.address.firstName !== data.address.firstName)) ? data.order.billing.billingAddress.address.firstName : data.customer.profile.firstName);
                                                }

                                                presetPhone(data.order, data.customerData, data.address, data.customer.profile, data.showSplitPhoneMobileField);
                                            } else {
                                                setBillingSameasShipping(data.address, billFirstLength, data.showSplitPhoneMobileField);
                                            }

                                            presetEmail(data.order, data.customerData, data.customer.profile, data.showSplitEmailField, data.basketEmail);
                                        } else {
                                            // eslint-disable-next-line no-lonely-if
                                            if (!data.shippingBillingSame) {
                                                $('#billingLastName').val((data.billName.lastName) ? data.billName.lastName : '');
                                                if (billFirstLength > 0) {
                                                    $('#billingFirstName').val((data.billName.firstName) ? data.billName.firstName : '');
                                                }

                                                presetPhone(data.order, '', data.address, '', data.showSplitPhoneMobileField);
                                            } else {
                                                setBillingSameasShipping(data.address, billFirstLength, data.showSplitPhoneMobileField);
                                            }

                                            presetEmail(data.order, '', '', data.showSplitEmailField, data.basketEmail);
                                        }
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

                    if (window.sitePreferences.isKRCustomCheckoutEnabled && $('#billingPhone1').length && $('#billingPhone1').is(':disabled')) {
                        $('#billingPhone1').prop('disabled', false);
                    }

                    var $billingBlock = $('#dwfrm_billing .billing-address-block');
                    var billingAddressForm = $('#dwfrm_billing .billing-address-block :input').serialize();

                    if (window.sitePreferences.isKRCustomCheckoutEnabled) {
                        $billingBlock = $('#dwfrm_billing .billing-address-block-kr');
                        billingAddressForm = $('#dwfrm_billing .billing-address-block-kr :input').serialize();
                    }

                    $('body').trigger('checkout:serializeBilling', {
                        form: $billingBlock,
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

                    var billingValidAvailable = $billingBlock.find('#validate-Billing-Form');

                    var billingValidURL = '';
                    if (billingValidAvailable.length === 1) {
                        billingValidURL = billingValidAvailable.attr('data-actionUrl');
                    }

                    var $formBilling = $('form[name=dwfrm_billing]');
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
                                    if ($('#shippingAsBilling').is(':checked') && $('#billingPhone1').length) {
                                        $('#billingPhone1').prop('disabled', true);
                                    }
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
                        } else if ($('input[name*="billing_paymentMethod"]').val() === 'ATOME_PAYMENT') {
                            paymentForm += 'Atome Payment';
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

                                    // Removing MembersonCoupon
                                    if (data.membersonRemoveCoupon) {
                                        if ($('.coupons-and-promos .coupon-price-adjustment').length) {
                                            $('.coupons-and-promos').empty().append(data.updatedTotals.discountsHtml);
                                            summaryHelpers.updateTotals(data.updatedTotals);
                                        }
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
                                        defer.reject(data);
                                    }
                                    $button.find('.b-cart-loader').addClass('hide');
                                // Adyen hpp case
                                } else if (data.adyenAction) {
                                    window.orderToken = data.orderToken;
                                    require('adyen/adyenCheckout').actionHandler(data.adyenAction);
                                    defer.resolve(data);
                                } else {
                                    var continueUrl = data.continueUrl;
                                    var urlParams = '';
                                    if (data.orderID != null && data.orderToken != null) {
                                        urlParams = {
                                            ID: data.orderID,
                                            token: data.orderToken,
                                            order_checkout_optin: data.order_checkout_optin
                                        };
                                    }

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
                    members.nextStage();
                });
                // attach DropDown Lists Events
                attachDropDownListsEvents();
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
                            if (window.sitePreferences.qasAddressSuggestion && !(window.sitePreferences.qasRestrictedCountries.indexOf($('#selectedCountry').val()) > -1)) {
                                var options = {
                                    token: document.querySelector('#qasToken').value,
                                    elements: {
                                        input: document.querySelector("input[name='dwfrm_billing_addressFields_address1']"),
                                        countryList: document.querySelector('#billingCountry').value,
                                        addressLine1: document.querySelector("input[name='dwfrm_billing_addressFields_address1']"),
                                        addressLine2: document.querySelector("input[name='dwfrm_billing_addressFields_address2']"),
                                        businessName: document.querySelector("input[name='dwfrm_billing_addressFields_businessName']"),
                                        locality: document.querySelector("input[name='dwfrm_billing_addressFields_city']"),
                                        province: document.querySelector('#billingState'),
                                        postalCode: document.querySelector("input[name='dwfrm_billing_addressFields_postalCode'],select[name^='dwfrm_billing_addressFields_postalCode']"),
                                        suburb: document.querySelector("input[name='dwfrm_billing_addressFields_suburb']")
                                    }
                                };
                                if ($('#selectedCountry').val() === 'NZ') {
                                    options.elements.province = document.querySelector('#billingAddressCity');
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
                    $('.b-contact').find('.form-group').removeClass('error-field');
                    $('.b-contact').find('.b-contact_column-phoneMobile-2-content').removeClass('error-field');
                    $('.b-billing-address').find('.form-group').removeClass('error-field');
                    $('.b-billing-address').find('.b-billing_form-column-phoneMobile-2-content').removeClass('error-field');
                    if (!$('#checkout-main').hasClass('multi-ship')) {
                        window.addressVerificationDone = false;
                        $('body').trigger('shipping:selectSingleShipping');
                        if (window.sitePreferences && window.sitePreferences.isKRCustomCheckoutEnabled && $('.data-checkout-stage').data('customer-type') === 'registered' && $('#shipmentSelector-default').children().length > 0) {
                            $('form.shipping-form').attr('data-address-mode', 'customer');
                        }
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
                });

                $('.payment-summary .edit-button', plugin).on('click', function () {
                    $('.b-contact').find('.form-group').removeClass('error-field');
                    $('.b-contact').find('.b-contact_column-phoneMobile-2-content').removeClass('error-field');
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
                        if (data.phoneErrorMessage && !$('.b-contact_phone').hasClass('error-field')) {
                            $('.b-contact_phone').addClass('error-field');
                            $('.phone-error-message-text').text(data.phoneErrorMessage);
                            $('body').trigger('checkout:error', data.phoneErrorMessage);
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

        if (window.sitePreferences.qasAddressSuggestion && !(window.sitePreferences.qasRestrictedCountries.indexOf($('#selectedCountry').val()) > -1)) {
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
                    businessName: document.querySelector('input[name$=_businessName]'),
                    locality: document.querySelector('input[name$=_city]'),
                    province: $('.shipping-form').is(':visible') ? document.querySelector('#shippingStatedefault') : document.querySelector('#billingState'),
                    postalCode: document.querySelector('input[name$=_postalCode], select[name$=_postalCode]'),
                    suburb: document.querySelector('input[name$=_suburb]')
                }
            };
            if ($('#selectedCountry').val() === 'NZ') {
                options.elements.province = document.querySelector('#shippingAddressCitydefault');
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
            summaryHelpers.updateTotals(data.order.totals);
            summaryHelpers.updatePromotionSummaryInformation(data.order);
            summaryHelpers.updateShippingSummarySection(data.order.shipping);
            var shipping = data.order.shipping[0];
            data.order.shipping.forEach(function (shipping) { // eslint-disable-line
                shippingHelpersAPAC.methods.updateShippingInformation(
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

            if (currentStage === 'shipping' && $('div#adyen-component-content').length > 0) {
                require('adyen/adyenCheckout').renderGenericComponent();
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

    // fucusOutSelectBox: function () {
    //     $('body').on('change', 'select', function () {
    //         $(this).focus();
    //     });
    // },

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
    },

    updatePaymentMethod: function () {
        $('body').on('click', '.js-checkout-forms .tab-pane', function (event) {
            if (!$(event.target).closest('li').find('.additionalFields:visible').length && event.target.type === 'radio') {
                var dataMethodID = $(this).attr('data-method-id');
                if (dataMethodID) {
                    $('#selectedPaymentOption').val(dataMethodID);
                }
                $('.tab-pane').removeClass('active');
                $('.tab-pane').find('.additionalFields').hide();
                $(this).closest('.tab-pane').addClass('active');
                $(this).closest('.tab-pane').find('.additionalFields').show();
                if ($(event.target).val() !== 'paypal') {
                    $('.next-step-button .submit-payment').removeAttr('disabled');
                }
            }
        });
    },

    updateIdentificationRegex: function () {
        $('body').on('change', 'select#identificationValue', function () {
            var selectedVal = $(this).find('option:selected').attr('id');
            var $inputField = $('input#contactInfoIdentificationValue_');
            var $errorField = $('#contactInfoIdentificationValue');
            var inputVal = $inputField.val();

            if ((selectedVal === '1') ? (/^([0-9.-]{15,20})$/).test(inputVal) : (selectedVal === '2') ? (/^([0-9]{16})$/).test(inputVal) : (/^([a-zA-Z0-9]{7,14})$/).test(inputVal)) {
                $inputField.removeClass('is-invalid');
                $inputField.closest('.form-group').removeClass('error-field');
                $errorField.val('');
            } else if (inputVal === '') {
                $inputField.removeClass('is-invalid');
                $inputField.closest('.form-group').removeClass('error-field');
                $errorField.text($inputField.attr('data-value'));
            } else if (selectedVal) {
                $errorField.text($inputField.attr('data-valid'));
                $inputField.addClass('is-invalid');
                $inputField.closest('.form-group').addClass('error-field');
            } else {
                $inputField.removeClass('is-invalid');
                $inputField.closest('.form-group').removeClass('error-field');
                $errorField.val('');
            }
        });
    },

    validateIdentificationDetails: function () {
        $('input#contactInfoIdentificationValue_').on('focusout', function (event) {
            event.stopPropagation();
            var selectedVal = $('select#identificationValue').find('option:selected').attr('id');
            var $errorField = $('#contactInfoIdentificationValue');
            var inputVal = $(this).val();

            if ((selectedVal === '1') ? (/^([0-9.-]{15,20})$/).test(inputVal) : (selectedVal === '2') ? (/^([0-9]{16})$/).test(inputVal) : (/^([a-zA-Z0-9]{7,14})$/).test(inputVal)) {
                $(this).removeClass('is-invalid');
                $(this).closest('.form-group').removeClass('error-field');
                $errorField.val('');
            } else if (inputVal === '') {
                $errorField.text($(this).attr('data-value'));
            } else if (selectedVal) {
                $errorField.text($(this).attr('data-valid'));
                $(this).addClass('is-invalid');
                $(this).closest('.form-group').addClass('error-field');
            } else {
                $(this).removeClass('is-invalid');
                $(this).closest('.form-group').removeClass('error-field');
                $errorField.val('');
            }
        });
    },

    loadAddressFeildsDefinition: function () {
        var url = $('form.shipping-form').data('address-definition-url');
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            async: true,
            success: function (data) {
                if (!data.error) {
                    window.countryData = data.countryData;
                    $('.dropdownState').trigger('change');
                    $('.addressCityDropdown').trigger('change');
                }
            }
        });
    }
};

var selectOption = $('.selectLabel').val();
var $defaultAddress = $('.default-address:visible');

/**
 *attach DropDown ListsEvents
 */
function attachDropDownListsEvents() {
    $('body').on('change', 'select[name $= "addressFields_states_stateCode"]', function () {
        var $form = $(this).closest('form');
        var stateField = $form.find('.dropdownState');
        var state = stateField.val();
        var country = $('#selectedCountry').val();
        var countriesDefinitions = window.countryData;
        var dependencyOnState = $('.shippingState').data('dependencyonstate');
        if (Object.keys(countriesDefinitions).length > 0 && state && country && dependencyOnState !== null) {
            if (dependencyOnState === 'postalCode') {
                filterPostalCodeDropDown(countriesDefinitions, state, dependencyOnState, null, true, $form);
            } else if (dependencyOnState === 'city') {
                filterCityDropDown(countriesDefinitions, state, $form);
            }
        } else if ((state == null || state === '') && $form.find('.dropdownState').children('option').length <= 1) {
            var allStates = Object.keys(countriesDefinitions.states);
            $(allStates).each(function () {
                $('<option />', {
                    html: this,
                    id: this,
                    value: this
                }).appendTo(stateField);
            });
        } else if (state === '' && $(this).closest('form').is('visible')) {
            $('select:visible').each(function () {
                var $this = $(this);
                if (!$this.hasClass('b-country-select') && !$this.hasClass('dropdownState') && !$this.hasClass('b-country-dialing-code') && !$this.hasClass('identification-type')) {
                    $this.empty();
                    $this.append($('<option value=""></option>').html(selectOption));
                }
            });
        }

        if (Object.keys(countriesDefinitions).length > 0 && state && country && dependencyOnState !== null) {
            var savedStateCode;
            if ($defaultAddress.length) {
                if ($('.default-address .shipping-address-option').is(':visible')) {
                    savedStateCode = $('.default-address:visible .shipping-address-option').data('state-code');
                } else if ($('.default-address .billing-address-option').is(':visible')) {
                    savedStateCode = $('.default-address:visible .billing-address-option').data('state-code');
                }
            }

            if (savedStateCode && savedStateCode !== '') {
                var option = stateField.find('option[value="' + savedStateCode + '"]');
                if (option.length > 0) {
                    option.prop('selected', true);
                }
            }
        }
    });
    $('body').on('change', 'select[name $= "addressFields_city"]', function () {
        var $form = $(this).closest('form');
        var stateField = $form.find('.dropdownState');
        var state = stateField.val();
        var cityField = $form.find('.addressCityDropdown');
        var city = cityField.val();
        var country = $('#selectedCountry').val();
        var countriesDefinitions = window.countryData;
        var dependencyOncity = $('.shippingAddressCity').data('dependencyoncity');
        if (Object.keys(countriesDefinitions).length > 0 && city && state && country && dependencyOncity !== null) {
            if (dependencyOncity !== null && dependencyOncity === 'district') {
                filterDistrictDropDown(countriesDefinitions, state, city, $form);
            } else if (dependencyOncity !== null && dependencyOncity === 'postalCode') {
                filterPostalCodeDropDown(countriesDefinitions, state, dependencyOncity, city, false, $form);
            }
        }

        if (city === '') {
            $('select:visible').each(function () {
                var $this = $(this);
                if (!$this.hasClass('b-country-select') && !$this.hasClass('dropdownState') && !$this.hasClass('addressCityDropdown') && !$this.hasClass('b-country-dialing-code') && !$this.hasClass('identification-type')) {
                    $this.empty();
                    $this.append($('<option value=""></option>').html(selectOption));
                }
            });
        }

        if ($defaultAddress.length && !$('#checkout-main').data('customer-type') === 'guest') {
            $('select[name$=_city]').empty();
            $('select[name$=_city]').append($('<option value=""></option>').html(''));
        }
    });
    $('.dropdownState').trigger('change');
    $('.addressCityDropdown').trigger('change');
}
/**
 * Filter Postal Code DropDown
 * @param {array} countriesDefinitions - countryData
 * @param {string} state - the state
 * @param {string} dependency - dependency
 * @param {string} city - city
 * @param {boolean} isState - isState
 * @param {string} parentForm - parentForm
 */
function filterPostalCodeDropDown(countriesDefinitions, state, dependency, city, isState, parentForm) {
    var PostalCodeField = parentForm.find('.dropdownPostalCode');
    var postalCodeValues;
    if (dependency && isState) {
        postalCodeValues = countriesDefinitions.states[state];
    } else if (dependency && !isState) {
        postalCodeValues = countriesDefinitions.states[state].cities[city] ? countriesDefinitions.states[state].cities[city].postalCodes : null;
    }
    PostalCodeField.empty();
    PostalCodeField.append($('<option value=""></option>').html(selectOption).val(''));
    if (postalCodeValues !== null) {
        $(postalCodeValues).each(function () {
            $('<option />', {
                html: this,
                id: this,
                value: this
            }).appendTo(PostalCodeField);
        });
    }
    var savedPostalCode = PostalCodeField.attr('value');
    if ($defaultAddress.length) {
        if ($('.default-address .shipping-address-option').is(':visible')) {
            savedPostalCode = $('.default-address:visible .shipping-address-option').data('postal-code');
        } else if ($('.default-address .billing-address-option').is(':visible')) {
            savedPostalCode = $('.default-address:visible .billing-address-option').data('postal-code');
        }
    }
    if (savedPostalCode && savedPostalCode !== '') {
        var option = PostalCodeField.find('option[value="' + savedPostalCode + '"]');
        if (option.length > 0) {
            if (!$('#shippingZipCodedefault').is(':visible') && $('#checkout-main').attr('data-checkout-stage') === 'shipping') {
                $('#shippingZipCodedefault').empty().append($('<option value="' + savedPostalCode + '"></option>').html(savedPostalCode));
            } else {
                option.prop('selected', true);
            }
        }
    }
}

/**
 * Filter City DropDown
 * @param {array} countriesDefinitions - countryData
 * @param {string} state - the state
 * @param {string} parentForm - parentForm
 */
function filterCityDropDown(countriesDefinitions, state, parentForm) {
    var cityField = parentForm.find('.addressCityDropdown');
    var cities = countriesDefinitions.states[state].cities;
    var citiesValues = cities;
    if ((citiesValues.length === undefined)) {
        citiesValues = Object.keys(cities);
    }
    cityField.empty();
    cityField.append($('<option value=""></option>').html(selectOption));
    if ($('#selectedCountry').val() === 'TH') {
        $(citiesValues).each(function () {
            $('<option />', {
                html: cities[this].label,
                id: this,
                value: this
            }).appendTo(cityField);
        });
    } else {
        $(citiesValues).each(function () {
            $('<option />', {
                html: this,
                id: this,
                value: this
            }).appendTo(cityField);
        });
    }
    var savedCity = cityField.attr('value');
    if ($('.default-address .shipping-address-option').length && $('#checkout-main').attr('data-checkout-stage') === 'shipping') {
        savedCity = $('.default-address .shipping-address-option').data('city');
    } else if ($('.default-address .billing-address-option').length && $('#checkout-main').attr('data-checkout-stage') === 'payment') {
        savedCity = $('.default-address .billing-address-option').data('city');
    }
    if (savedCity && savedCity !== '') {
        var option = cityField.find('option[value="' + savedCity + '"]');
        if (option.length > 0) {
            option.prop('selected', true);
        }
    }
    if (savedCity === '') {
        if ($('select.shippingZipCode').is(':visible')) {
            var $this = parentForm.find('.shippingZipCode');
            $this.empty();
            $this.append($('<option value=""></option>').html(selectOption));
        }
    }
}
/**
 * Filter District DropDown
 * @param {array} countriesDefinitions - countryData
 * @param {string} state - the state
 * @param {string} city - city
 * @param {string} parentForm - parentForm
 */
function filterDistrictDropDown(countriesDefinitions, state, city, parentForm) {
    var districtField = parentForm.find('.districtFieldDropdown');
    var districtValues = countriesDefinitions.states[state].cities[city];
    districtField.empty();
    districtField.append($('<option value=""></option>').html(selectOption).val(''));
    $(districtValues).each(function () {
        $('<option />', {
            html: this,
            id: this,
            value: this
        }).appendTo(districtField);
    });
    var savedDistrict = districtField.attr('value');
    if (savedDistrict && savedDistrict !== '') {
        var option = districtField.find('option[value="' + savedDistrict + '"]');
        if (option.length > 0) {
            option.prop('selected', true);
        }
    }
}

[billingHelpers, shippingHelpersAPAC, addressHelpers].forEach(function (library) {
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
