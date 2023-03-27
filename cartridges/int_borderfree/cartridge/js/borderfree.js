'use strict';

var borderfree = {
    /**
     * @function
     * @description Clear minicart after successful bf checkout
     */
	handleEmptyCart: function () {
		function bfResponse (e) {
			if(e.data.indexOf('clear-cart') >= 0){
				// clear cart contents
				$('.mini-cart-link').addClass('mini-cart-empty');
				$('.minicart-quantity').html('0');
				$('.mini-cart-content').remove();
			}
		}
		if (window.addEventListener) {
			// For standards-compliant web browsers
			window.addEventListener("message", bfResponse, false);
		}
		else {
			window.attachEvent("onmessage", bfResponse);
		}
    }
};

module.exports = minicart;
