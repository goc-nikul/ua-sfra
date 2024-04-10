'use strict';
var clientSideValidationBase = require('org/components/common/clientSideValidation');

/**
 * field Validations functions
 * @param {Object} $currEle form element
 */
function validateFields($currEle) {
    var $form;
    if ($('#checkout-main').length > 0) {
        $form = '.js-checkout-forms';
    } else if ($currEle !== undefined) {
        if ($($currEle.target).length > 0) {
            $form = $($currEle.target).closest('form');
        } else {
            $form = $currEle.closest('form');
        }
    }

    $($form).find('input:visible, select:visible').each((index, input) => {
        var str;
        var $this = $(input);
        var caretRegex = /\^/;
        var regex = /<(\"[^\"]*\"|'[^']*'|[^'\">])*>/; // eslint-disable-line
        var customRegex = $('[name$="xssRegex"]').val();
        var customRegexExp = new RegExp(customRegex, '');
        var errorMessage = $('[name$="xssRegex"]').attr('message');
        str = $this.val();
        // Address and city field validations
        var addressRegex = /^ *(((box|bin)[-. \/\\]?\d+)|(.*p[ \s]?[ \.]? ?(o|0)[ \s]?[-. \/\\]? *-?((box|bin)|b|(#|num)?\d+))|(p(ost)? *(o(ff(ice)?)?)? *((box|bin)|b)? *\d+)|(p *-?\/?(o)? *-?box)|Post Box|postoffice|Packstation|Postfach|POSTE RESTANTE|AUTORISATION|CS|CP|Postbus|APARTADO|CASELLA POSTALE|Postboks|Kotak Pos|Postfächer|boîtes postales|Boîtes Postales|Boîtes postales|boîtes Postales|post office|P. OFFICE. BOX.|P OFFICE. BOX.|P OFFICE BOX.|P OFFICE BOX|POFFICE BOX|POFFICEBOX|POST O. BOX|POST. O. BOX|POST. O. BOX.|POST O BOX|POSTOBOX|post office box|((box|bin)|b) *(number|num|#)? *\d*\d+)/i; // eslint-disable-line 
        var cityRegex = /(^(?!\b(apo|fpo|bfpo)\b).*$)/i;
        var isAddressField = $this.hasClass('js-address-field');
        var isCityField = $this.hasClass('cityField');

        if (customRegexExp.test(str) || (regex.test(str) || caretRegex.test(str)) || (isAddressField && addressRegex.test(str)) || (isCityField && !cityRegex.test(str) && str !== '')) {
            $this.closest('.form-group').addClass('error-field');
            $this.addClass('is-invalid');
            if (customRegexExp.test(str)) {
                errorMessage = $('[name$="xssRegex"]').attr('message');
            } else if (regex.test(str) || caretRegex.test(str)) {
                errorMessage = $this.data('pattern-invalid');
            } else if (isAddressField && addressRegex.test(str)) {
                errorMessage = $this.data('pattern-mismatch');
                $this.closest('.form-group').find('.invalid-feedback').show();
            } else if (isCityField && !cityRegex.test(str) && str !== '') {
                errorMessage = $this.data('pattern-mismatch');
                $this.closest('.form-group').find('.invalid-feedback').show();
            } else {
                $this.closest('.form-group').removeClass('error-field');
                $this.removeClass('is-invalid');
                $this.closest('.form-group').find('.invalid-feedback').text('');
            }
            $this.closest('.form-group').find('.invalid-feedback').text(errorMessage);
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            $('.next-step-button button').removeAttr('data-clicked');
            var headrHeight = $('.js-header').height() + 10;
            var errorForm = $this.parents('form').find('.is-invalid:first');
            var isGCForm = $this.parents('form').hasClass('js-giftcard-form');
            var errorParent = errorForm.parents('.form-group');
            var stickyApplyPromo = $('.b-checkout_sticky-applypromo').outerHeight();
            var checkoutHeight = headrHeight + stickyApplyPromo + 10;
            if (errorForm.length > 0) {
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
        } else if (input === $('input[name$=_dob]')[0] && $this.closest('.form-group').find('.invalid-feedback').text()) {
            $this.closest('.form-group').addClass('error-field');
            $this.addClass('is-invalid');
        } else {
            $this.closest('.form-group').removeClass('error-field');
            $this.removeClass('is-invalid');
            $this.closest('.form-group').find('.invalid-feedback').text('');
        }
    });
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
        SE: [/^\d{3}\s*\d{2}$/, 'Please enter valid zip code'],
        MX: [/^\d{5}$/, $zipCodeInput.data('pattern-invalid')]
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
    } else if ($zipCodeVal !== '' && $countrySelected !== '') {
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

/**
 * Billing Address ZipCode Validation on change country
 * @param {Object} $form form element
 */
function onChangeCountry() {
    $(document).on('change', 'form#dwfrm_billing select#billingCountry, form#dwfrm_internationalAddress select#country', function () {
        var $form = $(this).parents('form').attr('name');
        validateZipCode($form);
    });
}

/**
 * Checking if date is valid:
 * 2021-03-30 - March 30, 2021 - true
 * 2021-02-29 - February 29, 2021 - false
 * 2020-02-29 - February 29, 2020 - true
 * @param {string} date date in format YYYY-MM-DD
 * @returns {boolean} boolean
 */
function isValidDate(date) {
    const dateArr = date.split('-');
    const year = +dateArr[0];
    const month = dateArr[1] - 1;
    const day = +dateArr[2];

    const d = new Date(year, month, day);
    if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
        return true;
    }
    return false;
}

/**
 * Birthday minimum age restriction
 * @param {Object} $input form element
 */
function validateMinimumAgeRestriction($input) {
    if ($input && $input.length) {
        const dateValue = $input.val();
        // eslint-disable-next-line no-useless-escape
        const regEx = /^(0[1-9]|[12][0-9]|3[01])[\/](0[1-9]|1[012])[\/](19|20)\d\d$/;
        let errorMsg;
        if (!dateValue) {
            errorMsg = $input.data('missing-error');
        } else if (dateValue.length < 10 || !(regEx.test(dateValue.trim()))) {
            errorMsg = $input.data('pattern-mismatch');
        } else {
            const dateOfBirthStr = dateValue.split('/').reverse().join('-');
            if (isValidDate(dateOfBirthStr)) {
                const dateOfBirth = new Date(dateOfBirthStr);
                const date13YrsAgo = new Date();
                date13YrsAgo.setFullYear(date13YrsAgo.getFullYear() - 13);
                if (!(dateOfBirth <= date13YrsAgo)) {
                    errorMsg = $input.data('under-age');
                }
            } else {
                errorMsg = $input.data('pattern-mismatch');
            }
        }
        if (errorMsg) {
            $input.addClass('is-invalid');
            $input.parents('.form-group').addClass('error-field');
            $input.parents('.form-group').find('.invalid-feedback').text(errorMsg);
        }
    }
}

clientSideValidationBase.onChangeCountry = onChangeCountry;
clientSideValidationBase.validateFields = validateFields;
clientSideValidationBase.validateMinimumAgeRestriction = validateMinimumAgeRestriction;
module.exports = clientSideValidationBase;
