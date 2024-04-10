'use strict';

var profileHelpersCore = require('org/profile/profile');
var clientSideValidation = require('../components/common/clientSideValidation');
var scrollAnimate = require('org/components/scrollAnimate');
const consents = require('../consent/consents');

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

/**
 * Open create account modal
 * @param {Object} $this current element
 */
function getAgeConfimationModal() {
    if ($('#ageConfimationModal').length !== 0) {
        $('#ageConfimationModal').remove();
    }
    var htmlString = '<!-- Modal -->'
        + '<div class="modal g-modal g-modal-registerUser" id="ageConfimationModal" role="dialog" data-backdrop="static" data-keyboard="false">'
        + '<div class="modal-dialog g-modal-dialog ageConfimationModalBody">'
        + '<!-- Modal content-->'
        + '<div class="modal-content g-modal-content">'
        + '<div class="modal-body g-modal-body"></div>'
        + '</div>'
        + '</div>'
        + '</div>';
    $('body').append(htmlString);
}

module.exports = {
    submitProfile: function () {
        $('body').on('click', '.account-save-button', function (e) {
            e.preventDefault();
            var $form = $(this).closest('form');
            var url = $form.attr('action');
            $('form.edit-profile-form').trigger('profile:edit', e);
            $('.b-registration-error').addClass('hide');

            if (clientSideValidation.checkPasswordContainsEmail($form) === false) {
                clientSideValidation.checkMandatoryField($form);
                clientSideValidation.validatePasswordConfirm($form);
                clientSideValidation.validateMinimumAgeRestriction($form);
            }

            if ($('.b-profile-error-msg .b-error-message').length) {
                $('.b-account-edit-profile .b-profile-error-msg').empty();
            }
            if (!$form.find('input.is-invalid, select.is-invalid').length) {
                var serializedForm = $form.serialize();
                $(this).spinner().start();
                $.ajax({
                    url: url,
                    type: 'post',
                    dataType: 'json',
                    context: $(this),
                    data: serializedForm,
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
                                if (data.emailUpdateError) {
                                    $form.find('.b-registration-error').html(data.emailUpdateError);
                                    $form.find('.b-registration-error').removeClass('hide');
                                }
                            } else if (data.errorMessgae) {
                                $('.b-account-edit-profile .b-profile-error-msg').append('<div class="b-error-message">' + data.errorMessgae + '</div>');
                                scrollAnimate($('.b-account-edit-profile'));
                            }
                            // Display the PopUp if user Age is not valid for the memberson
                            if (data.ageNotValid) {
                                getAgeConfimationModal();
                                $('#ageConfimationModal .modal-body').html(data.modalContent);
                                $('#ageConfimationModal').modal('show');
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
                            $form.find('.js-change-email').show();

                            // if split field is enabled, reset form fields if saved successfully
                            if ($('.emailaddressDomainSelect').length > 0) {
                                $('.emailaddressDomainSelect').val('');
                                $('.emailAddressDomainSelectConfirm').val('');
                            }
                            // if split field is enabled, reset form fields if saved successfully
                            if ($('.emailaddressName').length > 0) {
                                $('.emailaddressName').val('');
                                $('.emailAddressNameConfirm').val('');
                            }
                            // if split field is enabled, reset form fields if saved successfully
                            if ($('.emailaddressDomain').length > 0) {
                                $('.emailaddressDomain').val('');
                                $('.emailAddressDomainConfirm').val('');
                            }
                            if (data && data.customerEmail) {
                                $('[name$="customer_email"]').val(data.customerEmail);
                            }
                            // Disabled the birthMonth and birthYer field on success
                            if (data && (data.birthMonth && data.birthMonth !== null) && (data.birthYear && data.birthYear !== null) && (data.locale && data.locale !== 'ko_KR')) {
                                $('select#birthYear, select#birthMonth').attr('disabled', true);
                            }
                            if (data && (data.LoyaltyID && data.LoyaltyID !== null)) {
                                $('input#email, input#phone').attr('readonly', true);
                            }

                            if (data && ('subscriptionUpdated' in data && data.subscriptionUpdated)) {
                                $('#add-to-email-list').prop('disabled', true);
                                $('.js-user-not-subscribed').removeClass('d-none');
                                $('.js-user-subscribed').addClass('d-none');
                                $('.emaillist-checkbox').addClass('email-disabled');
                            }

                            if (data && ('subscriptionUpdated' in data && !data.subscriptionUpdated)) {
                                $('#add-to-email-list').prop('disabled', false);
                                $('#add-to-email-list').prop('checked', false);
                                $('.js-user-not-subscribed').addClass('d-none');
                                $('.js-user-subscribed').addClass('d-none');
                                $('.emaillist-checkbox').removeClass('email-disabled');
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
                        if (message.responseJSON) {
                            $('.b-account-edit-profile .b-profile-error-msg').append('<div class="b-error-message">' + message.responseJSON.message + '</div>');
                            scrollAnimate($('.b-account-edit-profile'));
                        }
                    }
                });
            }
        });
    },
    handleReturnButtonClick: function () {
        $('body').on('click', '#ageConfimationModal .returnButton', function () {
            $('#ageConfimationModal').modal('hide');
        });
    },
    changeEmailField: function changeEmailField() {
        $('.js-change-email').on('click', function () {
            $(this).hide();
            $('.js-email-details input, .js-account_form-column-hide input').each(function () {
                var $this = $(this);
                $this.val('');
                $this.prop('readonly', false);
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
    cancelEmail: function () {
        $('.js-email-group-cancel').on('click', function () {
            $('.js-email-details').hide();
            $('.js-email-details input, .js-email-details select, .js-account_form-column-hide input').each(function () {
                var $this = $(this);
                $this.val('');
                $this.removeClass('is-invalid');
                $this.parent().removeClass('error-field');
                $this.parent().find('.invalid-feedback').empty();
            });
            $('.b-registration-error').empty();
            $('.js-change-email').show();
            $('.js-change-password').show();
            $('.js-account-profile_form-row').addClass('align-center');
            $('.js-account_form-column-hide').addClass('hide');
            return;
        });
    },

    displayEmailSubscriptionMessage: function () {
        $('#add-to-email-list').change(function () {
            if ($(this).is(':checked')) {
                $('.js-user-subscribed').removeClass('d-none');
            }
        });
    },
    updateDays: function () {
        $('body').on('change', 'select[name $= "customer_birthMonth"]', function () {
            var monthCode = $(this).val();
            var arrayHtml = '';
            const obj = { 1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31 }; // eslint-disable-line

            var days = getKeyByValue(obj, monthCode);
            for (var i = 0; i <= days; i++) { // eslint-disable-line
                if (i === 0) {
                    arrayHtml += '<option value=""> Select </option>';
                } else {
                    arrayHtml += '<option value="' + i + '">' + i + '</option>';
                }
            }
            $('.b-day-select').empty();
            $('.b-day-select').append(arrayHtml);
        });
    },
    birthDayDate: function () {
        if ($('#birthDay').length > 0) {
            var monthCode = $('select[name$="customer_birthMonth"]').val();
            var birthdateCode = $('select[name$="customer_birthDay"]').val();
            var arrayHtml = '';
            const obj = { 1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31 }; // eslint-disable-line

            var days = getKeyByValue(obj, monthCode);
            for (var i = 0; i <= days; i++) { // eslint-disable-line
                if (i === 0) {
                    arrayHtml += '<option value=""> Select </option>';
                // eslint-disable-next-line eqeqeq
                } else if (birthdateCode !== '' && i == birthdateCode) {
                    arrayHtml += '<option value="' + birthdateCode + '" selected>' + birthdateCode + '</option>';
                } else {
                    arrayHtml += '<option value="' + i + '">' + i + '</option>';
                }
            }
            $('.b-day-select').empty();
            $('.b-day-select').append(arrayHtml);
        }
    },
    consentModal: consents.consentClickmodal(),
    submitPassword: profileHelpersCore.submitPassword,
    changePasswordField: profileHelpersCore.changePasswordField,
    cancelPassword: profileHelpersCore.cancelPassword
};
