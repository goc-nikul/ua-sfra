'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./checkout/checkout'));
    processInclude(require('./checkout/instore'));
    processInclude(require('./checkout/holdAtLocation'));
    if ($('.js-employee-terms-conditions').length > 0) {
        if ($('.js-employee-terms-conditions').is(':checked')) {
            $('.place-order').removeAttr('disabled');
        } else {
            $('.place-order').attr('disabled', 'disabled');
        }
    }

    if ($('.js-vip-click').length > 0) {
        if ($('.js-vip-click').is(':checked')) {
            $('.place-order').removeAttr('disabled');
            $('.klarna-place-order').removeAttr('disabled');
        } else {
            $('.place-order').attr('disabled', 'disabled');
            $('.klarna-place-order').attr('disabled', 'disabled');
        }
    }

    if ($('.customer-phonenumber').length > 0) {
        $('.validatePhoneField').trigger('keyup');
    }
});
