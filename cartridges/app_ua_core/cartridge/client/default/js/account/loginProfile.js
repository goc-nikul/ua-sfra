'use strict';

var formValidation = require('base/components/formValidation');
var clientSideValidation = require('../components/common/clientSideValidation');

/**
 * Show one of the three UI panels.
 * @param {string} selector show the panel IF this selector applies.
 */
function showPanel(selector) {
    $('.js-login-screen').find('.g-reset-password-modal, .js-login-panel, .js-login-forminfo').each(function () {
        var $panel = $(this);
        $panel.toggle($panel.is(selector));
    });
}

/**
 * Initialize the on-page login form.
 */
function init() {
    $('.js-login-screen').find('.g-password-reset-confirm-modal').hide();
    showPanel('.js-login-panel, .js-login-forminfo');
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
    $('body').on('click', '.js-login-screen .js-reset-password', function (e) {
        e.preventDefault();
        showPanel('.g-reset-password-modal');
        $('.g-password-modal-body').show(); // re-init the reset dialog
        $('.g-password-reset-confirm-modal').hide();
        $('.js-login-forminfo').hide();
        $('.reset-password-header .request-password-title').show();
    });
}

/**
 *
 */
function returnToLogin() {
    $('body').on('click', '.js-login-screen .js-login', function (e) {
        e.preventDefault();
        showPanel('.js-login-panel, .js-login-forminfo');
        if ($('.js-account-profile-page').length > 0) {
            $('html, body').animate({ scrollTop: 0 }, 0);
        }
        e.stopPropagation();
        e.stopImmediatePropagation();
    });
}

/**
 * Validate the login Inputs
 */
function loginSubmit() {
    $('body').on('click', '.js-login-screen .js-login-button', function (e) {
        e.preventDefault();
        var form = $(this).closest('form');
        var url = form.attr('action');
        if ($('.js-account-profile-page').length > 0) {
            url += '&refreshTokenAjax=true';
        }
        var params = new URLSearchParams(window.location.search);
        var OrderHistoryParamValue = params.get('orderHistory');
        if (OrderHistoryParamValue === 'true') {
            url = url.includes('rurl=1') ? url.replace('rurl=1', 'rurl=4') : url;
        }
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

                        if ($('.js-login-in-page').length > 0) {
                            location.href = data.redirectUrl;
                        } else if ($('.js-account-profile-page').length > 0) {
                            var csrfToken = data && data.csrfToken && data.csrfToken.token;
                            $('.js-login-screen').addClass('hide');
                            $('.js-account-profile-page').removeClass('hide');
                            if (csrfToken) {
                                $('form').find('[name="csrf_token"]').val(csrfToken);
                            }
                            $('.account-save-button').trigger('click');
                        } else if ($('.b-order-confirmation').length || $('.b-account-history').length || ($('#checkout-main').length > 0 && data.isEmployee) || ($('#checkout-main').length === 0 && data.errorInProfileValues)) {
                            // Redirect to account page only on order confirmation, else refresh current page
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
    $('body').on('click', '.js-login-screen .js-passwordreset-modal', function (e) {
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
                        var $panel = $('.g-reset-password-modal');
                        $('.confirm-reset-password-title', $panel).html(data.receivedMsgHeading);
                        $('.confirm-password-reset-text', $panel).html(data.receivedMsgBody);
                        $('.confirm-password-reset-text span', $panel).html(data.email);

                        var $footer = $('.reset-password-footer', $panel);
                        $footer.insertAfter($('.g-password-reset-confirm-modal', $panel));
                        $('.request-password-title, .g-password-modal-body', $panel).hide();
                        $('.g-password-reset-confirm-modal', $panel).show();
                        $('.g-password-reset-confirm-modal .g-password-modal-body', $panel).show();
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
 * On updating new password
 */
function updatePasswordSubmit() {
    $('body').on('click', '.js-login-screen .js-passwordresetpage-button', function (e) {
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

var counter = 0;
$('#login-form-email, #login-form-password').on('keydown', function (e) {
    if (e.which === 32 || e.keyCode === 32) {
        counter += 1;
        if (counter > 1) {
            e.preventDefault();
        }
    } else {
        counter = 0;
    }
});

module.exports = {
    init: init,
    loginSubmit: loginSubmit,
    resetPassword: resetPassword,
    returnToLogin: returnToLogin,
    passwordResetSubmit: passwordResetSubmit,
    updatePasswordSubmit: updatePasswordSubmit,
    faceBookLogin: faceBookLogin
};
