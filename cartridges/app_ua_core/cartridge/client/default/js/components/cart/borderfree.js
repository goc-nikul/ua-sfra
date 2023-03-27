'use strict';

var borderfree = {
    /**
    * @function
    * @description Clear minicart after successful bf checkout
    */
    handleEmptyCart: function () {
        function bfResponse (e) { // eslint-disable-line
            if (typeof e.data.indexOf === 'function' && e.data.indexOf('clear-cart') >= 0) {
                // clear cart contents
                $('.mini-cart-link').addClass('mini-cart-empty');
                $('.minicart-quantity').remove();
                $('.minicart .minicart-link').attr({
                    'aria-label': 'Cart 0 Items',
                    title: 'Cart 0 Items'
                });
                $('.minicart .b-header_minicart-container').empty();
                $('.minicart .b-header_minicart-container').removeClass('show');
                $('.minicart .b-header_minicart-modal-backdrop').removeClass('show');
            }
        }

        if (window.addEventListener) {
            // For standards-compliant web browsers
            window.addEventListener('message', bfResponse, false);
        } else {
            window.attachEvent('onmessage', bfResponse);
        }
    }
};

module.exports = borderfree;
