'use strict';

/**
* @description Add Browser Cookie Check
*/
function initializeBrowserCookieCheck() {
    if (document.cookie.length === 0) {
        var cookieText = $('#browser-check').data('cookie');
        $('<div/>').addClass('browser-compatibility-alert').append(
            $('<p/>').addClass('browser-error').html(cookieText)).appendTo('#browser-check');
    }
}

module.exports = {
    init: function () {
        initializeBrowserCookieCheck();
    }
};
