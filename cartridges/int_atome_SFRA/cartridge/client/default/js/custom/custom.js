
'use strict';

$('.atome-logo-popup').on('click', function () {
    $('.atome-popup-show').addClass('show');
    $('body').addClass('atome-hidden');
});

$('.atome-close').on('click', function () {
    $('.atome-popup-show').removeClass('show');
    $('body').removeClass('atome-hidden');
});
