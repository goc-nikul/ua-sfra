'use strict';

$(document).ready(function () {
    var $cache = {
        input: $('.faq__input'),
        results: $('.faq__results'),
        menu: $('.faq__menu'),
        footer: $('footer#footercontent'),
        accordion: $('.accordion'),
        accordionMobile: $('.accordion-mobile'),
        contentLinks: $('.content-links'),
        d: $(document),
        w: $(window)
    };

    /**
     * to clear the results
    **/
    function clearResults() {
        $cache.results.html('');
    }

    /**
     * to scroll the browser on click of sub nav
     *  @param {number} xLocation - scrolled to this position
    **/
    function scrollBrowser(xLocation) {
        var $scrollBasis = $('html,body');
        var $wrapper = $('.faq__wrapper');
        var $globalPromo = $('#global-promo:visible');
        var $header = $('header.l-header:visible');
        var stickNavTop = 0;
        var fullHeaderHeight = ($globalPromo.length ? $globalPromo.height() : 0) + ($header.length ? $header.height() : 0);

        if (xLocation < $('.faq__wrapper').offset().top) {
            $scrollBasis.animate({ scrollTop: xLocation }, 500);
            return;
        }

        // if it need to change header height
        if ($(window).scrollTop() < stickNavTop) {
            $scrollBasis.animate({ scrollTop: stickNavTop }, 100, function () {
                var wrapperTopBefore = $wrapper.offset().top; // wrapper top position when header is big
                var wrapperTopDifference = wrapperTopBefore - $wrapper.offset().top; // wrapper top position difference
                fullHeaderHeight = ($globalPromo.length ? $globalPromo.height() : 0) + ($header.length ? $header.height() : 0) + wrapperTopDifference;
                $scrollBasis.animate({ scrollTop: xLocation - fullHeaderHeight }, 500);
            });
        } else {
            $scrollBasis.animate({ scrollTop: xLocation - fullHeaderHeight }, 500);
        }
    }

    /**
     * to search from FAQ search field
     *  @param {string} term - search the string passed
    **/
    function searchMe(term) {
        if ($cache.input.val() !== '') {
            clearResults();
            $('.faq__category').each(function (i) {
                var $this = $(this);
                var Nid = $this.attr('id');
                if ($this.text().search(new RegExp(term, 'i')) !== -1) {
                    $cache.results.append('<div class="faq__answer faq' + i + '"><a class="faq__named" href="#' + Nid + '" role="control">' + Nid.replace(/_/g, ' ') + '</a></div>');
                    $('#' + Nid + ' .faq__q-and-a').each(function () {
                        var $thisqa = $(this);
                        if ($thisqa.text().search(new RegExp(term, 'i')) !== -1) {
                            $thisqa.clone().appendTo('.faq__answer.faq' + i);
                        }
                    });

                    if ($('.faq__answer.faq' + i + ' .faq__q-and-a').length === 0) {
                        $('.faq__answer.faq' + i).addClass('faq__empty');
                    }
                }
            });
        }
        if ($cache.results.children().length === 0) {
            $cache.results.append('<div class="faq__noHits">' + $cache.results.data('nohits') + '</div>');
        }
    }

    if ($('.faq__wrapper').length > 0) {
        $('html').addClass('faq-content-page');
        $(window).on('scroll', function () {
            var menuheight = $cache.menu.height();
            var foottop = $cache.footer.offset().top - menuheight;
            var menutop = $cache.menu.offset().top;
            if (foottop - 50 <= menutop) {
                $cache.menu.addClass('faq__menu--bottom');
            }
            if ($cache.menu.css('position') === 'absolute' && $cache.w.scrollTop() + $cache.w.height() < Number($cache.menu.offset().top + menuheight + 380)) {
                $cache.menu.removeClass('faq__menu--bottom');
            }
        });

        $cache.input.on('keydown', function (e) {
            if (e.which === 13 || e.keyCode === 13) {
                e.preventDefault();
                searchMe($cache.input.val());
            }
        });
    }

    $cache.d.on('click', 'a.faq__named', function (e) {
        e.preventDefault();
        var newTop = $($(this).attr('href')).offset().top;
        scrollBrowser(newTop);
    });

    $cache.d.on('click', '.faq__q-and-a', function () {
        var $this = $(this);
        var el = $this.find('div:first');
        if (el.hasClass('icon__plus--square') === true) {
            el.removeClass('icon__plus--square').addClass('icon__minus--square');
            $this.find('span').addClass('faq__q-a--is-open');
        } else {
            el.removeClass('icon__minus--square').addClass('icon__plus--square');
            $this.find('span').removeClass('faq__q-a--is-open');
        }
    });

    $cache.d.on('click', '.faq__button-search', function () {
        searchMe($cache.input.val());
    });

    $cache.d.on('click', '.faq__button-clear', function () {
        clearResults();
        $cache.input.val('');
    });

    /**
     * to remove the hash tag which is getting aaded to the url
    **/
    function contentLinksReset() {
        // only run if cache exists
        if (typeof ($cache.contentLinks === 'undefined')) {
            $cache.contentLinks = $('.content-links');
        }
        // mobile versus desktop
        var trigger = $cache.contentLinks.find('.trigger');
        if (trigger.length > 0) {
            trigger.remove();
        }
        $cache.contentLinks.removeClass('open');

        $cache.contentLinks.find('a').off('click').on('click', function (e) {
            e.preventDefault();
            // escape slashes from href if exists
            var hrefValue = $(this).attr('href');
            if (hrefValue.indexOf('/') !== -1) {
                hrefValue = hrefValue.replace(/\//g, '\\/');
            }
            // scroll to the div
            var newTop = $(hrefValue).offset().top;
            scrollBrowser(newTop);
        });
    }
    contentLinksReset();
});
