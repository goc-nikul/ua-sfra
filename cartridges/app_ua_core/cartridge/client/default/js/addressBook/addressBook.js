'use strict';

var url;
var isDefault;
var width = $(window).width();
var height = $(window).height();

/**
 * Create an alert to display the error message
 * @param {Object} message - Error message to display
 */
function createErrorNotification(message) {
    var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
        'fade show" role="alert">' +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' + message + '</div>';

    $('.error-messaging').append(errorHtml);
}

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

/**
 * ViewMore and ViewLess to display the address container Fields
 * @param {Object} count - the count object which will get the count after the success
 */
function viewMoreLessfunction(count) {
    var $addressContainer = $('.b-account-address_book-container').find('.js-address_book-section');
    var $address = $('.b-account-address');
    if ($(window).width() < 1024) {
        var addressCount = (count === undefined && count !== '' && count !== null) ? 3 : count;

        var addressLenght = $('.b-account-address_book-container').find('.js-address_book-section').length;
        if (addressLenght > 3) {
            $addressContainer.addClass('hide');

            if ($address.find('.viewLess').is(':visible')) {
                $address.find('.viewLess').removeClass('hide');
                $address.find('.viewMore').addClass('hide');
            } else {
                $address.find('.viewLess').addClass('hide');
                $address.find('.viewMore').removeClass('hide');
            }
        } else {
            $address.find('.viewLess').addClass('hide');
            $address.find('.viewMore').addClass('hide');
        }
        $('.b-account-address_book-container').find('.js-address_book-section:lt(' + addressCount + ')').removeClass('hide');

        $address.on('click', '.viewMore', function () {
            addressCount = (addressCount + 3 <= addressLenght) ? addressCount + 3 : addressLenght;
            $('.b-account-address_book-container').find('.js-address_book-section:lt(' + addressCount + ')').removeClass('hide');

            if (addressCount === addressLenght) {
                $(this).addClass('hide');
                $address.find('.viewLess').removeClass('hide');
            }
        });

        $address.on('click', '.viewLess', function () {
            addressCount = (addressCount - 3 <= 0) ? 3 : addressCount - 3;
            $('.b-account-address_book-container').find('.js-address_book-section').not(':lt(' + addressCount + ')').addClass('hide');
            var addressScrollPosition = $('.b-account-address_book-container').find('.js-address_book-section:not(.hide)').last().offset().top - 60;

            $('html, body').animate({ scrollTop: 0 }, 0);
            $('html, body').animate({
                /* eslint-disable */
                'scrollTop': addressScrollPosition
                /* eslint-enable */
            }, 0);

            if (addressCount <= 3) {
                $(this).addClass('hide');
                $address.find('.viewMore').removeClass('hide');
            }
        });
    } else {
        $addressContainer.removeClass('hide');
    }
}

module.exports = {
    removeAddress: function () {
        $('body').on('click', '.remove-address', function (e) {
            e.preventDefault();
            isDefault = $(this).data('default');
            if (isDefault) {
                url = $(this).data('url')
                    + '?addressId='
                    + $(this).data('id')
                    + '&isDefault='
                    + isDefault;
            } else {
                url = $(this).data('url') + '?addressId=' + $(this).data('id');
            }
        });
    },

    removeAddressConfirmation: function () {
        $('body').on('click', '.delete-confirmation-btn', function (e) {
            e.preventDefault();
            var addressID = '?addressId=' + $(this).closest('#deleteAddressModal').attr('data-addr-id');
            var addressURL = $('.delete-confirmation-btn').data('url');
            $.spinner().start();
            url = addressURL + addressID;
            $.ajax({
                url: url,
                type: 'get',
                dataType: 'json',
                success: function (data) {
                    $('div#uuid-' + data.UUID).parent('div.js-address_book-section').remove();
                    var count = $('.b-account-address_book-container').find('.js-address_book-section:visible').length + 1;
                    viewMoreLessfunction(count);
                    if (data.message) {
                        $('.address-right-container').find('.heading-addresses').html(data.message);
                        $('.address-right-container').find('.b-account-address_book-heading').addClass('b-account-address_book-noaddress');
                        $('.address-right-container').find('.last-updated').remove();
                        $('.address-right-container').find('.js-address-form-content').addClass('empty-address');
                    }
                    $.spinner().stop();
                },
                error: function (err) {
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    } else {
                        createErrorNotification(err.responseJSON.errorMessage);
                    }
                    $.spinner().stop();
                }
            });
        });
    },

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
            if (currentCountry === 'CA' || currentCountry === 'US') {
                $('#country option[value="' + currentCountry + '"]').prop('selected', 'selected').change();
            }
            scrollPosition();
        });
    },

    editAddress: function () {
        $('body').on('click', '.address-right-container .edit-address', function () {
            var selectedOption = $(this);
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
            var element;

            Object.keys(attrs).forEach(function (attr) {
                element = attr === 'countryCode' ? 'country' : attr;
                $form.find('[name$=' + element + ']').val(attrs[attr]);
            });

            $('select[name$="_country"]').trigger('change');
            scrollPosition();

            Object.keys(attrs).forEach(function (attr) {
                element = attr === 'countryCode' ? 'country' : attr;
                $form.find('[name$=' + element + ']').val(attrs[attr]);
            });
        });
    },

    cancelAddress: function () {
        $('body').on('click', '.account-cancel-button', function () {
            var $this = $(this);
            var form = $this.closest('form');
            form.attr('data-action', 'new');
            $this.closest('.address-form-container').addClass('hide');
            $('.address-right-container .btn-add-new').removeClass('hide');
            $('.address-right-container .js-address-form-container').insertAfter($(this).closest('.address-right-container').find('.js-address-form-content'));

            form.find('.form-control.is-invalid').removeClass('is-invalid');
            form.find('.form-group.error-field').removeClass('error-field');
            form.find('.invalid-feedback').empty();
            $('html, body').animate({
                scrollTop: 0
            }, 500);
            return;
        });
    },

    showRemoveAddressModal: function () {
        $('body').on('click', '.remove-address', function (e) {
            e.preventDefault();
            var addressID = $(this).closest('.js-address_book-section').find('.js-address_book-option').attr('data-addressid');
            var addressContent = $(this).closest('.js-address_book-section').html();
            $('#deleteAddressModal').attr('data-addr-id', addressID);
            $('#deleteAddressModal').find('.js-remove-address').html(addressContent);
            $('#deleteAddressModal').modal('show');
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
            var inputField;
            var selectBox;
            var $formStateError = ($formState.length > 0 ? $formState : $formStateInput).closest('.form-group').data('missing-error');

            $formState.closest('.form-group').removeClass('error-field').find('.invalid-feedback').empty();
            $formState.removeClass('is-invalid');
            $formStateInput.removeClass('is-invalid');
            $formStateInput.closest('.form-group').removeClass('error-field').find('.invalid-feedback').empty();

            // if statement execute only for the countries which has states as dropdown( ex : UK, US, CA)
            if (countryObj !== undefined && countryObj !== null && countryObj.regions !== undefined && countryObj.regions !== null && Object.keys(countryObj.regions).length > 0) {
                selectID = 'id="' + $form.find('[name$="_states_stateCode"]').attr('id') + '"';
                selectName = 'name="' + $form.find('[name$="_states_stateCode"]').attr('name') + '"';
                inputField = $('<input required class="form-control b-input_row-input" type="text" aria-required="true" autocomplete="address-level1" ' + selectID + ' ' + selectName + ' />');
                arrayHtml = '<option value=""></option>';

                for (var stateValue in countryObj.regions) { // eslint-disable-line
                    arrayHtml += '<option value="' + stateValue + '">' + countryObj.regions[stateValue] + '</option>';
                }
                selectBox = $('<select required data-missing-error="' + $formStateError + '" class="b-state-select form-control" aria-required="true" autocomplete="address-level1" ' + selectID + ' ' + selectName + '>' + arrayHtml + '</select>');
                if (country !== 'US' && country !== 'CA') {
                    $form.find('select[name$="_states_stateCode"]').replaceWith($(inputField));
                    $form.find('input[name$="_states_stateCode"]').closest('.form-group').find('label').first()
                        .html($country.find('option:selected').data('state'));
                    $form.find('input[name$="_postalCode"]').closest('.form-group').find('label').first()
                        .html($country.find('option:selected').data('postal'));
                    $form.find('input[name$="_states_stateCode"]').closest('.form-group').addClass('b-state_text-field');
                } else {
                    $form.find('input[name$="_states_stateCode"]').replaceWith($(selectBox));
                    $form.find('select[name$="_states_stateCode"]').replaceWith($(selectBox));
                    $form.find('select[name$="_states_stateCode"]').closest('.form-group').removeClass('b-state_text-field').addClass('b-state_select-field');

                    if (stVal && stVal !== undefined && stVal !== null) {
                        $form.find('select[name$="_states_stateCode"] option[value=' + stVal + ']').prop('selected', true);
                    }
                }

                if (country === 'CA') {
                    $form.find('select[name$="_states_stateCode"]').closest('.form-group').find('label').first()
                        .html($country.find('option:selected').data('state'));
                    $form.find('input[name$="_postalCode"]').closest('.form-group').find('label').first()
                        .html($country.find('option:selected').data('postal'));
                } else if (country === 'US') {
                    $form.find('select[name$="_states_stateCode"]').closest('.form-group').find('label').first()
                        .html($country.find('option:selected').data('state'));
                    $form.find('input[name$="_postalCode"]').closest('.form-group').find('label').first()
                        .html($country.find('option:selected').data('postal'));
                }
            }
        });
    },

    viewMoreLess: function (count) {
        viewMoreLessfunction(count);
    },

    resizeFunction: function () {
        $(window).resize(function () {
            if ($(window).width() !== width || $(window).height() !== height) {
                viewMoreLessfunction();
            }
        });
    },

    billingDefaultCheckBox: function () {
        $('body').on('change', '#setAsDefaultBilling', function () {
            if ($(this).is(':checked')) {
                $(this).val($(this).is(':checked'));
            } else {
                $(this).val($(this).is(':checked'));
            }
        });
    }
};
