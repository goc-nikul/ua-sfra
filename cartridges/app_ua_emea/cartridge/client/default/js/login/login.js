'use strict';

var formValidation = require('base/components/formValidation');
var clientSideValidation = require('../components/common/clientSideValidation');

/**
 * Open login modal
 * @param {Object} $this current element
 */
function getModalHtmlElement() {
    var htmlString = '<!-- Modal -->'
        + '<div class="modal g-modal g-modal-loginform" id="loginModal" role="dialog">'
        + '<div class="modal-dialog g-modal-dialog ">'
        + '<!-- Modal content-->'
        + '<div class="modal-content g-modal-content">'
        + '</div>'
        + '</div>'
        + '</div>';
    $('body').append(htmlString);
}

/**
 * append login form into modal
 * @param {Object} $this current element
 * @param {Object} isPasswordResetOpen do we need to show password reset modal
 */
function openLoginModal($this, isPasswordResetOpen) {
    $.spinner().start();
    $('body').find('.b-loader').css('z-index', '999');
    const { pageRef } = window.GLOBAL_VALUES || {};
    $.ajax({
        url: $('.b-account-history').data('login-url') || $this.data('href') || $this.attr('href'),
        data: { format: 'ajax', pageRef },
        error: function () {
            $.spinner().stop();
        },
        success: function (data) {
            $.spinner().stop();
            $('body').find('.modal-backdrop.show').remove();
            $('#loginModal .g-modal-content').empty();
            $('#loginModal .g-modal-content').html(data);
            $('.g-reset-password-modal').addClass('hide');
            $('.g-force-password-reset-confirm-modal').addClass('hide');
            $('#loginModal').modal('show');
            $('body').trigger('modalShown', { name: 'login' });
            $('#loginModal').next('.modal-backdrop.show').css('z-index', '999');
            // open password reset popup
            if (isPasswordResetOpen) {
                $('.js-reset-password').trigger('click');
            }
        }
    });
}

/**
 * Login event to open login modal
 */
function loginModal() {
    $('body').on('click', '.js-login', function (e, isPasswordResetOpen) { // should be genuinely global
        e.preventDefault();
        $('#loginModal').remove();
        if ($('#newUserRegisterModal').length > 0) {
            $('#newUserRegisterModal').remove();
        }
        if ($(this).closest('.js-register-in-page').length > 0) {
            var registerUrl = $(this).attr('data-href');
            if ($(this).hasClass('b-registration-error-link')) {
                registerUrl = $(this).attr('href');
            }
            window.location.href = registerUrl;
            return false;
        } else if ($('.b-order_track').length > 0) {
            window.location.href = $('.b-order_track-link a').attr('href');
            return false;
        }
        getModalHtmlElement();
        openLoginModal($(this), (typeof isPasswordResetOpen !== 'undefined' && isPasswordResetOpen));
        return true;
    });
}

/**
 * Login event to perform social login
 */
function faceBookLogin() {
    $('body').on('click', '.g-button_facebook', function (e) {
        e.preventDefault();
        var $this = $(e.target);
        // eslint-disable-next-line no-undef
        FB.login(function (response) {
            if (response.status === 'connected') {
                var url = $('.g-button_facebook').attr('href');
                url += '&accessToken=' + response.authResponse.accessToken;
                $.ajax({
                    url: url,
                    type: 'GET',
                    context: $this,
                    success: function (data) {
                        if (!data.success) {
                            $('input[name$=login-oauth-form]').trigger('login:error', data);
                            $('.b-invalid-cred').html(data.error).show();
                        } else {
                            $this.closest('.g-modal').modal('hide');
                            $('input[name$=login-oauth-form]').trigger('login:success', data);
                            location.href = data.redirectUrl;
                        }
                    },
                    error: function (data) {
                        if (data.responseJSON.redirectUrl) {
                            window.location.href = data.responseJSON.redirectUrl;
                        } else {
                            $('input[name$=login-oauth-form]').trigger('login:error', data);
                        }
                    }
                });
            } else {
                var dataError = $('.g-button_facebook').data('error-msg');
                $('input[name$=login-oauth-form]').trigger('login:failed', {
                    errorMessage: dataError
                });
                $('.b-invalid-cred').html(dataError).show();
            }
        }, { scope: 'email' });
        return false;
    });
}

/**
 * Forgot Password event to toggle forgot password content
 */
function resetPassword() {
    $('body').on('click', '#loginModal .js-reset-password', function (e) {
        e.preventDefault();
        this.$target = $('.g-reset-password-modal').clone();
        $('#loginModal .g-modal-content').empty();
        $('#loginModal .g-modal-content').append(this.$target);
        $('.g-reset-password-modal').removeClass('hide');
        $('.g-password-reset-confirm-modal').addClass('hide');
        $('body').trigger('modalShown', { name: 'password-forgot-form' });
    });
}

/**
 * Show the password toggle
 */
function showPassword() {
    $('body').on('click', '.js-show-password', function () {
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
}

/**
 * Validate the login Inputs
 */
function loginSubmit() {
    $('body').on('click', '#loginModal .js-login-button', function (e) {
        e.preventDefault();
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
                    if (!data.success && data.error_code === 'ERROR_PASSWORD_RESET_REQUIRED') {
                        let resetModal = $('.g-force-password-reset-confirm-modal').clone();
                        $('#loginModal .g-modal-content').empty();
                        $('#loginModal .g-modal-content').append(resetModal);
                        $('.g-force-password-reset-confirm-modal').removeClass('hide');
                    } else if (!data.success) {
                        $('form.login').trigger('login:error', data);
                        $('body').trigger('login:failed', {
                            errorMessage: data && data.error && data.error[0]
                        });
                        $('.b-invalid-cred').html(data.error).show();
                    } else {
                        $('form.login').trigger('login:success', data);
                        $('body').trigger('login:success:analytics', {
                            customerNo: data && data.customerNo,
                            email: form.find('[name="loginEmail"]').val()
                        });
                        // Redirect to account page only on order confirmation, else refresh current page
                        if ($('.b-order-confirmation').length || $('.b-account-history').length || ($('#checkout-main').length > 0 && data.isEmployee) || ($('#checkout-main').length === 0 && data.errorInProfileValues)) {
                            location.href = data.redirectUrl;
                        } else {
                            window.location.reload();
                        }
                    }
                },
                error: function (data) {
                    if (data.responseJSON.redirectUrl) {
                        window.location.href = data.responseJSON.redirectUrl;
                    } else {
                        $('form.login').trigger('login:error', data);
                        form.spinner().stop();
                    }
                }
            });
        } else {
            $('body').trigger('login:failed', {
                emailErrorMessage: $('#form-email-error').text(),
                passwordErrorMessage: $('#form-password-error').text()
            });
        }
        form.spinner().stop();
        return false;
    });
}

/**
 * Submit the password reset Inputs
 */
function passwordResetSubmit() {
    $('body').on('click', '#loginModal .js-passwordreset-modal', function (e) {
        e.preventDefault();
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
                    if (data.success) {
                        this.$target = $('.g-password-reset-confirm-modal').clone();
                        $('#loginModal .g-modal-content').empty();
                        $('#loginModal .g-modal-content').append(this.$target);
                        $('body').find('#loginModal .confirm-reset-password-title').html(data.receivedMsgHeading);
                        $('body').find('#loginModal .confirm-password-reset-text').html(data.receivedMsgBody);
                        $('body').find('#loginModal .confirm-password-reset-text span').html(data.email);
                        $('#loginModal .g-password-reset-confirm-modal').removeClass('hide');
                        $('body').trigger('modalShown', { name: 'password-forgot-sent' });
                    } else {
                        formValidation(form, data);
                    }
                },
                error: function (err) {
                    console.log(err);
                }
            });
        }
        form.spinner().stop();
        return false;
    });
}

/**
 * Open login popup if page redirect from session expire
 */
function openLoginOnPageLoad() {
    if ($('input[name="showLogin"]').val() === 'true') {
        $('.b-header_account-link.js-login').trigger('click');
    }
}

/**
 * Open password reset popup if page redirect from password reset
 */
function openPasswordResetOnPageLoad() {
    if ($('input[name="showPasswordReset"]').val() === 'true') {
        $('.b-header_account-link.js-login').trigger('click', true);
    }
}

/**
 * On updating new password
 */
function updatePasswordSubmit() {
    $('body').on('click', '.js-passwordresetpage-button', function (e) {
        e.preventDefault();
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
                        formValidation(form, data);
                    } else {
                        $('#passwordresetSuccess').modal('show');
                    }
                },
                error: function (err) {
                    console.log(err);
                }
            });
        }
        form.spinner().stop();
        return false;
    });
}

/**
 * On close of reset password pop up
 */
function resetClosePopUp() {
    $('body').on('click', '.js-reset-popup-close', function (e) {
        e.preventDefault();
        var redirectUrl = $(this).attr('data-redirect-url');
        window.location.href = redirectUrl;
    });
}

module.exports = {
    loginModal: loginModal,
    loginSubmit: loginSubmit,
    showPassword: showPassword,
    resetPassword: resetPassword,
    passwordResetSubmit: passwordResetSubmit,
    openLoginOnPageLoad: openLoginOnPageLoad,
    openPasswordResetOnPageLoad: openPasswordResetOnPageLoad,
    updatePasswordSubmit: updatePasswordSubmit,
    faceBookLogin: faceBookLogin,
    resetClosePopUp: resetClosePopUp
};
