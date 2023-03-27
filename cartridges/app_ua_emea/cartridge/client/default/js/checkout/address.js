'use strict';
var addressHelperBase = require('org/checkout/address');
var addressSuggestionHelpers = require('./qasAddressSuggesstion');
var scrollAnimate = require('org/components/scrollAnimate');

/**
 * Address Suggestion
 * @param {Object} $element - Address Object
 */
function addressSuggestion() {
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

/**
 * Populates the Billing form
 * @param {Object} $element - Address Object
 */
function addNewAddressMethod($element) {
    var $el = $element;
    if ($el.parents('#dwfrm_billing').length > 0) {
        // Handle billing address case
        $('body').trigger('checkout:clearBillingForm');
        $el.parents('#dwfrm_billing').find('.form-group').removeClass('error-field');
        var $option = $($el.parents('form').find('.addressSelector option')[0]);
        $option.attr('value', 'new');
        var $newTitle = $('#dwfrm_billing input[name=localizedNewAddressTitle]').val();
        $option.text($newTitle);
        $option.prop('selected', 'selected');
        $el.parents('[data-address-mode]').attr('data-address-mode', 'new');
        $('#shippingAsBilling').prop('checked', false);
        $('.addressSelector .billing-address-section').removeClass('default-address');
    } else {
        // Handle shipping address case
        var $newEl = $el.parents('form').find('div[value=new]');
        $newEl.prop('selected', 'selected');
        $el.closest('form').attr('data-addr-id', '');
        var newLable = $el.closest('form').find('.js-new-shipping-address');
        newLable.removeClass('hide');
        newLable.closest('.shipping-address-block').find('.b-shipping-sub-header').addClass('hide');
        var $shippingForm = $el.closest('.shipping-form');
        if ($shippingForm.find('.shipping-address-container').length > 0) {
            if ($shippingForm.find('.shipping-address-section').length > 0) {
                $shippingForm.find('.shipping-address-section').each(function () {
                    if ($(this).hasClass('default-address')) {
                        $(this).removeClass('default-address');
                        var addressID = $(this).find('.shipping-address-option').data('addr-id');
                        $shippingForm.find('.shipping-cancel-button').attr('data-addr-id', addressID);
                    }
                });
            }
        }
        $newEl.trigger('click');
    }
    var currentCountry = $('#selectedCountry').val();
    if (currentCountry !== '' || currentCountry !== undefined) {
        $('#billingCountry option[value="' + currentCountry + '"]').prop('selected', 'selected').change();
        var $billingForm = $el.parents('#dwfrm_billing');
        if ($billingForm.length > 0) {
            $billingForm.find('select[name$="_addressFields_country"]').trigger('blur');
            if ($(window).width() < 1024) {
                scrollAnimate($billingForm.find('input[name$="_addressFields_firstName"]'));
            }
        }
    }
}

module.exports = {
    methods: {
        populateAddressSummary: addressHelperBase.populateAddressSummary,
        optionValueForAddress: addressHelperBase.optionValueForAddress,
        getAddressFieldsFromUI: addressHelperBase.getAddressFieldsFromUI
    },

    showDetails: addressHelperBase.showDetails,
    addNewAddress: function () {
        $('.btn-add-new').on('click', function () {
            var $el = $(this);
            if ($el.parents('#dwfrm_billing').length > 0) {
                $('#shippingAsBilling').trigger('click');
            }
            addNewAddressMethod($el);
        });
    },

    sameAsShipping: function () {
        $('#shippingAsBilling').on('click', function () {
            var $billingFields = $(this).closest('#dwfrm_billing');
            if (!($('#shippingAsBilling').is(':checked'))) {
                var $el = $billingFields.find('input#addressBlock');
                if ($('.b-checkout_main[data-customer-type=guest]').length > 0) {
                    $billingFields.find('.billing-address-block').addClass('display-billing-fields');
                }
                $billingFields.find('.b-billing_heading_line').addClass('display-required-text');
                addNewAddressMethod($el);
                if (window.sitePreferences.qasAddressSuggestion) {
                    addressSuggestion();
                }
            } else {
                $billingFields.find('.billing-address-block').removeClass('display-billing-fields');
                $billingFields.find('.b-billing_heading_line').removeClass('display-required-text');
                $billingFields.attr('data-address-mode', 'edit');
                if ($billingFields.length > 0) {
                    $('.billing-address-block .addressSelector').find('.billing-address-option[data-addr-id=""]').trigger('click');
                }
                if (window.sitePreferences.qasAddressSuggestion) {
                    addressSuggestion();
                }
                if ($billingFields.find('input').hasClass('is-invalid')) {
                    $billingFields.find('input').removeClass('is-invalid');
                    $billingFields.find('select').removeClass('is-invalid');
                }
                // updateBillingAddressOnchecked();
            }
        });
    }
};
