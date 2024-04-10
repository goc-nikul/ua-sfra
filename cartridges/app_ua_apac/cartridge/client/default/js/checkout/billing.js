'use strict';

var billingHelpersCore = require('org/checkout/billing');
var billingHelpersBase = require('falcon/checkout/billing');
var cleave = require('falcon/components/cleave');
var addressHelpers = require('./address');
var formHelpers = require('org/checkout/formErrors');
var isRegistered = $('.checkout-main').data('customer-type') === 'registered' ? false : true; // eslint-disable-line

/**
 * Updates the payment information in checkout, based on the supplied order model
 * @param {Object} order - checkout model to use as basis of new truth
 */
function updatePaymentInformation(order) {
    // update payment details
    var $paymentSummary = $('.payment-details');
    var htmlToAppend = '';

    if (order.billing.payment && order.billing.payment.selectedPaymentInstruments && order.billing.payment.selectedPaymentInstruments.length > 0) {
        var selectedPaymentInstrument = order.billing.payment.selectedPaymentInstruments[0];

        if (selectedPaymentInstrument.paymentMethod === 'Zip') {
            htmlToAppend += '<div>'
                .concat(selectedPaymentInstrument.name)
                .concat('</div>').concat('<div>')
                .concat(selectedPaymentInstrument.amountFormatted)
                .concat('</div>');
        } else if (selectedPaymentInstrument.paymentMethod === 'COD') {
            htmlToAppend += '<div>'
                .concat(selectedPaymentInstrument.name)
                .concat('</div>').concat('<div>')
                .concat(selectedPaymentInstrument.amountFormatted)
                .concat('</div>');
        } else if (selectedPaymentInstrument.paymentMethod === '2c2') {
            htmlToAppend += '<div>'
                .concat(selectedPaymentInstrument.name)
                .concat('</div>').concat('<div>')
                .concat(selectedPaymentInstrument.formattedAmount)
                .concat('</div>');
        } else if (order.billing.payment.selectedPaymentInstruments[0].paymentMethod === 'ATOME_PAYMENT') {
            htmlToAppend += '<div class="atome-method-name">'
            + order.billing.payment.selectedPaymentInstruments[0].paymentMethod
            + '</div><div class="atome-amount">'
            + order.priceTotal;
        } else if (selectedPaymentInstrument.paymentMethod === 'TOSS_PAYMENTS_CARD') {
            htmlToAppend += '<div class="toss-method-name"><span>'
                .concat(selectedPaymentInstrument.name)
                .concat('</span></div>').concat('<div class="toss-amount">')
                .concat(selectedPaymentInstrument.formattedAmount)
                .concat('</div>');
        } else if (selectedPaymentInstrument.paymentMethod === 'NAVERPAY') {
            htmlToAppend += '<div class="naverpay-method-name"><span>'
                .concat(selectedPaymentInstrument.name)
                .concat('</span></div>').concat('<div class="naverpay-amount">')
                .concat(selectedPaymentInstrument.formattedAmount)
                .concat('</div>');
        } else {
            if (selectedPaymentInstrument.selectedAdyenPM && selectedPaymentInstrument.type) {
                htmlToAppend += '<div><span>'.concat(selectedPaymentInstrument.type, '</span></div>');
            } else {
                htmlToAppend += '<div><span>'.concat(selectedPaymentInstrument.selectedAdyenPM, '</span></div>');
                htmlToAppend += '<div>' + selectedPaymentInstrument.formattedAmount + '</div>';
            }

            if (selectedPaymentInstrument.selectedIssuerName) {
                htmlToAppend += '<div><span>'.concat(selectedPaymentInstrument.selectedIssuerName, '</span></div>');
            }

            if (selectedPaymentInstrument.maskedCreditCardNumber) {
                htmlToAppend += '<div>'.concat(selectedPaymentInstrument.maskedCreditCardNumber, '</div>');
            }

            if (selectedPaymentInstrument.expirationMonth && selectedPaymentInstrument.expirationYear) {
                htmlToAppend += '<div><span>'.concat(order.resources.cardEnding, ' ').concat(selectedPaymentInstrument.expirationMonth, '/').concat(selectedPaymentInstrument.expirationYear, '</span></div>');
            }
        }
    }

    $paymentSummary.empty().append(htmlToAppend);
}

var hasOnlyEGiftCards = false;
/**
 * updates the billing address selector within billing forms
 * @param {Object} order - the order model
 * @param {Object} customer - the customer model
 */
function updateBillingAddressSelector(order, customer) {
    var shippings = order.shipping;

    var $form = $('form[name$=billing]');
    var $billingAddressSelector = $form.find('.addressSelector');
    var hasSelectedAddress = false;

    if ($billingAddressSelector.length && !window.basketHasOnlyBOPISProducts) {
        $billingAddressSelector.empty();
        if ($billingAddressSelector.find('.billing-address-section').not('.new').length === 1) {
            $billingAddressSelector.append(addressHelpers.methods.optionValueForAddress(null, false, order, {
                type: 'billing'
            }));
            /* to remove option values getting updated as a duplicate address
            $billingAddressSelector.append(addressHelpers.methods.optionValueForAddress(order.resources.shippingAddresses, false, order, {
                type: 'billing'
            })); */
        }

        var InCustAddressbookAvailable = false;
        var custAddressIDSelectedinShipping = '';
        if (customer && customer.addresses && customer.addresses.length > 0) {
            customer.addresses.forEach(function (address) {
                if (order.shipping[0].matchingAddressId === address.ID) {
                    InCustAddressbookAvailable = true;
                    custAddressIDSelectedinShipping = address.ID;
                }
            });
        }
        var isOfficeAddress = $('.employee-address-selector').find('.default-address').length > 0;
        var shipmentID = '';
        var isShipToCollectionEnabled = $('.pick-up-point-option.active').length > 0;
        if (!isOfficeAddress) {
            shippings.forEach(function (shipment) {
                var isSelected = order.billing.matchingAddressId !== undefined && (order.billing.matchingAddressId === shipment.UUID || order.billing.matchingAddressId === shipment.matchingAddressId);
                if (order.billing.matchingAddressId === shipment.UUID || order.billing.matchingAddressId === shipment.matchingAddressId) {
                    shipmentID = order.billing.matchingAddressId;
                }
                hasSelectedAddress = hasSelectedAddress || isSelected;
                if (shipment.selectedShippingMethod === null || !isShipToCollectionEnabled) {
                    $billingAddressSelector.append(
                        addressHelpers.methods.optionValueForAddress(shipment, isSelected, order, {
                            type: 'billing'
                        })
                    );
                }
            });
        }
        if (customer && customer.addresses && customer.addresses.length > 0) {
            $('.make-ship-as-bill').removeClass('hide');
            // to remove option values getting updated as a duplicate address
            // $billingAddressSelector.append(addressHelpers.methods.optionValueForAddress(order.resources.accountAddresses, false, order));
            customer.addresses.forEach(function (address) {
                if ((customer.countryCode === address.countryCode.value) && (!InCustAddressbookAvailable || (InCustAddressbookAvailable && custAddressIDSelectedinShipping !== address.ID)) && !isShipToCollectionEnabled) {
                    var isSelected = (order.shipping[0].matchingAddressId === address.ID) || (address.ID === order.billing.matchingAddressId);
                    if (order.shipping[0].matchingAddressId === order.billing.matchingAddressId) {
                        shipmentID = address.ID;
                    }
                    if (!isSelected && isOfficeAddress) {
                        isSelected = true;
                        isOfficeAddress = false;
                    }
                    hasSelectedAddress = hasSelectedAddress || isSelected;
                    $billingAddressSelector.append(
                        addressHelpers.methods.optionValueForAddress({
                            UUID: 'ab_' + address.ID,
                            shippingAddress: address
                        }, isSelected, order, {
                            type: 'billing'
                        })
                    );
                }
            });
        }

        var isShippingBillingSame = false;
        if (shipmentID && (shipmentID === order.billing.matchingAddressId)) {
            isShippingBillingSame = true;
        }
        hasOnlyEGiftCards = order.hasOnlyEGiftCards;
        isRegistered = customer.registeredUser;
        if (hasOnlyEGiftCards && !isRegistered) {
            isShippingBillingSame = false;
        }

        if (!window.sitePreferences.isKRCustomCheckoutEnabled) {
            if (isShippingBillingSame) {
                $('#shippingAsBilling').prop('checked', true);
            } else {
                $('#shippingAsBilling').prop('checked', false);
            }
        }

        $('.billing-address-option').wrap('<div class="billing-address-section"></div>');
        var editLink = $('input.editAddrURL').val();
        var deleteLabel = $('input.deleteLabel').val();
        var editLabel = $('input.editLabel').val();
        var editDeleteLink = `<a class='col-6 text-center btn-show-details' data-action-url='${editLink}'>${editLabel}</a>
            <a class="col-6 text-center button-delete-address">${deleteLabel}</a>
            <span class="icon"></span>`;

        $('.addressSelector .billing-address-section').append(editDeleteLink);
        $('.addressSelector .billing-address-option[data-addr-id=""]').closest('.billing-address-section').addClass('remove-links');
        $('.addressSelector .billing-address-option[selected="selected"]').closest('.billing-address-section').addClass('default-address remove-links');

        // If default saved address as international address then we need to update the billing form.
        var $billingSelectorOption = $('.addressSelector .billing-address-option[selected="selected"]');
        if ($billingSelectorOption.length > 0 && $billingSelectorOption.attr('data-country-code') !== '' && $billingSelectorOption.attr('data-country-code') !== undefined) {
            $('.addressSelector .billing-address-option[selected="selected"]').trigger('click');
        }
    }

    if (hasSelectedAddress || ((!order.billing.matchingAddressId || window.basketHasOnlyBOPISProducts) && order.billing.billingAddress.address)) {
        $form.attr('data-address-mode', 'edit');
    } else {
        $form.attr('data-address-mode', 'new');
    }

    if (window.basketHasOnlyBOPISProducts && order.billing.billingAddress.address === null) {
        $form.find('.billing-address-block').addClass('display-billing-fields');
        $form.find('.make-ship-as-bill').addClass('hide');
        window.basketHasOnlyBOPISProducts = false;
    } else if (window.basketHasOnlyBOPISProducts && order.billing.billingAddress.address !== null) {
        $form.find('.make-ship-as-bill').addClass('hide');
        $form.find('.billing-address-block').removeClass('display-billing-fields');
    } else {
        $form.find('.billing-address-block').removeClass('display-billing-fields');
        if ($('.employee-address-selector').find('.default-address').length > 0) {
            $form.find('.make-ship-as-bill').addClass('hide');
        } else {
            $form.find('.make-ship-as-bill').removeClass('hide');
        }
    }

    $billingAddressSelector.show();
}

/**
 * updates the billing address form values within payment forms
 * @param {Object} order - the order model
 */
function updateBillingAddressFormValues(order) {
    var billing = order.billing;
    var $form = $('form[name=dwfrm_billing]');
    if (!billing.billingAddress || !billing.billingAddress.address || !$form.length) return;
    var billingAddress = billing.billingAddress.address;

    $form.find('input[name$=_firstName]').val(billingAddress.firstName);
    $form.find('input[name$=_lastName]').val(billingAddress.lastName);
    $form.find('input[name$=_businessName]').val(billingAddress.businessName);
    $form.find('input[name$=_address1]').val(billingAddress.address1);
    $form.find('input[name$=_address2]').val(billingAddress.address2);
    $form.find('input[name$=_suburb]').val(billingAddress.suburb);
    var districtField = $form.find('input[name$=_district]');
    var districtDropDown = $form.find('select[name*="_district_district"]');
    if (districtField.length > 0) {
        districtField.val(billingAddress.district);
    } else if (districtDropDown.length > 0) {
        districtDropDown.empty();
        districtDropDown.append($('<option></option>').html(billingAddress.district).val(billingAddress.district));
    }
    if ($form.find('[name$=_city]').length) {
        var cityField = $form.find('input[name$=_city]');
        var cityFieldDropDown = $form.find('select[name*="_city_city"]');
        if (cityField.length > 0) {
            cityField.val(billingAddress.city);
        } else if (cityFieldDropDown.length > 0) {
            cityFieldDropDown.empty();
            cityFieldDropDown.append($('<option></option>').html(billingAddress.city).val(billingAddress.city));
        }
    }
    var postalCodeField = $form.find('input[name$=_postalCode]');
    var postalCodeDropDown = $form.find('select[name*="_postalCode_postalCode"]');
    if (postalCodeField.length > 0) {
        postalCodeField.val(billingAddress.postalCode);
    } else if (postalCodeDropDown.length > 0) {
        postalCodeDropDown.empty();
        postalCodeDropDown.append($('<option></option>').html(billingAddress.postalCode).val(billingAddress.postalCode));
    }
    $form.find('select[name*="_states_state"]').val(billingAddress.stateCode);
    $form.find('input[name*="_state"]').val(billingAddress.stateCode);
    $form.find('input[name$=_phone]').val(billingAddress.phone);
    $form.find('input[name$=_email]').val(order.orderEmail);
    $form.find().val();
}
/**
 * Get Success_url from Atome create Order API through AJAX call from Atome payment button on checkout
 * On success API response , Open Atome Lightbox to start Payment
 */
billingHelpersBase.paymentTabs = function () {
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

/**
 * Clearing the billing form
 */
function clearBillingForms() {
    var form = $('.billing-address.b-billing');
    if (!form) return;

    $('input[name$=_firstName]', form).val('');
    $('input[name$=_lastName]', form).val('');
    $('input[name$=_address1]', form).val('');
    $('input[name$=_address2]', form).val('');
    $('input[name$=_district]', form).val('');
    $('input[name$=_city]', form).val('');
    $('input[name$=_postalCode]', form).val('');
    $('input[name$=_stateCode]', form).val('');
    $('select[name$=_stateCode]').val($('select[name$=_stateCode] option:first').val());
    $('select[name$=_postalCode]').val($('select[name$=_postalCode] option:first').val());
    $('select[name$=_city]').val($('select[name$=_city] option:first').val());
    $('select[name$=_country]', form).val('');
}

/**
 * clears the billing address form values
 */
function clearBillingAddressFormValues() {
    updateBillingAddressFormValues({
        billing: {
            billingAddress: {
                address: {
                    countryCode: {}
                }
            }
        }
    });
}

/**
 * Updates the billing information in checkout, based on the supplied order model
 * @param {Object} order - checkout model to use as basis of new truth
 * @param {Object} customer - customer model to use as basis of new truth
 * @param {Object} [options] - options
 */
function updateBillingInformation(order, customer) {
    updateBillingAddressSelector(order, customer);
    updateBillingAddressFormValues(order);
    addressHelpers.methods.populateAddressSummary('.billing .address-summary', order.billing.billingAddress.address);
    $('.order-summary-email').text(order.orderEmail);

    if (order.billing.billingAddress.address) {
        $('.order-summary-phone').text(order.billing.billingAddress.address.phone);
    }
}

module.exports = {
    methods: {
        updateBillingAddressFormValues: updateBillingAddressFormValues,
        updateBillingAddressSelector: updateBillingAddressSelector,
        clearBillingAddressFormValues: clearBillingAddressFormValues,
        updateBillingInformation: updateBillingInformation,
        updatePaymentInformation: updatePaymentInformation,
        clearBillingForms: clearBillingForms,
        updateStateOptions: billingHelpersCore.updateStateOptions
    },

    showBillingDetails: billingHelpersCore.showBillingDetails,
    hideBillingDetails: billingHelpersCore.hideBillingDetails,
    selectSavedPaymentInstrument: billingHelpersCore.selectSavedPaymentInstrument,
    addNewPaymentInstrument: billingHelpersCore.addNewPaymentInstrument,
    cancelNewPayment: billingHelpersCore.cancelNewPayment,
    paymentTabs: billingHelpersCore.paymentTabs,
    removePayment: billingHelpersCore.removePayment,

    clearBillingForm: function () {
        $('body').on('checkout:clearBillingForm', function () {
            clearBillingAddressFormValues();
        });
    },

    sanitizeForm: function () {
        $('body').on('checkout:serializeBilling', function (e, data) {
            var serializedForm = cleave.serializeData(data.form);
            data.callback(serializedForm);
        });
    },

    selectBillingAddress: function () {
        $('body').on('click', '.payment-form .addressSelector .billing-address-option', function () {
            var $form = $(this).parents('form');
            var selectedOption = $(this);
            var optionID = $(selectedOption[0]).attr('value');

            if (optionID === 'new') {
                $form.attr('data-address-mode', 'new');
            } else {
                $form.attr('data-address-mode', 'shipment');
            }

            if (!(selectedOption.hasClass('shipping-address-section-new'))) {
                $('.billing-address-section').removeClass('default-address');
                $(this).closest('.billing-address-section').addClass('default-address');
            }

            var addressID = $(this).closest('.billing-address-section').find('.billing-address-option').attr('data-addr-ID');
            $form.attr('data-addr-ID', addressID);

            var billingAsShipping;

            if (hasOnlyEGiftCards && !isRegistered) {
                billingAsShipping = false;
            } else {
                billingAsShipping = $(this).closest('.billing-address-section').find('.billing-address-option').attr('data-sameAsShipping');
            }

            if (!window.sitePreferences.isKRCustomCheckoutEnabled) {
                if (billingAsShipping && (billingAsShipping === 'true')) {
                    $('#shippingAsBilling').prop('checked', true);
                } else {
                    $('#shippingAsBilling').prop('checked', false);
                }
            }

            var attrs = selectedOption.data();
            var element;
            var postCodeVal;

            Object.keys(attrs).forEach(function (attr) {
                element = attr === 'countryCode' ? 'country' : attr;
                if ($form.find('[name$=' + element + ']').is('select')) {
                    $form.find('[name$=' + element + ']').val(attrs[attr]).trigger('change');
                    if (element === 'postalCode') {
                        postCodeVal = attrs[attr];
                    }
                } else {
                    $form.find('[name$=' + element + ']').val(attrs[attr]);
                }
            });

            $('select[name$="addressFields_country"]').trigger('change');

            Object.keys(attrs).forEach(function (attr) {
                element = attr === 'countryCode' ? 'country' : attr;
                if ($form.find('[name$=' + element + ']').is('select')) {
                    $form.find('[name$=' + element + ']').val(attrs[attr]).trigger('change');
                    if (element === 'postalCode') {
                        postCodeVal = attrs[attr];
                    }
                } else {
                    $form.find('[name$=' + element + ']').val(attrs[attr]);
                }
            });

            if ($('#billingZipCode').val() === null || $('#billingZipCode').val() === '') {
                $('#billingZipCode').empty().append($('<option value="' + postCodeVal + '"></option>').html(postCodeVal));
            }
        });
    }
};

