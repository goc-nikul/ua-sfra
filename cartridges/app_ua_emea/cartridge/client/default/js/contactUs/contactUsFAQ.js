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
        var emailConfirmField = document.getElementById('emailConfirm');
        var emailInput = emailField.value;
        var emailConfirm = emailConfirmField.value;

        emailField.setCustomValidity('');
        emailConfirmField.setCustomValidity('');

        if (emailConfirm !== emailInput || !emailConfirm || !emailInput) {
            if (!emailInput) {
                emailField.setCustomValidity(
                    window.faqResources.faqErrorEmailMatch
                );
                error = true;
            } else {
                emailConfirmField.setCustomValidity(
                    window.faqResources.faqErrorEmailMatch
                );
                error = true;
            }
        }
        if (!/^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/.test(emailInput)) {
            emailField.setCustomValidity(window.faqResources.faqInvalidEmail);
            error = true;
        }
        if (!/^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/.test(emailConfirm)) {
            emailConfirmField.setCustomValidity(
                window.faqResources.faqInvalidEmail
            );
            error = true;
        }
        return error;
    };

    var onInputChangeMethod = function (e) {
        if ($(e.target).val().length < 1) {
            e.target.setCustomValidity(window.faqResources.invalidField);
        } else {
            e.target.setCustomValidity('');
            check();
        }
    };

    check();
    validateFields();
    $(document).on('change keyup', onInputChangeMethod);
    $('#emailConfirm, #email').on('change input keyup', check);
    $('#type').on('change', function () {
        var el = $(this);
        var faqResources = window.faqResources;
        var subTopic = $('#00N4V00000ECopw');
        if (el.val() === 'Select one') {
            subTopic.children().remove().end().append('<option value="">' + faqResources.faqPleaseSelect + '</option>');
        } else if (el.val() === 'Privacy') {
            subTopic.children().remove().end().append('<option value="Unsubscribe">' + faqResources.faqUnsubscribeEmail + '</option><option value="Data Deletion">' + faqResources.faqAccountDeletion + '</option>');
        } else if (el.val() === 'Orders & Tracking') {
            subTopic.children().remove().end().append('<option value="Cancel">' + faqResources.faqCancel + '</option><option value="Status">' + faqResources.faqStatus + '</option>');
        } else if (el.val() === 'Other') {
            subTopic.children().remove().end().append('<option value="General Feedback">' + faqResources.faqGeneralFeedback + '</option>');
        } else if (el.val() === 'Product Inquiry') {
            subTopic.children().remove().end().append('<option value="Availability / Stock Inquiry">' + faqResources.faqAvailability + '</option><option value="Product DNA Sizing/Specs/Fit&Care">' + faqResources.faqProductDna + '</option>');
        } else if (el.val() === 'Return') {
            subTopic.children().remove().end().append('<option value="Refund Status">' + faqResources.faqRefundStatus + '</option><option value="UA.Com/Label">' + faqResources.faqUaLabel + '</option>');
        }
        subTopic[0].setCustomValidity('');
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

    $('[type="submit"]').on('click', function () {
        // this adds 'required' class to all the required inputs under the same <form> as the submit button
        $(this).closest('form').find('[required]').addClass('required');
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

    var timestamp = function () {
        var response = document.getElementById('g-recaptcha-response');
        if (response == null || response.value.trim() === '') {
            var elems = JSON.parse(
                document.getElementsByName('captcha_settings')[0].value
            );
            elems.ts = JSON.stringify(new Date().getTime());
            document.getElementsByName(
                'captcha_settings'
            )[0].value = JSON.stringify(elems);
        }
    };
    setInterval(timestamp, 500);
};
