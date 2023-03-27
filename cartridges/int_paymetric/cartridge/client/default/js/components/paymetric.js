'use strict';

/* eslint-disable no-undef */
/* eslint-disable new-cap */
/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
/* eslint-disable no-param-reassign */

var exports = {
    initialize: function () {
        var $select = {};

        /**
         * Cache selectors
         */
        function initializeCache() {
            $select.paymentSandboxContainer = $('#payment-sandbox-container');
            $select.payload = $('input[name$="_payload"]');
            $select.cardType = $('input[name$="_cardType"]');
            $select.lastFour = $('input[name$="_lastFour"]');
            $select.ccBinRange = $('input[name$="_ccBinRange"]');
            $select.expiresMonth = $('input[name$="_expiresMonth"]');
            $select.expiresYear = $('input[name$="_expiresYear"]');
            $select.shippingAddressForm = $('.single-shipping .shipping-form');
            $select.billingAddressForm = $('#dwfrm_billing');
            $select.storedPayments = $('.stored-payments');
            $select.paymetricError = $('#paymetricError');
        }

        /**
         * Collect checkout data
         * @returns {Object} data - Address and Payment info
         */
        function getPaymentSandboxExternalData() {
            var selectedCard = $select.storedPayments.length && $select.storedPayments.find('.selected-payment:visible');
            var billingRegion;
            if ($select.billingAddressForm.find('select[name*="_states_state"]').length > 0) {
                billingRegion = $select.billingAddressForm.find('select[name*="_states_state"]').val();
            } else {
                billingRegion = billingRegion = $select.billingAddressForm.find('input[name*="_states_state"]').val();
            }
            // eslint-disable-next-line spellcheck/spell-checker
            var productLineItemExist = $('#checkout-main').data('productlineitemexist');
            var data = {
                currency: $select.paymentSandboxContainer.data('currency'),
                billingAddress: {
                    line1: $select.billingAddressForm.find('input[name$="_address1"]').val(),
                    line2: $select.billingAddressForm.find('input[name$="_address2"]').val(),
                    city: $select.billingAddressForm.find('input[name$="_city"]').val(),
                    region: billingRegion,
                    postal: $select.billingAddressForm.find('input[name$="_postalCode"]').val(),
                    country: $select.billingAddressForm.find('select[name$="_country"]').val()
                }
            };
            if (productLineItemExist) {
                data.shippingAddress = {
                    line1: $select.shippingAddressForm.find('input[name$="_address1"]').val(),
                    line2: $select.shippingAddressForm.find('input[name$="_address2"]').val(),
                    city: $select.shippingAddressForm.find('input[name$="_city"]').val(),
                    region: $select.shippingAddressForm.find('select[name*="_states_state"]').val(),
                    postal: $select.shippingAddressForm.find('input[name$="_postalCode"]').val(),
                    country: $select.shippingAddressForm.find('select[name$="_country"]').val()
                };
            }

            if (selectedCard.length) {
                var paymentData = selectedCard.data('card');
                if (paymentData) {
                    data.payment = {
                        type: paymentData.paymetricCardType,
                        cardToken: paymentData.creditCardToken || paymentData.creditCardTokenInt,
                        nameOnCard: paymentData.creditCardHolder,
                        cardType: paymentData.creditCardType,
                        expiresMonth: paymentData.creditCardExpirationMonth,
                        expiresYear: paymentData.creditCardExpirationYear,
                        lastFour: paymentData.creditCardLastFour,
                        ccBinRange: paymentData.creditCardBinRange || ''
                    };
                }
            }

            return data;
        }

        /**
         * Iframe init
         */
        function paymentSandBoxInit() {
            if ($select.paymentSandboxContainer && $select.paymentSandboxContainer.length) {
                var element = $select.paymentSandboxContainer[0];
                var url = $select.paymentSandboxContainer.data('url');
                // fetch inactive card types from data attribute to pass to the ￼Payment Sandbox￼ constructor call
                // Example - cardTypes={DISC:false}
                var inactiveCardTypes = $select.paymentSandboxContainer.data('inactive-card-types');
                var isCSR = $select.paymentSandboxContainer.data('is-csr');
                var locale = $select.paymentSandboxContainer.data('locale');
                var fields = {};
                if (isCSR) {
                    fields = {
                        number: false,
                        type: true,
                        token: true
                    };
                }
                var sandbox = new Promise(function (resolve) {
                    PaymentSandbox(element, {
                        uri: url,
                        onReady: function (sandbox) {
                            window.sandbox = sandbox;
                            resolve();
                        },
                        cardTypes: (inactiveCardTypes !== '' && inactiveCardTypes !== null) ? inactiveCardTypes : {},
                        fields: fields,
                        locale: (locale !== '' && locale !== null) ? locale : 'en'
                    });
                });
            }
        }

        /**
         * Iframe reinit
         */
        function paymentSandBoxReInit() {
            $select.paymentSandboxContainer.empty();
            sandbox.destroy();
            paymentSandBoxInit();
        }

        /**
         * Handle validation error
         */
        function handleValidationError() {
            $select.payload.val('');
            $select.payload.removeClass('authorized');
            $select.cardType.val('');
            $select.lastFour.val('');
            $select.ccBinRange.val('');
            $select.expiresMonth.val('');
            $select.expiresYear.val('');
        }

        /**
         * Handle API error
         * @param {Object} error - Error
         */
        function handleAuthorizationError(error) {
            $select.payload.val('');
            $select.payload.removeClass('authorized');
            $select.cardType.val('');
            $select.lastFour.val('');
            $select.ccBinRange.val('');
            $select.expiresMonth.val('');
            $select.expiresYear.val('');
            $select.paymetricError.css('display', 'block');
            paymentSandBoxReInit();
        }

        /**
         * Handle successful request
         * @param {Object} res - response
         */
        function handleSuccess(res) {
            $select.payload.val(res.authorization.payload);
            $select.payload.addClass('authorized');
            $select.cardType.val(res.payment.cardType);
            $select.lastFour.val(res.payment.lastFour);
            $select.ccBinRange.val(res.payment.ccBinRange);
            $select.expiresMonth.val(res.payment.expiresMonth);
            $select.expiresYear.val(res.payment.expiresYear);
        }

        /**
         * Add payload to the serialized form data
         * @param {Object} paymentForm - Payment form
         * @returns {string} Updated serialized form data
         */
        function serializePayload(paymentForm) {
            var serializedPayloadForm = $('input[name$="_payload"]').serialize();
            var emptyPayloadForm = serializedPayloadForm.split('=')[0] + '=';
            return paymentForm.replace(emptyPayloadForm, serializedPayloadForm);
        }
        /**
         * Add cardData to the serialized form data
         * @param {Object} paymentForm - Payment form
         * @returns {string} Updated serialized form data
         */
        function serializeCardData(paymentForm) {
            var serializedCardTypeForm = $('input[name$="_cardType"]').serialize();
            var serializedLastFourForm = $('input[name$="_lastFour"]').serialize();
            var serializedCCBinRangeForm = $('input[name$="_ccBinRange"]').serialize();
            var serializedExpiresMonthForm = $('input[name$="_expiresMonth"]').serialize();
            var serializedExpiresYear = $('input[name$="_expiresYear"]').serialize();
            var emptyCardTypeForm = serializedCardTypeForm.split('=')[0] + '=';
            var emptyLastFourForm = serializedLastFourForm.split('=')[0] + '=';
            var emptyCCBinRangeForm = serializedCCBinRangeForm.split('=')[0] + '=';
            var emptyExpiresMonthForm = serializedExpiresMonthForm.split('=')[0] + '=';
            var emptyExpiresYear = serializedExpiresYear.split('=')[0] + '=';
            paymentForm = paymentForm.replace(emptyCardTypeForm, serializedCardTypeForm);
            paymentForm = paymentForm.replace(emptyLastFourForm, serializedLastFourForm);
            paymentForm = paymentForm.replace(emptyCCBinRangeForm, serializedCCBinRangeForm);
            paymentForm = paymentForm.replace(emptyExpiresMonthForm, serializedExpiresMonthForm);
            paymentForm = paymentForm.replace(emptyExpiresYear, serializedExpiresYear);
            return paymentForm;
        }

        /**
         * Initialize events
         */
        function initializeEvents() {
            if (!$select.paymentSandboxContainer && !$select.paymentSandboxContainer.length) {
                return;
            }

            // Checkout payment submit listener
            $('body').on('checkout:paymentSubmitted:paymetric', function (e, data) {
                if (!data) {
                    return;
                }

                var callback = data.callback;
                var paymentForm = data.form;

                // Request Paymetric API via promise in order to get encrypted payload
                if (!$select.payload.is('.authorized')) {
                    var externalData = getPaymentSandboxExternalData();
                    var isSavedCard = $select.storedPayments.find('.selected-payment:visible').length;

                    if (isSavedCard) {
                        // Saved card data
                        sandbox.authorize(externalData)
                            .then((res) => {
                                if (res && res.authorization && res.authorization.payload) {
                                    handleSuccess(res);
                                    paymentForm = serializePayload(paymentForm);
                                    paymentForm = serializeCardData(paymentForm);
                                    callback({
                                        error: false,
                                        form: paymentForm
                                    });
                                } else {
                                    handleAuthorizationError();
                                    callback({
                                        error: true
                                    });
                                }
                            })
                            .catch((error) => {
                                handleAuthorizationError(error);
                                callback({
                                    error: true
                                });
                            });
                    } else {
                        // New card data
                        sandbox.validate()
                            .then(() => {
                                sandbox.authorize(externalData)
                                    .then((res) => {
                                        if (res && res.authorization && res.authorization.payload) {
                                            handleSuccess(res);
                                            paymentForm = serializePayload(paymentForm);
                                            paymentForm = serializeCardData(paymentForm);
                                            callback({
                                                error: false,
                                                form: paymentForm
                                            });
                                        } else {
                                            handleAuthorizationError();
                                            callback({
                                                error: true
                                            });
                                        }
                                    })
                                    .catch((error) => {
                                        handleAuthorizationError(error);
                                        callback({
                                            error: true
                                        });
                                    });
                            })
                            .catch((error) => {
                                handleValidationError();
                                callback({
                                    error: true
                                });
                            });
                    }
                } else {
                    data.callback({
                        error: false,
                        form: paymentForm
                    });
                }
            });
        }
        /**
         * Clear Paymetric Fields
         * @returns {void}
         */
        function clearPaymetricFields() {
            $select.payload.val('');
            $select.payload.removeClass('authorized');
            $select.cardType.val('');
            $select.lastFour.val('');
            $select.ccBinRange.val('');
            $select.expiresMonth.val('');
            $select.expiresYear.val('');
        }
        // clear paymetric fields if user clicks on edit button of shipping and payment section
        $('.payment-summary .edit-button, .shipping-summary .edit-button').on('click', function () {
            clearPaymetricFields();
        });
        $('.user-payment-instruments .js-add-payment, .stored-payments').on('click', function (e) {
            paymentSandBoxReInit();
            var $target = $(e.target);
            var $paymentFields = $target.closest('.payment-form-fields');
            if ($target.hasClass('js-add-payment')) {
                $paymentFields.find('.js-payment-selection-error').addClass('hide');
                $paymentFields.removeClass('error-payment-selection');
            }
        });
        // clear paymetric fields on click of back button if checkout stage is payment
        window.onpopstate = function () {
            var hashValue = window.location.hash;
            if (hashValue.indexOf('payment')) {
                clearPaymetricFields();
            }
        };
        initializeCache();
        initializeEvents();
        paymentSandBoxInit();
    }
};

module.exports = exports;
