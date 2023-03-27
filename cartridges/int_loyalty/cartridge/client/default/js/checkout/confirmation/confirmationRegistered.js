'use strict';
const form = $('.b-loyalty-confirmation-registred_form');
const loyaltyWrapper = $('.b-loyalty-confirmation-registred');

module.exports = {
    init: function () {
        form.on('submit', function (e) {
            e.preventDefault();
            const url = form.attr('action');
            form.spinner().start();
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: form.serialize(),
                success: function (data) {
                    form.spinner().stop();
                    if (data.success) {
                        loyaltyWrapper.addClass('border-hide');
                        loyaltyWrapper.html(data.template);
                        $('body').trigger('loyalty:enroll', {
                            type: 'genericLink',
                            loyalty: true,
                            action: 'joined-yes',
                            member: 'current_member',
                            points_earned: data.estimationPoints
                        });
                    }
                },
                error: function (err) {
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    }
                    form.spinner().stop();
                }
            });
        });
    }
};
