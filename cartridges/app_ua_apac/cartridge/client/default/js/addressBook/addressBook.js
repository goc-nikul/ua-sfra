/* eslint-disable no-use-before-define */
'use strict';
var addressBookBase = require('org/addressBook/addressBook');

/**
 * Create an scroll position to display the address container
 */
function scrollPosition() {
    var headerHeight = $('.js-header').height();
    var addressContainer = $('.address-form-container');
    if ($('.address-form-container').length > 0) {
        $('html, body').animate({
            scrollTop: addressContainer.offset().top - headerHeight
        }, 500);
    }
}

module.exports = {
    addressBookBase: addressBookBase,
    removeAddress: addressBookBase.removeAddress,
    removeAddressConfirmation: addressBookBase.removeAddressConfirmation,
    cancelAddress: addressBookBase.cancelAddress,
    showRemoveAddressModal: addressBookBase.showRemoveAddressModal,
    viewMoreLess: addressBookBase.viewMoreLess,
    resizeFunction: addressBookBase.resizeFunction,
    billingDefaultCheckBox: addressBookBase.billingDefaultCheckBox,

    addNewAddress: function () {
        $('body').on('click', '.address-right-container .btn-add-new', function () {
            var $form = $('form.address-form');
            if ($('.address-right-container .address-form-container').hasClass('hide')) {
                $('.address-right-container .address-form-container').removeClass('hide');
            }

            $('.address-right-container .btn-add-new').addClass('hide');
            $('form.address-form').attr('data-action', 'new');
            $('form.address-form').attr('data-addressID', '');
            $('.address-right-container .address-form-container .add-address').removeClass('hide');
            $('.address-right-container .address-form-container .edit-address').addClass('hide');
            $('.address-right-container .js-address-form-container').insertAfter($(this).closest('.js-address-form-content'));
            $form.find('.form-control.is-invalid').removeClass('is-invalid');
            $form.find('.form-group.error-field').removeClass('error-field');
            $form.find('.invalid-feedback').empty();

            $form.find('[name$="_country"]').val('');
            $form.find('#setAsDefault').prop('checked', false);
            $form.find('#setAsDefaultBilling').prop('checked', false);

            if ($('.js-address_book-section').find('.js-address_book-option').length > 0) {
                var attrs = $('.js-address_book-section').find('.js-address_book-option').data();
                var element;
                Object.keys(attrs).forEach(function (attr) {
                    element = attr === 'countryCode' ? 'country' : attr;
                    $form.find('[name$=' + element + ']').val('');
                });
            } else {
                $('.b-account_address-container input').val('');
                $('.b-account_address-container select').val('');
            }

            // attach DropDown Lists Events
            attachDropDownListsEvents($form);

            var currentCountry = $('#selectedCountry').val();
            if (currentCountry !== undefined && currentCountry !== '' && currentCountry !== null) {
                $('#country option[value="' + currentCountry + '"]').prop('selected', 'selected').change();
            }
            scrollPosition();
        });
    },
    editAddress: function () {
        $('body').on('click', '.address-right-container .edit-address', function () {
            var selectedOption = $(this);
            // attach DropDown Lists Events
            var $form = $('form.address-form');
            $('form.address-form').attr('data-action', 'edit');
            var addressID = selectedOption.closest('.js-address_book-section').find('.js-address_book-option').attr('data-addressid');
            $('form.address-form').attr('data-addressid', addressID);

            if ($('.address-right-container .address-form-container').hasClass('hide')) {
                $('.address-right-container .address-form-container').removeClass('hide');
                // $('.address-right-container .btn-add-new').addClass('hide');
            }
            if ($(this).attr('data-default')) {
                $('input#setAsDefault').prop('checked', true);
            } else {
                $('input#setAsDefault').prop('checked', false);
            }
            if ($(this).attr('data-default-billing')) {
                $('input#setAsDefaultBilling').prop('checked', true);
            } else {
                $('input#setAsDefaultBilling').prop('checked', false);
            }

            $('.address-right-container .address-form-container .add-address').addClass('hide');
            $('.address-right-container .address-form-container .edit-address').removeClass('hide');
            $('.address-right-container .js-address-form-container').insertAfter(selectedOption.closest('.js-address_book-section'));

            $form.find('.form-control.is-invalid').removeClass('is-invalid');
            $form.find('.form-group.error-field').removeClass('error-field');
            $form.find('.invalid-feedback').empty();
            var attrs = selectedOption.closest('.js-address_book-section').find('.js-address_book-option').data();
            attachDropDownListsEvents(attrs);
            var element;

            Object.keys(attrs).forEach(function (attr) {
                element = attr === 'countryCode' ? 'country' : attr;
                if ($form.find('[name$=' + element + ']').is('select')) {
                    $form.find('[name$=' + element + ']').val(attrs[attr]).trigger('change');
                } else {
                    $form.find('[name$=' + element + ']').val(attrs[attr]);
                }
            });

            attachDropDowncity(attrs);
            $('select[name$="_country"]').trigger('change');
            scrollPosition();

            Object.keys(attrs).forEach(function (attr) {
                element = attr === 'countryCode' ? 'country' : attr;
                if ($form.find('[name$=' + element + ']').is('select')) {
                    $form.find('[name$=' + element + ']').val(attrs[attr]).trigger('change');
                } else {
                    $form.find('[name$=' + element + ']').val(attrs[attr]);
                }
            });
        });
    },
    loadAddressFeildsDefinition: function () {
        var url = $('form.address-form').data('address-definition-url');
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            async: true,
            success: function (data) {
                if (!data.error) {
                    window.countryData = data.countryData;
                }
            }
        });
    }
};

var selectOption = $('.selectLabel').val();

/**
 * attach DropDown ListsEvents
 * @param {Object} attrs which has form details
 */
function attachDropDownListsEvents(attrs) {
    $('#state').on('change', function () {
        var form = $(this).closest('form');
        var stateField = form.find('#state');
        var state = stateField.val();
        var country = $('#selectedCountry').val();
        var countriesDefinitions = window.countryData;
        var dependencyOnState = $('#state').data('dependencyonstate');
        if (Object.keys(countriesDefinitions).length > 0 && state && country && dependencyOnState !== null) {
            if (dependencyOnState === 'postalCode') {
                var PostalCodeField = form.find('#zipCode');
                filterPostalCodeDropDown(countriesDefinitions, state, dependencyOnState, null, true, PostalCodeField, attrs.postalCode);
            } else if (dependencyOnState === 'city') {
                var cityField = form.find('#city');
                filterCityDropDown(countriesDefinitions, state, cityField, attrs.postalCode);
            }
        }

        if (state === '') {
            $('select:visible').each(function () {
                var $this = $(this);
                if (!$this.hasClass('b-country-select') && !$this.hasClass('b-state-select')) {
                    $this.empty();
                    $this.append($('<option value=""></option>').html(selectOption));
                }
            });
        }
    });
    attachDropDowncity(attrs);
    if ($(attrs).hasClass('address-form')) {
        $('select:visible').each(function () {
            var $this = $(this);
            if (!$this.hasClass('b-country-select') && !$this.hasClass('b-state-select')) {
                $this.empty();
                $this.append($('<option value=""></option>').html(selectOption));
            }
        });
    }
}
/**
 *attach DropDown ListsEvents
 * @param {Object} attrs which has form details
 */
function attachDropDowncity(attrs) {
    $('#city').on('change', function () {
        var $form = $(this).closest('form');
        var stateField = $form.find('#state');
        var state = stateField.val();
        var cityField = $form.find('#city');
        var city = cityField.val();
        var country = $('#selectedCountry').val();
        var countriesDefinitions = window.countryData;
        var dependencyOncity = $('#city').data('dependencyoncity');
        if (countriesDefinitions && city && state && country && dependencyOncity !== null) {
            if (dependencyOncity !== null && dependencyOncity === 'district') {
                var districtField = $form.find('#district');
                filterDistrictDropDown(countriesDefinitions, state, city, districtField, attrs.district);
            } else if (dependencyOncity !== null && dependencyOncity === 'postalCode') {
                var PostalCodeField = $form.find('#zipCode');
                filterPostalCodeDropDown(countriesDefinitions, state, dependencyOncity, city, false, PostalCodeField, attrs.postalCode);
            }
        }

        if (city === '') {
            $('select:visible').each(function () {
                var $this = $(this);
                if (!$this.hasClass('b-country-select') && !$this.hasClass('b-state-select') && !$this.hasClass('selectCityDropDown')) {
                    $this.empty();
                    $this.append($('<option value=""></option>').html(selectOption));
                }
            });
        }
    });
    $('#city').trigger('change');
}
/**
 * Filter Postal Code DropDown
 * @param {array} countriesDefinitions - countryData
 * @param {string} state - the state
 * @param {string} dependency - dependency
 * @param {string} city - city
 * @param {boolean} isState - isState
 * @param {string} PostalCodeField - PostalCodeField
 * @param {string} selectedValue - selectedValue
 */
function filterPostalCodeDropDown(countriesDefinitions, state, dependency, city, isState, PostalCodeField, selectedValue) {
    var postalCodeValues;
    if (dependency && isState) {
        postalCodeValues = countriesDefinitions.states[state];
    } else if (dependency && !isState) {
        postalCodeValues = countriesDefinitions.states[state].cities[city].postalCodes;
    }
    PostalCodeField.empty();
    PostalCodeField.append($('<option value=""></option>').html(selectOption).val(''));
    $(postalCodeValues).each(function () {
        $('<option />', {
            html: this,
            id: this,
            value: this
        }).appendTo(PostalCodeField);
    });

    if ($('#zipCode option[value="' + selectedValue + '"]').length > 0) {
        $('select[name$=_postalCode]').val(selectedValue).trigger('change');
    }
}

/**
 * Filter City DropDown
 * @param {array} countriesDefinitions - countryData
 * @param {string} state - the state
 * @param {string} cityField - cityField
 * @param {string} selectedValue - selectedValue
 */
function filterCityDropDown(countriesDefinitions, state, cityField, selectedValue) {
    var cities = countriesDefinitions.states[state].cities;
    var citiesValues = cities;
    if ((citiesValues.length === undefined)) {
        citiesValues = Object.keys(cities);
    }
    cityField.empty();
    cityField.append($('<option value=""></option>').html(selectOption).val(''));
    if ($('#selectedCountry').val() === 'TH') {
        $(citiesValues).each(function () {
            $('<option />', {
                html: cities[this].label,
                id: this,
                value: this
            }).appendTo(cityField);
        });
    } else {
        $(citiesValues).each(function () {
            $('<option />', {
                html: this,
                id: this,
                value: this
            }).appendTo(cityField);
        });
    }
    if ($('#city option[value="' + selectedValue + '"]').length > 0) {
        $('select[name$=_city]').val(selectedValue).trigger('change');
    }
}
/**
 * Filter District DropDown
 * @param {array} countriesDefinitions - countryData
 * @param {string} state - the state
 * @param {string} city - city
 * @param {string} districtField - districtField
 * @param {string} selectedValue - selectedValue
 */
function filterDistrictDropDown(countriesDefinitions, state, city, districtField, selectedValue) {
    var districtValues = countriesDefinitions.states[state].cities[city];
    districtField.empty();
    districtField.append($('<option value=""></option>').html(selectOption).val(''));
    $(districtValues).each(function () {
        $('<option />', {
            html: this,
            id: this,
            value: this
        }).appendTo(districtField);
    });
    if ($('#district option[value="' + selectedValue + '"]').length > 0) {
        $('select[name$=_district]').val(selectedValue).trigger('change');
    }
}
