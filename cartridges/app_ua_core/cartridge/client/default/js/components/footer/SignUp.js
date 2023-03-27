import Component from '../forms/FormGeneric';

export default class SignUp extends Component {
    init() {
        super.init();
        this.$signupContainer = $('.js-signup-container', this.$el);
        this.$signupButton = $('.js-signup-submit', this.$el);
        this.$signupEmailField = $('.js-signup-email', this.$el);
        this.$merkleSourceCode = $('.js-merkle-code', this.$el);
        this.$continueShopButton = $('.b-continue_shop-button', this.$el);
        this.$successHeader = $('.js-email-success-header', this.$el);
        this.event('submit', this.subscribe.bind(this));
        this.$signupForm = this.$el;
        if ($(window).width() < 1024) {
            $('.email-signup-merkle-code').attr('data-emailsource', 'mEmailSignupModel');
        }
    }

    displayMessage(data) {
        $.spinner().stop();

        if (data.success) {
            $('body').find('.email-pop-content-asset', this.$el).hide();
            this.$signupContainer.html(data.msg);
            this.$continueShopButton.removeClass('hide');
            this.$signupContainer.addClass('data-success');
            this.$successHeader.removeClass('hide');
            if (data.merklecode === 10) {
                $('.js-first-subscrption').removeClass('hide');
            } else if (data.merklecode === -40) {
                $('.js-subscribed-user').removeClass('hide');
            }
            $('body').trigger('global:emailSubscribeSuccess', {
                merkleCode: data.merklecode,
                email: this.$signupEmailField.val(),
                merkleSource: this.$merkleSourceCode.val(),
                emailHashed: data.__mccEvents && data.__mccEvents[1] && data.__mccEvents[1].email, // eslint-disable-line spellcheck/spell-checker,no-underscore-dangle
                signupLocation: this.$signupEmailField.attr('data-analytics-location')
            });
        } else {
            this.$signupButton.attr('disabled', false);
        }

        if (data.error && data.msg) {
            this.$signupForm.find('.invalid-feedback').text(data.msg);
            this.$signupEmailField.addClass('is-invalid');
        }

        if ($('#emailPopUpModal').length > 0 && $('#emailPopUpModal').is(':visible')) {
            $('body').addClass('m-accessible-on');
            $('#emailPopUpModal').on('mouseenter', '.accessible-element', function () {
                $(this).focus();
            });
            $('#emailPopUpModal').find('.accessible-element').trigger('mouseenter');
        }
    }

    subscribe(event) {
        event.preventDefault();
        var $this = this.$signupEmailField;
        var customRegex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff]|[\u0250-\ue007])/;
        var emoRegex = /([#0-9]\u20E3)|[\xA9\xAE\u203C\u2047-\u2049\u2122\u2139\u3030\u303D\u3297\u3299][\uFE00-\uFEFF]?|[\u2190-\u21FF][\uFE00-\uFEFF]?|[\u2300-\u23FF][\uFE00-\uFEFF]?|[\u2460-\u24FF][\uFE00-\uFEFF]?|[\u25A0-\u25FF][\uFE00-\uFEFF]?|[\u2600-\u27BF][\uFE00-\uFEFF]?|[\u2900-\u297F][\uFE00-\uFEFF]?|[\u2B00-\u2BF0][\uFE00-\uFEFF]?|(?:\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDEFF])[\uFE00-\uFEFF]?/g;
        var emoStr = $this.val();

        if ((emoStr && customRegex.test(emoStr)) || (emoStr && emoRegex.test(emoStr))) {
            $this.parent().addClass('error-field');
            $this.addClass('is-invalid');
            $this.parent().find('.invalid-feedback').html($this.data('invalid-characters'));
            return;
        }
        const validateEmail = (emailValue) => {
            var validRegex =  /^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/; // eslint-disable-line
            return validRegex.test(emailValue);
        };

        var emailValue = this.$signupEmailField.val();
        if (validateEmail(emailValue)) {
            $this.parent().removeClass('error-field');
            $this.removeClass('is-invalid');
            $this.parent().find('.invalid-feedback').html('');

            if (!this.$signupForm.find('input.is-invalid').length) {
                const url = this.$signupForm.attr('action');
                const email = this.$signupEmailField.val();
                const merkleSource = this.$merkleSourceCode.val();
                const emailsource = $(this.$signupForm).data('emailsource');

                $.spinner().start();
                this.$signupButton.attr('disabled', true);

                $.ajax({
                    url: url,
                    type: 'post',
                    dataType: 'json',
                    context: this,
                    data: {
                        email: email,
                        emailSourceCode: merkleSource,
                        emailWebsource: emailsource
                    },
                    success: this.displayMessage,
                    error: this.displayMessage
                });
            }
        } else {
            $this.parent().addClass('error-field');
            $this.addClass('is-invalid');
            $this.parent().find('.invalid-feedback').html($this.attr('pattern_mismatch'));
        }
    }
}
