/**
 * Populate the Billing Address
 * @param {string} parentSelector - the top level DOM selector for a unique address summary
 * @param {Object} address - the address data
 */
'use strict';
var addressSuggestionHelpers = require('org/checkout/qasAddressSuggesstion');
var addressHelpersCore = require('org/checkout/address');
var scrollAnimate = require('org/components/scrollAnimate');
var isLegendSoftEnabled = $('div[data-is-legendsoft]').data('is-legendsoft');
var legendSoft;

if (isLegendSoftEnabled) {
    legendSoft = require('legendsoft/checkout/suggestions');
}

/**
 * returns a formed <option /> element
 * @param {Object} shipping - the shipping object (shipment model)
 * @param {boolean} selected - current shipping is selected (for PLI)
 * @param {order} order - the Order model
 * @param {Object} [options] - options
 * @returns {Object} - the jQuery / DOMElement
 */
function optionValueForAddress(shipping, selected, order, options) {
    var isShipToCollectionEnabled = $('#ship-to-collectionPoint').is(':checked');
    var safeOptions = options || {};
    var isBilling = safeOptions.type && safeOptions.type === 'billing';
    var className = safeOptions.className || '';
    var isSelected = selected;
    var isNew = !shipping;
    if (typeof shipping === 'string') {
        return $('<div class="billing-address-section ' + className + '">' + shipping + '</div>');
    }
    var safeShipping = shipping || {};
    var shippingAddress = safeShipping.shippingAddress || {};

    if (shipping && shipping.UUID && !(shipping.UUID.indexOf('ab_') > -1)) {
        shippingAddress.isShippingSelectedAddress = true;
    }
    if (isBilling && isNew && !order.billing.matchingAddressId) {
        shippingAddress = order.billing.billingAddress.address || {};
        isNew = false;
        isSelected = true;
        safeShipping.UUID = 'manual-entry';
    }

    var uuid = safeShipping.UUID ? safeShipping.UUID : 'new';
    var optionEl = $('<div class="billing-address-option ' + className + ' ' + uuid + '"/>');

    if (isNew) {
        optionEl = $('<div class="billing-address-section ' + className + ' ' + uuid + '"/>');
    }

    optionEl.val(uuid);

    var title;

    if (isNew) {
        title = order.resources.addNewAddress;
    } else {
        title = [];
        var localizedCountryLabel = $('input[name=localizedCountryLabel]').val();
        if (shippingAddress.firstName) {
            title.push('<span>' + shippingAddress.firstName + '</span>');
        }
        if (shippingAddress.lastName) {
            title.push('<span>' + shippingAddress.lastName + '</span>');
        }
        if (shippingAddress.address1) {
            title.push('<div>' + shippingAddress.address1);
        }
        if (shippingAddress.address2) {
            title.push('<div>' + shippingAddress.address2 + '</div>');
        }
        if (shippingAddress.exteriorNumber) {
            title.push('<span>' + shippingAddress.exteriorNumber + '</span>,');
        }
        if (shippingAddress.interiorNumber) {
            title.push('<span>' + shippingAddress.interiorNumber + '</span>,');
        }
        title.push('</div>');
        if (shippingAddress.additionalInformation) {
            title.push('<div>' + shippingAddress.additionalInformation + '</div>');
        }
        if (shippingAddress.colony) {
            title.push('<span>' + shippingAddress.colony + '</span>');
        }
        if (shippingAddress.dependentLocality) {
            title.push('<span>' + shippingAddress.dependentLocality + '</span>');
        }
        if (shippingAddress.city && !isShipToCollectionEnabled) {
            if (shippingAddress.state) {
                title.push('<div>' + shippingAddress.city + ',');
            } else {
                title.push('<div>' + shippingAddress.city + ',');
            }
        }
        if (shippingAddress.stateCode) {
            title.push('<span>' + shippingAddress.stateCode + '</span>,');
        }
        if (shippingAddress.postalCode) {
            title.push('<span>' + shippingAddress.postalCode + '</span>,</div>');
        }
        if (localizedCountryLabel !== null && localizedCountryLabel !== '') {
            title.push('<div>' + localizedCountryLabel + '</div>');
        }
        if (!isBilling && safeShipping.selectedShippingMethod) {
            title.push(safeShipping.selectedShippingMethod.displayName);
        }
        if (title.length > 2) {
            title = title.join(' ');
        } else {
            title = order.resources.newAddress;
        }
    }
    optionEl.html(title);

    var keyMap = {
        'data-addr-id': 'ID',
        'data-first-name': 'firstName',
        'data-last-name': 'lastName',
        'data-address1': 'address1',
        'data-address2': 'address2',
        'data-city': 'city',
        'data-state-code': 'stateCode',
        'data-postal-code': 'postalCode',
        'data-country-code': 'countryCode',
        'data-phone': 'phone',
        'data-sameAsShipping': 'isShippingSelectedAddress',
        'data-exterior-number': 'exteriorNumber',
        'data-interior-number': 'interiorNumber',
        'data-additional-information': 'additionalInformation',
        'data-colony': 'colony',
        'data-dependent-locality': 'dependentLocality',
        'data-rfc': 'rfc',
        'data-razonsocial': 'razonsocial'
    };

    $.each(keyMap, function (key) {
        var mappedKey = keyMap[key];
        var mappedValue = shippingAddress[mappedKey];
        // In case of country code
        if (mappedValue && typeof mappedValue === 'object') {
            mappedValue = mappedValue.value;
        }

        optionEl.attr(key, mappedValue || '');
    });

    var giftObj = {
        'data-is-gift': 'isGift',
        'data-gift-message': 'giftMessage'
    };

    $.each(giftObj, function (key) {
        var mappedKey = giftObj[key];
        var mappedValue = safeShipping[mappedKey];
        optionEl.attr(key, mappedValue || '');
    });

    if (isSelected) {
        optionEl.attr('selected', true);
    }

    return optionEl;
}

/**
 * returns address properties from a UI form
 * @param {Form} form - the Form element
 * @returns {Object} - a JSON object with all values
 */
function getAddressFieldsFromUI(form) {
    var address = {
        firstName: $('input[name$=_firstName]', form).val(),
        lastName: $('input[name$=_lastName]', form).val(),
        address1: $('input[name$=_address1]', form).val(),
        address2: $('input[name$=_address2]', form).val(),
        city: $('input[name$=_city]', form).val(),
        postalCode: $('input[name$=_postalCode]', form).val(),
        stateCode: $('select[name$=_stateCode],input[name$=_stateCode]', form).val(),
        countryCode: $('select[name$=_country]', form).val(),
        phone: $('input[name$=_phone]', form).val(),
        exteriorNumber: $('input[name$=_exteriorNumber]', form).val(),
        interiorNumber: $('input[name$=_interiorNumber]', form).val(),
        additionalInformation: $('input[name$=_additionalInformation]', form).val(),
        colony: $('input[name$=_colony],select[name$=_colony]', form).val(),
        dependentLocality: $('input[name$=_dependentLocality]', form).val()
    };
    return address;
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
        let shippingForm = $el.parents('#dwfrm_shipping');
        if (shippingForm.length > 0) {
            $('input[type=text][name*=shippingAddress_addressFields], select[name*=shippingAddress_addressFields]', shippingForm).val('');
        }
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

    $('#billingCountry option[value="' + currentCountry + '"]').prop('selected', 'selected').change();
    var $billingForm = $el.parents('#dwfrm_billing');
    if ($billingForm.length > 0) {
        $billingForm.find('select[name$="_addressFields_country"]').trigger('blur');
        if ($(window).width() < 1024) {
            scrollAnimate($billingForm.find('input[name$="_addressFields_firstName"]'));
        }
    }
}

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

addressHelpersCore.addNewAddress = function () {
    $('.btn-add-new').on('click', function () {
        var $el = $(this);
        if ($el.parents('#dwfrm_billing').length > 0) {
            $('#shippingAsBilling').trigger('click');
        }
        addNewAddressMethod($el);
    });
};

addressHelpersCore.sameAsShipping = function () {
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
            legendSoft.updateFieldsBackToNormal();
            $('.billing-address-section.default-address').removeClass('default-address');
            $('.billing-address-option[data-sameAsShipping=true]').closest('.billing-address-section').addClass('default-address');
            $('.billing-address-option[data-sameAsShipping=true]').trigger('click');
            $billingFields.find('.billing-address-block').removeClass('display-billing-fields');
            $billingFields.find('.b-billing_heading_line').removeClass('display-required-text');
            $billingFields.attr('data-address-mode', 'edit');
            if ($billingFields.length > 0) {
                $('.billing-address-block .addressSelector').find('.billing-address-option[data-sameasshipping="true"]').trigger('click');
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
};

/**
 * Populate the Billing Address Summary View
 * @param {string} parentSelector - the top level DOM selector for a unique address summary
 * @param {Object} address - the address data
 */
function populateAddressSummary(parentSelector, address) {
    $.each(address, function (attr) {
        var val = address[attr];
        if ((attr === 'city' || attr === 'exteriorNumber' || attr === 'interiorNumber' || attr === 'stateCode' || attr === 'postalCode') && val) {
            val += ',';
        }
        $('.' + attr, parentSelector).text(val || '');
    });
}
addressHelpersCore.methods.populateAddressSummary = populateAddressSummary;
addressHelpersCore.methods.optionValueForAddress = optionValueForAddress;
addressHelpersCore.methods.getAddressFieldsFromUI = getAddressFieldsFromUI;
module.exports = addressHelpersCore;
