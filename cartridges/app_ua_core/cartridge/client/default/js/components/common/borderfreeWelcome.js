'use strict';

/**
 * Renders a Welcome Mat modal window
 */
function showWelcomeMatModal() {
    if ($('.tracking-consent.welcomeMat').hasClass('api-true')) {
        return;
    }

    var urlContent = $('.tracking-consent.welcomeMat').data('url');

    if ($('#welcome-mat-modal').length !== 0) {
        $('#welcome-mat-modal').remove();
    }

    var htmlString = '<!-- Modal -->'
        + '<div class="g-modal g-welcome-mat-modal" id="welcome-mat-modal" class="consent-tracking-modal" role="dialog" aria-modal="true">'
        + '<div class="g-modal-dialog g-welcome-mat-modal-dialog">'
        + '<!-- Modal content-->'
        + '<div class="g-modal-content g-welcome-mat-modal-content">'
        + '<div class="g-modal-header g-welcome-mat-modal-header">'
        + '<a href="#" class="g-modal-close">'
        + '<div aria-hidden="true" class="g-address-modal-close g-modal-close-button"></div></a></div>'
        + '<div class="g-welcome-mat-modal-body"></div>'
        + '</div>'
        + '</div>'
        + '</div>';

    $.spinner().start();
    $('body').append(htmlString);

    $.ajax({
        url: urlContent,
        type: 'get',
        dataType: 'html',
        success: function (response) {
            $('.g-welcome-mat-modal-body').html(response);
            $('.g-welcome-mat-modal-header .g-modal-close').attr('href', $('#default-country').val());
            $('#welcome-mat-modal').modal('show');
            $.spinner().stop();
        }
    });

    $('.g-welcome-mat-modal .g-modal-close').on('click', function () {
        $(this).closest('.g-welcome-mat-modal').hide();
    });
}

module.exports = function () {
    if ($('.tracking-consent.welcomeMat').hasClass('welcomeMat-false')) {
        showWelcomeMatModal();
    }
};
