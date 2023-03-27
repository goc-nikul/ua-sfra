'use strict';

var base = require('int_aurus_custom/checkout/apbilling');
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
                if (order.shipping[0].matchingAddressId === address.ID) {
                    InCustAddressbookAvailable = true;
                    custAddressIDSelectedinShipping = address.ID;
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
                if (((customer.countryCode === 'CA' && address.countryCode.value === 'CA') || customer.countryCode !== 'CA') &&
                    (!InCustAddressbookAvailable || (InCustAddressbookAvailable && custAddressIDSelectedinShipping !== address.ID))) {
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
    $('input[name$=_exteriorNumber]').val(billing.billingAddress.exteriorNumber);
    $('input[name$=_interiorNumber]').val(billing.billingAddress.interiorNumber);
    $('input[name$=_additionalInformation]').val(billing.billingAddress.additionalInformation);
    $('input[name$=_colony]').val(billing.billingAddress.colony);
    $('input[name$=_dependentLocality]').val(billing.billingAddress.dependentLocality);

    if (billing.payment && billing.payment.selectedPaymentInstruments
        && billing.payment.selectedPaymentInstruments.length > 0) {
        var instrument = billing.payment.selectedPaymentInstruments[0];
        $('select[name$=expirationMonth]', form).val(instrument.expirationMonth);
        $('select[name$=expirationYear]', form).val(instrument.expirationYear);
        // Force security code and card number clear
        $('input[name$=securityCode]', form).val('');
    }
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

base.clearBillingForm = function () {
    $('body').on('checkout:clearBillingForm', function () {
        clearBillingAddressFormValues();
    });
};

base.paymentTabs = function () {
    $('.payment-options .nav-item').on('click', function (e) {
        e.preventDefault();
        var methodID = $(this).data('method-id');

        $(this).closest('.payment-information').attr('data-payment-method-id', methodID);

        if (methodID === 'PayPal' && $('.js-payment-paypal-paid').hasClass('hide')) {
            $('.submit-payment').addClass('hide');
        } else {
            $('.submit-payment').removeClass('hide');
        }
    });
};

base.methods.updateStateOptions = updateStateOptions;
base.methods.updateBillingAddressFormValues = updateBillingAddressFormValues;
base.methods.clearBillingAddressFormValues = clearBillingAddressFormValues;
base.methods.updateBillingAddressSelector = updateBillingAddressSelector;
module.exports = base;
