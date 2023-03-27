/**
 * Populate the Billing Address
 * @param {string} parentSelector - the top level DOM selector for a unique address summary
 * @param {Object} address - the address data
 */
'use strict';
var addressBookCore = require('org/addressBook/addressBook');
var isLegendSoftEnabled = $('div[data-is-legendsoft]').data('is-legendsoft');
var legendSoft;

if (isLegendSoftEnabled) {
    legendSoft = require('legendsoft/checkout/suggestions');
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

addressBookCore.addNewAddress = function () {
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
        $('#country option[value="' + currentCountry + '"]').prop('selected', 'selected').change();
        scrollPosition();
    });
};

addressBookCore.cancelAddress = function () {
    $('body').on('click', '.account-cancel-button', function () {
        var $this = $(this);
        var form = $this.closest('form');
        legendSoft.updateFieldsBackToNormal();
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
};

/**
     * updates the country and states list
     */
addressBookCore.updateStateOptions = function () {
    $('body').on('change', 'select[name$="_country"]', function () {
        // No need to execute this function for MX
    });
};

module.exports = addressBookCore;
