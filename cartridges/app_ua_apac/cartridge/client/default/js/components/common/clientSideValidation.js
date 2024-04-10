'use strict';
var clientSideValidationBase = require('org/components/common/clientSideValidation');
var clientSideValidationFalcon = require('falcon/components/common/clientSideValidation');

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
        var $customerror = $('[name$="caretRegexError"]');
        var customRegexExp = new RegExp(customRegex, '');
        var errorMessage = $('[name$="xssRegex"]').attr('message');
        str = $this.val();
        // Address and city field validations
        var addressRegex = /^ *(((box|bin)[-. \/\\]?\d+)|(.*p[ \s]?[ \.]? ?(o|0)[ \s]?[-. \/\\]? *-?((box|bin)|b|(#|num)?\d+))|(p(ost)? *(o(ff(ice)?)?)? *((box|bin)|b)? *\d+)|(p *-?\/?(o)? *-?box)|Post Box|postoffice|Packstation|Postfach|POSTE RESTANTE|AUTORISATION|CS|CP|Postbus|APARTADO|CASELLA POSTALE|Postboks|Kotak Pos|Postfächer|boîtes postales|Boîtes Postales|Boîtes postales|boîtes Postales|post office|P. OFFICE. BOX.|P OFFICE. BOX.|P OFFICE BOX.|P OFFICE BOX|POFFICE BOX|POFFICEBOX|POST O. BOX|POST. O. BOX|POST. O. BOX.|POST O BOX|POSTOBOX|Private Bag|GPO BOX|Care PO|Locked Bag|PO BOX|post office box|((box|bin)|b) *(number|num|#)? *\d*\d+)/i; // eslint-disable-line
        var cityRegex = /(^(?!\b(apo|fpo|bfpo)\b).*$)/i;
        var isAddressField = $this.hasClass('js-address-field');
        var isCityField = $this.hasClass('cityField');
        // IdentificationValue field validations
        var isIdentificationDetailField = $this.is('#contactInfoIdentificationValue_');
        var IdentificationRegx = /^(?!-)[a-zA-Z0-9\p{L}\p{Nd}\s.-]*$/; // eslint-disable-line
        if (isIdentificationDetailField && str) {
            var selectedType = $('select#identificationValue').find('option:selected').attr('id');
            IdentificationRegx = (selectedType === '1') ? /^([0-9.-]{15,20})$/ : (selectedType === '2') ? /^([0-9]{16})$/ : (selectedType === '3') ? /^([a-zA-Z0-9]{7,14})$/ : IdentificationRegx;
        }

        if (customRegexExp.test(str) || (regex.test(str) || caretRegex.test(str)) || (isAddressField && addressRegex.test(str)) || (isCityField && !cityRegex.test(str) && str !== '') || (isIdentificationDetailField && !IdentificationRegx.test(str) && str !== '')) {
            $this.closest('.form-group').addClass('error-field');
            $this.addClass('is-invalid');
            if (customRegexExp.test(str)) {
                errorMessage = $('[name$="xssRegex"]').attr('message');
            } else if (regex.test(str) || caretRegex.test(str)) {
                errorMessage = $customerror.attr('message');
            } else if (isAddressField && addressRegex.test(str)) {
                errorMessage = $this.data('pattern-mismatch');
                $this.closest('.form-group').find('.invalid-feedback').show();
            } else if (isCityField && !cityRegex.test(str) && str !== '') {
                errorMessage = $this.data('apopattern-mismatch');
                $this.closest('.form-group').find('.invalid-feedback').show();
            } else if (isIdentificationDetailField && !IdentificationRegx.test(str) && str !== '') {
                errorMessage = $this.attr('data-valid');
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
            var isSinglePageCheckout = (($('#checkout-main').length && $('#checkout-main').hasClass('single-page-checkout')));
            if (errorForm.length > 0 && !isSinglePageCheckout) {
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
    var $errorMsg = $('.zipCodeValidation').data('postalcode-err') || $('#zipCode').data('pattern-mismatch');
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
    } else {
        return;
    }
    $regexPattern = {
        AU: [/^(0[289][0-9]{2})|([1345689][0-9]{3})|(2[0-8][0-9]{2})|(290[0-9])|(291[0-4])|(7[0-4][0-9]{2})|(7[8-9][0-9]{2})$/, $errorMsg],
        NZ: [/^(^\d{4}?$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)$/, $errorMsg],
        ID: [/^(^\d{5}?$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)$/, $errorMsg],
        MY: [/^(^\d{5}?$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)$/, $errorMsg],
        PH: [/^(^\d{4}?$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)$/, $errorMsg],
        SG: [/^(^\d{6}?$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)$/, $errorMsg]
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
        if ($regexPattern[$countrySelected] !== undefined) {
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
}

/**
 * Birthday minimum age restriction
 * @param {Object} $form form element
 */
function validateMinimumAgeRestriction($form) {
    if ($form) {
        if (window.sitePreferences && window.sitePreferences.minimumAgeRestriction && window.sitePreferences.isKRCustomCheckoutEnabled) {
            var $formName = $($form[0]);
            var yearField = $formName.find('select#birthYear');
            var yearSelected = $formName.find('select#birthYear option:selected').val();
            var monthSelected = $formName.find('select#birthMonth option:selected').val();
            var daySelected = $formName.find('select#birthDay option:selected').val();
            if (yearSelected && monthSelected && daySelected) {
                var birthdate = yearSelected + '/' + monthSelected + '/' + daySelected;
                birthdate = new Date(birthdate.replace(/(..)\/(..)\/(....)/, '$3-$2-$1'));
                var yearsAgo = new Date();
                yearsAgo.setFullYear(yearsAgo.getFullYear() - window.sitePreferences.minimumAgeRestriction);
                yearsAgo.setHours(0, 0, 0, 0);
                if (yearField) {
                    if (birthdate > yearsAgo) {
                        yearField.addClass('is-invalid');
                        yearField.parents('.form-group').addClass('error-field');
                        yearField.parents('.form-group').find('.invalid-feedback').text(yearField.data('minimum-age'));
                        $('html, body').animate({
                            scrollTop: $('.b-year #birthYear').position().top
                        }, 500);
                    } else {
                        yearField.removeClass('is-invalid');
                        yearField.parents('.form-group').removeClass('error-field');
                        yearField.parents('.form-group').find('.invalid-feedback').text('');
                    }
                }
            }
        }
    }
}

/**
 * Method to validate zip code on blur.
 */
function onBlurZipCode() {
    $(document).on('blur', 'form#dwfrm_billing input#billingZipCode, form#dwfrm_internationalAddress input.zipCodeValidation', function () {
        var $form = $(this).parents('form').attr('name');
        validateZipCode($form);
    });
}

module.exports = {
    clientSideValidationBase: clientSideValidationBase,
    clientSideValidationFalcon: clientSideValidationFalcon,
    validatePasswordConfirm: clientSideValidationBase.validatePasswordConfirm,
    checkMandatoryField: clientSideValidationBase.checkMandatoryField,
    checkPasswordContainsEmail: clientSideValidationBase.checkPasswordContainsEmail,
    showPasswordRequirement: clientSideValidationBase.showPasswordRequirement,
    inputFocusoutValidation: clientSideValidationFalcon.inputFocusoutValidation,
    validatePasswordVisibility: clientSideValidationBase.validatePasswordVisibility,
    scrollToActiveElement: clientSideValidationBase.validateReturnReasonComment,
    validateFields: validateFields,
    validateZipCode: validateZipCode,
    validateAddress: clientSideValidationFalcon.validateAddress,
    validateSpaceAtFirstCharacter: clientSideValidationBase.validateSpaceAtFirstCharacter,
    validateEmployeeTermsConditions: clientSideValidationBase.validateEmployeeTermsConditions,
    validateMinimumAgeRestriction: validateMinimumAgeRestriction,
    onKeyupZipCode: clientSideValidationFalcon.onKeyupZipCode,
    onBlurZipCode: onBlurZipCode
};
