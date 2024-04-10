'use strict';

var profileHelpersCore = require('org/profile/profile');
var clientSideValidation = require('../components/common/clientSideValidation');

profileHelpersCore.submitProfile = function () {
    $('body').on('click', '.account-save-button', function (e) {
        e.preventDefault();
        var $form = $(this).closest('form');
        var $passwordError = $('#form-password-error');
        var $passwordField = $('.js-password-field');
        var url = $form.attr('action');
        $('form.edit-profile-form').trigger('profile:edit', e);
        if (clientSideValidation.checkPasswordContainsEmail($form) === false) {
            clientSideValidation.checkMandatoryField($form);
            clientSideValidation.validatePasswordConfirm($form);
            clientSideValidation.validateMinimumAgeRestriction($form.find('#dob'));
            if ($form.find($passwordField).hasClass('is-invalid')) {
                if ($passwordError.is(':hidden')) {
                    $passwordError.show();
                }
            }
        }
        if (!$form.find('input.is-invalid').length) {
            $(this).spinner().start();
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                context: $(this),
                data: $form.serialize(),
                success: function (data) {
                    var $this = $(this);
                    if (!data.success) {
                        $form.find('input, select').removeClass('is-invalid');
                        $form.find('.form-group').removeClass('error-field');
                        $form.find('.invalid-feedback').empty();
                        if (data.refreshTokenError) {
                            $this.closest('#maincontent').find('.js-account-profile-page').addClass('hide');
                            $this.closest('#maincontent').find('.js-login-screen').removeClass('hide');
                            $this.closest('#maincontent').find('.js-login-screen .b-invalid-cred').empty().removeAttr('style');
                            $this.closest('#maincontent').find('.js-login-screen #login-form-password').val('');
                            $('#login-form-email').val(data.email);
                            $('#login-form-email').attr('readonly', true);
                            $('html, body').animate({ scrollTop: 0 }, 500);
                        }
                        // logic to display error messages
                        var fieldErrorMessages = data.fields;
                        if (fieldErrorMessages !== undefined && fieldErrorMessages !== null && Object.keys(fieldErrorMessages).length > 0) {
                            Object.keys(fieldErrorMessages).forEach(function (element) {
                                if ($('[name$=' + element + ']').is(':visible')) {
                                    $('[name$=' + element + ']:visible').siblings('.invalid-feedback').text(fieldErrorMessages[element]);
                                    $('[name$=' + element + ']:visible').closest('div.b-input_row').addClass('error-field');
                                    $('[name$=' + element + ']:visible').addClass('is-invalid');
                                }
                            });
                        }
                        $this.spinner().stop();
                    } else {
                        if ($form.find('.js-password-details').is(':visible') && $form.find('.js-password-details').length > 0) {
                            $form.find('.js-password-details').hide();
                        } else if ($form.find('.js-email-details').is(':visible') && $form.find('.js-email-details').length > 0) {
                            $form.find('.js-email-details').hide();
                        }
                        $form.find('.js-account-profile_form-row').addClass('align-center');
                        $form.find('.js-account_form-column-hide').addClass('hide');
                        $form.find('.js-change-password').show();
                        if (data && data.customerEmail) {
                            $('[name$="customer_email"]').val(data.customerEmail);
                        }
                        $this.spinner().stop();
                        $this.addClass('f-added-checkmark').html($this.attr('data-saved'));
                        setTimeout(function () {
                            $this.removeClass('f-added-checkmark').html($this.attr('data-save'));
                        }, 3000);
                    }
                },
                error: function (message) {
                    $(this).spinner().stop();
                    if (message.responseJSON && typeof message.responseJSON.message !== 'undefined') {
                        if (!$('.b-error-message').length) {
                            $('.edit-profile-form').append('<div class="b-error-message">' + message.responseJSON.message + '</div>');
                        }
                    }
                }
            });
        }
    });
};

module.exports = profileHelpersCore;
