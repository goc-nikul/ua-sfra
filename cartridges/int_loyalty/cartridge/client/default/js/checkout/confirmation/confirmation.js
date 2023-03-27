'use strict';
const $checkboxRewardsEnroll = $('.js-checkbox-rewards-enroll');

module.exports = {
    init: function () {
        $checkboxRewardsEnroll.on('click', function () {
            $(this).closest('form').toggleClass('js-loyalty-enable-toggle');
        });
    }
};
