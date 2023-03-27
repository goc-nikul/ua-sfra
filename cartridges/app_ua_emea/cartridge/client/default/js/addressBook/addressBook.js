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
    editAddress: addressBookBase.editAddress,
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

            var currentCountry = $('#selectedCountry').val();
            if (currentCountry !== undefined && currentCountry !== '' && currentCountry !== null) {
                $('#country option[value="' + currentCountry + '"]').prop('selected', 'selected').change();
            }
            scrollPosition();
        });
    },

    /**
     * updates the country and states list
     */
    updateStateOptions: function () {
        $('body').on('change', 'select[name$="_country"]', function () {
            var $form = $('form.address-form');
            var $country = $form.find('select[name$="_country"]');
            var $formState = $form.find('select[name$="_states_stateCode"]');
            var $formStateInput = $form.find('input[name$="_states_stateCode"]');
            var stVal = $formState.val();
            var country = $country.val();
            var countryObj;
            if (country !== undefined && $('.countryRegion').data('countryregion') !== null) {
                countryObj = $('.countryRegion').data('countryregion')[country]; // eslint-disable-line
            }
            var arrayHtml = '';
            var selectID = '';
            var selectName = '';
            var selectBox;
            var $formStateError = $formState.closest('.form-group').data('missing-error');

            $formState.closest('.form-group').removeClass('error-field').find('.invalid-feedback').empty();
            $formState.removeClass('is-invalid');
            $formStateInput.removeClass('is-invalid');
            $formStateInput.closest('.form-group').removeClass('error-field').find('.invalid-feedback').empty();

            // if statement execute only for the countries which has states as dropdown( ex : UK, US, CA)
            if (countryObj !== undefined && countryObj !== null && countryObj.regions !== undefined && countryObj.regions !== null && Object.keys(countryObj.regions).length > 0) {
                selectID = 'id="' + $form.find('[name$="_states_stateCode"]').attr('id') + '"';
                selectName = 'name="' + $form.find('[name$="_states_stateCode"]').attr('name') + '"';
                arrayHtml = '<option value=""></option>';

                for (var stateValue in countryObj.regions) { // eslint-disable-line
                    arrayHtml += '<option value="' + stateValue + '">' + countryObj.regions[stateValue] + '</option>';
                }
                selectBox = $('<select required data-missing-error="' + $formStateError + '" class="b-state-select form-control" aria-required="true" autocomplete="address-level1" ' + selectID + ' ' + selectName + '>' + arrayHtml + '</select>');
                if (country === 'IE') {
                    $form.find('input[name$="_states_stateCode"]').replaceWith($(selectBox));
                    $form.find('select[name$="_states_stateCode"]').replaceWith($(selectBox));
                    $form.find('select[name$="_states_stateCode"]').closest('.form-group').removeClass('b-state_text-field').addClass('b-state_select-field');

                    if (stVal && stVal !== undefined && stVal !== null) {
                        $form.find('select[name$="_states_stateCode"] option[value=' + stVal + ']').prop('selected', true);
                    }
                }

                if (country === 'IE') {
                    $form.find('select[name$="_states_stateCode"]').closest('.form-group').find('label').first()
                        .html($country.find('option:selected').data('state'));
                    $form.find('input[name$="_postalCode"]').closest('.form-group').find('label').first()
                        .html($country.find('option:selected').data('postal'));
                }
            }
        });
    }
};
