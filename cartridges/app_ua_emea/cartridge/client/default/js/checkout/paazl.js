'use strict';

/**
 * To select Shipping function
 *
 */
function switchShippingOption() {
    $('.delivery-option, .pick-up-point-option').on('click', function (e) {
        e.preventDefault();
        if ($(this).hasClass('delivery-option') && !$(this).hasClass('active')) {
            $('input#shippingZipCodedefault').trigger('change');
            $('.pick-up-point-content').addClass('hide');
            $('.pick-up-point-option').removeClass('active');
            $('.delivery-option').addClass('active');
            $('.delivery-content').removeClass('hide');
            $('.b-shipping-method').removeClass('topSpacing');
            $('.b-shipping-method').find('.js-shipping-method-heading').removeClass('hide');
            $('.b-shipping-privacy_links').removeClass('pickup-point-hide');
            $('button#tab-button-delivery')[0].click();
            $('#paazl-checkout').removeClass('hide');
            $('.next-step-button button').removeAttr('data-clicked');
            if ($('.shipment-selector-block') && $('.shipping-address-option')) {
                $('.shipment-selector-block').removeClass('hide');
            }
            setTimeout(function () {
                if (!$('input#postnumber-input').is(':visible')) {
                    $('.submit-shipping').removeClass('disabled');
                }
            }, 100);
        } else if ($(this).hasClass('pick-up-point-option') && !$(this).hasClass('active')) {
            $('.pick-up-point-content').removeClass('hide');
            $('.pick-up-point-option').addClass('active');
            $('.delivery-option').removeClass('active');
            $('.delivery-content').addClass('hide');
            $('.b-shipping-method').addClass('topSpacing');
            $('.b-shipping-method').find('.js-shipping-method-heading').addClass('hide');
            $('.b-shipping-privacy_links').addClass('pickup-point-hide');
            if ($('button#tab-button-pickup').length > 0 && $('#pickUpPointPostalcode').val() !== '') {
                $('#paazl-checkout').removeClass('hide');
                $('button#tab-button-pickup')[0].click();
            }
            $('#paazl-checkout').addClass('hide');
            if ($('.shipment-selector-block') && $('.shipping-address-option')) {
                $('.shipment-selector-block').addClass('hide');
            }
        }
    });
}

var exports = {
    init: function () {
        switchShippingOption();
    }
};

module.exports = exports;
