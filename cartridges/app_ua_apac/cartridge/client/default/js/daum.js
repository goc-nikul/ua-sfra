'use strict';

$(document).on('click', '.js-daum-address-search', function (event) {
    event.preventDefault();
    var daum = window.daum;
    var self = $(this);
    new daum.Postcode({
        oncomplete: function (data) {
            if (self.closest('form').find('input[name$=_postalCode], input[name$=_address1]').is(':visible')) {
                self.closest('form').find('input[name$=_address1]').removeClass('is-invalid').val(data.address);
                self.closest('form').find('input[name$=_postalCode]').removeClass('is-invalid').val(data.zonecode);
                self.closest('form').find('input[name$=_postalCode], input[name$=_address1]').parent('.error-field').removeClass('error-field');
                self.closest('form').find('input[name$=_postalCode], input[name$=_address1]').next('.invalid-feedback').text('');
            }
        }
    }).open();
});

$(document).on('keydown paste focus mousedown', '.js-daum-readonly', function (e) {
    if (e.keyCode !== 9) {
        e.preventDefault();
    }
});
