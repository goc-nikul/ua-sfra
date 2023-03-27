import Component from '../components/forms/FormGeneric';

var formValidation = require('base/components/formValidation');
var cleave = require('base/components/cleave');
var paymentInstruments = require('./paymentInstruments');

export default class paymentFormGeneric extends Component {
    init() {
        super.init();
        this.event('submit', this.paymentFromGenericSubmit.bind(this));
    }

    paymentFromGenericSubmit(event) {
        event.preventDefault();
        var $form = this.$el;
        var expYear = $('input[name$="_expirationYear"]');
        var expMonth = $('input[name$="_expirationMonth"]');
        var expDate = $('input[name$="_expirationdate_date"]');

        var date = new Date();

        var fullYear = date.getFullYear();
        var expiryMonth = '';
        var expiryYear = '';

        var yearPrefix = fullYear.toString().substring(0, 2);

        if (expDate.val()) {
            expDate = expDate.val().split('/');
            expiryMonth = expDate[0];
            expiryYear = '' + yearPrefix + expDate[1];
        }

        expMonth.val(expiryMonth);
        expYear.val(expiryYear);

        var url = $form.attr('action') + '?UUID=' + $('#updatePaymentButton').data('id');
        var $formButton = $('.account-save-button', $form);

        $('form.update-payment-form').trigger('payment:submit', event);

        var formData = cleave.serializeData($form);

        if (!$form.find('input.is-invalid').length && !$form.find('select.is-invalid').length) {
            $formButton.spinner().start();
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: formData,
                success: function (data) {
                    $formButton.spinner().stop();
                    if (!data.success) {
                        formValidation($form, data);
                    } else {
                        var dataHtml = data.renderedTemplate;
                        $formButton.addClass('f-added-checkmark').html($formButton.attr('data-saved'));
                        setTimeout(function () {
                            $formButton.removeClass('f-added-checkmark').html($formButton.attr('data-save'));
                            $form.closest('.payment-form-container').addClass('hide');
                            $('.b-account-payment').find('.address-right-container').empty().append(dataHtml);
                            paymentInstruments.viewMoreLess();
                            $('body').trigger('components:init');
                            $('html, body').animate({
                                scrollTop: 0
                            }, 500);
                        }, 3000);
                    }
                },
                error: function () {
                    $formButton.spinner().stop();
                }
            });
        }
        return false;
    }
}
