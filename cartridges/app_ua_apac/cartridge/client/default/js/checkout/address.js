'use strict';

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
            businessName: document.querySelector("input[name='dwfrm_billing_addressFields_businessName']"),
            locality: document.querySelector("input[name='dwfrm_billing_addressFields_city']"),
            province: document.querySelector('#billingState'),
            postalCode: document.querySelector("input[name='dwfrm_billing_addressFields_postalCode'], select[name^='dwfrm_billing_addressFields_postalCode']"),
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

/**
 * While adding a new field clear existing drop down values
 */
function clearValuesOnAddMode() {
    var selectOption = $('.selectLabel').val();
    if (!$('.default-address:visible').length) {
        $('select:visible').each(function () {
            var $this = $(this);
            if (!$this.hasClass('b-country-select')) {
                if ($this.hasClass('b-state-select')) {
                    if ($.trim($('.dropdownState:visible').find('option:first').text()) !== selectOption) {
                        $this.prepend($('<option value></option>').html(selectOption));
                    }
                } else if (!$this.hasClass('b-mobile1-select')) {
                    $this.empty();
                    $this.append($('<option value></option>').html(selectOption));
                }
            }
        });
    }
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
    clearValuesOnAddMode();
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
        city: $('input[name$=_city],select[name$=_city]', form).val(),
        district: $('input[name$=_district],select[name$=_district]', form).val(),
        postalCode: $('input[name$=_postalCode],select[name$=_postalCode]', form).val(),
        suburb: $('input[name$=_suburb]', form).val(),
        businessName: $('input[name$=_businessName]', form).val(),
        stateCode: $('select[name$=_stateCode],input[name$=_stateCode]', form).val(),
        countryCode: $('select[name$=_country]', form).val(),
        phone: $('input[name$=_phone]', form).val()
    };
    return address;
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
        if (shippingAddress.businessName) {
            title.push('<span>' + shippingAddress.businessName + '</span>');
        }
        if (shippingAddress.address1) {
            title.push('<div>' + shippingAddress.address1 + '</div>');
        }
        if (shippingAddress.address2) {
            title.push('<div>' + shippingAddress.address2 + '</div>');
        }
        if (shippingAddress.suburb) {
            title.push('<div>' + shippingAddress.suburb + '</div>');
        }
        if (shippingAddress.district) {
            title.push('<span>' + shippingAddress.district + ', </span>');
        }
        if (shippingAddress.city && !isShipToCollectionEnabled && !shippingAddress.hideCityAndPostalCode) {
            if (shippingAddress.state) {
                title.push(shippingAddress.cityLabel ? shippingAddress.cityLabel + ',' : shippingAddress.city + ',');
            } else {
                title.push(shippingAddress.cityLabel ? shippingAddress.cityLabel + ',' : shippingAddress.city + ',');
            }
        }
        if (shippingAddress.stateCode) {
            title.push(shippingAddress.stateCodeLabel ? shippingAddress.stateCodeLabel : shippingAddress.stateCode);
        }
        if (shippingAddress.postalCode && !shippingAddress.hideCityAndPostalCode) {
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
        'data-businessName': 'businessName',
        'data-address1': 'address1',
        'data-address2': 'address2',
        'data-suburb': 'suburb',
        'data-district': 'district',
        'data-city': 'city',
        'data-state-code': 'stateCode',
        'data-postal-code': 'postalCode',
        'data-country-code': 'countryCode',
        'data-phone': 'phone',
        'data-sameAsShipping': 'isShippingSelectedAddress',
        'data-state': 'stateCode'
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
 * Populate the Billing Address Summary View
 * @param {string} parentSelector - the top level DOM selector for a unique address summary
 * @param {Object} address - the address data
 */
function populateAddressSummary(parentSelector, address) {
    $.each(address, function (attr) {
        var val = address[attr];
        if ((attr === 'city' || attr === 'suburb' || attr === 'district') && val) {
            val += ',';
        }
        if (attr) {
            $('.' + attr, parentSelector).text(val || '');
        }
    });
    if (address && address.cityLabel !== undefined && address.cityLabel !== null) {
        $('.city', parentSelector).text('');
        $('.city', parentSelector).text(address.cityLabel + ',' || '');
    }
    if (address && address.stateCodeLabel !== undefined && address.stateCodeLabel !== null) {
        $('.stateCode', parentSelector).text(address.stateCodeLabel || '');
    }
    if (address && address.postalCode !== undefined && address.hideCityAndPostalCode !== undefined) {
        $('.postalCode', parentSelector).text('');
        $('.city', parentSelector).text('');
    }
    if (window.sitePreferences && window.sitePreferences.isKRCustomCheckoutEnabled && window.sitePreferences.isShowOnlyLastNameAsNameFieldEnabled) {
        $('.firstName', parentSelector).text('');
    }
}

/**
 * Populate the Billing Fields for same as shipping checkbox
 * @param {boolean} clear - to clear fields
 * @param {boolean} readonly - to make fields read only
 */
function populateBillingfields(clear, readonly) {
    if ($('#billingPhone').length === 0 && $('#billingPhone1').length > 0) {
        $('#billingPhone1').val(clear ? '' : $('.b-shipping-summary_shipping .address-summary .phone1').text().trim()).prop('disabled', readonly);
        $('#billingPhone1').parent().toggleClass('readonly');
        $('#billingPhone2').val(clear ? '' : $('.b-shipping-summary_shipping .address-summary .phone2').text().trim()).prop('readonly', readonly);
        $('#billingPhone2').parent().toggleClass('readonly');
        $('#billingPhone3').val(clear ? '' : $('.b-shipping-summary_shipping .address-summary .phone3').text().trim()).prop('readonly', readonly);
        $('#billingPhone3').parent().toggleClass('readonly');
    } else {
        $('#billingPhone').val(clear ? '' : $('#phone').val()).prop('readonly', readonly);
        $('#billingPhone').parent().toggleClass('readonly');
    }

    if ($('#billingFirstName').length > 0) {
        $('#billingFirstName').val(clear ? '' : $('#shippingFirstNamedefault').val()).prop('readonly', readonly);
        $('#billingFirstName').parent().toggleClass('readonly');
    }

    $('#billingLastName').val(clear ? '' : $('#shippingLastNamedefault').val()).prop('readonly', readonly);
    $('#billingLastName').parent().toggleClass('readonly');
}

module.exports = {
    methods: {
        populateAddressSummary: populateAddressSummary,
        optionValueForAddress: optionValueForAddress,
        getAddressFieldsFromUI: getAddressFieldsFromUI,
        clearValuesOnAddMode: clearValuesOnAddMode
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
                    if (form.find('[name$=' + element + ']').is('select')) {
                        form.find('[name$=' + element + ']').val(attrs[attr]).trigger('change');
                    } else {
                        form.find('[name$=' + element + ']').val(attrs[attr]);
                    }
                });
            } else {
                $(this).closest('.shipping-address-section').find('.shipping-address-option').trigger('click');
                addressID = $(this).closest('.shipping-address-section').find('.shipping-address-option').attr('data-addr-ID');
                form.attr('data-addr-ID', addressID);
                setTimeout(function () {
                    form.attr('data-address-mode', 'details');
                    if (window.sitePreferences && window.sitePreferences.isKRCustomCheckoutEnabled) {
                        var phone1 = form.find('#phone1');
                        var phone1Val = $('.default-address .shipping-address-option').attr('data-phone1');

                        if (phone1.find('option[value="' + phone1Val + '"]').length > 0) {
                            phone1.val(phone1Val).change();
                        }
                    }
                }, 1000);
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
            var isKRCustomCheckoutEnabled = window.sitePreferences.isKRCustomCheckoutEnabled;
            if (!($('#shippingAsBilling').is(':checked'))) {
                if (!isKRCustomCheckoutEnabled) {
                    var $el = $billingFields.find('input#addressBlock');
                    if ($('.b-checkout_main[data-customer-type=guest]').length > 0) {
                        $billingFields.find('.billing-address-block').addClass('display-billing-fields');
                    }
                    $billingFields.find('.b-billing_heading_line').addClass('display-required-text');
                    addNewAddressMethod($el);
                    if (window.sitePreferences.qasAddressSuggestion && !(window.sitePreferences.qasRestrictedCountries.indexOf($('#selectedCountry').val()) > -1)) {
                        addressSuggestion();
                    }
                } else {
                    populateBillingfields(true, false);
                }
            } else {
                // eslint-disable-next-line no-lonely-if
                if (!isKRCustomCheckoutEnabled) {
                    $billingFields.find('.billing-address-block').removeClass('display-billing-fields');
                    $billingFields.find('.b-billing_heading_line').removeClass('display-required-text');
                    $billingFields.attr('data-address-mode', 'edit');
                    if ($billingFields.length > 0) {
                        $('.billing-address-block .addressSelector').find('.billing-address-option[data-addr-id=""]').trigger('click');
                    }
                    if (window.sitePreferences.qasAddressSuggestion && !(window.sitePreferences.qasRestrictedCountries.indexOf($('#selectedCountry').val()) > -1)) {
                        addressSuggestion();
                    }
                    if ($billingFields.find('input').hasClass('is-invalid')) {
                        $billingFields.find('input').removeClass('is-invalid');
                        $billingFields.find('select').removeClass('is-invalid');
                    }
                } else {
                    populateBillingfields(false, true);
                }
                // updateBillingAddressOnchecked();
            }
        });
    },

    smsOptIn: function () {
        $('body').on('click', '#checkout-main #addsmsto-list-ci', function () {
            var checked = $(this).is(':checked');

            if ($('#contact-phoneNumber').length === 0) {
                $('#contactPhone1, #contactPhone2, #contactPhone3').attr('required', checked);
                $('#contactPhone1').parent('.b-input_row').find('label').toggleClass('required', checked);
            } else {
                $('#contact-phoneNumber').attr('required', checked)
                .parent('.b-input_row').find('label')
                .toggleClass('required', checked);
            }
        });
    }
};
