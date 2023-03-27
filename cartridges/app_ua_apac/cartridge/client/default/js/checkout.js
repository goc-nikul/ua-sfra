'use strict';

var processInclude = require('base/util');
var shippingHelpersDragon = require('./checkout/shipping');
var addressHelpersDragon = require('./checkout/address');

$(document).ready(function () {
  // eslint-disable-line
    var name = 'paymentError';
    var error = new RegExp('[?&]'.concat(encodeURIComponent(name), '=([^&]*)')).exec(location.search // eslint-disable-line no-restricted-globals
    );
    var paymentStage = new RegExp('[?&]stage=payment([^&]*)').exec(location.search // eslint-disable-line no-restricted-globals
    );
    var isPayPal = new RegExp('[?&]isPayPal=true([^&]*)').exec(location.search // eslint-disable-line no-restricted-globals
    );

    if (error || paymentStage || isPayPal) {
        if (error) {
            $('.error-message').show();
            $('.error-message-text').text(decodeURIComponent(error[1]));
        }

        if ($('div#adyen-component-content').length > 0) require('adyen/adyenCheckout').renderGenericComponent();
    }

    processInclude(require('./checkout/checkout'));
    processInclude(require('atome/custom'));
    let methodID = $('.payment-options .nav-item .active').parent().attr('data-method-id');
    if (methodID) {
        $('#selectedPaymentOption').val(methodID);
    }

    if ($('.js-employee-terms-conditions').length > 0) {
        if ($('.js-employee-terms-conditions').is(':checked')) {
            $('.place-order').removeAttr('disabled');
        } else {
            $('.place-order').attr('disabled', 'disabled');
        }
    }

    $('.checkout-card-header').on('click', function () {
        $(this).parents('.card').prev().find('.btn-primary')
            .trigger('click');
    });
    if ($('.customer-phonenumber').length > 0) {
        $('.validatePhoneField').trigger('keyup');
    }
});
$('.payment-options .nav-link').click(function () {
    let methodID = $(this).parent().attr('data-method-id');
    if (methodID) {
        $('#selectedPaymentOption').val(methodID);
    }
});

[shippingHelpersDragon, addressHelpersDragon].forEach(function (library) {
    Object.keys(library).forEach(function (item) {
        if (typeof library[item] === 'object') {
            exports[item] = $.extend({}, exports[item], library[item]);
        } else {
            exports[item] = library[item];
        }
    });
});

module.exports = exports;
