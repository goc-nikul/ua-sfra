'use strict';

var util = require('../../util');

// eslint-disable-next-line valid-jsdoc
/**
 * Renders a modal window that will open a email pop up for first time users
 */
function getCookie(name) {
    // eslint-disable-next-line one-var
    var value = '; ' + document.cookie,
        parts = value.split('; ' + name + '=');
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return '';
}

// eslint-disable-next-line require-jsdoc
function createCookie(name, value) {
    document.cookie = name + '=' + value + '; path=/';
}

/**
 * Tests the href against each excluded url
 * @param {Array} excludedUrls - an array of strings/regexp
 * @param {string} url - the url to test
 * @returns {boolean} - returns true if url should be excluded
 */
const isPageURLExcluded = (excludedUrls, url) => {
    if (!excludedUrls || !url) {
        return false;
    }
    try {
        return !!excludedUrls.find((searchUrl) => {
            return new RegExp(searchUrl).test(url);
        });
    } catch (err) {
        return false;
    }
};

module.exports = function () {
    const excludedUrls = ($('#emailPopUpModal').data('excluded-urls') + '').replace(' ', '').split(',');
    if (excludedUrls.length && isPageURLExcluded(excludedUrls, window.location.href)) {
        return;
    }

    if (getCookie('emailSubscribeCookie') === '' || getCookie('emailSubscribeCookie') === undefined || getCookie('emailSubscribeCookie') == null) {
        createCookie('emailSubscribeCookie', 'first');
    } else if (getCookie('emailSubscribeCookie') === 'first') {
        var closeBranch = setInterval(function () {
            util.branchCloseJourney();
        }, 2000);
        setTimeout(function () { clearInterval(closeBranch); }, 8000);
        $('#emailPopUpModal').modal('show');
        $('body > .modal-backdrop').css('z-index', '105').show();
        $('body').addClass('m-accessible-on');
        $('#emailPopUpModal').on('mouseenter', '.accessible-element', function () {
            $(this).focus();
        });
        $('#emailPopUpModal').find('.accessible-element').trigger('mouseenter');
        createCookie('emailSubscribeCookie', 'second');
    } else {
        $('#emailPopUpModal').modal('hide');
    }
};
