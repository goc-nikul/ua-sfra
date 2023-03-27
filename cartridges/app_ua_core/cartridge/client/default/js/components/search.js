'use strict';

var debounce = require('lodash/debounce');
var layout = require('../layout');
var productCookieId = require('../product/productIdCookie');
var endpoint = $('.js-suggestions-wrapper').data('url');
var UP_KEY = 38;
var DOWN_KEY = 40;
var DIRECTION_DOWN = 1;
var DIRECTION_UP = -1;

/**
 * Retrieves Suggestions element relative to scope
 *
 * @param {Object} scope - Search input field DOM element
 * @return {JQuery} - .js-suggestions-wrapper element
 */
function getSuggestionsWrapper(scope) {
    return $(scope).closest('.js-search-container').siblings('.js-suggestions-wrapper');
}

/**
 * Determines whether DOM element is inside the .search-mobile class
 *
 * @param {Object} scope - DOM element, usually the input.js-search-field element
 * @return {boolean} - Whether DOM element is inside  div.search-mobile
 */
function isMobileSearch(scope) {
    return !!$(scope).closest('.search-mobile').length;
}

/**
 * Remove modal classes needed for mobile suggestions
 *
 */
function clearModals() {
    $('body').removeClass('modal-open');
    $('header').siblings().attr('aria-hidden', 'false');
    $('.js-suggestions').removeClass('modal');
}

/**
 * Apply modal classes needed for mobile suggestions
 *
 * @param {Object} scope - Search input field DOM element
 */
function applyModals(scope) {
    if (isMobileSearch(scope)) {
        $('body').addClass('modal-open');
        $('header').siblings().attr('aria-hidden', 'true');
        getSuggestionsWrapper(scope).find('.js-suggestions').addClass('modal');
    }
}

/**
 * Tear down Suggestions panel
 */
function tearDownSuggestions() {
    $('input.js-search-field').val('');
    clearModals();
    $('.search-mobile .js-suggestions').unbind('scroll');
    $('.js-suggestions-wrapper').empty();
}

/**
 * Toggle search field icon from search to close and vice-versa
 *
 * @param {string} action - Action to toggle to
 */
function toggleSuggestionsIcon(action) {
    var mobileSearchIcon = '.search-mobile button.';
    var iconSearch = 'fa-search';
    var iconSearchClose = 'fa-close';

    if (action === 'close') {
        $(mobileSearchIcon + iconSearch).removeClass(iconSearch).addClass(iconSearchClose).attr('type', 'button');
    } else {
        $(mobileSearchIcon + iconSearchClose).removeClass(iconSearchClose).addClass(iconSearch).attr('type', 'submit');
    }
}

/**
 * Determines whether the "More Content Below" icon should be displayed
 *
 * @param {Object} scope - DOM element, usually the input.js-search-field element
 */
function handleMoreContentBelowIcon(scope) {
    if (($(scope).scrollTop() + $(scope).innerHeight()) >= $(scope)[0].scrollHeight) {
        $('.more-below').fadeOut();
    } else {
        $('.more-below').fadeIn();
    }
}

/**
 * Positions Suggestions panel on page
 *
 * @param {Object} scope - DOM element, usually the input.js-search-field element
 */
function positionSuggestions(scope) {
    var outerHeight;
    var $scope;
    var $suggestions;
    var top;

    if (isMobileSearch(scope)) {
        $scope = $(scope);
        top = $scope.offset().top;
        outerHeight = $scope.outerHeight();
        $suggestions = getSuggestionsWrapper(scope).find('.js-suggestions');
        $suggestions.css('top', top + outerHeight);

        handleMoreContentBelowIcon(scope);

        // Unfortunately, we have to bind this dynamically, as the live scroll event was not
        // properly detecting dynamic suggestions element's scroll event
        $suggestions.scroll(function () {
            handleMoreContentBelowIcon(this);
        });
    }
}

/**
 * Recently viewed cookie function
 */
function recentlyViewedBadge() {
    // Get pvpIDs cookie
    var productIds = productCookieId.getCookie('pvpIDs').split(',');
    $('.b-tile_badge-recently-viewed').css('display', 'none');
    // if product ID is in cookie, find recently viewed & show
    if (productIds !== ['']) {
        productIds.forEach(value => {
            var values = document.querySelectorAll('[data-product="' + value + '"]');
            if (values.length) {
                var recentlyViewed = values[0].querySelector('.b-tile_badge-recently-viewed');
                var hideTopLeftBadge = values[0].querySelector('.hide-top_left_badge');
                var hideFlameIconBadge = values[0].querySelector('.b-tile-badge_top_left.b-flameIcon');
                if (recentlyViewed) {
                    recentlyViewed.style.display = 'block';
                    if (hideTopLeftBadge) hideTopLeftBadge.style.display = 'none';
                    if (hideFlameIconBadge) hideFlameIconBadge.style.display = 'none';
                }
            }
        });
    }
}

/**
 * Process Ajax response for SearchServices-GetSuggestions
 *
 * @param {Object|string} response - Empty object literal if null response or string with rendered
 *                                   suggestions template contents
 */
function processResponse(response) {
    var $suggestionsWrapper = getSuggestionsWrapper(this).empty();

    $.spinner().stop();

    if (!(typeof (response) === 'object')) {
        $suggestionsWrapper.append(response).show();

        $(this).closest('.js-search-container').addClass('m-suggestions-show');
        positionSuggestions(this);

        if (isMobileSearch(this)) {
            toggleSuggestionsIcon('close');
            applyModals(this);
        }

        // Trigger screen reader by setting aria-describedby with the new suggestion message.
        var suggestionsList = $('.js-suggestions .js-item');
        if ($(suggestionsList).length) {
            $('input.js-search-field').attr('aria-describedby', 'search-result-count');
        } else {
            $('input.js-search-field').removeAttr('aria-describedby');
        }
        recentlyViewedBadge();

        // Hide the product tile if no image configured
        $suggestionsWrapper.find('.b-tile.hide').parent('.b-suggestions_products-item').addClass('hide');
    } else {
        $suggestionsWrapper.hide();
    }
}

/**
 * Retrieve suggestions
 *
 * @param {Object} scope - Search field DOM element
 */
function getSuggestions(scope) {
    if ($(scope).val().length >= $(scope).data('min-chars')) {
        $.spinner().start();
        $.ajax({
            context: scope,
            url: endpoint + encodeURIComponent($(scope).val()),
            method: 'GET',
            data: {
                isMobilePortraitView: layout.isExtraSmallView()
            },
            success: processResponse,
            error: function () {
                $.spinner().stop();
            }
        });
    } else {
        toggleSuggestionsIcon('search');
        $(scope).closest('.js-search-container').removeClass('m-suggestions-show');
        clearModals();
        getSuggestionsWrapper(scope).empty();
    }
}

/**
 * Handle Search Suggestion Keyboard Arrow Keys
 *
 * @param {Integer} direction takes positive or negative number constant, DIRECTION_UP (-1) or DIRECTION_DOWN (+1)
 */
function handleArrow(direction) {
    // get all li elements in the suggestions list
    var suggestionsList = $('.js-suggestions .js-item');
    if (suggestionsList.filter('.selected').length === 0) {
        suggestionsList.first().addClass('selected');
        $('input.js-search-field').each(function () {
            $(this).attr('aria-activedescendant', suggestionsList.first()[0].id);
        });
    } else {
        suggestionsList.each(function (index) {
            var idx = index + direction;
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected');
                $(this).removeAttr('aria-selected');
                if (suggestionsList.eq(idx).length !== 0) {
                    suggestionsList.eq(idx).addClass('selected');
                    suggestionsList.eq(idx).attr('aria-selected', true);
                    $(this).removeProp('aria-selected');
                    $('input.js-search-field').each(function () {
                        $(this).attr('aria-activedescendant', suggestionsList.eq(idx)[0].id);
                    });
                } else {
                    suggestionsList.first().addClass('selected');
                    suggestionsList.first().attr('aria-selected', true);
                    $('input.js-search-field').each(function () {
                        $(this).attr('aria-activedescendant', suggestionsList.first()[0].id);
                    });
                }
                return false;
            }
            return true;
        });
    }
}

module.exports = {
    init: function () {
        $('form[name="simpleSearch"]').submit(function (e) {
            var suggestionsList = $('.js-suggestions .js-item');
            if (suggestionsList.filter('.selected').length !== 0) {
                e.preventDefault();
                suggestionsList.filter('.selected').find('a')[0].click();
            }
        });

        $('input.js-search-field').each(function () {
            /**
             * Use debounce to avoid making an Ajax call on every single key press by waiting a few
             * hundred milliseconds before making the request. Without debounce, the user sees the
             * browser blink with every key press.
             */
            var debounceSuggestions = debounce(getSuggestions, 300);
            $(this).on('keyup focus', function (e) {
                // Capture Down/Up Arrow Key Events
                switch (e.which) {
                    case DOWN_KEY:
                        handleArrow(DIRECTION_DOWN);
                        e.preventDefault(); // prevent moving the cursor
                        break;
                    case UP_KEY:
                        handleArrow(DIRECTION_UP);
                        e.preventDefault(); // prevent moving the cursor
                        break;
                    default:
                        debounceSuggestions(this, e);
                }
            });
        });

        $('body').on('click', function (e) {
            if (!$('.js-suggestions').has(e.target).length && !$(e.target).hasClass('js-search-field')) {
                $('.js-suggestions').hide();
            }
        });

        $('body').on('click touchend', '.search-mobile button.fa-close', function (e) {
            e.preventDefault();
            $('.js-suggestions').hide();
            toggleSuggestionsIcon('search');
            tearDownSuggestions();
        });

        $('.js-site-search .js-search-clear').on('click', function () {
            $(this).closest('.js-search-container').removeClass('m-suggestions-show');
        });
    },
    recentlyViewedBadge
};