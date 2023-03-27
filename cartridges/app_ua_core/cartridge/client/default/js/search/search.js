'use strict';

const util = require('../util');
const loadSlimScrollPlugin = () => util.loadScript('/lib/jquery/jquery.slimscroll.min.js');

var isLoading = 0;
var filterSidebarOffset = $('.js-plp-sidebar').length > 0 ? $('.js-plp-sidebar').offset().top - $('.l-plp-header').height() : '';

/**
 * Update DOM elements with Ajax results
 *
 * @param {Object} $results - jQuery DOM element
 * @param {string} selector - DOM element to look up in the $results
 * @return {undefined}
 */
function updateDom($results, selector) {
    var $updates = $results.find(selector);
    $(selector).empty().html($updates.html());
}

/**
 * Keep refinement panes expanded/collapsed after Ajax refresh
 *
 * @param {Object} $results - jQuery DOM element
 * @return {undefined}
 */
function handleRefinements($results) {
    $('.refinement.active').each(function () {
        var $activeRefinement = $(this);
        $activeRefinement.removeClass('active');
        var activeDiv = $results.find('.' + $activeRefinement[0].className.replace(/ /g, '.'));
        activeDiv.addClass('active');
        activeDiv.find('button.title').attr('aria-expanded', 'true');
    });

    updateDom($results, '.refinements');
}

/**
 * Update data attribute value
 * @param {Object} $results - jQuery DOM element
 * @param {string} attrName - attribute name
 * @return {undefined}
 */
function updateDataAttributeValue($results, attrName) {
    const selector = `[${attrName}]`;
    $(selector).attr(attrName, $results.find(selector).attr(attrName) || '');
}

/**
 * Update data-analytics-plp-count in dom from html response
 *
 * @param {Object} $results - jQuery DOM element
 * @return {undefined}
 */
function handleAnalyticsValues($results) {
    updateDataAttributeValue($results, 'data-analytics-plp-count');
    updateDataAttributeValue($results, 'data-analytics-plp-sort-default');
}

// Update mobile sort options
// eslint-disable-next-line require-jsdoc
function updateMobileSortOptions() {
    var windowUrl = window.location.href;
    if (windowUrl.indexOf('srule=') !== -1) {
        var srule = util.getParameterValueFromUrl('srule', windowUrl);
        if (srule) {
            $(`input[type=radio][id=id-sort-${srule}]`).prop('checked', true);
            $(`input[type=radio][id=id-sort-${srule}]`).parents('.b-refinements-content').siblings('.b-refinements-header').removeClass('collapsed');
            $(`input[type=radio][id=id-sort-${srule}]`).parents('.b-refinements-content').addClass('show');
        }
    }
}

// Hide By team Refinement after one selection
// eslint-disable-next-line require-jsdoc
function onHideTeamRefinement() {
    var isSearchPage = window.location.href.indexOf('?q=');
    if (isSearchPage === -1) {
        var teamRefinement = $('.b-refinements-item[data-refinement-id="team"]');
        var selectedTeam = teamRefinement ? teamRefinement.find('li a.m-selected') : '';
        if (teamRefinement.length && selectedTeam.length === 1) {
            teamRefinement.css('display', 'none');
        }
    }
}

/**
 * Parse Ajax results and updated select DOM elements
 *
 * @param {string} response - Ajax response HTML code
 * @param {Array} additionalSelectors - Additional selectors for update DOM
 * @return {undefined}
 */
function parseResults(response, additionalSelectors) {
    var $results = $(response);
    var specialHandlers = {
        '.refinements': handleRefinements
    };

    // Update DOM elements that do not require special handling
    [
        ...additionalSelectors,
        '.js-products_count',
        '.js-header-sort',
        '.js-products_grid',
        '.js-show_more',
        '.js-refinements',
        '.js-selected-refinements',
        '.canonical-div',
        '.b-plp_header-category_heading',
        '.b-plp_header-breadcrumbs',
        '.b-plp_header-search'
    ].forEach(function (selector) {
        updateDom($results, selector);
    });
    onHideTeamRefinement();

    Object.keys(specialHandlers).forEach(function (selector) {
        specialHandlers[selector]($results);
    });

    handleAnalyticsValues($results);

    const url = $('input[data-canonical-url]').data('canonical-url');
    if (url) {
        history.replaceState({}, '', url);
    }
    updateMobileSortOptions();
}

/**
 * This function retrieves another page of content to display in the content search grid
 * @param {JQuery} $element - the jquery element that has the click event attached
 * @param {JQuery} $target - the jquery element that will receive the response
 * @return {undefined}
 */
function getContent($element, $target) {
    var showMoreUrl = $element.data('url');
    $.spinner().start();
    $.ajax({
        url: showMoreUrl,
        method: 'GET',
        success: function (response) {
            $target.append(response);
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

/**
 * Update sort option URLs from Ajax response
 *
 * @param {string} response - Ajax response HTML code
 * @return {undefined}
 */
function updateSortOptions(response) {
    var $tempDom = $('<div>').append($(response));
    var sortOptions = $tempDom.find('.js-grid_footer').data('sort-options').options;
    sortOptions.forEach(function (option) {
        var trimmedId = option.id.replace(/\s/g, '');
        $('option.' + trimmedId).val(option.url);
        $('li.js-sort-item[data-id="' + trimmedId + '"]').data('value', option.url);
    });
}

//	eslint-disable-next-line require-jsdoc
function modifyUrl(link) {
    if (link === undefined) {
        $('body .js-grid_footer button.triggerMore').click();
    } else {
        var href = link;
        var windowUrl = window.location.href.split('&start')[0];
        var isSearchPage = window.location.href.indexOf('?q=');
        var appliedFilter = window.location.href.indexOf('?p');
        var url = new URL(window.location.href);
        var srule = url.searchParams.get('srule');
        var sruleParam = window.location.href.indexOf('?srule');
        var appliedSizeModel = window.location.href.indexOf('?viewPreference');
        var isShopAllUrl = window.location.href.indexOf('?isShopAllUrl');
        if (sruleParam !== -1 || appliedSizeModel !== -1 || isShopAllUrl !== -1) {
            appliedFilter = 0;
        }
        if (isSearchPage !== -1 || appliedFilter !== -1) {
            if (href === '?start=0&sz=12') {
                href = windowUrl;
            } else {
                href = windowUrl + href.replace('?', '&');
            }
        }
        var isiPhone = /(iPhone|iPad)/i.test(navigator.platform);

        if (href === '?start=0&sz=12' && isSearchPage === -1) {
            href = location.href.split('?')[0];
            if (srule) {
                href += '?srule=' + srule;
            }
        } else if (link === '?start=0&sz=12' && appliedFilter !== -1) {
            href = location.href.split('&start')[0];
            if (!isiPhone) {
                history.replaceState(null, null, href);
            }
        }

        if (href === location.href.split('?')[0] || href !== windowUrl) {
            if (!isiPhone) {
                if (srule && href.indexOf('srule') === -1) {
                    if (href.indexOf('?') > -1) {
                        href += '&srule=' + srule;
                    } else {
                        href += '?srule=' + srule;
                    }
                }
                history.replaceState(null, null, href);
            }
        }
    }
}

$('body').on('click', '.b-products_grid .b-products_grid-tile', function () {
    var startPageSize = $(this).attr('data-tile-num');
    var locationParts = window.location.href.split('?');
    var newLocation = locationParts[0].split('#')[0];
    // eslint-disable-next-line no-nested-ternary
    var newLocParams = window.params ? window.params : (locationParts[1] ? locationParts[1].split('#')[0] : '');
    var queryParams = newLocParams ? newLocParams.split('&') : '';
    if (!queryParams && !!startPageSize) {
        if (!(startPageSize === '0')) {
            newLocation = newLocation + '?start=' + startPageSize;
        }
    } else if (!!queryParams && newLocParams.indexOf('start=') < 0 && !!startPageSize) {
        if (startPageSize === '0') {
            newLocation = newLocation.concat('?' + newLocParams);
        } else {
            newLocation = newLocation.concat('?' + newLocParams + '&start' + startPageSize);
        }
    } else {
        for (var i = 0; i < queryParams.length; i++) {
            if (startPageSize !== '0') {
                if (i !== 0) {
                    newLocation += '&';
                } else {
                    newLocation += '?';
                }
            }

            if (queryParams[i].indexOf('start') > -1) {
                if (startPageSize !== '0') {
                    newLocation = newLocation + 'start=' + startPageSize;
                }
            } else {
                newLocation += queryParams[i];
            }
        }
    }
});

/**
* Traverse dom tree and grabs analytics values and emits event
* @param {JQuery} $filter jquery element of button clicked
* @param {JQuery} $results jquery element of html from ajax filter response
* @return {undefined}
*/
function analyticsNotifyFilter($filter, $results) {
    const titleSelector = 'data-analytics-plp-filter-title';
    const valueSelector = 'data-analytics-plp-filter-value';
    const totalCountSelector = 'data-analytics-plp-count';
    const productStyleSelector = 'data-analytics-style';
    const selectedFilterSelector = 'data-analytics-plp-selected-filter-value';

    const refinementTitle = $filter.parents(`[${titleSelector}]`).attr(titleSelector);
    const refinementValue = $filter.closest(`[${valueSelector}]`).attr(valueSelector);
    const totalCount = $results.find(`[${totalCountSelector}]`).attr(totalCountSelector);
    const productStyles = $results.find(`[${productStyleSelector}]`).map(function () {
        return $(this).attr(productStyleSelector);
    }).toArray();
    const selectedFilters = $('body').find(`[${selectedFilterSelector}]`).map(function () {
        return $(this).attr(selectedFilterSelector);
    }).toArray();

    $('body').trigger('grid:refinementComplete', {
        refinementTitle,
        refinementValue,
        totalCount,
        productStyles,
        selectedFilters
    });
}

// This function will check if an element is in viewport
// eslint-disable-next-line require-jsdoc
function isInViewport(element) {
    const rect = document.querySelector(element).getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// eslint-disable-next-line require-jsdoc
function collapseTilesAndUpdateCount() {
    if (!isNaN($('.js-products_count').attr('data-analytics-plp-count')) && $('.js-products_count').text() !== null && $('.js-products_count').text() !== '' && $('.js-products_count').text().split(' ').length > 1) {
        $('.b-products_grid-tile').find('.b-tile.hide').parent('.b-products_grid-tile').addClass('hide');
        var searchResultCount = parseInt($('.js-products_count').attr('data-analytics-plp-count'), 10) - $('section.b-products_grid-tile').find('.b-tile-images_container .b-tile-main_image[title="No Image"]').length;
        var searchResultText = searchResultCount + ' ' + $('.js-products_count').text().trim().split(' ')[1];
        $('.js-products_count').text(searchResultText);
    }
}

$(window).on('scroll', function () {
    if ($('.js-grid_footer button.triggerMore').length) {
        if (isInViewport('.js-grid_footer')) {
            // eslint-disable-next-line no-undef
            if (isLoading === 0) {
                isLoading = 1;
                if ($('section.b-products_grid-tile.hide').length) {
                    isLoading = 0;
                    var urlParam = $('.updateBrowserUrl.hide').data('url');
                    if (urlParam === undefined) {
                        $('body .js-grid_footer button.triggerMore').click();
                    } else {
                        modifyUrl(urlParam);
                        $('section.b-products_grid-tile.hide').removeClass('hide');
                        $('.updateBrowserUrl.hide').removeClass('hide');
                        $('body .js-grid_footer button.triggerMore').click();
                        collapseTilesAndUpdateCount();
                    }
                } else {
                    isLoading = 0;
                    $('body .js-grid_footer button.triggerMore').click();
                    $('.lazyLoadwrapper').removeClass('loadedAlready');
                }
            }
        }
    }

    var navlist = [];
    $('.updateBrowserUrl').each(function () {
        var $this = $(this);
        var thisId = $this.attr('data-url');
        var thisTarget = $(this); // eslint-disable-line
        navlist.push({
            'anchor': $this, // eslint-disable-line
            'id': thisId, // eslint-disable-line
            'target': $this // eslint-disable-line
        });
        return true;
    });

    $.each(navlist, function (e, elem) { // eslint-disable-line
        var placement = elem.target[0].getBoundingClientRect();
        if (placement.top < window.innerHeight && placement.bottom > 0) {
            var attrCheck = window.location.href.split('?')[1];
            if (elem.id !== attrCheck) {
                modifyUrl(elem.id);
            }
            return false; /* Exit $.each loop */
        }
    });

    if (!$('.js-grid_footer button').hasClass('triggerMore')) {
        setTimeout(function () {
            $('.js-grid_footer button').addClass('triggerMore');
        }, 5000);
    }

    if ($(window).width() > 1023) {
        var headrHeight = $('.js-header').height();
        var pageHeaderHeight = $('.l-plp-header').outerHeight();
        var scrollPosition = $(window).scrollTop();
        var outerContentHeight = headrHeight + pageHeaderHeight;
        var scrollHeight;
        if (scrollPosition > filterSidebarOffset) {
            scrollHeight = 'calc(100vh - ' + headrHeight + 'px)';
            $('.js-plp-sidebar').addClass('filter-sticky');
        } else if (scrollPosition <= filterSidebarOffset) {
            scrollHeight = 'calc(100vh - ' + outerContentHeight + 'px)';
            $('.js-plp-sidebar').removeClass('filter-sticky');
        }
        loadSlimScrollPlugin().then(() => {
            $('.js-slim-scrollbar').slimScroll({
                height: scrollHeight,
                railVisible: true,
                color: '#d0d0d0',
                railColor: '#ffffff',
                railOpacity: 1,
                size: '7px',
                alwaysVisible: true
            });
        });
    }
});

/**
 * Checking the Height of PLP Sidebar to add ScrollBar
 *
 */
function checkFilterSize() {
    if ($(window).width() > 1023) {
        var sideBar = $('.js-plp-sidebar');
        var filterSidebarHeight = sideBar.height();
        var pageHeaderHeight = $('.l-plp-header').outerHeight();
        var headrHeight = $('.js-header').height();
        var doc = $(window).height() - headrHeight - pageHeaderHeight;
        var outerContentHeight = headrHeight + pageHeaderHeight;
        var scrollHeight;
        if (sideBar.hasClass('filter-sticky')) {
            scrollHeight = 'calc(100vh - ' + headrHeight + 'px)';
        } else {
            scrollHeight = 'calc(100vh - ' + outerContentHeight + 'px)';
        }
        sideBar.css('top', headrHeight);
        if (filterSidebarHeight > doc) {
            sideBar.addClass('b-scrollable-content');
            loadSlimScrollPlugin().then(() => {
                $('.js-slim-scrollbar').slimScroll({
                    height: scrollHeight,
                    railVisible: true,
                    color: '#d0d0d0',
                    railColor: '#ffffff',
                    railOpacity: 1,
                    size: '7px',
                    alwaysVisible: true
                });
            });
        } else {
            sideBar.removeClass('b-scrollable-content');
        }
    }
}

// eslint-disable-next-line require-jsdoc
function getSelectedModelSizeUrl(baseUrl) {
    if ($('.js-select-model-size:visible').length > 0) {
        var selectedSize = $('.js-select-model-size:visible').val();
        $('body').find('.js-select-model-size:hidden').val(selectedSize).trigger('change', [true]);
        if (selectedSize) {
            var urlParams = {
                viewPreference: selectedSize
            };
            return util.appendParamsToUrl(baseUrl, urlParams);
        }
    }
    return baseUrl;
}
// eslint-disable-next-line require-jsdoc
function getSelectedSortingRule(baseUrl) {
    if ($('select.b-sort-select').find('option:selected').length > 0) {
        var selectedsortingRule = $('select.b-sort-select').find('option:selected').data('id');
        if (selectedsortingRule) {
            var urlParams = {
                srule: selectedsortingRule
            };
            // remove from srule from url if present then add srule with latest updated values
            if (baseUrl.indexOf('srule=') !== -1) {
                baseUrl = util.removeParamFromURL(baseUrl, 'srule'); // eslint-disable-line no-param-reassign
            }
            return util.appendParamsToUrl(baseUrl, urlParams);
        }
    }
    return baseUrl;
}

/**
 * Updating Wishlist Indicator for respective products
 *
 * @param {string} rawProductIDs - Wishlist Product IDs
 */
function updateWishlistIndicator(rawProductIDs) {
    var productIDs = rawProductIDs;
    if (productIDs && productIDs !== '') {
        productIDs = productIDs.split('|');
        if (productIDs.length) {
            var selectorArray = productIDs.map(function (productID) {
                return '.wishlistTile[data-pid=' + productID + '] span.b-tile-fav_button';
            });
            var selectorString = selectorArray.join(', ');
            $(selectorString).addClass('product-added b-tile-fav_selectButton');
            $(selectorString).removeClass('b-tile-fav_button');
        }
    }
}

// Disable unselected By Teams refinement values on PLP page
// eslint-disable-next-line require-jsdoc
function disableTeamRefinements(teamRefinement, selectedTeam, $this) {
    if (selectedTeam.length === 1) {
        teamRefinement.find('li a:not(.m-selected)').each(function () {
            $(this).addClass('disabled-team');
        });
    } else {
        // avoid the 2nd selection of team refinement during the page reload
        $this.removeClass('m-selected');
        teamRefinement.find('li a:not(.m-selected)').each(function () {
            $(this).addClass('disabled-team');
        });
        return false;
    }
    return true;
}

module.exports = {

    sort: function () {
        // Handle sort order menu selection
        $('.js-page').on('change', '[name=sort-order]', function (e) {
            e.preventDefault();

            $.spinner().start();
            $(this).trigger('search:sort', this.value);
            var selectedOptionText = $(this).find(`[value="${this.value}"]`).text();
            var newUrl = this.value;
            newUrl = getSelectedModelSizeUrl(newUrl);
            $.ajax({
                url: newUrl,
                data: { selectedUrl: newUrl },
                method: 'GET',
                success: function (response) {
                    const search = require('../components/search');
                    $('.js-products_grid').empty().html(response);
                    var $response = $(response);
                    $('.b-sort').find('.b-sort-content:not(.js-categories-content)').empty().html($response.filter('.b-sort-content').html());
                    $('.b-products_grid').find('.b-sort-content').remove();
                    search.recentlyViewedBadge();
                    collapseTilesAndUpdateCount();
                    var pageUrl = new URL(window.location.href);
                    var $selectedSortingElement = $('select.b-sort-select').find('option:selected');
                    if (pageUrl && $selectedSortingElement.length > 0) {
                        pageUrl.searchParams.set('srule', $selectedSortingElement.data('id'));
                        history.replaceState({}, '', pageUrl.toString());
                    }
                    updateMobileSortOptions();
                    var productIDs = $response.filter('.wishlist-productIDs').length > 0 ? $response.filter('.wishlist-productIDs').val() : null;
                    updateWishlistIndicator(productIDs);
                    $.spinner().stop();
                    $('body').trigger('search:sortComplete', {
                        selectedOptionText: selectedOptionText
                    });
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
        $('.b-products_grid').find('.b-sort-content').remove();
        if ($('.l-plp-container').find('li.b-sort-item.m-selected:first').length > 0) {
            $('.g-selectric-b-sort-select').find('li.' + $('.l-plp-container').find('li.b-sort-item.m-selected:first').data('id')).addClass('highlighted');
            $('.g-selectric-b-sort-select').find('.g-selectric .label').text($('.g-selectric-b-sort-select').find('li.highlighted').text());
        }

        // Mobile sort trigger
        $('.js-page').on('change', '[name=sortMobileOption]', function (e) {
            e.preventDefault();

            $('#sort-order [data-id="' + $(this).val() + '"]').prop('selected', 'selected');
            $('#sort-order').trigger('change');
        });
    },
    showMore: function () {
        // Show more products
        $('.js-page').on('click', '.js-grid_footer button.triggerMore', function (e) {
            isLoading = 1;
            e.stopPropagation();
            var showMoreUrl = $(this).data('url');
            if (showMoreUrl === '') {
                return false;
            }
            if (showMoreUrl) {
                showMoreUrl = getSelectedModelSizeUrl(showMoreUrl);
            }
            var data = {
                showMore: true,
                previous: false,
                pageSize: $('.pageSize').val(),
                breadCrumbLast: $('.breadCrumbLast').val()
            };
            e.preventDefault();
            $('.js-grid_footer').spinner().start();
            $('body').css('overflow', 'auto');
            $(this).trigger('search:showMore', e);
            var $this = $(this);
            $.ajax({
                url: showMoreUrl,
                data: data,
                method: 'GET',
                success: function (response) {
                    var $lazyWrapper = $('.lazyLoadwrapper');
                    const search = require('../components/search');
                    // eslint-disable-next-line newline-per-chained-call
                    updateSortOptions(response);
                    isLoading = 0;

                    if (isInViewport('.js-grid_footer')) {
                        $('.js-grid_footer').eq(0).replaceWith(response);
                        var urlParam = $(response).filter('.b-products_grid-tile').find('.currentPageNumber').val();
                        modifyUrl(urlParam);
                    } else {
                        $lazyWrapper.html(response);
                        $lazyWrapper.find('.b-products_grid-tile').addClass('hide');
                        $lazyWrapper.find('.updateBrowserUrl').addClass('hide');
                        $lazyWrapper.addClass('loadedAlready');
                        $('.js-grid_footer').eq(0).replaceWith($lazyWrapper.html());
                        $lazyWrapper.empty();
                    }

                    $('.js-grid_footer').spinner().stop();
                    $('body').css('overflow', 'auto');
                    $('body').trigger('adobeTagManager:productArrayUpdate', $this);
                    $('body').find('.b-tile-swatches_slider').trigger('mainCarousel:update');
                    search.recentlyViewedBadge();
                    collapseTilesAndUpdateCount();
                    var productIDs = $(response).filter('.wishlist-productIDs').length > 0 ? $(response).filter('.wishlist-productIDs').val() : null;
                    updateWishlistIndicator(productIDs);
                },
                error: function () {
                    $('.js-grid_footer').spinner().stop();
                    $('body').css('overflow', 'auto');
                }
            });
            return true;
        });
    },

    applyFilter: function () {
        // Handle refinement value selection and reset click
        $('.js-page').on(
            'click change',
            '.js-select-model-size, .js-plp-sidebar li a:not(".b-refinements_category-link"), .js-category-link, .js-plp-sidebar .js-refinements_clear, .js-refinement_swatch, .js-selected-refinements a',
            function (e, isTriggered) {
                e.preventDefault();
                e.stopPropagation();
                if (e.type === 'click' && $(e.currentTarget).hasClass('js-select-model-size')) {
                    return false;
                }
                if (isTriggered && $(e.currentTarget).hasClass('js-select-model-size')) {
                    return false;
                }

             // Disable unselected team refinement values on PLP page
                var isSearchPage = window.location.href.indexOf('?q=');
                var teamRefinement = $('.b-refinements-item[data-refinement-id="team"]:visible');
                var selectedTeam = teamRefinement ? teamRefinement.find('li a.m-selected') : '';
                if (isSearchPage === -1 && teamRefinement && selectedTeam.length > 0) {
                    var updateRefinement = disableTeamRefinements(teamRefinement, selectedTeam, $(this));
                    if (!updateRefinement) {
                        return false;
                    }
                }
                isLoading = 0;
                var newUrl = $(this).data('href');
                if (newUrl === undefined) {
                    if ($('.js-canonical-url').attr('data-action-sizeModelUrl') !== null && $('.js-canonical-url').attr('data-queryString') !== null) {
                        newUrl = $('.js-canonical-url').attr('data-action-sizeModelUrl') + '?' + $('.js-canonical-url').attr('data-queryString');
                    }
                }
                newUrl = getSelectedModelSizeUrl(newUrl);
                if ($(window).width() < 1024) {
                    var currentUrl = window.location.href;
                    if (currentUrl.indexOf('isShopAllUrl') > -1) {
                        var urlParams = {
                            isShopAllUrl: true
                        };
                        newUrl = util.appendParamsToUrl(newUrl, urlParams);
                    }
                }
                // Added selected sorting rules in refinement url if sorting option is in present url
                if (window.location.href.indexOf('srule=') !== -1) {
                    newUrl = getSelectedSortingRule(newUrl);
                }
                // get the  opened refinement items
                var showFilters = [];
                var filters = '';
                if ($('.b-refinements-content.show').length) {
                    $('.b-refinements-content.show').each(function () {
                        var filter = $(this).attr('data-refinementattr');
                        showFilters.push(filter);
                    });
                }
                filters = showFilters.join(',');
                if (!$(this).hasClass('m-disabled')) {
                    const $filterElement = $(this);
                    $(this).trigger('search:filter', e);
                    $.ajax({
                        url: newUrl,
                        data: {
                            page: $('.js-grid_footer').data('page-number'),
                            selectedUrl: newUrl,
                            selectedFilter: filters
                        },
                        method: 'GET',
                        success: (response) => {
                            const additionalSelectors = [];
                            const search = require('../components/search');

                            if ($(this).hasClass('js-category-link')) {
                                additionalSelectors.push('.js-plp-banner');
                            }

                            parseResults(response, additionalSelectors);
                            analyticsNotifyFilter($filterElement, $(response));
                            collapseTilesAndUpdateCount();
                            search.recentlyViewedBadge();
                            var productIDs = $(response).find('.wishlist-productIDs').length > 0 ? $(response).find('.wishlist-productIDs').val() : null;
                            updateWishlistIndicator(productIDs);
                        }
                    });
                }
                return true;
            });
    },

    showContentTab: function () {
        // Display content results from the search
        $('.container').on('click', '.content-search', function () {
            var $contentSearchResults = $('#content-search-results');
            if ($contentSearchResults.html() === '') {
                getContent($(this), $contentSearchResults);
            }
        });

        // Display the next page of content results from the search
        $('.container').on('click', '.show-more-content button', function () {
            getContent($(this), $('#content-search-results'));
            $('.show-more-content').remove();
        });

        // Display content slot when it is configured
        setTimeout(function () {
            if ($('.l-plp-category_banner').find('.hero').length > 0) {
                $('.l-plp-category_banner').removeClass('hide');
            } else {
                $('.l-plp-category_banner').addClass('hide');
            }
        }, 2000);
    },

    checkFilterHeight: function () {
        checkFilterSize();
        $('body').on('click', '.b-refinements-header', function () {
            setTimeout(function () {
                checkFilterSize();
            }, 800);
        });
    },

    updateTilesAndCount: function () {
        collapseTilesAndUpdateCount();
    },

    onPageLoad: function () {
        $(window).ready(function () {
            var urlParam = window.location.search;
            if (urlParam.indexOf('srule') > -1) {
				var sortValue = new RegExp('[?&]' + 'srule' + '=([^&]*)').exec(urlParam); // eslint-disable-line
                $(`#sort-order [data-id="${sortValue[1]}"]`).prop('selected', 'selected');
                $('#sort-order').trigger('change');
            }
        });
        $(window).on('load', function () {
            var urlParam = window.location.search;
            if (urlParam.indexOf('viewPreference') > -1) {
                var modelSize = new RegExp('[?&]' + 'viewPreference' + '=([^&]*)').exec(urlParam); // eslint-disable-line
                $('body').find('.js-select-model-size', this.$el).val(modelSize[1]).trigger('change', [true]);
            }
            updateMobileSortOptions();
            onHideTeamRefinement();
        });
    },

    updateWishlistIndicatorOnLoad: function () {
        var productIDs = $('.wishlist-productIDs:last').length > 0 ? $('.wishlist-productIDs:last').val() : null;
        updateWishlistIndicator(productIDs);
    }
};
