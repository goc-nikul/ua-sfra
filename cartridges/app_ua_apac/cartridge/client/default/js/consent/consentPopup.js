'use strict';

var util = require('org/util');

/**
 * Hide Error Message in consent popup
 */
function hideErrorMessage() {
    if ($('#consentPopUpModal .g-modal-content .errorMsg').length) {
        $('#consentPopUpModal .g-modal-content .errorMsg').remove();
    }
}

module.exports = {
    openConsentModal: function () {
        if ($('input[name="membersonEnabled"]').length && $('input[name="membersonEnabled"]').val() === 'true') {
            var closeBranch = setInterval(function () {
                util.branchCloseJourney();
            }, 2000);
            setTimeout(function () { clearInterval(closeBranch); }, 8000);
            $('#consentPopUpModal').modal('show');
            $('body > .modal-backdrop').css('z-index', '105').show();
            $('body').addClass('m-accessible-on');
        }
    },
    handleCancelClick: function () {
        $('body').on('click', '#consentPopUpModal #cancelButton', function () {
            hideErrorMessage();
            $('#mainBody').addClass('d-none');
            $('#primaryBody').removeClass('d-none');
        });
    },
    handleBackClick: function () {
        $('body').on('click', '#consentPopUpModal #backButton', function () {
            hideErrorMessage();
            $('#mainBody').removeClass('d-none');
            $('#primaryBody').addClass('d-none');
        });
    },
    handleAgreeClick: function () {
        $('body').on('click', '#consentPopUpModal #agreeButton', function () {
            var url = $(this).attr('data-href');
            $('body').find('.b-loader').css('z-index', '999');
            hideErrorMessage();
            $.ajax({
                url: url,
                method: 'GET',
                dataType: 'json',
                success: function (data) {
                    if (!data.success) {
                        $('<div class="errorMsg"><p>' + data.msg + '</p></div>').prependTo('#consentPopUpModal .g-modal-content');
                    } else {
                        location.href = data.redirectUrl;
                    }
                }
            });
        });
    }
};
