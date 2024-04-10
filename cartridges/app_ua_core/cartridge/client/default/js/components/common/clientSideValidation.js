'use strict';

/**
 * Displays error messages for invalid field
 * input button
 * @param {Object} data - validate the fields
 */
function checkMandatoryField(data) {
    var $this = data;
    var valid = true;
    if ($this !== undefined && $this !== '' && $this !== null) {
        $this.find('.form-control.is-invalid').removeClass('is-invalid');
        $this.find('.g-selectric-container.is-invalid').removeClass('is-invalid');
        $this.find('.g-selectric-container .invalid-feedback').text('');
        $this.parent().removeClass('error-field');
        // Display error messages
        if (($('.validatePhoneField').length > 0 && $('.validatePhoneField').val().length > 0 && $('.validatePhoneField').is(':visible')) || $('.validatePhoneField').hasClass('smsValidation')) {
            $('.validatePhoneField').trigger('submit');
        }
        if ($('.customer-phonenumber').length > 0) {
            $('.validatePhoneField').trigger('keyup');
        }

        $this.find('input:visible, select:visible').each((index, input) => {
            var isConfirmField = $(input).hasClass('js-confirm-password');
            if (!input.validity.valid && !isConfirmField) {
                if (input.checkValidity && !input.checkValidity()) {
                    // safari
                    valid = false;
                    if (event) {
                        event.preventDefault();
                        event.stopPropagation();
                        event.stopImmediatePropagation();
                    }
                    if (!input.validity.valid) {
                        input.setCustomValidity('');
                        if (!input.validity.valid) {
                            var validationMessage = input.validationMessage;
                            $(input).addClass('is-invalid');
                            $(input).parent().addClass('error-field');
                            if ($(input).parent().hasClass('g-selectric-hide-select')) {
                                $(input).parents('.g-selectric-container').addClass('is-invalid');
                            }
                            if ((input.validity.patternMismatch || input.validity.typeMismatch) && $(input).data('pattern-mismatch')) {
                                validationMessage = $(input).data('pattern-mismatch');
                            }
                            if ((input.validity.rangeOverflow || input.validity.rangeUnderflow)
                                && $(input).data('range-error')) {
                                validationMessage = $(input).data('range-error');
                            }
                            if ((input.validity.tooLong || input.validity.tooShort)
                                && $(input).data('range-error')) {
                                validationMessage = $(input).data('range-error');
                            }
                            if (input.validity.valueMissing && $(input).data('missing-error')) {
                                if ($(input).hasClass('js-password-field')) {
                                    $(input).parents().find('.invalid-feedback-email').html($(input).data('missing-error'))
                                    .show();
                                    $(input).parents().find('#form-password-rules').hide();
                                } else {
                                    validationMessage = $(input).data('missing-error');
                                }
                            }
                            if ($(input).parent().find('.input-feedback').length) {
                                validationMessage = $(input).parent().find('.input-feedback').html();
                            }
                            // hide the input feedback
                            $(input).parent().find('.input-feedback').hide();

                            // show validation error.
                            $(input).parents('.form-group').find('.invalid-feedback')
                                .html(validationMessage);
                            $('.next-step-button button').removeAttr('data-clicked');
                            var headrHeight = $('.js-header').height();
                            var errorForm = $this.find('.is-invalid:first');
                            var isGCForm = $this.hasClass('js-giftcard-form');
                            var isLoginForm = $this.hasClass('login');
                            var resetPasswordForm = $this.hasClass('reset-password-form');
                            var isCreateAccount = $this.hasClass('registration');
                            var isEmailsignup = $this.hasClass('.email-pop-up_signup-form');
                            var errorParent = errorForm.parents('.form-group');
                            var stickyApplyPromo = $('.b-checkout_sticky-applypromo').outerHeight();
                            var checkoutHeight = headrHeight + stickyApplyPromo + 10;
                            if (errorForm) {
                                if (!(isLoginForm || isCreateAccount || isEmailsignup || resetPasswordForm)) {
                                    if (isGCForm && $('.b-payment-info').length) {
                                        $('html, body').animate({
                                            scrollTop: $('.b-payment-info .b-shipping-summary_header-line').position().top
                                        });
                                    } else if ($('.b-checkout_page').length > 0 && $(window).width() < 1024) {
                                        $('html, body').animate({
                                            scrollTop: errorParent.offset().top - checkoutHeight - 10
                                        }, 500);
                                    } else {
                                        $('html, body').animate({
                                            scrollTop: errorParent.offset().top - headrHeight - 10
                                        }, 500);
                                    }
                                }
                            }
                        }
                    }
                } else {
                    return valid;
                }
            }
            return true;
        });
    }
}

/**
 * Checks if the password contains email.
 * @param {Object} data - form or element containing js-email-field and js-password-field.
 * @returns {boolean} - indicate if password contains email.
 */
function checkPasswordContainsEmail(data) {
    var $this = data;
    if ($this !== undefined && $this !== '' && $this !== null) {
        var passwordField = $this.find('.js-password-field');

        let canContainEmail = passwordField.data('can-contains-email');
        if (canContainEmail === true) return false; // halt check operation if system allows user email in password.

        var email = $this.find('.js-email-field').length ? $this.find('.js-email-field').val() : null;

        var password = passwordField && passwordField.length ? passwordField.val() : null;

        if (password !== null && email !== null && email.length > 0 && password.toLowerCase().indexOf(email.toLowerCase()) !== -1) {
            $(passwordField).parent().find('.input-feedback').hide(); // hide the input feedback
            $(passwordField).parents('.form-group').addClass('error-field');
            $(passwordField).parents('.form-group').find('.invalid-feedback-email').text(passwordField.data('contains-email-error'))
            .show();

            passwordField.get(0).setCustomValidity(passwordField.data('contains-email-error'));
            passwordField.addClass('is-invalid');

            return true;
        }
    }

    return false;
}

/**
 * Handle validate address on keypress/paste
 * @param {Object} evtThis - previous this
 */
function handleValidateAddress(evtThis) {
    var $this = $(evtThis);
    var str;
    var customRegex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff]|[\u0250-\ue007])/;
    var emoRegex = /([#0-9]\u20E3)|[\xA9\xAE\u203C\u2047-\u2049\u2122\u2139\u3030\u303D\u3297\u3299][\uFE00-\uFEFF]?|[\u2190-\u21FF][\uFE00-\uFEFF]?|[\u2300-\u23FF][\uFE00-\uFEFF]?|[\u2460-\u24FF][\uFE00-\uFEFF]?|[\u25A0-\u25FF][\uFE00-\uFEFF]?|[\u2600-\u27BF][\uFE00-\uFEFF]?|[\u2900-\u297F][\uFE00-\uFEFF]?|[\u2B00-\u2BF0][\uFE00-\uFEFF]?|(?:\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDEFF])[\uFE00-\uFEFF]?/g;
    var emoStr = $this.val();
    str = emoStr.replace(new RegExp(emoRegex, 'g'), '');
    str = str.replace(new RegExp(customRegex, 'g'), '');
    var attr = $this.attr('name');
    var position = $this[0].selectionStart;
    if (typeof attr !== typeof undefined && attr !== false && (attr.indexOf('_address1') > -1 || attr.indexOf('_address2') > -1)) {
        str = str.replace(/_/g, '');
        if ($this.val().length === 35) {
            var validationMessage = $this.data('lengthexceeded-error');
            $this.parent().addClass('error-field');
            $this.addClass('is-invalid');
            $this.parent().find('.invalid-feedback')
            .text(validationMessage);
            $('.address-picklist-container').remove();
        } else {
            $this.parent().removeClass('error-field');
            $this.removeClass('is-invalid');
            $this.parent().find('.invalid-feedback').empty();
        }
    }
    $this.val(str);
    if (!$($this[0]).hasClass('g-checkbox-input')) {
        $this[0].selectionEnd = position;
    }
}

/**
 * Check that the password and password confirmation field match.
 * @param {Object} data - form or element containing js-password-field and js-confirm-password.
 * @returns {boolean} - indicate if passwords match.
 */
function validatePasswordConfirm(data) {
    var $this = data;
    if ($this !== undefined && $this !== '' && $this !== null) {
        var passwordField = $this.find('.js-password-field');
        var confirmField = $this.find('.js-confirm-password');

        if (passwordField.length > 0 && confirmField.length > 0) {
            var confirm = confirmField.val();
            var password = passwordField.val();
            if (password.length && confirm.length) {
                if (password !== confirm) {
                    var errorMsg = confirmField.data('password-mismatch');
                    confirmField.get(0).setCustomValidity(errorMsg);
                    confirmField.closest('.form-group').addClass('error-field');
                    confirmField.parent().find('.invalid-feedback').html(errorMsg);
                    confirmField.addClass('is-invalid');
                    if ($(data).hasClass('edit-profile-form')) {
                        var headerHeight = $('.js-header').height();
                        var errorForm = $(data).find('.is-invalid:first');
                        var errorParent = errorForm.closest('.form-group');
                        $('html, body').animate({
                            scrollTop: errorParent.offset().top - headerHeight - 10
                        }, 500);
                    }
                    return false;
                }
            }
        }
    }
    return true;
}

/**
 * Validate whole form. Requires `this` to be set to form object
 * @param {jQuery.event} event - Event to be canceled if form is invalid on blur.
 * @returns {boolean} - Flag to indicate if form is valid on blur
 */
function validateFormBlur(event) {
    var valid = true;
    if (this.checkValidity && !this.checkValidity()) {
        // safari
        valid = false;
        if (event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        }
        if (!this.validity.valid) {
            this.setCustomValidity('');
            if (!this.validity.valid) {
                var validationMessage = this.validationMessage;
                $(this).addClass('is-invalid');
                $(this).parent().addClass('error-field');
                if ($(this).parent().find('.input-feedback').length) {
                    validationMessage = $(this).parent().find('.input-feedback').html();
                }
                if (this.validity.patternMismatch && $(this).data('pattern-mismatch')) {
                    validationMessage = $(this).data('pattern-mismatch');
                }
                if ((this.validity.rangeOverflow || this.validity.rangeUnderflow)
                    && $(this).data('range-error')) {
                    validationMessage = $(this).data('range-error');
                }
                if ((this.validity.tooLong || this.validity.tooShort)
                    && $(this).data('range-error')) {
                    validationMessage = $(this).data('range-error');
                }
                if (this.validity.valueMissing && $(this).data('missing-error')) {
                    if ($(this).hasClass('js-password-field')) {
                        $(this).parents().find('.invalid-feedback-email').html($(this).data('missing-error'))
                        .show();
                        $(this).parents().find('#form-password-rules').hide();
                    } else {
                        validationMessage = $(this).data('missing-error');
                    }
                }
                $(this).parents('.form-group').find('.invalid-feedback')
                    .html(validationMessage);
                var headrHeight = $('.js-header').height();
                var errorForm = $(this).parents('form').find('.is-invalid:first');
                var isGCForm = $(this).parents('form').hasClass('js-giftcard-form');
                var isLoginForm = $(this).parents('form.login');
                var isCreateAccount = $(this).parents('form.registration');
                var isEmailsignup = $(this).parents('form.email-pop-up_signup-form');
                var errorParent = errorForm.parents('.form-group');
                var stickyApplyPromo = $('.b-checkout_sticky-applypromo').outerHeight();
                var checkoutHeight = headrHeight + stickyApplyPromo + 10;
                if (errorForm) {
                    if (!isLoginForm || !isCreateAccount || !isEmailsignup) {
                        if (isGCForm && $('.b-payment-info').length) {
                            $('html, body').animate({
                                scrollTop: $('.b-payment-info .b-shipping-summary_header-line').position().top
                            });
                        } else if ($('.b-checkout_page').length > 0 && $(window).width() < 1024) {
                            $('html, body').animate({
                                scrollTop: errorParent.offset().top - checkoutHeight - 10
                            }, 500);
                        } else {
                            $('html, body').animate({
                                scrollTop: errorParent.offset().top - headrHeight - 10
                            }, 500);
                        }
                    }
                }
            }
        }
    } else if (!$(this).hasClass('shippingAddressTwo') && $(this).hasClass('is-invalid')) {
        $(this).removeClass('is-invalid');
        $(this).parent().removeClass('error-field');
        $(this).closest('div').find('.invalid-feedback').text('');
    }
    return valid;
}
/**
 * Billing Address ZipCode Validation
 * @param {Object} $form form element
 */
function validateZipCode($form) {
    var $formName;
    var $zipCodeField;
    var $zipCodeInput;
    var $zipCodeVal;
    var $countryField;
    var $countrySelected;
    var $regexPattern;
    if (typeof $form === 'undefined') {
        return;
    }
    if ($form === 'dwfrm_billing') {
        $formName = $('form[name =' + $form + ']');
        $zipCodeField = $formName.find('input#billingZipCode')[0];
        $zipCodeInput = $formName.find('input#billingZipCode');
        $zipCodeVal = $zipCodeInput.val();
        $countryField = $formName.find('select#billingCountry');
        $countrySelected = $formName.find('select#billingCountry option:selected').val();
    } else if ($form === 'dwfrm_internationalAddress') {
        $formName = $('form[name =' + $form + ']');
        $zipCodeField = $formName.find('input#zipCode')[0];
        $zipCodeInput = $formName.find('input#zipCode');
        $zipCodeVal = $zipCodeInput.val();
        $countryField = $formName.find('select#country');
        $countrySelected = $formName.find('select#country option:selected').val();
    }
    $regexPattern = {
        US: [/^\d{5}$|^\d{5}-\d{4}$/, 'Please enter valid zip code'],
        CA: [/^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]( )?\d[ABCEGHJKLMNPRSTVWXYZ]\d$/i, 'Please enter valid zip code'],
        AT: [/^\d{4}$/, 'Please enter valid zip code'],
        BE: [/^\d{4}$/, 'Please enter valid zip code'],
        DK: [/^\d{4}$/, 'Please enter valid zip code'],
        FR: [/^\d{5}$/, 'Please enter valid zip code'],
        DE: [/^\d{5}$/, 'Please enter valid zip code'],
        GB: [/^([A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}|GIR ?0A{2})$/i, 'Please enter valid zip code'],
        IE: [/(?:^[AC-FHKNPRTV-Y][0-9]{2}|D6W)[ -]?[0-9AC-FHKNPRTV-Y]{4}$/i, 'Please enter valid zip code'],
        IT: [/^\d{5}$/, 'Please enter valid zip code'],
        NL: [/^(?:NL-)?(\d{4})\s*([A-Z]{2})$/i, 'Please enter valid zip code'],
        ES: [/^\d{5}$/, 'Please enter valid zip code'],
        SE: [/^\d{3}\s*\d{2}$/, 'Please enter valid zip code']
    };

    if ($zipCodeInput.hasClass('is-invalid') || $countryField.hasClass('is-invalid')) {
        $zipCodeInput.removeClass('is-invalid');
        $countryField.removeClass('is-invalid');
        $countryField.parents('.form-group').removeClass('error-field');
        $zipCodeInput.parents('.form-group').removeClass('error-field');
        $countryField.parents('.form-group').find('.invalid-feedback').empty();
        $zipCodeInput.parents('.form-group').find('.invalid-feedback').empty();
    } else if ($zipCodeVal !== '' && $countrySelected === '') {
        $countryField.addClass('is-invalid');
        $countryField.parents('.form-group').addClass('error-field');
        $countryField.parents('.form-group').find('.invalid-feedback').text('please select country');
    } else if ($zipCodeVal !== '' && $countrySelected !== '' && $regexPattern[$countrySelected]) {
        var constraint = new RegExp($regexPattern[$countrySelected][0], '');
        if (constraint.test($zipCodeVal)) {
            $zipCodeField.setCustomValidity('');
        } else {
            $('.next-step-button button').removeAttr('data-clicked');
            $zipCodeField.setCustomValidity($regexPattern[$countrySelected][1]);
            $zipCodeInput.addClass('is-invalid');
            $zipCodeInput.parents('.form-group').addClass('error-field');
            $zipCodeInput.parents('.form-group').find('.invalid-feedback').text($zipCodeField.validationMessage);
        }
    }
}

module.exports = {
    inputFocusoutValidation: function () {
        $('body').on('blur', 'input:not(.js-giftcard-amount-date, #expirationDate, .g-email-pop-modal .js-signup-email, .js-confirm-password):visible, select:visible', function (e) {
            var $this = $(this);
            if ($this.closest('form').hasClass('trackorder')) {
                $this.val($this.val().trim());
            }

            if ($('.js-check-length').length > 0 && $('.js-check-length').val().length < 36) {
                $(this).parent().removeClass('error-field');
                $(this).removeClass('is-invalid');
                $(this).parent().find('.invalid-feedback').empty();
            }

            if ($this.hasClass('js-password-field')) {
                if (!$(e.relatedTarget).hasClass('js-createaccount-button')) {
                    var inputFeedback = $(this).parents('.form-group').find('.input-feedback');
                    if (checkPasswordContainsEmail($this.parents('form')) === false) {
                        validateFormBlur.call(this, e);
                    }
                    inputFeedback.hide();
                }
            }

            if ($this.hasClass('is-invalid')) {
                validateFormBlur.call(this, e);

                if ($this.closest('form').length > 0) {
                    if ($this.closest('.single-shipping').length > 0 && !$('.single-shipping').find('.shipping-address-block').is(':visible') && !$('input.usingMultiShipping').is(':checked') && $('.single-shipping').find('.js-primary-pickup input:visible').length > 0) {
                        var validationFailed = false;
                        $.each($('.single-shipping').find('.js-primary-pickup input'), function (index, element) {
                            if (element.value === '') {
                                validationFailed = true;
                            }
                        });
                        if ($('.single-shipping').find('input.g-checkbox-input.js-pickup').is(':checked')) {
                            $.each($('.single-shipping').find('.js-secondary-pickup input'), function (index, element) {
                                if (element.value === '') {
                                    validationFailed = true;
                                }
                            });
                        }
                        if (!validationFailed) {
                            $('.next-step-button').find('button').removeAttr('disabled');
                        }
                    } else if ($this.closest('form')[0].checkValidity() && (!$('.contact-info').find('.js-employee-terms-conditions').is(':visible') || $('.contact-info').find('.js-employee-terms-conditions').is(':checked')) && (!$('.contact-info').find('.js-vip-click').is(':visible') || $('.contact-info').find('.js-vip-click').is(':checked'))) {
                        $('.next-step-button').find('button').removeAttr('disabled');
                    }
                }
            }
        });

        $('body').on('change', 'select, input[type=checkbox]', function (e) {
            if ($(this).hasClass('is-invalid')) {
                validateFormBlur.call(this, e);
                $(this).blur();
            }
        });
    },

    validatePostalCode: function () {
        $('body').on('keyup', 'input.postal-code, .js-billingZipCode', function () {
            var country = $(this).closest('form').find('select.b-country-select');
            var zipCodeVal;
            if (country.val() === 'US') {
                zipCodeVal = $(this).val().split('-').join('');
                if (zipCodeVal.length > 0) {
                    zipCodeVal = zipCodeVal.match(new RegExp('.{1,5}', 'g')).join('-');
                }
                $(this).val(zipCodeVal);
            } else if (country.val() === 'CA') {
                var max = 7;
                if ($(this).val().length > max) {
                    $(this).val($(this).val().substr(0, max));
                }
                zipCodeVal = $(this).val().split(' ').join('');
                if (zipCodeVal.length > 0) {
                    zipCodeVal = zipCodeVal.match(new RegExp('.{1,3}', 'g')).join(' ');
                }
                $(this).val(zipCodeVal);
            }
        });
    },

    validateAddress: function () {
        ['keyup', 'paste'].forEach(evt => $('body').on(evt, 'input:not(.js-giftcard-amount-date, .js-custom-input, #expirationDate, #store-postal-code, .js-search-field)', function () {
            var evtThis = this;
            if (evt === 'paste') {
                // Short pause to wait for paste to complete
                setTimeout(function () {
                    handleValidateAddress(evtThis);
                }, 100);
            } else {
                handleValidateAddress(evtThis);
            }
        }));
    },

    validateReturnReasonComment: function () {
        $('body').on('keyup input', 'textarea.return-comments, .js-valideComment', function () {
            if ($(this).val().length > 200) {
                $(this).addClass('is-invalid');
                $(this).parent().addClass('error-field');
                $(this).parents('.form-group').find('.invalid-feedback')
                .removeClass('info-maxChar');
                $('body').find('.continue-return-reason').attr('disabled', 'disabled');
                var headrHeight = $('.js-header').height();
                var errorForm = $(this).parents('form').find('.is-invalid:first');
                var errorParent = errorForm.parents('.form-group');
                if (errorForm) {
                    $('html, body').animate({
                        scrollTop: errorParent.offset().top - headrHeight - 10
                    }, 500);
                }
            } else {
                $(this).removeClass('is-invalid');
                $(this).parent().removeClass('error-field');
                $(this).closest('div').find('.invalid-feedback').addClass('info-maxChar');
                $('body').find('.continue-return-reason').removeAttr('disabled');
            }
        });
    },
    validateEmployeeTermsConditions: function () {
        $('.contact-info').find('.js-employee-terms-conditions').on('click', function () {
            if ($(this).is(':checked') && $('.contact-info').find('form').length > 0) {
                $('.place-order').removeAttr('disabled');
            } else {
                $('.place-order').attr('disabled', 'disabled');
            }
        });
    },
    smsOptIn: function () {
        $('body').on('click', '.b-sms-opt-in #smsUpdates', function () {
            if ($('#smsUpdates').is(':checked')) {
                $('.validatePhoneField').addClass('smsValidation');
            } else {
                $('.validatePhoneField').removeClass('smsValidation');
            }
        });
    },
    scrollToActiveElement: function () {
        if (/Android/i.test(navigator.userAgent)) {
            window.addEventListener('resize', function () {
                if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT') {
                    window.setTimeout(function () {
                        document.activeElement.scrollIntoView({ block: 'center' });
                    }, 0);
                }
            });
        }
    },

    onChangeCountry: function () {
        $(document).on('change', 'form#dwfrm_billing select#billingCountry, form#dwfrm_internationalAddress select#country', function () {
            if ($(this).is(':visible')) {
                var $form = $(this).parents('form').attr('name');
                validateZipCode($form);
            }
        });
    },
    onBlurZipCode: function () {
        $(document).on('blur', 'form#dwfrm_billing input#billingZipCode, form#dwfrm_internationalAddress input#zipCode', function () {
            var $form = $(this).parents('form').attr('name');
            validateZipCode($form);
        });
    },
    onBlurPhoneNumber: function () {
        $('input.validatePhoneField').keyup(function (e) {
            $(e.target).val($(e.target).val().replace(/[^\d]/g, ''));
            if (e.keyCode !== 8) {
                var value = $.trim($('input.validatePhoneField').val());
                value = value.split('-').join('');
                if (value.length === 2) {
                    value = value.substr(0, 3);
                } else if (value.length > 2 && value.length < 6) {
                    value = value.substr(0, 3) + '-' + value.substr(3, 3);
                } else if (value.length >= 6) {
                    value = value.substr(0, 3) + '-' + value.substr(3, 3) + '-' + value.substr(6, 4);
                }
                $('input.validatePhoneField').val(value);
            }
        });

        $(document).on('submit', 'input.validatePhoneField', function () {
            var $this = $(this);
            var $required = $(this).hasClass('defaultMandatory');
            var phnRegx = /^[0-9]*$/;
            var value = $.trim($('input.validatePhoneField').val());
            var val = value.split(' ').join('').replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '-');
            if (val !== '') {
                if (val.length <= 9) {
                    $this.addClass('is-invalid');
                    $this.parents('.form-group').addClass('error-field');
                    $this.parents('.form-group').find('.invalid-feedback').text($this.data('range-error'));
                } else if (!phnRegx.test(val)) {
                    $this.addClass('is-invalid');
                    $this.parents('.form-group').addClass('error-field');
                    $this.parents('.form-group').find('.invalid-feedback').text($this.data('pattern-mismatch'));
                } else {
                    $this.removeClass('is-invalid');
                    $this.parents('.form-group').removeClass('error-field');
                }
            } else if ($required) {
                $this.addClass('is-invalid');
                $this.parents('.form-group').addClass('error-field');
                $this.parents('.form-group').find('.invalid-feedback').text($this.data('missing-error'));
            } else {
                $this.removeClass('is-invalid');
                $this.parents('.form-group').removeClass('error-field');
            }

            $('.next-step-button button').removeAttr('data-clicked');
        });
    },

    validatePasswordVisibility: function () {
        $('body').on('click', '.js-password-ToggleDisplay', function () {
            if ($(this).parents('.form-group').find('.order-return-form-input').attr('type') === 'password') {
                $(this).parents('.form-group').find('.order-return-form-input').attr('type', 'text');
                this.textContent = $(this).closest('form').find('.hidelabel').val();
            } else {
                $(this).parents('.form-group').find('.order-return-form-input').attr('type', 'password');
                this.textContent = $(this).closest('form').find('.showlabel').val();
            }
        });
    },

    showPasswordRequirement: function () {
        $('body').on('focus', '.js-password-field', function () {
            var inputFeedback = $(this).parents('.form-group').find('.input-feedback');
            var emailFeedback = $(this).parents('.form-group').find('.invalid-feedback-email');
            inputFeedback.show();
            emailFeedback.hide();
        });

        $('body').on('keyup', '.js-password-field', function () {
            var pwdLength = /^.{8,}$/;
            var pwdUpper = /[A-Z]+/;
            var pwdLower = /[a-z]+/;
            var pwdNumber = /[0-9]+/;
            var pwdSpecial = /[@$!%*?&]+/;

            var currentPasswordVal = $('.js-password-field').val(); // get the current password value
            var inputFeedback = $(this).parents('.form-group').find('.input-feedback');
            inputFeedback.show();
            $(this).parents('.b-input_row').removeClass('error-field');
            $(this).removeClass('is-invalid');

            if (pwdLength.test(currentPasswordVal)) {
                $('.js-password-length').addClass('validated');
            } else {
                $('.js-password-length').removeClass('validated');
            }

            if (pwdUpper.test(currentPasswordVal) && pwdLower.test(currentPasswordVal)) {
                $('.js-password-case').addClass('validated');
            } else {
                $('.js-password-case').removeClass('validated');
            }

            if (pwdNumber.test(currentPasswordVal)) {
                $('.js-password-number').addClass('validated');
            } else {
                $('.js-password-number').removeClass('validated');
            }

            if (pwdSpecial.test(currentPasswordVal)) {
                $('.js-password-special').addClass('validated');
            } else {
                $('.js-password-special').removeClass('validated');
            }
        });
    },

    checkPasswordFieldErrors: function () {
        $('body').on('click', 'form.b-checkout-registration button', function () {
            var form = $(this).closest('form');
            checkMandatoryField(form);
        });
    },

    getOperatingSystem: function () {
        var isMacOS = /(Mac)/i.test(navigator.platform);
        var isFireFox = /(firefox)/i.test(navigator.userAgent);
        var isApplePaySupport = window.dw && window.dw.applepay && window.ApplePaySession && window.ApplePaySession.canMakePayments();
        if (isMacOS) {
            $('.b-header_minicart-icon, .b-tile-swatches_slider_button, .b-promo-tooltip-content, .b-contactinfo-tooltip-content').addClass('mac-only');
            if (isFireFox) {
                $('.strike-through, .m-strikethrough').addClass('mac-strikethrough');
            }
        }
        if (isApplePaySupport) {
            $('.b-checkout_subheader-express-login, .apple-pay').addClass('ios-only');
        }
    },

    validateSpaceAtFirstCharacter: function () {
        $('body').on('keyup', 'input:not(#expirationDate, .g-checkbox-input, #store-postal-code)', function () {
            var stringValue;
            var spaceCheck = /^\s/;
            stringValue = $(this).val();
            var position = $(this)[0].selectionStart;
            if (spaceCheck.test(stringValue)) {
                stringValue = stringValue.trim();
                $(this).val(stringValue);
                $(this)[0].selectionEnd = position;
            }
        });
    },

    restrictingCharacterLength: function () {
        $('body').on('change input', 'input.js-check-length', function () {
            var $this = $(this);
            var maxChar = parseInt($this.attr('maxlength')); // eslint-disable-line
            $this.val($this.val().slice(0, maxChar));
        });
    },

    consecutiveSpaceValidator: function () {
        var counter = 0;
        $('body').on('keydown', '.b-footer_signup-input', function (e) {
            if (e.which === 32 || e.keyCode === 32) {
                counter += 1;
                if (counter > 1) {
                    e.preventDefault();
                }
            } else {
                counter = 0;
            }
        });
    },

    checkMandatoryField: checkMandatoryField,
    checkPasswordContainsEmail: checkPasswordContainsEmail,
    validatePasswordConfirm: validatePasswordConfirm,
    validateFormBlur: validateFormBlur
};
