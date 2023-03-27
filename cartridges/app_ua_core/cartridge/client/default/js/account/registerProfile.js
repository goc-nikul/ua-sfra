'use strict';

var clientSideValidation = require('../components/common/clientSideValidation');

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
 * On Submitting login on modal
 */
function submitCreateAccount() {
    $('body').on('click', '.b-login-register_screen .js-createaccount-button', function (e) {
        e.preventDefault();
        $('.b-registration-error').addClass('hide');
        var $this = $(this).closest('form');
        var form = $(this).closest('form');
        var url = form.attr('action');
        var type = form.attr('method');
        var formdata = form.serialize();
        form.spinner().start();

        if (clientSideValidation.checkPasswordContainsEmail(form) === false) {
            clientSideValidation.checkMandatoryField(form);
        }

        if (!form.find('input.is-invalid').length) {
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
                    } else {
                        form.trigger('login:success', data);
                        $('body').trigger('register:success:analytics', {
                            customerNo: data && data.customerNo,
                            addToEmailList: data && data.addToEmailList,
                            email: form.find('[name="dwfrm_profile_customer_email"]').val()
                        });

                        if (data.shouldRedirect) {
                            location.href = data.redirectUrl;
                        } else {
                            setRegisteredCookie();
                            if (data.shouldRedirectUrl) {
                                location.href = data.shouldRedirectUrl;
                            } else {
                                window.location.reload();
                            }
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
    submitCreateAccount();
}

/**
 * Register event consecutive space validator
 */
function consecutiveSpaceValidator() {
    var counter = 0;
    $('body').on('keydown', '.b-login-register_screen #registration-form-email, .b-login-register_screen #registration-form-password', function (e) {
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

module.exports = {
    registerCreateAccountEvents: registerCreateAccountEvents,
    consecutiveSpaceValidator: consecutiveSpaceValidator
};
