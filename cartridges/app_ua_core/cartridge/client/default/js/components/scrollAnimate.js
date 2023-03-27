'use strict';

module.exports = function (element) {
    var position = element && element.length ? (element.offset().top - $('.l-header-section_bottom').outerHeight()) : 0;
    if ($(window).width() < 1024) {
        position = element && element.length ? (element.offset().top - $('.l-header-section_bottom').outerHeight() - ($('.b-checkout_sticky-applypromo').length > 0 ? $('.b-checkout_sticky-applypromo').outerHeight() : 0)) : 0;
    }
    $('html, body').animate({
        scrollTop: position - 30
    }, 500);
    if (!element) {
        $('.logo-home').focus();
    }
};
