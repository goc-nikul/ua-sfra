import Component from 'org/components/forms/FormGeneric';
import ToastMessage from 'org/components/common/ToastMessage';

var formValidation = require('base/components/formValidation');
var clientSideValidation = require('../common/clientSideValidation');

export default class checkoutRegistration extends Component {
    init() {
        super.init();
        this.event('submit', this.checkoutRegistrationSubmit.bind(this));
    }

    checkoutRegistrationSubmit(event) {
        event.preventDefault();
        $('.b-registration-checkout-error').addClass('hide');
        var form = this.$el;
        var url = form.attr('action');
        clientSideValidation.validateMinimumAgeRestriction(form);
        if (!form.find('input.is-invalid, select.is-invalid').length) {
            form.spinner().start();
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: form.serialize(),
                success: function (data) {
                    form.spinner().stop();
                    if (data && data.errorEstimateMsg) {
                        new ToastMessage(data.errorEstimateMsg, {
                            duration: 3000,
                            type: 'error'
                        }).show();
                    }
                    if (!data.success) {
                        if (data.duplicateCustomer) {
                            $('.b-registration-checkout-error').removeClass('hide');
                        } else {
                            formValidation(form, data);
                        }
                    } else {
                        $('body').trigger('register:success:analytics', {
                            email: $('.email-text').attr('data-analytics-email')
                        });
                        if ('rewardsEnroll' in data) {
                            $('body').trigger('loyalty:enroll', {
                                type: 'genericLink',
                                loyalty: data.rewardsEnroll,
                                action: data.rewardsEnroll ? 'joined-yes' : 'joined-no',
                                member: 'new_member',
                                points_earned: 'estimationPoints' in data ? data.estimationPoints : 0
                            });
                        }
                        if (data.redirectUrl) {
                            location.href = data.redirectUrl;
                        }
                        if (data.rewardsEnroll) {
                            $('.b-order-confirmation_account').addClass('border-hide');
                            $('.b-order-confirmation_account').html(data.template);
                        }
                    }
                },
                error: function (err) {
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    }
                    form.spinner().stop();
                }
            });
        }
        return false;
    }
}
