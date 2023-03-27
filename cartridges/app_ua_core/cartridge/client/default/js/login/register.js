'use strict';

var clientSideValidation = require('../components/common/clientSideValidation');
var util = require('../util');

/**
 * Get cookie value by cookie name from browser
 * @param {string} cookieName - name of the cookie
 * @returns {string} cookie value of the found cookie name
 */
function getCookie(cookieName) {
    var name = cookieName + '=';
    var decodedCookie = decodeURIComponent(document.cookie);
    var cookieArray = decodedCookie.split(';');
    for (var i = 0; i < cookieArray.length; i++) {
        var cookieItem = cookieArray[i];
        while (cookieItem.charAt(0) === ' ') {
            cookieItem = cookieItem.substring(1);
        }
        if (cookieItem.indexOf(name) === 0) {
            return cookieItem.substring(name.length, cookieItem.length);
        }
    }
    return '';
}

/**
 * sets the 'registered' cookie
 */
function setRegisteredCookie() {
    var d = new Date();
    d.setTime(d.getTime() + (1 * 24 * 60 * 60 * 1000));
    var expires = 'expires=' + d.toGMTString();

    document.cookie = `showRegisteredModal=true; ${expires}; secure='on'; path=/;`;
}

/**
 * deletes the 'registered' cookie
 */
function deleteRegisteredCookie() {
    var d = new Date();
    d.setTime(d.getTime() + (0 * 24 * 60 * 60 * 1000));
    var expires = 'expires=' + d.toGMTString();

    document.cookie = `showRegisteredModal=false; ${expires}; secure='on'; path=/;`;
}

/**
 * Open create account modal
 * @param {Object} $this current element
 */
function getModalHtmlElement() {
    if ($('#newUserRegisterModal').length !== 0) {
        $('#newUserRegisterModal').remove();
    }
    var htmlString = '<!-- Modal -->'
        + '<div class="modal g-modal g-modal-registerUser" id="newUserRegisterModal" role="dialog">'
        + '<div class="modal-dialog g-modal-dialog ">'
        + '<!-- Modal content-->'
        + '<div class="modal-content g-modal-content">'
        + '<div class="modal-body g-modal-body"></div>'
        + '</div>'
        + '</div>'
        + '</div>';
    $('body').append(htmlString);
}

/**
 * On Submitting login on modal
 */
function submitCreateAccount() {
    $('body').on('click', '.js-createaccount-button', function (e) {
        e.preventDefault();
        $('.b-registration-error').addClass('hide');
        var $this = $(this).closest('form');
        var form = $(this).closest('form');
        var url = form.attr('action');
        var type = form.attr('method');
        var formdata = form.serialize();
        var registerForm = $('input[name="initializeRegisterForm"]');
        var inputFeedback = $(this).parents().find('#form-password-rules');
        inputFeedback.hide();
        form.spinner().start();

        if (clientSideValidation.checkPasswordContainsEmail(form) === false) {
            clientSideValidation.checkMandatoryField(form);
        }

        if (!form.find('input.is-invalid').length && (registerForm.length > 0 ? registerForm.val() === 'false' : true)) {
            registerForm.val(true);
            $.ajax({
                url: url,
                type: type,
                data: formdata,
                success: function (data) {
                    form.spinner().stop();
                    if (!data.success) {
                        if (data.invalidForm) {
                            var formValidation = require('base/components/formValidation');
                            formValidation($this, data);
                            form.trigger('login:error', data);
                        } else {
                            $('.b-registration-error').removeClass('hide');
                            var errorMsg = $('[data-analytics-track="error-span"]').text().trim() + ' ' + $('[data-analytics-track="error-link"]').text().trim();
                            $('body').trigger('register:error', { errorMsg: errorMsg });
                        }
                        registerForm.val(false);
                    } else {
                        form.trigger('login:success', data);
                        $('body').trigger('register:success:analytics', {
                            customerNo: data && data.customerNo,
                            addToEmailList: data && data.addToEmailList,
                            email: form.find('[name="dwfrm_profile_customer_email"]').val()
                        });
                        if ('loyaltyGatedModal' in data) {
                            $('body').trigger('loyalty:enroll', {
                                type: 'genericLink',
                                loyalty: data.loyaltyGatedModal,
                                action: data.loyaltyGatedModal ? 'joined-yes' : 'joined-no',
                                member: 'new_member',
                                points_earned: 0
                            });
                        }
                        if (data.shouldRedirect || $('.js-login-in-page').length > 0 || $('.b-order-confirmation').length > 0 || 'loyaltyGatedModal' in data) {
                            location.href = data.redirectUrl;
                        } else {
                            setRegisteredCookie();
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
        }
        form.spinner().stop();
        return false;
    });
}

/**
 * Events after open modal
 */
function registerCreateAccountEvents() {
    $('body').on('login:afterCreateAccountModal', function () {
        submitCreateAccount();
    });
}
/**
 * @param {Object} $this current element
 * request to render the create acccount modal
 */
function openCreateAccount($this) {
    $.spinner().start();
    $('body').find('.b-loader').css('z-index', '999');
    $.ajax({
        url: $this.data('href') || $this.attr('href'),
        data: { format: 'ajax' },
        error: function (err) {
            $.spinner().stop();
            console.log(err);
        },
        success: function (data) {
            $.spinner().stop();
            if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
                return;
            }
            $('body').find('.modal-backdrop.show').remove();
            $('.modal-body').empty();
            $('.modal-body').html(data);
            $('body').trigger('login:afterCreateAccountModal');
            util.branchCloseJourney();
            $('#newUserRegisterModal').modal('show');
            $('body').trigger('modalShown', { name: 'register' });
            $('#newUserRegisterModal').next('.modal-backdrop.show').css('z-index', '999');
        }
    });
}

/**
 * Register event to open create account modal
 */
function openCreateAccountModal() {
    $('body').on('click', '.js-register', function (e) {
        e.preventDefault();
        $('#newUserRegisterModal').remove();
        if ($('#loginModal').length > 0) {
            $('#loginModal').remove();
        }
        if ($(this).closest('.js-login-page').length > 0) {
            var loginUrl = $(this).attr('data-href');
            window.location.href = loginUrl;
            return false;
        } else if ($('.js-register-in-page').length > 0) {
            return false;
        }
        getModalHtmlElement();
        openCreateAccount($(this));
        return true;
    });
}

/**
 * Register event to open account created modal
 */
function openAccountCreatedModal() {
    $(document).ready(function () {
        if (getCookie('showRegisteredModal') === 'true') {
            if ($('#userRegisteredModal').length !== 0) {
                $('#userRegisteredModal').remove();
            }
            var htmlString = '<!-- Modal -->'
                + '<div class="modal g-modal g-modal-userRegistered" id="userRegisteredModal" role="dialog">'
                + '<div class="modal-dialog g-modal-dialog ">'
                + '<!-- Modal content-->'
                + '<div class="modal-content g-modal-content g-modal-content-user-registered">'
                + '<div class="modal-body g-modal-body"></div>'
                + '</div>'
                + '</div>'
                + '</div>';
            $('body').append(htmlString);

            $.spinner().start();
            $('body').find('.b-loader').css('z-index', '999');

            $.ajax({
                url: $('#account-created-modal-url').val(),
                method: 'GET',
                error: function () {
                    $.spinner().stop();
                },
                success: function (data) {
                    $.spinner().stop();
                    deleteRegisteredCookie();
                    $('body').find('.modal-backdrop.show').remove();
                    $('body').addClass('m-no-scroll');
                    $('.modal-body').empty();
                    $('.modal-body').html(data);
                    $('#userRegisteredModal').modal('show');
                    $('body').trigger('modalShown', { name: 'registered' });
                    $('#userRegisteredModal').next('.modal-backdrop.show').css('z-index', '999');
                }
            });
        }
    });

    $('body').on('click', '.continue-shopping-container, .g-registered-modal-close_button', function (e) {
        e.preventDefault();
        $('#userRegisteredModal').modal('hide');
        $('body').removeClass('m-no-scroll');
    });
}
/**
 * Register event consecutive space validator
 */
function consecutiveSpaceValidator() {
    var counter = 0;
    $('body').on('keydown', '#registration-form-email, #registration-form-password', function (e) {
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
 * Open register popup if page redirect from header section
 */
function openRegisterOnPageLoad() {
    if ($('input[name="showRegisterModal"]').val() === 'true') {
        $('.b-header_account-link.js-register').trigger('click');
    }
}


module.exports = {
    registerCreateAccountEvents: registerCreateAccountEvents,
    openCreateAccountModal: openCreateAccountModal,
    openAccountCreatedModal: openAccountCreatedModal,
    consecutiveSpaceValidator: consecutiveSpaceValidator,
    openRegisterOnPageLoad: openRegisterOnPageLoad
};
