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
        var $customerror = $('[name$="caretRegexError"]');
        var customRegexExp = new RegExp(customRegex, '');
        var errorMessage = $('[name$="xssRegex"]').attr('message');
        str = $this.val();
        // Address and city field validations
        // var addressRegex = /^ *(((box|bin)[-. \/\\]?\d+)|(.*p[ \s]?[ \.]? ?(o|0)[ \s]?[-. \/\\]? *-?((box|bin)|b|(#|num)?\d+))|(p(ost)? *(o(ff(ice)?)?)? *((box|bin)|b)? *\d+)|(p *-?\/?(o)? *-?box)|Post Box|postoffice|Packstation|Postfach|POSTE RESTANTE|AUTORISATION|CS|Postbus|APARTADO|CASELLA POSTALE|Postboks|Kotak Pos|Postfächer|boîtes postales|Boîtes Postales|Boîtes postales|boîtes Postales|post office|P. OFFICE. BOX.|P OFFICE. BOX.|P OFFICE BOX.|P OFFICE BOX|POFFICE BOX|POFFICEBOX|POST O. BOX|POST. O. BOX|POST. O. BOX.|POST O BOX|POSTOBOX|post office box|((box|bin)|b) *(number|num|#)? *\d*\d+)/i;
        // eslint-disable-line
        var addressRegex = /^ *(((box|bin)[-. \/\\]?\d+)|(p[ \s]?[ \.]? ?(o|0)[ \s]?[-. \/\\]? *-?((box|bin)|(#|num)?\d+))|post *office *box|post *office *bin|post *office *b|post *off *box|post *off *bin|post *off *b|post *o *box|post *o *bin|post *o *b|p *office *box|p *office *bin|p *office *b|p *off *box|p *off *bin|p *off *b|p *o *box|p *o *bin|(p *-?\/?(o)? *-?box)|Post Box|postoffice|Packstation|Postfach|POSTE RESTANTE|AUTORISATION|Postbus|APARTADO|CASELLA POSTALE|Postboks|Kotak Pos|Postfächer|boîtes postales|Boîtes Postales|Boîtes postales|boîtes Postales|post office|P. OFFICE. BOX.|P OFFICE. BOX.|P OFFICE BOX.|P OFFICE BOX|POFFICE BOX|POFFICEBOX|POST O. BOX|POST. O. BOX|POST. O. BOX.|POST O BOX|POSTOBOX|post office box|((box|bin)|b) *(number|num|#)? *\d*\d+)/i; // eslint-disable-line
        var cityRegex = /(^(?!\b(apo|fpo|bfpo)\b).*$)/i;
        var isAddressField = $this.hasClass('js-address-field');
        var isCityField = $this.hasClass('cityField');

        if (customRegexExp.test(str) || (regex.test(str) || caretRegex.test(str)) || (isAddressField && addressRegex.test(str)) || (isCityField && !cityRegex.test(str) && str !== '')) {
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
    var $errorMsg = $('.zipCodeValidation').data('postalcode-err');
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
    } else if ($('#pickUpPointPostalcode').is(':visible')) {
        $zipCodeInput = $countryField = $('input#pickUpPointPostalcode');
        $zipCodeField = $('input#pickUpPointPostalcode')[0];
        $countrySelected = $('#shippingCountrydefault').val();
        $zipCodeVal = $('input#pickUpPointPostalcode').val();
    } else {
        return;
    }
    $regexPattern = {
        US: [/^\d{5}$|^\d{5}-\d{4}$/, $errorMsg],
        CA: [/^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]( )?\d[ABCEGHJKLMNPRSTVWXYZ]\d$/i, $errorMsg],
        AT: [/^\d{4}?$/, $errorMsg],
        BE: [/^\d{4}?$/, $errorMsg],
        DK: [/^[0-9]{4}$/, $errorMsg],
        FR: [/^(^\d{5}(-\d{4})?$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)$/, $errorMsg],
        DE: [/^(^\d{5}(-\d{4})?$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)$/, $errorMsg],
        GB: [/ ?(([BEGLMNSWbeglmnsw][0-9][0-9]?)|(([A-PR-UWYZa-pr-uwyz][A-HK-Ya-hk-y][0-9][0-9]?)|(([ENWenw][0-9][A-HJKSTUWa-hjkstuw])|([ENSWenw][A-HK-Ya-hk-y][0-9][ABEHMNPRVWXYabehmnprvwxy])))) ?[0-9][ABD-HJLNP-UW-Zabd-hjlnp-uw-z]{2}$/, $errorMsg],
        IE: [/^[0-9a-zA-Z]{3}[ ][0-9a-zA-Z]{4}$/, $errorMsg],
        IT: [/^[0-9]{5}$/, $errorMsg],
        NL: [/^[1-9][0-9]{3} ?(?!sa|sd|ss)[a-zA-Z]{2}$/, $errorMsg],
        ES: [/^[0-9]{5}$/, $errorMsg],
        SE: [/^[0-9]{3} ?(?!sa|sd|ss)[0-9]{2}$/, $errorMsg],
        CH: [/^\d{4}?$/, $errorMsg],
        LI: [/^\d{4}?$/, $errorMsg],
        NO: [/^[0-9]{4}$/, $errorMsg],
        PL: [/^([0-9]{5})|([0-9]{2}-[0-9]{3})$/, $errorMsg],
        PT: [/^([0-9]{7})|([0-9]{4}-[0-9]{3})$/, $errorMsg]
    };

    if ($zipCodeVal !== '' && $countrySelected === '') {
        $countryField.addClass('is-invalid');
        $countryField.parents('.form-group').addClass('error-field');
        $countryField.parents('.form-group').find('.invalid-feedback').text('please select country');
    } else if ($zipCodeVal !== '' && $countrySelected !== '') {
        var constraint = new RegExp($regexPattern[$countrySelected][0], '');
        if (constraint.test($zipCodeVal)) {
            $zipCodeInput.removeClass('is-invalid');
            $countryField.removeClass('is-invalid');
            $countryField.parents('.form-group').removeClass('error-field');
            $zipCodeInput.parents('.form-group').removeClass('error-field');
            $countryField.parents('.form-group').find('.invalid-feedback').empty();
            $zipCodeInput.parents('.form-group').find('.invalid-feedback').empty();
            $zipCodeField.setCustomValidity('');
        } else {
            $('.next-step-button button').removeAttr('data-clicked');
            $zipCodeField.setCustomValidity($regexPattern[$countrySelected][1]);
            $zipCodeInput.addClass('is-invalid');
            $zipCodeInput.parents('.form-group').addClass('error-field');
            if ($('#pickUpPointPostalcode').is(':visible')) {
                $zipCodeInput.parents('.form-group').find('.invalid-feedback').text($($zipCodeField).data('pattern-mismatch'));
            } else {
                $zipCodeInput.parents('.form-group').find('.invalid-feedback').text($zipCodeField.validationMessage);
            }
        }
    }
}

/**
 * Paazl post code validation
 * disabling the further navigation when
 * we have error response from API
 */
function validatePostCodePaazl() {
    var targetNode = document.querySelector('.postnumber__status');
    var config = { attributes: true, childList: true, subtree: true };
    if (!targetNode) {
        // if node we need does not exist Wait 500ms and try again.
        window.setTimeout(validatePostCodePaazl, 500);
        return;
    }

    var observer = new MutationObserver(function () {
        if ($('.postnumber__status').is('.postnumber__status--valid')) {
            $('.submit-shipping').removeClass('disabled');
        } else {
            $('.submit-shipping').addClass('disabled');
        }
    });
    observer.observe(targetNode, config);
}

module.exports = {
    clientSideValidationBase: clientSideValidationBase,
    checkMandatoryField: clientSideValidationBase.checkMandatoryField,
    checkPasswordContainsEmail: clientSideValidationBase.checkPasswordContainsEmail,
    showPasswordRequirement: clientSideValidationBase.showPasswordRequirement,
    validatePasswordVisibility: clientSideValidationBase.validatePasswordVisibility,
    scrollToActiveElement: clientSideValidationBase.validateReturnReasonComment,

    validateFields: validateFields,
    validateZipCode: validateZipCode,

    onKeyupZipCode: function () {
        $(document).on('keyup', 'form#dwfrm_billing input#billingZipCode, input#pickUpPointPostalcode', function () {
            if ($(this).hasClass('is-invalid')) {
                $(this).removeClass('is-invalid');
                $(this).parents('.form-group').removeClass('error-field');
            }
        });
    },

    onBlurZipCode: function () {
        $(document).on('blur', 'form#dwfrm_billing input#billingZipCode, input#pickUpPointPostalcode', function () {
            if ($('#selectedCountry').val() !== 'IE') {
                var $form = $(this).parents('form').attr('name');
                validateZipCode($form);
            }

            if ($(this).hasClass('is-invalid')) {
                $(this).parent().find('.invalid-feedback').removeAttr('style');
            }

            if ($('.pazzl-no-response').is(':visible')) {
                $('.pazzl-no-response').addClass('hide');
            }
        });
    },

    onChangeCountry: function () {
        $(document).on('change', 'form#dwfrm_billing select#billingCountry, form#dwfrm_internationalAddress select#country', function () {
            if ($(this).is(':visible') && $(this).val() !== 'IE') {
                var $form = $(this).parents('form').attr('name');
                validateZipCode($form);
            }
        });
    },

    validatePickUpPostalCode: function () {
        $('body').on('click', 'input#find-pickup-point', function () {
            var postCode = $('#pickUpPointPostalcode').val();
            var $form;
            if (!$('#pickUpPointPostalcode').hasClass('is-invalid')) {
                if (!postCode) {
                    $form = $(this).parents('form');
                    clientSideValidationBase.checkMandatoryField($form);
                } else {
                    $form = $(this);
                    validateZipCode($form);
                }
            }
        });
    },

    validatePostCodeFieldPaazl: function () {
        $('body').on('blur', 'input#postnumber-input', function () {
            validatePostCodePaazl();
        });

        $('body').on('click', '.pickup-select__item', function () {
            if (!$('input#postnumber-input').is(':visible')) {
                $('.submit-shipping').removeClass('disabled');
            }
        });
    },

    validatePostalCode: function () {
        $('body').on('keyup', '.js-zipCodeFormat', function () {
            var country = $(this).closest('form').find('select.b-country-select');
            var zipCodeVal;
            var max;
            if (country.val() === 'SE') {
                max = 6;
                if ($(this).val().length > max) {
                    $(this).val($(this).val().substr(0, max));
                }
                zipCodeVal = $(this).val().split(' ').join('');
                if (zipCodeVal.length > 0) {
                    zipCodeVal = zipCodeVal.match(new RegExp('.{1,3}', 'g')).join(' ');
                }
                $(this).val(zipCodeVal);
            } else if (country.val() === 'NL') {
                max = 7;
                if ($(this).val().length > max) {
                    $(this).val($(this).val().substr(0, max));
                }
                zipCodeVal = $(this).val().split(' ').join('');
                if (zipCodeVal.length > 0) {
                    zipCodeVal = zipCodeVal.match(new RegExp('.{1,4}', 'g')).join(' ');
                }
                $(this).val(zipCodeVal);
            }
        });
    },

    validateAddress: function () {
        $('body').on('keyup', 'input:not(.js-giftcard-amount-date, .js-custom-input)', function () {
            var str;
            var $this = $(this);
            var customRegex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/gm;
            var emoRegex = /([#0-9]\u20E3)|[\xA9\xAE\u203C\u2047-\u2049\u2122\u2139\u3030\u303D\u3297\u3299][\uFE00-\uFEFF]?|[\u2190-\u21FF][\uFE00-\uFEFF]?|[\u2300-\u23FF][\uFE00-\uFEFF]?|[\u2460-\u24FF][\uFE00-\uFEFF]?|[\u25A0-\u25FF][\uFE00-\uFEFF]?|[\u2600-\u27BF][\uFE00-\uFEFF]?|[\u2900-\u297F][\uFE00-\uFEFF]?|[\u2B00-\u2BF0][\uFE00-\uFEFF]?|(?:\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDEFF])[\uFE00-\uFEFF]?/g;
            var emoStr = $this.val();
            str = emoStr.replace(new RegExp(emoRegex, 'g'), '');
            str = str.replace(new RegExp(customRegex, 'g'), '');
            var attr = $this.attr('name');
            if (typeof attr !== typeof undefined && attr !== false && (attr.indexOf('_address1') > -1 || attr.indexOf('_address2') > -1)) {
                str = str.replace(/_/g, '');
                if ($this.val().length > 50) {
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
            $(this).val(str);
        });
    },

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
                    if (clientSideValidationBase.checkPasswordContainsEmail($this.parents('form')) === false) {
                        clientSideValidationBase.validateFormBlur.call(this, e);
                    }
                    inputFeedback.hide();
                }
            }

            if ($this.hasClass('is-invalid')) {
                clientSideValidationBase.validateFormBlur.call(this, e);

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
                        var disableButton = false;
                        if ($this.closest('form')[0].id === 'dwfrm_billing') {
                            var paymentMethodsList = $('#paymentMethodsList');
                            if (paymentMethodsList && paymentMethodsList.find('input[name="brandCode"]:checked')) {
                                var paymentMethod = paymentMethodsList.find('input[name="brandCode"]:checked').val();
                                disableButton = paymentMethod === 'paypal';
                            }
                        }
                        if (!disableButton) {
                            $('.next-step-button').find('button').removeAttr('disabled');
                        }
                    }
                }
            }
        });

        $('body').on('change', 'select, input[type=checkbox]', function (e) {
            if ($(this).hasClass('is-invalid')) {
                clientSideValidationBase.validateFormBlur.call(this, e);
                $(this).blur();
            }
        });
    },

    validateSpaceAtFirstCharacter: clientSideValidationBase.validateSpaceAtFirstCharacter

};
