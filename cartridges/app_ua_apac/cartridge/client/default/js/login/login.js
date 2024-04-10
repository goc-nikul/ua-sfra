'use strict';

var formValidation = require('base/components/formValidation');
var location = window.location;
var clientSideValidation = require('../components/common/clientSideValidation');
var util = require('org/util');

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
    var naverRedirectURL = !$('.b-order-confirmation').length ? window.location.href : null;
    var eaQty = $('.js-quantity-select').val();
    if ($('.ua-early-access').length && window.earlyAccessPid) {
        if (naverRedirectURL.indexOf('#') !== -1) {
            var noHashURL = naverRedirectURL.split('#')[0];
            var hash = naverRedirectURL.split('#')[1];
            naverRedirectURL = util.appendParamsToUrl(noHashURL, { earlyAccessPid: window.earlyAccessPid, eaQty: eaQty, triggerATC: true });
            naverRedirectURL += '#' + hash;
        } else {
            naverRedirectURL = util.appendParamsToUrl(naverRedirectURL, { earlyAccessPid: window.earlyAccessPid, eaQty: eaQty, triggerATC: true });
        }
    }
    $.ajax({
        url: $('.b-account-history').data('login-url') || $this.data('href') || $this.attr('href'),
        data: { format: 'ajax', naverRedirectURL: naverRedirectURL, pageRef },
        error: function () {
            $.spinner().stop();
        },
        success: function (data) {
            $.spinner().stop();
            $('body').find('.modal-backdrop.show').remove();
            $('#loginModal .g-modal-content').empty();
            $('#loginModal .g-modal-content').html(data);
            if ($('input[name="showValidationMessage"]').length && $('input[name="showValidationMessage"]').val() !== '') {
                var validateRes = JSON.parse($('input[name="showValidationMessage"]').val());
                $('<div class="validateMsg"><p>' + validateRes.validateMsg + '</p></div>').prependTo('#loginModal .g-modal-content');
                if (validateRes.validationProfile === 'false') {
                    $('#loginModal .g-login-modal-header h2, #loginModal .g-login-modal-header .free-shipping-promotion, #loginModal .g-modal-body').addClass('d-none');
                }
                $('input[name="showValidationMessage"]').val('');
            }

            // Handle NaverSSO Error
            if ($('input[name="showNaverValidationMessage"]').length && $('input[name="showNaverValidationMessage"]').val() !== '') {
                var naverValidateRes = $('input[name="showNaverValidationMessage"]').val();
                // Handle NaverSSO Error
                $('<div class="validateMsg invalid-feedback"><p>' + naverValidateRes + '</p></div>').prependTo('#loginModal .g-modal-content');
                $('input[name="showNaverValidationMessage"]').val('');
            }
            $('.g-reset-password-modal').addClass('hide');
            $('.g-force-password-reset-confirm-modal').addClass('hide');
            util.branchCloseJourney();
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
            $('html').removeClass('modal-open');
            $('#newUserRegisterModal').remove();
        }
        if ($(this).closest('.js-register-in-page').length > 0) {
            var registerUrl = $(this).attr('data-href');
            if ($(this).hasClass('b-registration-error-link')) {
                registerUrl = $(this).attr('href');
            }
            window.location.href = registerUrl;
            return false;
        } else if ($('.js-account-profile-page').length > 0) {
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
        var attributes = e.currentTarget.attributes;
        var isLoyalty = false;
        if (attributes.isLoyalty && attributes.isLoyalty.value) {
            isLoyalty = attributes.isLoyalty.value;
        }
        this.$target = $('.g-reset-password-modal').clone();
        $('#loginModal .g-modal-content').empty();
        $('#loginModal .g-modal-content').append(this.$target);
        if (isLoyalty) {
            var loginURL = $('#loginModal .loyalty-login').attr('href');
            $('#loginModal .loyalty-login').attr('href', loginURL + '?pilotEnroll=' + isLoyalty);
            $('#loginModal #backToLoginButton').attr('href', loginURL + '?pilotEnroll=' + isLoyalty);
        }
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
        if (inputField.hasClass('delete-account-password-disc')) {
            inputField.attr('type', 'password');
        }
        var typee = inputField.attr('type');
        if (typee === 'password') {
            inputField.attr('type', 'text');
            $(this).html(hideLabel);
            $('.js-custom-input').removeClass('delete-account-password-disc');
        } else {
            inputField.attr('type', 'password');
            $(this).html(showLabel);
            $('.js-custom-input').removeClass('delete-account-password-disc');
        }
    });
}

/**
 * Validate the login Inputs
 */
function loginSubmit() {
    $('body').on('click', '#loginModal .js-login-button, #sleepingInfoMain .js-login-button', function (e) {
        e.preventDefault();
        var form = $(this).closest('form');
        var url = form.attr('action');
        var button = $(this);
        var buttonContainer = $(this).parent('div');
        var buttonText = button.html();
        button.html('');
        button.blur();
        $('.b-invalid-cred').hide();
        buttonContainer.spinner().start();
        button.attr('disabled', 'true');
        clientSideValidation.checkMandatoryField(form);
        if (!form.find('input.is-invalid').length) {
            if (window.earlyAccessPid) {
                url = util.appendParamsToUrl(url, { earlyAccessPid: window.earlyAccessPid });
            }
            var formdata = form.serialize();
            if ($('.l-pdp').length > 0 && window.memberPricePid) {
                formdata += '&memberPricePid=' + window.memberPricePid;
            }
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: formdata,
                success: function (data) {
                    if (!data.success && data.error_code === 'ERROR_PASSWORD_RESET_REQUIRED') {
                        let resetModal = $('.g-force-password-reset-confirm-modal').clone();
                        $('#loginModal .g-modal-content').empty();
                        $('#loginModal .g-modal-content').append(resetModal);
                        $('.g-force-password-reset-confirm-modal').removeClass('hide');
                        buttonContainer.spinner().stop();
                        button.prop('disabled', false);
                        button.html(buttonText);
                    } else if (!data.success) {
                        $('form.login').trigger('login:error', data);
                        $('body').trigger('login:failed', {
                            errorMessage: data && data.error && data.error[0]
                        });
                        $('.b-invalid-cred').html(data.error).show();
                        buttonContainer.spinner().stop();
                        button.prop('disabled', false);
                        button.html(buttonText);
                    } else {
                        $('form.login').trigger('login:success', data);
                        $('body').trigger('login:success:analytics', {
                            customerNo: data && data.customerNo,
                            email: form.find('[name="loginEmail"]').val()
                        });
                        if (!('membersonConsentPending' in data)) {
                            if ($('.l-pdp').length > 0 && window.memberPricePid && data.memberPriceModalContent) {
                                $('#loginModal').modal('hide');
                                window.keepMemberPricingVar = true;
                                $('body').trigger('memberpricing:successpopup', {
                                    memberPriceModalContent: data.memberPriceModalContent
                                });
                                return;
                            }
                            if (window.earlyAccessPid && 'earlyAccess' in data && $('.ua-early-access').length) {
                                var earlyAccess = require('org/components/product/earlyAccess');
                                earlyAccess.updateEarlyAccessAttributes(data.earlyAccess);
                                if (!data.mobileAuthPending) {
                                    if ($('.js-add-to-cart').length) {
                                        var urlParams = new URLSearchParams(window.location.search);
                                        if (!urlParams.has('earlyAccessPid')) {
                                            urlParams.set('earlyAccessPid', window.earlyAccessPid);
                                            urlParams.set('triggerATC', true);
                                            urlParams.set('eaQty', $('.js-quantity-select').val() || 1);
                                        }
                                        var hash = '';
                                        if (window.location.href.indexOf('#') !== -1) {
                                            hash = '#' + window.location.href.split('#')[1];
                                        }
                                        var urlWithEarlyAccessParams = window.location.pathname + '?' + urlParams.toString() + hash;
                                        history.replaceState({}, '', urlWithEarlyAccessParams);
                                        button.html(buttonText);
                                        window.location.reload();
                                    }
                                    delete window.earlyAccessPid;
                                    return;
                                }
                            }
                        } else if ($('.l-pdp').length > 0 && window.memberPricePid && data.memberPriceModalContent) {
                            var currentPage = window.location.href;
                            currentPage = util.appendParamsToUrl(currentPage, { memberPriceLoginPopup: true });
                            history.replaceState({}, '', currentPage);
                            button.html(buttonText);
                            window.location.reload();
                        }
                        if (data.mobileAuthPending) {
                            if ($('.product-detail').length && window.earlyAccessPid) {
                                var eaQty = $('.js-quantity-select').val();
                                var currentPageURL = new URL(window.location.href);
                                currentPageURL.searchParams.set('earlyAccessPid', window.earlyAccessPid);
                                currentPageURL.searchParams.set('eaQty', eaQty);
                                currentPageURL.searchParams.set('triggerATC', true);
                                window.history.replaceState(null, null, currentPageURL); // or pushState
                                delete window.earlyAccessPid;
                            }
                            $('.js-init-mobileauth-login').eq(0).trigger('click');
                            return;
                        }
                        if ('loyaltyGatedModal' in data) {
                            $('body').trigger('loyalty:enroll', {
                                type: 'genericLink',
                                loyalty: data.loyaltyGatedModal,
                                action: data.loyaltyGatedModal ? 'joined-yes' : 'joined-no',
                                member: 'current_member',
                                points_earned: 0
                            });
                        }
                        button.html(buttonText);
                        button.attr('disabled', 'true');
                        // Redirect to account page only on order confirmation, else refresh current page
                        if ($('.b-order-confirmation').length || $('.b-account-history').length || ($('#checkout-main').length > 0 && data.isEmployee) || ($('#checkout-main').length > 0 && data.isVIP) || 'loyaltyGatedModal' in data) {
                            location.href = data.redirectUrl;
                        } else if ('isSleepingRedirect' in data && data.isSleepingRedirect && data.redirectUrl) {   // Handle redirection for sleeping customers
                            location.href = data.redirectUrl;
                        } else {
                            window.location.reload();
                        }
                    }
                },
                error: function (data) {
                    if (data.status === 418 || data.status === 406) {
                        $('.b-invalid-cred').html($('.b-invalid-cred').attr('data-blocked-msg')).show();
                    }
                    if (data.responseJSON && data.responseJSON.redirectUrl) {
                        window.location.href = data.responseJSON.redirectUrl;
                    } else {
                        $('form.login').trigger('login:error', data);
                        buttonContainer.spinner().stop();
                        button.prop('disabled', false);
                        button.html(buttonText);
                    }
                }
            });
        } else {
            $('body').trigger('login:failed', {
                emailErrorMessage: $('#form-email-error').text(),
                passwordErrorMessage: $('#form-password-error').text()
            });
            buttonContainer.spinner().stop();
            button.prop('disabled', false);
            button.html(buttonText);
        }
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
                    this.$target = $('.g-password-reset-confirm-modal').clone();
                    $('#loginModal .g-modal-content').empty();
                    $('#loginModal .g-modal-content').append(this.$target);
                    $('body').find('#loginModal .confirm-reset-password-title').html(data.receivedMsgHeading);
                    $('body').find('#loginModal .confirm-password-reset-text').html(data.receivedMsgBody);
                    $('.g-password-reset-confirm-modal').removeClass('hide');
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

/**
 * Login event consecutive space validator
 */
function consecutiveSpaceValidator() {
    var counter = 0;
    $('body').on('keydown', '#login-form-email, #login-form-password', function (e) {
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

/**
 * Event to handle popup close for early access products
 */
function onPopupClose() {
    $('body').on('hidden.bs.modal', '#loginModal', function () {
        if ($('.l-pdp').length > 0 && window.earlyAccessPid) {
            const url = $('.ua-early-access').length > 0 ? $('.ua-early-access').attr('data-chk-ea-url') : '';
            if (url) {
                const isEarlyAccessCustomer = $('.ua-early-access').attr('data-is-ea-customer');
                $.ajax({
                    url: url,
                    method: 'GET',
                    success: function (data) {
                        if (data.success && data.earlyAccess.isEarlyAccessProduct && data.earlyAccess.isLoggedIn) {
                            var earlyAccess = require('org/components/product/earlyAccess');
                            earlyAccess.updateEarlyAccessAttributes(data.earlyAccess);
                            if ((isEarlyAccessCustomer !== data.earlyAccess.isEarlyAccessCustomer) && $('.js-add-to-cart').length > 0) {
                                $('.b-product_actions-inner .js-add-to-cart').trigger('click');
                            }
                        }
                    },
                    error: function (err) {
                        console.log(err);
                    }
                });
            }
        }
        delete window.earlyAccessPid;
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
    resetClosePopUp: resetClosePopUp,
    consecutiveSpaceValidator: consecutiveSpaceValidator,
    onPopupClose: onPopupClose
};
