import Component from '../forms/FormGeneric';

const LOCAL_PART_LENGTH = 64;
const DOMAIN_PART_LENGTH = 255;

export default class EmailNewsletterSubs extends Component {
    init() {
        super.init();
        this.$signupContainer = $('.featured-banner--center', this.$el);
        this.signUpFormData = $('.hero-signup .featured-banner-form__input', this.$el);
        this.$signupButton = $('.cta-style1', this.$el);
        this.$signupEmailField = $('#subscribeNewsLetter', this.$el);
        this.$merkleSourceCode = $('#merklesc');
        this.event('submit', this.subscribe.bind(this));
        this.$signupForm = this.$el;
        if ($(window).width() < 1024) {
            $('.email-signup-merkle-code').attr('data-emailsource', 'mEmailSignupModel');
        }
    }

    displayMessage(data) {
        $.spinner().stop();

        if (data.success) {
            // this.$signupContainer.html(data.msg);
            $('#success-message').text(data.msg);
            $(this.$signupForm).addClass('data-success');
            $('#feedSuccess').removeClass('form-success');
            $('#feedSuccess').addClass('success');
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
            $('#emailPopUpModal').on('mouseenter', '.g-modal-close', function () {
                $(this).focus();
            });
            $('#emailPopUpModal').find('.g-modal-close').trigger('mouseenter');
        }
    }

    subscribe(event) {
        event.preventDefault();

        const url = this.$signupForm.attr('action');
        const email = this.$signupEmailField.val();
        const merkleSource = this.$merkleSourceCode.val();
        const [local, domain] = email.split('@');
        const emailsource = $(this.$signupForm).data('emailsource');

        if (local.length > LOCAL_PART_LENGTH || domain.length > DOMAIN_PART_LENGTH) {
            this.displayMessage({
                error: true,
                msg: $(this.$signupEmailField).data('pattern-mismatch')
            });
            return;
        }

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
}
