var clientSideValidation = require('../common/clientSideValidation');
import Component from '../core/Component';

export default class Form extends Component {
    /**
     * Initialize component
     */
    init() {
        super.init();

        if (this.$el.is('form')) {
            this.initCache();
            this.initEvents();
        }
    }

    /**
     * Set selectors
     */
    initCache() {
        this.$submitButton = $('button[type="submit"], input[type="submit"]', this.$el);
        this.$formInputs = $('input, select', this.$el);
        this.$checkoutFormInputs = $('.js-checkout-forms').find('input:visible, select:visible');
        this.$submitContinue = $('button.submit-shipping, button.submit-payment, button.place-order');
    }

    /**
     * Initialize component events
     */
    initEvents() {
        this.event('click', this.onSubmit.bind(this), this.$submitButton);
        this.event('submit', this.onSubmit.bind(this));
        this.event('click', this.onSubmit.bind(this), this.$submitContinue);
    }

    /**
     * Billing Address ZipCode Validation
     * @param {Object} $form form element
     * @param {event} e event type
     */
    validateZipCode($form, e) {
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
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        } else if ($zipCodeVal !== '' && $countrySelected !== '') {
            var constraint = new RegExp($regexPattern[$countrySelected][0], '');
            if (constraint.test($zipCodeVal)) {
                $zipCodeField.setCustomValidity('');
            } else {
                $('.next-step-button button').removeAttr('data-clicked');
                $zipCodeField.setCustomValidity($regexPattern[$countrySelected][1]);
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                $('.next-step-button button').removeAttr('data-clicked');
                $zipCodeInput.addClass('is-invalid');
                $zipCodeInput.parents('.form-group').addClass('error-field');
                $zipCodeInput.parents('.form-group').find('.invalid-feedback').text($zipCodeField.validationMessage);
            }
        }
    }

    handleHackEntries(event) {
        $(this.$el).find('input:visible, select:visible').each((index, input) => {
            var str;
            var $this = $(input);
            var customRegex = $('[name$="xssRegex"]').val();
            var customRegexExp = new RegExp(customRegex, '');
            var errorMessage = $('[name$="xssRegex"]').attr('message');
            str = $this.val();
            if (customRegexExp.test(str)) {
                $this.closest('.form-group').addClass('error-field');
                $this.addClass('is-invalid');
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
     * Displays error messages for invalid field
     */
    handleInvalidInput() {
        var isConfirmField = $(this).hasClass('js-confirm-password');
        this.setCustomValidity('');
        if ($(this).hasClass('js-password-field')) {
            // validate containing email first before checking the validity.
            clientSideValidation.checkPasswordContainsEmail($(this).parents('form'));
            if ($(this).hasClass('is-invalid')) {
                return;
            }
        } else if (isConfirmField) {
            // do not validate the confim password fields. Just check for matches against original password field.
            clientSideValidation.validatePasswordConfirm($(this).parents('form'));
            if ($(this).hasClass('is-invalid')) {
                return;
            }
        }

        if (!this.validity.valid && !isConfirmField) {
            var validationMessage = this.validationMessage;
            $(this).addClass('is-invalid');
            $(this).parent().addClass('error-field');
            if ((this.validity.patternMismatch || this.validity.typeMismatch) && $(this).data('pattern-mismatch')) {
                validationMessage = $(this).data('pattern-mismatch');
            }
            if ((this.validity.rangeOverflow || this.validity.rangeUnderflow) &&
                $(this).data('range-error')) {
                validationMessage = $(this).data('range-error');
            }
            if ((this.validity.tooLong || this.validity.tooShort) &&
                $(this).data('range-error')) {
                validationMessage = $(this).data('range-error');
            }
            if (this.validity.valueMissing && $(this).data('missing-error')) {
                validationMessage = $(this).data('missing-error');
            }
            if ((this.validity.patternMismatch || this.validity.typeMismatch) && $(this).parent().find('.input-feedback').length) {
                validationMessage = $(this).parent().find('.input-feedback').html();
            }
            // hide the input feedback
            $(this).parent().find('.input-feedback').hide();
            $(this).closest('.form-group').find('.invalid-feedback').html(validationMessage);
            $('.next-step-button button').removeAttr('data-clicked');
            var headrHeight = $('.js-header').height() + 10;
            var errorForm = $(this).parents('form').find('.is-invalid:first');
            var isGCForm = $(this).parents('form').hasClass('js-giftcard-form');
            var errorParent = errorForm.parents('.form-group');
            var stickyApplyPromo = $('.b-checkout_sticky-applypromo').outerHeight();
            var checkoutHeight = headrHeight + stickyApplyPromo + 10;
            var isLoginForm = $(this).parents('form.login');
            var isCreateAccount = $(this).parents('form.registration');
            var isEmailsignup = $(this).parents('form.email-pop-up_signup-form');
            var isSinglePage = $(this).parents('.single-page-checkout');
            if (errorForm.length > 0) {
                if ((!isLoginForm.length > 0 || !isCreateAccount.length > 0 || !isEmailsignup.length > 0) && !isSinglePage.length > 0) {
                    if (isGCForm && $('.b-payment-info').length) {
                        $('html, body').animate({
                            scrollTop: $('.b-payment-info .b-shipping-summary_header-line').position().top
                        });
                    } else if ($('.b-checkout_page').length > 0 && $(window).width() < 1024) {
                        $('html, body').animate({
                            scrollTop: errorParent.offset().top - checkoutHeight - 10
                        }, 500);
                    } else if ($('.js-signup-submit').length < 1) {
                        $('html, body').animate({
                            scrollTop: errorParent.offset().top - headrHeight - 10
                        }, 500);
                    }
                }
            }
        }
    }

    /**
     * Validate whole form using native checkValidity method
     * @param {jQuery.event} event - Event to be canceled if form is invalid.
     */
    onSubmit(event) {
        if (!this.$el.find('.form-control#expirationDate').length) {
            // Remove old error messages
            this.$el.find('.form-control.is-invalid').removeClass('is-invalid');
            this.$el.find('.form-control.is-invalid').parent().addClass('error-field');

            this.handleHackEntries.call(this, event);
        }

        // Gift card page: Remove previous balance data
        if (this.$el.is('.js-check-balance-form')) {
            this.$el.find('.js-check-balance-result-wrapper').hide();
        }

        if (!this.$el.find('input.is-invalid').length && !this.$el.find('select.is-invalid').length) {
            if ($('.js-checkout-forms').length > 0) {
                if ($('.js-checkout-forms')[0].checkValidity && !$('.js-checkout-forms')[0].checkValidity() && ($('.b-shipping-method_input:checked').val() !== 'store-pickup' && !$('input.usingMultiShipping').is(':checked') && $('.single-shipping').find('.js-primary-pickup input:visible').length > 0)) {
                    // Trigger validation check
                    if (event) {
                        // Disable default HTML5 handlers, also form submit
                        event.preventDefault();
                        event.stopPropagation();
                        event.stopImmediatePropagation();
                    }

                    // Display error messages
                    this.$checkoutFormInputs.each((index, input) => {
                        if (!input.validity.valid) {
                            this.handleInvalidInput.call(input);
                        }
                    });
                }
                if ($('.nav-item.paypal-tab a.nav-link').hasClass('active')) {
                    $('select.billingCountry').removeAttr('name').attr('name', 'billingCountry');
                    $('#billingState option:first').val($('#payment-method-state').val());
                    $('#billingState').val($('#billingState  option:first').val());
                    $('#billingCountry').val($('#payment-method-country').val());
                    $('#billingCountry').change();
                }
                var visibleForm;
                if ($('.hal-active').length > 0 || $('.b-checkout_page').data('onlyegiftcard') === true || $('.bopis-active').length > 0) {
                    visibleForm = $('.js-checkout-forms')[1].checkValidity();
                } else {
                    visibleForm = $('.js-checkout-forms')[2].checkValidity();
                }
                if ($($('.js-checkout-forms')[2]).is(':visible') && $('.js-checkout-forms')[2].checkValidity && !visibleForm) {
                    if (event) {
                        // Disable default HTML5 handlers, also form submit
                        event.preventDefault();
                        event.stopPropagation();
                        event.stopImmediatePropagation();
                    }
                    if (!($(event.target)[0].id === 'PayPal')) {
                        this.validateZipCode.call(this, 'dwfrm_billing', event);
                    }
                    // Display error messages
                    $('.js-checkout-forms').find('input:visible, select:visible').each((index, input) => {
                        if (!input.validity.valid) {
                            this.handleInvalidInput.call(input);
                        }
                    });
                }
                if ($($('.js-checkout-forms')[2]).is(':visible') && $('.js-checkout-forms')[2].checkValidity()) {
                    // ZipCode Validation for International Billing Address.
                    if (!($(event.target)[0].id === 'PayPal')) {
                        this.validateZipCode.call(this, 'dwfrm_billing', event);
                    }
                    // Display error messages
                    $('.js-checkout-forms').find('input:visible, select:visible').each((index, input) => {
                        if (!input.validity.valid) {
                           // Disable default HTML5 handlers, also form submit
                            this.handleInvalidInput.call(input);
                        }
                    });
                }
            } else if (this.$el[0].checkValidity && !this.$el[0].checkValidity() && !$('.checkout-main').length > 0) {
                // Trigger validation check
                if (event) {
                    // Disable default HTML5 handlers, also form submit
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                }
                if ($(this.$el[0]).attr('name') === 'dwfrm_internationalAddress') {
                    // ZipCode Validation for International Billing Address.
                    this.validateZipCode.call(this, 'dwfrm_internationalAddress', event);
                }
                var formInputs = this.$formInputs;
                if ($('#address-page').length > 0) {
                    formInputs = $(this.$el).find('input:visible, select:visible');
                }
                // Display error messages
                formInputs.each((index, input) => {
                    if (!input.validity.valid) {
                        this.handleInvalidInput.call(input);
                    }
                });
            } else if ($(this.$el[0]).attr('name') === 'dwfrm_internationalAddress' && this.$el[0].checkValidity() && !$('.checkout-main').length > 0) {
                // ZipCode Validation for International Billing Address.
                this.validateZipCode.call(this, 'dwfrm_internationalAddress', event);
                // Display error messages
                this.$formInputs.each((index, input) => {
                    if (!input.validity.valid) {
                        this.handleInvalidInput.call(input);
                    }
                });
            } else if (this.$el.find('input.js-confirm-password').length > 0) {
                if (!clientSideValidation.validatePasswordConfirm(this.$el)) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                }
            }
        } else if (this.$el.find('input.js-confirm-password').length > 0) {
            if (!clientSideValidation.validatePasswordConfirm(this.$el)) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
            }
        }

        return;
    }
}
