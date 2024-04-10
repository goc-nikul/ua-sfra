'use strict';

var register = require('../login/register');

/**
 * On Submitting login on modal
 */
function submitCreateAccount() {
    register.submitCreateAccount();
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
