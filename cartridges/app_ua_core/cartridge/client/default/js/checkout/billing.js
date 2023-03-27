'use strict';

var addressHelpers = require('./address');
var cleave = require('base/components/cleave');
var hasOnlyEGiftCards = false;
var isRegistered;

/**
 * updates the billing address selector within billing forms
 * @param {Object} order - the order model
 * @param {Object} customer - the customer model
 */
function updateBillingAddressSelector(order, customer) {
    var shippings = order.shipping;
    var addresses = customer.addresses;

    var $form = $('form[name$=billing]');
    var $billingAddressSelector = $form.find('.addressSelector');
    var hasSelectedAddress = false;
    var onlyBopisitemExist = $('#checkout-main').data('onlybopisitemexist');
    var isShipToCollectionEnabled = $('#ship-to-collectionPoint').is(':checked');

    if ($billingAddressSelector.length) {
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
        if (customer.addresses && customer.addresses.length > 0) {
            customer.addresses.forEach(function (address) {
                if (shippings[0].matchingAddressId === address.ID) {
                    InCustAddressbookAvailable = true;
                    custAddressIDSelectedinShipping = address.ID;
                    if (!shippings[0].shippingAddress.ID) {
                        shippings[0].shippingAddress.ID = address.ID;
                    }
                    // Populate RFC data from source customer address to shipping model
                    if (address.rfc) {
                        shippings[0].shippingAddress.rfc = address.rfc;
                    }
                    if (address.razonsocial) {
                        shippings[0].shippingAddress.razonsocial = address.razonsocial;
                    }
                }
            });
        }
        var isOfficeAddress = $('.employee-address-selector').find('.default-address').length > 0;
        var shipmentID = '';
        if (!isOfficeAddress) {
            shippings.forEach(function (shipment) {
                var isSelected = order.billing.matchingAddressId !== undefined && (order.billing.matchingAddressId === shipment.UUID || order.billing.matchingAddressId === shipment.matchingAddressId);
                if (order.billing.matchingAddressId === shipment.UUID || order.billing.matchingAddressId === shipment.matchingAddressId) {
                    shipmentID = order.billing.matchingAddressId;
                }
                hasSelectedAddress = hasSelectedAddress || isSelected;
                if (shipment.selectedShippingMethod === null || shipment.selectedShippingMethod.storePickupEnabled !== true) {
                    $billingAddressSelector.append(
                        addressHelpers.methods.optionValueForAddress(shipment, isSelected, order, {
                            type: 'billing'
                        })
                    );
                }
            });
        }
        if (customer.addresses && customer.addresses.length > 0) {
            $('.make-ship-as-bill').removeClass('hide');
            // to remove option values getting updated as a duplicate address
            // $billingAddressSelector.append(addressHelpers.methods.optionValueForAddress(order.resources.accountAddresses, false, order));
            customer.addresses.forEach(function (address) {
                if (((customer.countryCode === 'CA' && address.countryCode.value === 'CA') || customer.countryCode !== 'CA') &&
                    (!InCustAddressbookAvailable || (InCustAddressbookAvailable && custAddressIDSelectedinShipping !== address.ID))) {
                    var isSelected = (shippings[0].matchingAddressId === address.ID) || (address.ID === order.billing.matchingAddressId);
                    if (shippings[0].matchingAddressId === order.billing.matchingAddressId) {
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

        if (isShippingBillingSame) {
            $('#shippingAsBilling').prop('checked', true);
        } else {
            $('#shippingAsBilling').prop('checked', false);
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

    if (hasSelectedAddress || ((!order.billing.matchingAddressId || onlyBopisitemExist || isShipToCollectionEnabled) && order.billing.billingAddress.address)) {
        $form.attr('data-address-mode', 'edit');
    } else {
        $form.attr('data-address-mode', 'new');
    }

    if (order.billing.payment && order.billing.payment.selectedPaymentInstruments && order.billing.payment.selectedPaymentInstruments.length > 0) {
        var paymentMethod = order.billing.payment.selectedPaymentInstruments[0].paymentMethod;
        if (paymentMethod !== 'PayPal' && paymentMethod !== 'DW_APPLE_PAY') {
            $form.find('.b-billing_firstline, .billing-address-block').removeClass('hide');
            if (onlyBopisitemExist || isShipToCollectionEnabled) {
                $form.find('.billing-address-block').addClass('display-billing-fields');
                $form.find('.make-ship-as-bill').addClass('hide');
                if (addresses.length) {
                    $form.find('.billing-address-block').removeClass('display-billing-fields');
                    $form.find('.make-ship-as-bill').removeClass('hide');
                    if ($('.employee-address-selector').find('.default-address').length > 0) {
                        $form.find('.make-ship-as-bill').addClass('hide');
                    }
                }
            } else {
                $form.find('.billing-address-block').removeClass('display-billing-fields');
                $form.find('.make-ship-as-bill').removeClass('hide');
                if ($('.employee-address-selector').find('.default-address').length > 0) {
                    $form.find('.make-ship-as-bill').addClass('hide');
                }
            }
        } else {
            $form.find('.b-billing_firstline, .billing-address-block').addClass('hide');
        }
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
 * Clearing the billing form
 */
function clearBillingForms() {
    var form = $('.billing-address.b-billing');
    if (!form) return;

    $('input[name$=_firstName]', form).val('');
    $('input[name$=_lastName]', form).val('');
    $('input[name$=_address1]', form).val('');
    $('input[name$=_address2]', form).val('');
    $('input[name$=_city]', form).val('');
    $('input[name$=_postalCode]', form).val('');
    $('select[name$=_stateCode],input[name$=_stateCode]', form).val('');
    $('select[name$=_country]', form).val('');
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
    $form.find('input[name$=_address1]').val(billingAddress.address1);
    $form.find('input[name$=_address2]').val(billingAddress.address2);
    $form.find('input[name$=_city]').val(billingAddress.city);
    $form.find('input[name$=_postalCode]').val(billingAddress.postalCode);
    $form.find('select[name*="_states_state"]').val(billingAddress.stateCode);
    $form.find('select[name$=_country]').val(billingAddress.countryCode.value);
    $form.find('input[name$=_phone]').val(billingAddress.phone);
    $form.find('input[name$=_email]').val(order.orderEmail);
    $form.find().val();
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

        // Updating the firstName and lastName for the Hold at Location
        $('input[name$=_contactInfoFields_firstName]').val(order.billing.billingAddress.address.firstName);
        $('input[name$=_contactInfoFields_lastName]').val(order.billing.billingAddress.address.lastName);
    }
}

/**
 * Updates the payment information in checkout, based on the supplied order model
 * @param {Object} order - checkout model to use as basis of new truth
 */
function updatePaymentInformation(order) {
    var $paymentSummary = $('.payment-details');
    var htmlToAppend = '';
    if (order.billing.payment && order.billing.payment.selectedPaymentInstruments && order.billing.payment.selectedPaymentInstruments.length > 0) {
        var payment;
        Object.keys(order.billing.payment.selectedPaymentInstruments).forEach(function (selectedPaymentInstrument) {
            payment = order.billing.payment.selectedPaymentInstruments[selectedPaymentInstrument];
            var paymentMethodType = $paymentSummary.data('gift-card-type');
            if (payment.paymentMethod === 'Paymetric' && payment.type) {
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
            }
        });
    }
    $paymentSummary.empty().append(htmlToAppend);
}

/**
 * updates the country and states list
 */
function updateStateOptions() {
    $('body').on('change', 'select[name $= "addressFields_country"]', function () {
        var $form = $('#dwfrm_billing');
        var $country = $form.find('select[id$="billingCountry"]');
        var $formState = $form.find('select[id$="billingState"]');
        var stVal = $formState.val();
        var country = $country.val();
        var countryObj;
        if (country !== undefined && $('.countryRegion').data('countryregion') !== null) {
            countryObj = $('.countryRegion').data('countryregion')[country]; // eslint-disable-line
        }
        var arrayHtml = '';
        var selectID = '';
        var selectName = '';
        var inputField;
        var selectBox;

        $form.find('[id$="_states_stateCode"]').closest('.form-group').find('.invalid-feedback').remove();
        $form.find('[id$="_states_stateCode"]').removeClass('is-invalid');

        // if statement execute only for the countries which has states as dropdown( ex : UK, US, CA)
        if (countryObj !== undefined && countryObj !== null && countryObj.regions !== undefined && countryObj.regions !== null && Object.keys(countryObj.regions).length > 0) {
            selectID = 'id="' + $form.find('[name$="_states_stateCode"]').attr('id') + '"';
            selectName = 'name="' + $form.find('[name$="_states_stateCode"]').attr('name') + '"';
            inputField = $('<input class="form-control b-input_row-input" type="text" ' + selectID + ' ' + selectName + ' />');
            arrayHtml = '<option value=""></option>';
            var dataMissingError = 'data-missing-error="' + $form.find('[name$="_states_stateCode"]').attr('data-missing-error') + '"';

            for (var stateValue in countryObj.regions) { // eslint-disable-line
                arrayHtml += '<option value="' + stateValue + '">' + countryObj.regions[stateValue] + '</option>';
            }
            selectBox = $('<select enterkeyhint="go" required data-analytics-track="billing : billing_state" class="form-control billingState custom-select b-state-select" ' + selectID + ' ' + selectName + dataMissingError + '>' + arrayHtml + '</select>');
            if (country !== 'US' && country !== 'CA') {
                $form.find('select[name$="_states_stateCode"]').replaceWith($(inputField));
                $form.find('input[name$="_states_stateCode"]').closest('.form-group').find('label').first()
                .html('State/Region');
                $form.find('input[name$="_postalCode"]').closest('.form-group').find('label').first()
                .html('Postal Code');
                $form.find('input[name$="_states_stateCode"]').closest('.form-group').addClass('b-state_text-field');
            } else {
                $form.find('input[name$="_states_stateCode"]').replaceWith($(selectBox));
                $form.find('select[name$="_states_stateCode"]').replaceWith($(selectBox));
                $form.find('select[name$="_states_stateCode"]').addClass('required');
                $form.find('select[name$="_states_stateCode"]').closest('.form-group').removeClass('b-state_text-field').addClass('b-state_select-field');

                if (stVal && stVal !== undefined && stVal !== null) {
                    $form.find('select[name$="_states_stateCode"] option[value=' + stVal + ']').prop('selected', true);
                }
            }

            if (country === 'CA') {
                $form.find('select[name$="_states_stateCode"]').closest('.form-group').find('label').first()
                .html($(this).find(':selected').data('state'));
                $form.find('input[name$="_postalCode"]').closest('.form-group').find('label').first()
                .html($(this).find(':selected').data('postalcode'));
            } else if (country === 'US') {
                $form.find('select[name$="_states_stateCode"]').closest('.form-group').find('label').first()
                .html('State');
                $form.find('input[name$="_postalCode"]').closest('.form-group').find('label').first()
                .html('Zip Code');
            }

            $('select').on('change', function () {
                if ($(this).find('option:selected').val() == null || $(this).find('option:selected').val() === '') {
                    $(this).addClass('is-invalid');
                } else {
                    $(this).removeClass('is-invalid');
                }
            });
        }
    });
}

module.exports = {
    methods: {
        updateBillingAddressSelector: updateBillingAddressSelector,
        updateBillingAddressFormValues: updateBillingAddressFormValues,
        clearBillingAddressFormValues: clearBillingAddressFormValues,
        updateBillingInformation: updateBillingInformation,
        updatePaymentInformation: updatePaymentInformation,
        updateStateOptions: updateStateOptions,
        clearBillingForms: clearBillingForms
    },

    showBillingDetails: function () {
        $('.btn-show-billing-details').on('click', function () {
            $(this).closest('[data-address-mode]').attr('data-address-mode', 'new');
        });
    },

    hideBillingDetails: function () {
        $('.btn-hide-billing-details').on('click', function () {
            $(this).closest('[data-address-mode]').attr('data-address-mode', 'shipment');
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

            if (billingAsShipping && (billingAsShipping === 'true')) {
                $('#shippingAsBilling').prop('checked', true);
            } else {
                $('#shippingAsBilling').prop('checked', false);
            }

            var attrs = selectedOption.data();
            var element;

            Object.keys(attrs).forEach(function (attr) {
                element = attr === 'countryCode' ? 'country' : attr;
                $form.find('[name$=' + element + ']').val(attrs[attr]);
            });

            $('select[name$="billing_addressFields_country"]').trigger('change');

            Object.keys(attrs).forEach(function (attr) {
                element = attr === 'countryCode' ? 'country' : attr;
                $form.find('[name$=' + element + ']').val(attrs[attr]);
            });
        });
    },

    sanitizeForm: function () {
        $('body').on('checkout:serializeBilling', function (e, data) {
            var serializedForm = cleave.serializeData(data.form);
            data.callback(serializedForm);
        });
    },

    selectSavedPaymentInstrument: function () {
        $(document).on('click', '.saved-payment-instrument', function (e) {
            e.preventDefault();
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
    },

    addNewPaymentInstrument: function () {
        $('.btn.add-payment').on('click', function (e) {
            e.preventDefault();
            $('.payment-information').data('is-new-payment', true);
            $('.credit-card-form').removeClass('checkout-hidden');
            $('.credit-card-form button').addClass('checkout-hidden');
            $(this).addClass('checkout-hidden');
            $(this).parent('.row').siblings('.stored-payments').find('.saved-payment-instrument')
            .removeClass('selected-payment');
        });
    },

    cancelNewPayment: function () {
        $('.cancel-new-payment').on('click', function (e) {
            e.preventDefault();
            $('.payment-information').data('is-new-payment', false);
            $('.user-payment-instruments').removeClass('checkout-hidden');
            $('.credit-card-form').addClass('checkout-hidden');
        });
    },

    clearBillingForm: function () {
        $('body').on('checkout:clearBillingForm', function () {
            clearBillingAddressFormValues();
        });
    },

    paymentTabs: function () {
        $('.payment-options .nav-item').on('click', function (e) {
            e.preventDefault();
            var methodID = $(this).data('method-id');
            $('.payment-information').data('payment-method-id', methodID);
        });
    },

    removePayment: function () {
        $('.remove-payment').on('click', function (e) {
            e.preventDefault();
            var url = $(this).data('url') + '?UUID=' + $(this).data('id');
            var savedlength = $(this).closest('.store-payments-container').find('.saved-payment-instrument').length;
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
    }

};

