'use strict';

var billingHelpers = require('org/checkout/billing');
var cleave = require('../components/cleave');
var addressHelpers = require('org/checkout/address');
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
        if (customer.addresses && customer.addresses.length > 0) {
            $('.make-ship-as-bill').removeClass('hide');
            // to remove option values getting updated as a duplicate address
            // $billingAddressSelector.append(addressHelpers.methods.optionValueForAddress(order.resources.accountAddresses, false, order));
            customer.addresses.forEach(function (address) {
                if ((order.isInternationalBillingAddressEnabled || customer.countryCode === address.countryCode.value) && (!InCustAddressbookAvailable || (InCustAddressbookAvailable && custAddressIDSelectedinShipping !== address.ID)) && !isShipToCollectionEnabled) {
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
 * Updates the billing information in checkout, based on the supplied order model
 * @param {Object} order - checkout model to use as basis of new truth
 * @param {Object} customer - customer model to use as basis of new truth
 * @param {Object} [options] - options
 */
function updateBillingInformation(order, customer) {
    updateBillingAddressSelector(order, customer);
    billingHelpers.methods.updateBillingAddressFormValues(order);
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

billingHelpers.methods.updateBillingInformation = updateBillingInformation;
billingHelpers.methods.updateBillingAddressSelector = updateBillingAddressSelector;
billingHelpers.methods.updatePaymentInformation = updatePaymentInformation;
billingHelpers.sanitizeForm = sanitizeForm;
module.exports = billingHelpers;
