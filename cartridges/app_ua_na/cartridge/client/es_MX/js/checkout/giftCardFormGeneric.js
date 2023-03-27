import Component from '../components/forms/FormGeneric';

export default class giftCardFormGeneric extends Component {
    init() {
        super.init();
        this.event('submit', this.giftCardFormGenericSubmit.bind(this));
    }

    validateInputFields() {
        $(this.$el).find('input:visible, select:visible').each((index, input) => {
            var $this = $(input);
            var value = $this.val();
            var errorMessage = null;
            if (!value) {
                errorMessage = $this.data('missing-error');
            } else {
                var customerRegExp = new RegExp($this.attr('pattern'), '');
                if (!customerRegExp.test(value)) {
                    errorMessage = $this.data('parse-error');
                }
            }

            if (errorMessage) {
                $this.closest('.form-group').find('.invalid-feedback').text(errorMessage);
                $this.addClass('is-invalid');
            }
        });
    }

    giftCardFormGenericSubmit(event) {
        event.preventDefault();
        $('.gift-card-payment').spinner().start();
        var $form = this.$el;
        this.validateInputFields();
        if (!$form.find('input.is-invalid').length && !$form.find('select.is-invalid').length) {
            $.ajax({
                url: $form.attr('action'),
                type: 'post',
                data: $form.serialize(),
                context: this,
                success: function (response) {
                    if (response && response.data && response.data.success) {
                        var $parsedHtml = this.parseHtml(response.renderedTemplate);
                        $('.js-giftcard-container .s-giftcard_section_ajax').html($parsedHtml.body);
                        var $giftcardFields = $('.s-giftcard__formFields');
                        $giftcardFields.addClass('hide');
                        $('.paypal-tab, .g-tabs-chip.klarna-payment-item, .g-accordion-item.klarna_payments-content, .applepay-tab, .g-accordion-item.paypal-content, .g-accordion-item.applepay-tab-wrapper').addClass('hide');
                        $('.nav-item.paymetric-tab a.nav-link').trigger('click');
                        if (response.data.isOrderTotalRedeemed) {
                            $('.credit-card-selection-new .tab-pane').removeClass('active');
                            $('.payment-information .g-tabs-chip.nav-item .nav-link').removeClass('active');
                            $('.b-payment-tab').addClass('hide');
                            $('.payment-information').addClass('gc-pay');
                            $('.b-payment-heading').addClass('hide');
                        }
                        if (response && response.gcResults && response.gcResults.gcPaymentInstruments) {
                            var gcAppliedAmount = $('.js-gift_card_applied_amount');
                            var htmlToAppend = '';
                            for (var i = 0; i < response.gcResults.gcPaymentInstruments.length; i++) {
                                var gcPaymentInstrument = response.gcResults.gcPaymentInstruments[i];
                                htmlToAppend += `<div class="gift_card_applied_amount active">
                                    <span class="order-summary_itemsattr">
                                    <span class="order-receipt-label gc-row">${gcAppliedAmount.data('giftcard-title')} ${gcPaymentInstrument.maskedGcLastFourNumber}:</span></span>
                                    <span class="order-summary_itemsvalue">
                                        <span class="text-right gc-row">- <span class="gc-applied-amount">${gcPaymentInstrument.appliedAmount}</span></span>
                                    </span></div>`;
                            }
                            gcAppliedAmount.empty().append(htmlToAppend);
                        }
                    } else {
                        $('.s-giftcard__formFields .error-info').html(response.data.message);
                    }
                    $('.gift-card-payment').spinner().stop();
                },
                error: function () {
                    $('.gift-card-payment').spinner().stop();
                }
            });
        } else {
            $('.gift-card-payment').spinner().stop();
        }
    }

    parseHtml(html) {
        var $html = $('<div>').append($.parseHTML(html));

        var body = $html.find('.s-giftcard_section_ajax');

        return { body: body };
    }

    handleGiftCardSectionDisplay(data) {
        var $giftcardFields = $('.s-giftcard__formFields');
        if (data && data.renderedTemplate) {
            $('.js-giftcard-container .s-giftcard_section_ajax').html($(data.renderedTemplate).find('.s-giftcard_section_ajax').html());
            if ($('.b-giftcard_applied_card').length) {
                $giftcardFields.addClass('hide');
            } else {
                $giftcardFields.removeClass('hide');
            }
        }
        if (data.gcResults && data.gcResults.gcPaymentInstruments && data.gcResults.gcPaymentInstruments.length > 0) {
            var gcAppliedAmount = $('.js-gift_card_applied_amount');
            var htmlToAppend = '';
            for (var i = 0; i < data.gcResults.gcPaymentInstruments.length; i++) {
                var gcPaymentInstrument = data.gcResults.gcPaymentInstruments[i];
                htmlToAppend += `<div class="gift_card_applied_amount active">
                    <span class="order-summary_itemsattr">
                    <span class="order-receipt-label gc-row">${gcAppliedAmount.data('giftcard-title')} ${gcPaymentInstrument.maskedGcLastFourNumber}:</span></span>
                    <span class="order-summary_itemsvalue">
                        <span class="text-right gc-row">- <span class="gc-applied-amount">${gcPaymentInstrument.appliedAmount}</span></span>
                    </span></div>`;
            }
            gcAppliedAmount.empty().append(htmlToAppend);
            if (data.gcResults.isOrderTotalRedeemed) {
                $('.payment-information').addClass('gc-pay');
                $('.b-payment-tab').addClass('hide');
                $('.b-payment-heading').addClass('hide');
            } else {
                $('.payment-information').removeClass('gc-pay');
                $('.b-payment-tab').removeClass('hide');
                $('.b-payment-heading').removeClass('hide');
                $('.nav-item.paymetric-tab a.nav-link').trigger('click');
            }
        } else {
            $('.gift_card_applied_amount').removeClass('active');
            $('.payment-information').removeClass('gc-pay');
            $('.b-payment-tab').removeClass('hide');
            $('.b-payment-heading').removeClass('hide');
            $('.nav-item.paymetric-tab a.nav-link').trigger('click');
        }
        if (!($('.js-giftCard-section').is(':checked'))) {
            $giftcardFields.addClass('hide');
        } else {
            $giftcardFields.removeClass('hide');
        }
        if (data.basketHasGiftCard) {
            $('.js-giftcard-container').remove();
        }
    }
}
