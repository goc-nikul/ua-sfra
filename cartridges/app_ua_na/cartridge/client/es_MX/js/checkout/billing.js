'use strict';

var billingHelpersCore = require('org/checkout/billing');
var cleave = require('../components/cleave');
var addressHelpersNA = require('./address');
var hasOnlyEGiftCards = false;
var isRegistered;

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
    var onlyBopisitemExist = $('#checkout-main').data('onlybopisitemexist');

    if ($billingAddressSelector.length && !onlyBopisitemExist) {
        $billingAddressSelector.empty();
        if ($billingAddressSelector.find('.billing-address-section').not('.new').length === 1) {
            $billingAddressSelector.append(addressHelpersNA.methods.optionValueForAddress(null, false, order, {
                type: 'billing'
            }));
            /* to remove option values getting updated as a duplicate address
            $billingAddressSelector.append(addressHelpersNA.methods.optionValueForAddress(order.resources.shippingAddresses, false, order, {
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
                        addressHelpersNA.methods.optionValueForAddress(shipment, isSelected, order, {
                            type: 'billing'
                        })
                    );
                }
            });
        }
        if (customer.addresses && customer.addresses.length > 0) {
            $('.make-ship-as-bill').removeClass('hide');
            // to remove option values getting updated as a duplicate address
            // $billingAddressSelector.append(addressHelpersNA.methods.optionValueForAddress(order.resources.accountAddresses, false, order));
            customer.addresses.forEach(function (address) {
                if (!InCustAddressbookAvailable || (InCustAddressbookAvailable && custAddressIDSelectedinShipping !== address.ID)) {
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
                        addressHelpersNA.methods.optionValueForAddress({
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

    if (hasSelectedAddress || ((!order.billing.matchingAddressId || window.basketHasOnlyBOPISProducts) && order.billing.billingAddress.address)) {
        $form.attr('data-address-mode', 'edit');
    } else {
        $form.attr('data-address-mode', 'new');
    }

    if (onlyBopisitemExist) {
        $form.find('.billing-address-block').addClass('display-billing-fields');
        $form.find('.make-ship-as-bill').addClass('hide');
        window.basketHasOnlyBOPISProducts = false;
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
 * updates the country and states list
 */
function updateStateOptions() {
    $('body').on('change', 'select[name $= "addressFields_country"]', function () {
        // No need to execute this function for MX
    });
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
    $form.find('input[name$=_exteriorNumber]').val(billingAddress.exteriorNumber);
    $form.find('input[name$=_interiorNumber]').val(billingAddress.interiorNumber);
    $form.find('input[name$=_additionalInformation]').val(billingAddress.additionalInformation);
    $form.find('input[name$=_colony]').val(billingAddress.colony);
    $form.find('input[name$=_dependentLocality]').val(billingAddress.dependentLocality);
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
 * This method returns the serialized form data
 */
function sanitizeForm() {
    $('body').on('checkout:serializeBilling', function (e, data) {
        var serializedForm = cleave.serializeData(data.form);
        data.callback(serializedForm);
    });
}

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

    $paymentSummary.empty().append(htmlToAppend);

    var fiscalInvoice = $('#taxBillingInfo').is(':checked');
    var $rfcWrapper = $('#rfc-cfdi-details');
    $('.rfc-details, .cfdi-details, #rfc-cfdi-details').addClass('hide');
    if (fiscalInvoice) {
        $('#rfc-cfdi-details, .rfc-details').removeClass('hide');
        $rfcWrapper.find('.rfc-value').text(order.billing.billingAddress.address.rfc);
        $rfcWrapper.find('.razonsocial-value').text(order.billing.billingAddress.address.razonsocial);
        $('#rfc-cfdi-details, .cfdi-details').removeClass('hide');
        $rfcWrapper.find('.usoCFDI-value').text($('select[name$=_usoCFDI] option:selected').text());
        $rfcWrapper.find('.regimenFiscal-value').text($('select[name$=_regimenFiscal] option:selected').text());
        $rfcWrapper.find('.codigoPostal-value').text($('input[name$=_codigoPostal]').val());
    }
}

/**
 * This method clears billing form
 */
function clearBillingForm() {
    $('body').on('checkout:clearBillingForm', function () {
        clearBillingAddressFormValues();
    });
}


billingHelpersCore.methods.updateStateOptions = updateStateOptions;
billingHelpersCore.methods.updateBillingAddressFormValues = updateBillingAddressFormValues;
billingHelpersCore.methods.clearBillingAddressFormValues = clearBillingAddressFormValues;
billingHelpersCore.methods.updateBillingAddressSelector = updateBillingAddressSelector;
billingHelpersCore.methods.updatePaymentInformation = updatePaymentInformation;
billingHelpersCore.sanitizeForm = sanitizeForm;
billingHelpersCore.clearBillingForm = clearBillingForm;
module.exports = billingHelpersCore;
