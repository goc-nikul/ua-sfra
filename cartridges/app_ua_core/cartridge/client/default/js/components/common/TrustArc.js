'use strict';

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

module.exports = function () {
    $('#teconsent').add('#teconsent a').add('.l-consent_banner .close').on('click', function () {
        createCookie('consentCookie', 'first');
        $('.l-consent_banner').hide();
        $('body').removeClass('m-consent-show');
    });
    if (getCookie('consentCookie') === '' || getCookie('consentCookie') === undefined || getCookie('consentCookie') == null) {
        createCookie('consentCookie', 'first');
        $('.l-consent_banner').show();
        $('body').addClass('m-consent-show');
    } else {
        $('.l-consent_banner').hide();
    }

    // codes for privacy policy banner
    if ($('.l-privacy_banner:visible').length) {
        $('body').addClass('m-privacy_banner-show');
    }
    $('.l-privacy_banner .close').on('click', function () {
        $('.l-privacy_banner').hide();
        $('body').removeClass('m-privacy_banner-show');
    });
};
