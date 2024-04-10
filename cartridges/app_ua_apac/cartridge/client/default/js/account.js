'use strict';

var processInclude = require('base/util');
var layout = require('org/layout').init();
var clientSideValidation = require('./components/common/clientSideValidation');

$(document).ready(function () {
    processInclude(require('org/account'));

    if ($('.memberson-points-summary').length) {
        if (layout.isAndroid()) {
            $('.apple-app').addClass('d-none');
        }
        if (layout.isIOS() || (navigator.platform === 'MacIntel' && layout.getMode() !== 'large')) {
            $('.android-app').addClass('d-none');
        }
    }

    $('body').on('click', '.return-method', function () {
        $('.return-method-title').removeClass('checked');
        $(this).parent('.return-method-title').addClass('checked');
    });


    // Handle account deletion form
    $('body').on('click', '.js-account-delete-page .js-account-delete-submit-button', function (e) {
        e.preventDefault();
        $('.b-invalid-cred').hide();
        var form = $(this).closest('form');
        var url = form.attr('action');
        form.spinner().start();
        clientSideValidation.checkMandatoryField(form);
        if (!form.find('input.is-invalid').length) {
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: form.serialize(),
                success: function (data) {
                    form.spinner().stop();
                    if (!data.success) {
                        $('.b-invalid-cred').html(data.errorMessage).show();
                    } else if (data.redirect) {
                        location.href = data.redirect;
                    }
                }
            });
        }
        form.spinner().stop();
    });
});
