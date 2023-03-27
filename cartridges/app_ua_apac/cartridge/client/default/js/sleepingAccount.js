'use strict';

$(document).on('click', '.js-sleeping-show-password', function () {
    var inputField = $(this).parent().find('input');
    var hideLabel = $(this).attr('data-hide');
    var showLabel = $(this).attr('data-show');
    var typee = inputField.attr('type');
    if (typee === 'password') {
        inputField.attr('type', 'text');
        $(this).html(hideLabel);
    } else {
        inputField.attr('type', 'password');
        $(this).html(showLabel);
    }
});

$(document).on('click', '.reactivate-button', function (e) {
    e.preventDefault();
    var customerNo = $(this).data('cusomerno');
    $('.reactivate-button').attr('disabled', true);
    var url = $(this).data('url');
    $.spinner().start();
    $.ajax({
        url: url,
        type: 'POST',
        data: { customerNo: customerNo },
        success: function (data) {
            if (!data.success) {
                $('.reactivate-button').removeAttr('disabled', true);
                $('.sleepingErrorText').addClass('invalid-feedback').removeClass('d-none');
            } else if (data.success && 'isNaverUser' in data && data.isNaverUser) {
                location.href = $('.reactivate-button').data('redirect');
            }
        }
    });
    $('.reactivate-button').removeAttr('disabled', true);
    $.spinner().stop();
    return false;
});
