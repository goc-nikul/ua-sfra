'use strict';

var keyboardAccessibility = require('./keyboardAccessibility');

const util = require('../util');
const loadHoverIntentPlugin = () => util.loadScript('/lib/jquery/jquery.hoverIntent.min.js');

var clearSelection = function (element) {
    $(element).closest('.dropdown').children('.dropdown-menu').children('.top-category')
        .detach();
    $(element).closest('.dropdown.show').children('.nav-link').attr('aria-expanded', 'false');
    $(element).closest('.dropdown.show').children('.dropdown-menu').attr('aria-hidden', 'true');
    $(element).closest('.dropdown.show').removeClass('show');
    $('div.menu-group > ul.nav.navbar-nav > li.nav-item > a').attr('aria-hidden', 'false');
    $(element).closest('li').detach();
};

var scrollDirection = function (start, end) {
    if (start >= end) {
        $('body').removeClass('scrolling-up');
        $('body').addClass('scrolling-down');
    } else {
        $('body').addClass('scrolling-up');
        $('body').removeClass('scrolling-down');
    }
};

module.exports = function () {
    var isDesktop = function (element) {
        return $(element).parents('.menu-toggleable-left').css('position') !== 'fixed';
    };

    var headerBannerStatus = window.sessionStorage.getItem('hide_header_banner');
    $('.header-banner .close').on('click', function () {
        $('.header-banner').addClass('d-none');
        window.sessionStorage.setItem('hide_header_banner', '1');
    });

    if (!headerBannerStatus || headerBannerStatus < 0) {
        $('.header-banner').removeClass('d-none');
    }

    keyboardAccessibility('.main-menu .nav-link, .main-menu .dropdown-link',
        {
            40: function (menuItem) { // down
                if (menuItem.hasClass('nav-item')) { // top level
                    $('.navbar-nav .show').removeClass('show')
                        .children('.dropdown-menu')
                        .removeClass('show');
                    menuItem.addClass('show').children('.dropdown-menu').addClass('show');
                    menuItem.find('ul > li > a')
                        .first()
                        .focus();
                } else {
                    menuItem.removeClass('show').children('.dropdown-menu').removeClass('show');
                    if (!(menuItem.next().length > 0)) { // if this is the last menuItem
                        menuItem.parent().parent().find('li > a') // set focus to the first menuitem
                        .first()
                        .focus();
                    } else {
                        menuItem.next().children().first().focus();
                    }
                }
            },
            39: function (menuItem) { // right
                if (menuItem.hasClass('nav-item')) { // top level
                    menuItem.removeClass('show').children('.dropdown-menu').removeClass('show');
                    $(this).attr('aria-expanded', 'false');
                    menuItem.next().children().first().focus();
                } else if (menuItem.hasClass('dropdown')) {
                    menuItem.addClass('show').children('.dropdown-menu').addClass('show');
                    $(this).attr('aria-expanded', 'true');
                    menuItem.find('ul > li > a')
                        .first()
                        .focus();
                }
            },
            38: function (menuItem) { // up
                if (menuItem.hasClass('nav-item')) { // top level
                    menuItem.removeClass('show').children('.dropdown-menu').removeClass('show');
                } else if (menuItem.prev().length === 0) { // first menuItem
                    menuItem.parent().parent().removeClass('show')
                        .children('.nav-link')
                        .attr('aria-expanded', 'false');
                    menuItem.parent().children().last().children() // set the focus to the last menuItem
                        .first()
                        .focus();
                } else {
                    menuItem.prev().children().first().focus();
                }
            },
            37: function (menuItem) { // left
                if (menuItem.hasClass('nav-item')) { // top level
                    menuItem.removeClass('show').children('.dropdown-menu').removeClass('show');
                    $(this).attr('aria-expanded', 'false');
                    menuItem.prev().children().first().focus();
                } else {
                    menuItem.closest('.show').removeClass('show')
                        .closest('li.show').removeClass('show')
                        .children()
                        .first()
                        .focus()
                        .attr('aria-expanded', 'false');
                }
            },
            27: function (menuItem) { // escape
                var parentMenu = menuItem.hasClass('show')
                    ? menuItem
                    : menuItem.closest('li.show');
                parentMenu.children('.show').removeClass('show');
                parentMenu.removeClass('show').children('.nav-link')
                    .attr('aria-expanded', 'false');
                parentMenu.children().first().focus();
            }
        },
        function () {
            return $(this).parent();
        }
    );

    $('.dropdown:not(.disabled) [data-toggle="dropdown"]')
        .on('click', function (e) {
            if (!isDesktop(this)) {
                $('.modal-background').show();
                // copy parent element into current UL
                var li = $('<li class="dropdown-item top-category" role="button"></li>');
                var link = $(this).clone().removeClass('dropdown-toggle')
                    .removeAttr('data-toggle')
                    .removeAttr('aria-expanded')
                    .attr('aria-haspopup', 'false');
                li.append(link);
                var closeMenu = $('<li class="nav-menu"></li>');
                closeMenu.append($('.close-menu').first().clone());
                $(this).parent().children('.dropdown-menu')
                    .prepend(li)
                    .prepend(closeMenu)
                    .attr('aria-hidden', 'false');
                // copy navigation menu into view
                $(this).parent().addClass('show');
                $(this).attr('aria-expanded', 'true');
                $(link).focus();
                $('div.menu-group > ul.nav.navbar-nav > li.nav-item > a').attr('aria-hidden', 'true');
                e.preventDefault();
            }
        })
        .on('mouseenter', function () {
            if (isDesktop(this)) {
                var eventElement = this;
                $('.navbar-nav > li').each(function () {
                    if (!$.contains(this, eventElement)) {
                        $(this).find('.show').each(function () {
                            clearSelection(this);
                        });
                        if ($(this).hasClass('show')) {
                            $(this).removeClass('show');
                            $(this).children('ul.dropdown-menu').removeClass('show');
                            $(this).children('.nav-link').attr('aria-expanded', 'false');
                        }
                    }
                });
                // need to close all the dropdowns that are not direct parent of current dropdown
                $(this).parent().addClass('show');
                $(this).siblings('.dropdown-menu').addClass('show');
                $(this).attr('aria-expanded', 'true');
            }
        })
        .parent()
        .on('mouseleave', function () {
            if (isDesktop(this)) {
                $(this).removeClass('show');
                $(this).children('.dropdown-menu').removeClass('show');
                $(this).children('.nav-link').attr('aria-expanded', 'false');
            }
        });

    loadHoverIntentPlugin().then(function () {
        $('.b-navigation-item').hoverIntent(function () {
            $(this).toggleClass('hoverintent');
        });
    });

    $('body').on('click', '#myaccount', function () {
        event.preventDefault();
    });

    /* Scrolling direction and touch gesture mapping for scroll direction */
    $(window).on('wheel', function (e) {
        var delta = e.originalEvent.deltaY;
        scrollDirection(delta, 0);
    });

    var touchstart;
    $(document).bind('touchstart', function (e) {
        touchstart = e.originalEvent.touches[0].clientY;
    });

    $(document).bind('touchmove', function (e) {
        var touchend = e.originalEvent.changedTouches[0].clientY;
        scrollDirection(touchstart, touchend);
    });

    const $headerBanner = $('.b-header-banner');
    const $promoBannerWrapper = $('.promo-banner__wrapper');
    const $globalMessageBannerWrapper = $('.b-global-message-banner__wrapper .js-promo-header-banner');
    const $globalPromoBannerMessage = $('.b-global-promo-banner-message .js-promo-header-banner');

    var removePromoMessage = function () {
        if ($('.header-mobile-message').length) {
            $('.header-mobile-promo').remove();
            $('.b-header-banner .promo-banner__modal-1').first().remove();
        } else {
            $('.header-mobile-promo').closest('.js-promo-header-banner').remove();
            let loadnumber = $promoBannerWrapper.attr('data-assets') - 1;
            $promoBannerWrapper.attr('data-assets', loadnumber);
        }
        $('.b-global-promo-banner').addClass('promo-banner--closed');
    };
    $('.js-banner-close').on('click', function () {
        removePromoMessage();
    });

    $headerBanner.on('click', '.js-banner-close', function () {
        removePromoMessage();
    });

    var analyticAddition = function () { // fires for analytics purpose
        $('body').trigger('modalShown', {
            name: 'sitewide: promo banner'
        });
    };
    $headerBanner.on('click', '.promo-tooltip-link', function () {
        if (window.matchMedia('(max-width: 1024px)').matches) {
            $('.b-header-banner .g-promo-combo-modal').first().addClass('promo-banner--show');
            analyticAddition();
        }
    });
    $headerBanner.on('click', '.js-menu-close', function () {
        $('.g-promo-combo-modal').removeClass('promo-banner--show');
    });

    // Clones elements from message banner and/or promo banner to Header banner for mobile display and updates data.
    if ($globalMessageBannerWrapper.length || $globalPromoBannerMessage.length) {
        let loadNumber = $('.b-header-banner .js-promo-header-banner').length;
        let analyticsAssetID = '';
        let analyticsVariant = 'header-banner';
        if ($globalMessageBannerWrapper.length) {
            analyticsAssetID = $('.b-global-message-banner__wrapper .js-promo-header-banner').attr('data-analytics-id');
        } else if ($globalPromoBannerMessage.length) {
            analyticsAssetID = $('.b-global-promo-banner-message .js-promo-header-banner').attr('data-analytics-id');
        }

        $('.b-header-banner .promo-banner-slider').append('<div class="js-promo-header-banner promo-banner__slide-' + loadNumber
        + '" data-analytics-id="' + analyticsAssetID + '" data-analytics-variant="' + analyticsVariant
        + '" data-analytics-type="bm-header-text-link"><div class="mobile-messages__wrapper"></div>');

        if ($globalPromoBannerMessage.length) {
            let clonedSlidePromo = $('.b-global-promo-banner-message .js-promo-header-banner').find('.promo-mobile-layout').clone().html();
            let clonedClosebox = $('.b-global-promo-banner-exit').clone();
            $('.mobile-messages__wrapper').append('<div class="header-mobile-promo">' + clonedSlidePromo + '</div>');
            $('.header-mobile-promo').append(clonedClosebox.html());
            if ($('.b-global-promo-banner-message .g-promo-combo-modal').length) {
                let clonedModal = $('.b-global-promo-banner-message .g-promo-combo-modal').clone();
                $('.b-header-banner .promo-banner__wrapper').append('<div class="g-promo-combo-modal promo-banner__modal-' + loadNumber + '">' + clonedModal.html() + '</div>');
            }
        }
        if ($globalMessageBannerWrapper.length) {
            let clonedSlideMessage = $('.b-global-message-banner__wrapper .js-promo-header-banner').find('.promo-mobile-layout').clone().html();
            $('.mobile-messages__wrapper').append('<div class="header-mobile-message">' + clonedSlideMessage + '</div>');
            if ($('.b-global-message-banner__wrapper .g-promo-combo-modal').length) {
                let clonedModal = $('.b-global-message-banner__wrapper .g-promo-combo-modal').clone();
                $('.b-header-banner .promo-banner__wrapper').append('<div class="g-promo-combo-modal promo-banner__modal-' + loadNumber + '">' + clonedModal.html() + '</div>');
            }
        }
        $promoBannerWrapper.attr('data-assets', loadNumber + 1);
    }

    $('.promo-banner__wrapper .g-modal-close').on('click', function () {
        $(this).closest('.g-promo-combo-modal').hide();
    });

    var ttMouseIn = function () { // moueseIn to display tooltip
        if (window.matchMedia('(min-width: 1025px)').matches) {
            let $this = $(this);
            let toolRoot = $this.closest('.js-promo-header-banner');
            let toolTarget = toolRoot.prop('className').slice(-1);
            let horizontalLoc = event.clientX;
            if ($this.parents('.b-global-promo-banner-message').length) {
                $('.b-global-promo-banner-message .promo-banner__modal-' + toolTarget).show().css('left', horizontalLoc);
            }
            if ($this.parents('.b-global-message-banner__wrapper').length) {
                $('.b-global-message-banner__wrapper .promo-banner__modal-' + toolTarget).show().css('left', horizontalLoc);
            }
            analyticAddition();
        }
    };
    var ttMouseOut = function () { // moueseOut to hide tooltip
        let $this = $(this);
        let toolRoot = $this.closest('.js-promo-header-banner');
        let toolTarget = toolRoot.prop('className').slice(-1);
        if ($this.parents('.b-global-promo-banner-message').length) {
            $('.b-global-promo-banner-message .promo-banner__modal-' + toolTarget).hide();
        }
        if ($this.parents('.b-global-message-banner__wrapper').length) {
            $('.b-global-message-banner__wrapper .promo-banner__modal-' + toolTarget).hide();
        }
    };
    $('.promo-tooltip-link').hover(ttMouseIn, ttMouseOut);
};
