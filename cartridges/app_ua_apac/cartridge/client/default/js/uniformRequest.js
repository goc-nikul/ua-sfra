'use strict';

var clientSideValidation = require('org/components/common/clientSideValidation');

$(document).on('click', '.js-inquiry-submit-btn', function (e) {
    e.preventDefault();
    var form = $(this).closest('form');

    clientSideValidation.checkMandatoryField(form);
    if (!form.find('input.is-invalid').length) {
        $('.js-inquiry-submit-btn').attr('disabled', true);
        var url = $(this).data('url');
        var serializedForm = form.serialize();
        $.spinner().start();
        $.ajax({
            url: url,
            type: 'POST',
            data: serializedForm,
            success: function (data) {
                if (!data.success) {
                    $('.js-inquiry-submit-btn').removeAttr('disabled', true);
                    if (data.invalidForm) {
                        var formValidation = require('base/components/formValidation');
                        formValidation(form, data);
                    }
                } else {
                    $('.uniform-form-container').hide();
                    $('.uniform-result').removeClass('d-none');
                }
            }
        });
    }
    return false;
});
