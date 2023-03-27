'use strict';
/**
* @description Bazaar Voice Events for Data layer
*/
module.exports = {
    bvReviewEvents: function () {
        $(document).on('click', '.bv-write-review', function () {
            $('body').trigger('write:review');
        });

        $(document).on('click', '.bv-submission-button-submit', function () {
            if ($('#bv-casltext-question').length) {
                $('body').trigger('submit:question');
            } else {
                $('body').trigger('submit:review');
            }
        });

        $(document).on('click', '.bv-ask-question-label, .bv-ask-question', function () {
            $('body').trigger('start:question');
        });
    }
};
