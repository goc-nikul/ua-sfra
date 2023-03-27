/* eslint-disable no-undef */
module.exports = function () {
    var validateFields = function () {
        var error = false;
        $('#sendNoteForm [required]').each((index, elem) => {
            if ($(elem).val().length < 1) {
                elem.setCustomValidity(window.faqResources.invalidField);
                if (elem.id === 'g-recaptcha') {
                    try {
                        if (grecaptcha.getResponse() === 0) {
                            error = true;
                        }
                    } catch (e) {
                        error = false;
                    }
                } else {
                    error = true;
                }
            } else {
                elem.setCustomValidity('');
            }
        });
        return error;
    };

    var check = function () {
        var error = false;
        var emailField = document.getElementById('email');
        var emailInput = emailField.value;

        emailField.setCustomValidity('');
        if (!/^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/.test(emailInput)) {
            emailField.setCustomValidity(window.faqResources.faqInvalidEmail);
            error = true;
        }
        return error;
    };

    var onInputChangeMethod = function (e) {
        if ($(e.target).val().length < 1 && e.target.id !== '00N4V00000ECopn') {
            e.target.setCustomValidity(window.faqResources.invalidField);
        } else {
            e.target.setCustomValidity('');
            check();
        }
    };

    check();
    validateFields();
    $(document).on('change keyup', onInputChangeMethod);
    $('#email').on('change input keyup', check);

    $('#sendNote').on('click', function () {
        var inquirytype = $('.inquiry-type');
        if (inquirytype.val() === '') {
            var scrollDiv = $('#sendNoteForm')[0].offsetTop;
            window.scrollTo({ top: scrollDiv, behavior: 'smooth' });
        }
    });

    $('#sendNoteForm').on('submit', function (e) {
        var error1 = check();
        var error2 = validateFields();
        if (error1 || error2) {
            e.preventDefault();
        }

        var response = grecaptcha.getResponse();
        // recaptcha failed validation
        if (response.length === 0) {
            e.preventDefault();
        }
        if (e.isDefaultPrevented()) {
            return false;
        }

        return true;
    });

    $('#sendNoteForm').on('submit', function (e) {
        if (typeof grecaptcha === 'undefined') return;

        var response = grecaptcha.getResponse();
        // recaptcha failed validation
        if (response.length === 0) {
            e.preventDefault();
        }
        if (e.isDefaultPrevented()) {
            return;
        }

        return;
    });
};
