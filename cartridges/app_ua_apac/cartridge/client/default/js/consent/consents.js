'use strict';

/**
 * Function to display the policy modals
 */
function displayPolicyModal() {
    $('body').find('.b-loader').css('z-index', '999');
    $('#policy-modal').modal('show');
    $('body').trigger('modalShown', {
        name: 'consent'
    });
    $('#policy-modal').next('.modal-backdrop.show').css('z-index', '999');
}

/**
 * @param {Object} $modalDiv element reference to populate the modal
 * Populates the policy modal based on reference
 */
function populatePolicyModal($modalDiv) {
    if ($('#policy-modal').length) {
        $('#policy-modal').remove();
    }
    var consentHtml = $modalDiv.html();
    var htmlString = '<!-- Modal -->' +
        '<div class="modal g-modal g-modal-registerUser" id="policy-modal" role="dialog">' +
        '<div class="modal-dialog g-modal-dialog ">' +
        '<!-- Modal content-->' +
        '<div class="modal-content g-modal-content">' +
        '<div class="modal-body g-modal-body">' + consentHtml + '</div>' +
        '</div>' +
        '</div>' +
        '</div>';
    $('body').append(htmlString);
    displayPolicyModal();
}

module.exports = {
    consentClickmodal: function () {
        $('body').on('click', '.js-agree-to-policy-content', function (e) {
            e.preventDefault();
            populatePolicyModal($('#js-agree-to-policy-content'));
        })
        .on('click', '.js-agree-to-datatransfer-content', function (e) {
            e.preventDefault();
            populatePolicyModal($('#js-agree-to-datatransfer-content'));
        })
        .on('click', '.js-email-subscribed-content', function (e) {
            e.preventDefault();
            populatePolicyModal($('#js-user-not-subscribed-content'));
        })
        .on('click', '.js-smsOptIn-content', function (e) {
            e.preventDefault();
            populatePolicyModal($('#js-smsOptIn-content'));
        });

        $('body').on('click', '#newUserRegisterModal #select-all-register, .register-in-page #select-all-register, .contact-info-block #select-all-checkout', function () {
            $(this).parents('form').find('.g-checkbox-input').prop('checked', $(this).prop('checked'));

            if ($('.b-contact_row-phone-address').length > 0) {
                var checked = $('#addsmsto-list-ci').is(':checked');
                if ($('#contact-phoneNumber').length === 0) {
                    $('#contactPhone1, #contactPhone2, #contactPhone3').attr('required', checked);
                    $('#contactPhone1').parent('.b-input_row').find('label').toggleClass('required', checked);
                } else {
                    $('#contact-phoneNumber').attr('required', checked)
                    .parent('.b-input_row').find('label')
                    .toggleClass('required', checked);
                }
            }
        });

        $('body').on('click', '#newUserRegisterModal .g-checkbox-input, .register-in-page .g-checkbox-input, .contact-info-block .g-checkbox-input', function () {
            if (!$(this).prop('checked')) {
                if ($(this).parents('form').hasClass('registration')) {
                    $(this).parents('form').find('#select-all-register').prop('checked', false);
                } else {
                    $(this).parents('form').find('#select-all-checkout').prop('checked', false);
                }
            } else if ($(this).prop('checked') && $(this).parents('form').find('.g-checkbox-input.form-control').not(':checked').length === 0) {
                if ($(this).parents('form').hasClass('registration')) {
                    $(this).parents('form').find('#select-all-register').prop('checked', true);
                } else {
                    $(this).parents('form').find('#select-all-checkout').prop('checked', true);
                }
            }
        });
    }
};
