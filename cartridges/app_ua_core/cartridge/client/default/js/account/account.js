'use strict';

module.exports = {
    accountNavDropDown: function () {
        $('body').on('click', '.js-account-page-heading', function (e) {
            e.preventDefault();
            if ($('.js-account-left').hasClass('show')) {
                $('.js-account-left').removeClass('show');
                $(this).removeClass('show');
                $('body').removeClass('m-no-scroll');
                $('.js-hide-sec, .b-breadcrumbs, .js-order-return-exchange-items').show();
            } else {
                $('.js-account-left').addClass('show');
                $(this).addClass('show');
                $('body').addClass('m-no-scroll');
                $('.js-hide-sec, .b-breadcrumbs, .js-order-return-exchange-items').hide();
            }
        });

        $('body').on('click', '.write-review-link', function (e) {
            e.preventDefault();
            var $productID = $('.write-review-link').attr('data-product');
            $BV.ui('rr', 'submit_review', { // eslint-disable-line no-undef
                productId: $productID
            });
        });
    },

    consecutiveSpaceValidator: function () {
        var counter = 0;
        $('#trackorder-form-number, #trackorder-form-email').on('keydown', function (e) {
            if (e.which === 32 || e.keyCode === 32) {
                counter += 1;
                if (counter > 1) {
                    e.preventDefault();
                }
            } else {
                counter = 0;
            }
        });
    }
};
