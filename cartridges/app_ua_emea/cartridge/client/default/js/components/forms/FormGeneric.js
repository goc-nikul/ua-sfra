import FormGenericBase from 'org/components/forms/FormGeneric';
import clientSideValidation from '../common/clientSideValidation';

export default class FormEMEA extends FormGenericBase {
    /**
     * Initialize component
     */
    init() {
        super.init();
    }

    handleHackEntries(event) {
        clientSideValidation.validateFields(event);
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
        } else if ($form === 'input#find-pickup-point') {
            $zipCodeInput = $countryField = $('input#pickUpPointPostalcode');
            $zipCodeField = $('input#pickUpPointPostalcode')[0];
            $countrySelected = $('#billingCountry').val();
            $zipCodeVal = $('input#pickUpPointPostalcode').val();
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

    /**
     * Validate whole form using native checkValidity method
     * @param {jQuery.event} event - Event to be canceled if form is invalid.
     */
    onSubmit(event) {
        // Remove old error messages
        this.$el.find('.form-control.is-invalid').removeClass('is-invalid');
        this.$el.find('.form-control.is-invalid').parent().addClass('error-field');

        this.handleHackEntries.call(this, event);

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
                if ($('.hal-active').length > 0 || $('.b-checkout_page').data('onlyegiftcard') === true) {
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
                if ($('.js-paazlwidget-form #pickUpPointPostalcode').is(':visible') && !$('#pickUpPointPostalcode').hasClass('is-invalid') && !$(event.currentTarget).hasClass('submit-shipping')) {
                    this.validateZipCode.call(this, 'input#find-pickup-point', event);
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
            }
        }

        return;
    }
}
