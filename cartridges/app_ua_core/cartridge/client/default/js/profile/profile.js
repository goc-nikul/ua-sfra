'use strict';

var formValidation = require('base/components/formValidation');
var clientSideValidation = require('../components/common/clientSideValidation');

/**
 * Populate the days present in a month
 * @param {string} parentSelector - finding the days
 * @param {Object} month ID - passing the month ID
 */

function getKeyByValue(object, value) { // eslint-disable-line
    for (var prop in object) { // eslint-disable-line
        if (prop === value) {
            return object[prop];
        }
    }
}
module.exports = {
    submitProfile: function () {
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
    },

    submitPassword: function () {
        $('form.change-password-form').submit(function (e) {
            var $form = $(this);
            e.preventDefault();
            var url = $form.attr('action');
            $form.spinner().start();
            $('form.change-password-form').trigger('password:edit', e);
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: $form.serialize(),
                success: function (data) {
                    $form.spinner().stop();
                    if (!data.success) {
                        formValidation($form, data);
                    } else {
                        location.href = data.redirectUrl;
                    }
                },
                error: function (err) {
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    }
                    $form.spinner().stop();
                }
            });
            return false;
        });
    },

    changeEmailField: function () {
        $('.js-change-email').on('click', function () {
            $(this).hide();
            $('.js-email-details input, .js-account_form-column-hide input').each(function () {
                var $this = $(this);
                $this.val('');
                $this.removeClass('is-invalid');
                $this.parent().removeClass('error-field');
                $this.parent().find('.invalid-feedback').empty();
            });
            $('.js-password-details').hide();
            $('.js-email-details').show();
            $('.js-change-password').hide();
            $('.js-account-profile_form-row').removeClass('align-center');
            $('.js-account_form-column-hide').removeClass('hide');
        });
    },

    changePasswordField: function () {
        $('.js-change-password').on('click', function () {
            $(this).hide();
            $('.js-password-details input, .js-account_form-column-hide input').each(function () {
                var $this = $(this);
                $this.val('');
                $this.removeClass('is-invalid');
                $this.parent().removeClass('error-field');
                $this.parent().find('.invalid-feedback').empty();
                $this.attr('type', 'password');
                $this.parent().find('.js-show-password').html($this.parent().find('.js-show-password').attr('data-show'));
            });
            $('.js-account-profile_form-row').removeClass('align-center');
            $('.js-email-details').hide();
            $('.js-account_form-column-hide').removeClass('hide');
            $('.js-password-details, .js-change-email').show();
        });
    },

    cancelEmail: function () {
        $('.js-email-group-cancel').on('click', function () {
            $('.js-email-details').hide();
            $('.js-email-details input, .js-account_form-column-hide input').each(function () {
                var $this = $(this);
                $this.val('');
                $this.removeClass('is-invalid');
                $this.parent().removeClass('error-field');
                $this.parent().find('.invalid-feedback').empty();
            });
            $('.js-change-email').show();
            $('.js-change-password').show();
            $('.js-account-profile_form-row').addClass('align-center');
            $('.js-account_form-column-hide').addClass('hide');
            return;
        });
    },

    cancelPassword: function () {
        $('.js-password-group-cancel').on('click', function () {
            $('.js-password-details').hide();
            $('.js-password-details input, .js-account_form-column-hide input').each(function () {
                var $this = $(this);
                $this.val('');
                $this.removeClass('is-invalid');
                $this.parent().removeClass('error-field');
                $this.parent().find('.invalid-feedback').empty();
                $this.parent().find('.input-feedback').hide();
                $this.attr('type', 'password');
                $this.parent().find('.js-show-password').html($this.parent().find('.js-show-password').attr('data-show'));
            });
            $('.js-change-password').show();
            $('.js-account-profile_form-row').addClass('align-center');
            $('.js-account_form-column-hide').addClass('hide');
            return;
        });
    },

    updateDays: function () {
        $('body').on('change', 'select[name $= "customer_birthMonth"]', function () {
            let birthDayZeroLabel = $('.b-day-select').find('option:first-child').text();
            var monthCode = $(this).val();
            var arrayHtml = '';
            const obj = { 1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31 }; // eslint-disable-line
            // when no month is selected, populate 31 day as it was rendered on page load
            var days = monthCode !== '0' ? getKeyByValue(obj, monthCode) : 31;
            for (var i = 0; i <= days; i++) { // eslint-disable-line
                if (i === 0) {
                    arrayHtml += '<option value="' + i + '">' + (birthDayZeroLabel || 'Select') + '</option>';
                } else {
                    arrayHtml += '<option value="' + i + '">' + i + '</option>';
                }
            }
            $('.b-day-select').empty();
            $('.b-day-select').append(arrayHtml);
        });
    },

    showPassword: function () {
        $('body').on('click', '.edit-profile-form .js-profile-show-password', function () {
            var $this = $(this);
            var $inputField = $this.parent().find('input');
            var hideLabel = $this.attr('data-hide');
            var showLabel = $this.attr('data-show');
            var inputFieldType = $inputField.attr('type');
            if (inputFieldType === 'password') {
                $inputField.attr('type', 'text');
                $this.html(hideLabel);
            } else {
                $inputField.attr('type', 'password');
                $this.html(showLabel);
            }
        });
    },

    consecutiveSpaceValidator: function () {
        var counter = 0;
        $('#firstName, #lastName, #email').on('keydown', function (e) {
            if (e.which === 32 || e.keyCode === 32) {
                counter += 1;
                if (counter > 1) {
                    e.preventDefault();
                }
            } else {
                counter = 0;
            }
        });
    }
};
