/**
 * Populate the Billing Address
 * @param {string} parentSelector - the top level DOM selector for a unique address summary
 * @param {Object} address - the address data
 */
'use strict';
var addressSuggestionHelpers = require('./qasAddressSuggesstion');
var scrollAnimate = require('../components/scrollAnimate');
/**
 * Populate the Billing Address Summary View
 * @param {string} parentSelector - the top level DOM selector for a unique address summary
 * @param {Object} address - the address data
 */
function populateAddressSummary(parentSelector, address) {
    $.each(address, function (attr) {
        var val = address[attr];
        if (attr === 'city') {
            val += ',';
        }
        $('.' + attr, parentSelector).text(val || '');
    });
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
        if (shippingAddress.firstName) {
            title.push('<span>' + shippingAddress.firstName + '</span>');
        }
        if (shippingAddress.lastName) {
            title.push('<span>' + shippingAddress.lastName + '</span>');
        }
        if (shippingAddress.address1) {
            title.push('<div>' + shippingAddress.address1 + '</div>');
        }
        if (shippingAddress.address2) {
            title.push('<div>' + shippingAddress.address2 + '</div>');
        }
        if (shippingAddress.city && !isShipToCollectionEnabled) {
            if (shippingAddress.state) {
                title.push(shippingAddress.city + ',');
            } else {
                title.push(shippingAddress.city + ',');
            }
        }
        if (shippingAddress.stateCode) {
            title.push(shippingAddress.stateCode);
        }
        if (shippingAddress.postalCode) {
            title.push(shippingAddress.postalCode);
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
        'data-sameAsShipping': 'isShippingSelectedAddress'
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
        phone: $('input[name$=_phone]', form).val()
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
    if (currentCountry === 'CA' || currentCountry === 'US') {
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

/**
 * updates the billing form values from shipping form
 */
function updateBillingAddressOnchecked() { // eslint-disable-line
    var $formBilling = $('form[name=dwfrm_billing]');
    var $formShipping = $('form[name=dwfrm_shipping]');

    var firstname = $formShipping.find('input[name$=_firstName]').val();
    $formBilling.find('input[name$=_firstName]').val(firstname);
    var lastName = $formShipping.find('input[name$=_lastName]').val();
    $formBilling.find('input[name$=_lastName]').val(lastName);
    var address1 = $formShipping.find('input[name$=_address1]').val();
    $formBilling.find('input[name$=_address1]').val(address1);
    var address2 = $formShipping.find('input[name$=_address2]').val();
    $formBilling.find('input[name$=_address2]').val(address2);
    var city = $formShipping.find('input[name$=_city]').val();
    $formBilling.find('input[name$=_city]').val(city);
    var postalCode = $formShipping.find('input[name$=_postalCode]').val();
    $formBilling.find('input[name$=_postalCode]').val(postalCode);
    var stateCode = $formShipping.find('select[name*="_states_state"]').val();
    $formBilling.find('select[name*="_states_state"]').val(stateCode);
    var country = $formShipping.find('select[name$=_country]').val();
    $formBilling.find('select[name$=_country]').val(country);
    var phone = $formShipping.find('input[name$=_phone]').val();
    $formBilling.find('input[name$=_phone]').val(phone);
    var email = $formShipping.find('input[name$=_email]').val();
    $formBilling.find('input[name$=_email]').val(email);
    $formBilling.find().val();
    if ($formBilling.find('input').hasClass('is-invalid')) {
        $formBilling.find('input').removeClass('is-invalid');
        $formBilling.find('select').removeClass('is-invalid');
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
    if (window.sitePreferences.qasCurrentLocation) {
        options.elements.location = window.sitePreferences.qasCurrentLocation;
    }
    addressSuggestionHelpers.addressSuggestion(options);
    $('#qasBilling').val(true);
    return;
}
module.exports = {
    methods: {
        populateAddressSummary: populateAddressSummary,
        optionValueForAddress: optionValueForAddress,
        getAddressFieldsFromUI: getAddressFieldsFromUI
    },

    showDetails: function () {
        $('body').on('click', '.btn-show-details', function () {
            var form = $(this).closest('form');
            var addressID;
            if ($(this).parents('#dwfrm_billing').length > 0) {
                $(this).closest('.billing-address-section').find('.billing-address-option').trigger('click');
                addressID = $(this).closest('.billing-address-section').find('.billing-address-option').attr('data-addr-ID');
                form.attr('data-addr-ID', addressID);
                $('#shippingAsBilling').prop('checked', false);
                form.attr('data-address-mode', 'details');
                $('select[name $= "addressFields_country"].billingCountry').trigger('change');
                var attrs = $(this).closest('.billing-address-section').find('.billing-address-option').data();
                var element;

                Object.keys(attrs).forEach(function (attr) {
                    element = attr === 'countryCode' ? 'country' : attr;
                    form.find('[name$=' + element + ']').val(attrs[attr]);
                });
            } else {
                $(this).closest('.shipping-address-section').find('.shipping-address-option').trigger('click');
                addressID = $(this).closest('.shipping-address-section').find('.shipping-address-option').attr('data-addr-ID');
                form.attr('data-addr-ID', addressID);
                setTimeout(function () { form.attr('data-address-mode', 'details'); }, 1000);
                var newLable = form.find('.js-new-shipping-address');
                newLable.addClass('hide');
                newLable.closest('.shipping-address-block').find('.b-shipping-sub-header').addClass('hide');
            }
            form.find('.multi-ship-address-actions').removeClass('d-none');
            form.find('.multi-ship-action-buttons .col-12.btn-save-multi-ship').addClass('d-none');
        });
    },

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
