'use strict';

const util = require('../util');
const search = require('../components/search');
const constructorIOPLP = require('../constructorio/constructorIOPLP');
const { getConstructorIOSettings } = require('../constructorio/clientWrapper');
const { generatePLPURL } = require('../constructorio/utils/utils');
const { getConstructorioSearch } = require('../constructorio/request');
const loadSlimScrollPlugin = () => util.loadScript('/lib/jquery/jquery.slimscroll.min.js');

let $page;
let $body;
let $header;

let isLoading = 0;
let filterSidebarOffset = $('.js-plp-sidebar').length > 0 ? $('.js-plp-sidebar').offset().top - $('.l-plp-header').height() : '';

let waitTimeout = 0;

/**
 * Starts the spinner.
 */
const startSpinner = () => {
    if (typeof $.spinner === 'function') {
        $.spinner().start();
    }
};

/**
 * Stops the spinner.
 */
const stopSpinner = () => {
    if (typeof $.spinner === 'function') {
        $.spinner().stop();
    }
};

/**
 * Checks if the current page is a search page by checking the presence of '?q=' in the URL.
 *
 * @returns {number} -1 if '?q=' is not found in the URL (indicating that the page is not a search page), otherwise returns the index at which '?q=' starts in the URL.
 */
const isSearchPage = () => {
    return window.location.href.indexOf('?q=') > -1 ? window.location.href.indexOf('?q=') : window.location.href.indexOf('&q=');
};

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
    if (isSearchPage() === -1) {
        var teamRefinement = $('.b-refinements-item[data-refinement-id="team"]');
        var selectedTeam = teamRefinement ? teamRefinement.find('li a.m-selected') : '';
        if (teamRefinement.length && selectedTeam.length === 1) {
            teamRefinement.css('display', 'none');
        }
    }
}

/**
 * Updates page when we have no results response
 *
 * @param {Object} $results - jquery object of responsse html
 * @param {string} selector - selecter of no result element
 * @return {undefined}
 */
function handleNoResultResponse($results, selector) {
    const $noResultData = $results.find(selector);
    if ($noResultData.length > 0) {
        const updateContainerSelector = '.l-plp-container';
        const $container = $noResultData.closest(updateContainerSelector);
        $(updateContainerSelector).empty().html($container.length > 0 ? $container.html() : $noResultData);
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
    const $results = $(response);
    const specialHandlers = {
        '.b-nosearch_results-title': handleNoResultResponse,
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
        specialHandlers[selector]($results, selector);
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
    startSpinner();
    $.ajax({
        url: showMoreUrl,
        method: 'GET',
        success: function (response) {
            $target.append(response);
            stopSpinner();
        },
        error: function () {
            stopSpinner();
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
    const $tempDom = $('<div>').append($(response));
    const dataOptions = $tempDom.find('.js-grid_footer').data('sort-options');
    const sortOptions = dataOptions ? dataOptions.options : false;
    if (Array.isArray(sortOptions)) {
        sortOptions.forEach(function (option) {
            const trimmedId = option.id.replace(/\s/g, '');
            $('option.' + trimmedId).val(option.url);
            $('li.js-sort-item[data-id="' + trimmedId + '"]').data('value', option.url);
        });
    }
}

//	eslint-disable-next-line require-jsdoc
function modifyUrl(link) {
    if (link === undefined) {
        $('body .js-grid_footer button.triggerMore').click();
    } else {
        var href = link;
        var windowUrl = window.location.href.split('&start')[0];
        var appliedFilter = window.location.href.indexOf('?p');
        var url = new URL(window.location.href);
        var srule = url.searchParams.get('srule');
        var sruleParam = window.location.href.indexOf('?srule');
        var appliedSizeModel = window.location.href.indexOf('?viewPreference');
        var isShopAllUrl = window.location.href.indexOf('?isShopAllUrl');
        if (sruleParam !== -1 || appliedSizeModel !== -1 || isShopAllUrl !== -1) {
            appliedFilter = 0;
        }
        if (isSearchPage() !== -1 || appliedFilter !== -1) {
            if (href === '?start=0&sz=12') {
                href = windowUrl;
            } else {
                href = windowUrl + href.replace('?', '&');
            }
        }

        if (href === '?start=0&sz=12' && isSearchPage() === -1) {
            href = window.location.href.split('?')[0];
            if (srule) {
                href += '?srule=' + srule;
            }
        } else if (link === '?start=0&sz=12' && appliedFilter !== -1) {
            href = window.location.href.split('&start')[0];
            history.replaceState(null, null, href);
        }

        if (href === window.location.href.split('?')[0] || windowUrl.indexOf(href) === -1) {
            if (srule && href.indexOf('srule') === -1) {
                if (href.indexOf('?') > -1) {
                    href += '&srule=' + srule;
                } else {
                    href += '?srule=' + srule;
                }
            }
            if (windowUrl.indexOf(href) === -1) {
                history.replaceState(null, null, href);
            }
        }
    }
}

/**
 * Inits events for adding parameters to url after clicking on grid tiles
 */
function gridTileClick() {
    $body.on('click', '.b-products_grid .b-products_grid-tile', function () {
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
}

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
    const selectedFilters = $body.find(`[${selectedFilterSelector}]`).map(function () {
        return $(this).attr(selectedFilterSelector);
    }).toArray();

    $body.trigger('grid:refinementComplete', {
        refinementTitle,
        refinementValue,
        totalCount,
        productStyles,
        selectedFilters
    });
}

/**
 * This function will check if an element is visible in viewport
 * @param {string} element - selector for element
 * @param {number} minTopPos - px value of space above the value that we should ignore
 * @return {boolean} value if element is visible
 */
function isInViewport(element, minTopPos = 0) {
    const rect = document.querySelector(element).getBoundingClientRect();
    return (
        rect.top >= minTopPos &&
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

/**
 * Checking the Height of PLP Sidebar to add ScrollBar
 *
 */
function checkFilterSize() {
    if ($(window).width() > 1023) {
        var sideBar = $('.js-plp-sidebar');
        var filterSidebarHeight = sideBar.height();
        var pageHeaderHeight = $('.l-plp-header').outerHeight();
        var headerHeight = $('.js-header').height();
        var doc = $(window).height() - headerHeight - pageHeaderHeight;
        var outerContentHeight = headerHeight + pageHeaderHeight;
        var scrollHeight;
        if (sideBar.hasClass('filter-sticky')) {
            scrollHeight = 'calc(100vh - ' + headerHeight + 'px)';
        } else {
            scrollHeight = 'calc(100vh - ' + outerContentHeight + 'px)';
        }
        sideBar.css('top', headerHeight);
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
        $body.find('.js-select-model-size:hidden').val(selectedSize).trigger('change', [true]);
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
        if ($(window).width() < 1024) {
            selectedsortingRule = $('input[name="sortMobileOption"]:checked').val();
        }

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

const searchModule = {
    init: function () {
        $page = $('.js-page');
        $body = $('body');
        $header = $('.js-header');
    },
    gridTileClick: gridTileClick,
    methods: {
        constractorRequestErrorHandler: () => {
            const searchShowAjax = window.constructorIOURLs ? window.constructorIOURLs.searchShowAjax : '';
            // generate url only with q= , srule= and extra parameters
            const url = generatePLPURL({ url: searchShowAjax, params: { filterParams: {}, priceRange: null, start: null, sz: null } });

            const $productsGrid = $('.b-products_grid');
            const data = {
                page: 1,
                selectedUrl: url,
                selectedFilter: []
            };
            delete window.searchParams;
            searchModule.methods.applyFilterRequest(url, data, $productsGrid);
        },
        applySortingRequest({ url, data, $productsGrid, selectedOptionText }) {
            $.ajax({
                url: url,
                data: data,
                method: 'GET',
                success: (response) => {
                    searchModule.methods.applySortingSuccessHandler(response, $productsGrid, selectedOptionText);
                },
                complete: stopSpinner
            });
        },
        applySortingSuccessHandler(response, $productsGrid, selectedOptionText) {
            const $response = $(response);
            $('.js-products_grid').empty().html(response);
            $('.b-sort').find('.b-sort-content:not(.js-categories-content)').empty().html($response.filter('.b-sort-content').html());
            $productsGrid.find('.b-sort-content').remove();
            search.recentlyViewedBadge();
            collapseTilesAndUpdateCount();

            const pageUrl = new URL(window.location.href);
            const $selectedSortingElement = $('select.b-sort-select').find('option:selected');
            if (pageUrl && $selectedSortingElement.length > 0) {
                pageUrl.searchParams.set('srule', $selectedSortingElement.data('id'));
                history.replaceState({}, '', pageUrl.toString());
            }

            updateMobileSortOptions();

            const productIDs = $response.filter('.wishlist-productIDs').length > 0 ? $response.filter('.wishlist-productIDs').val() : null;
            $body.trigger('wishlistSuggestion:update', productIDs);

            $body.trigger('search:sortComplete', { selectedOptionText: selectedOptionText });
        },
        applyFilterRequest(url, data, $clickTarget) {
            $.ajax({
                url: url,
                data: data,
                method: 'GET',
                success: (res) => searchModule.methods.applyFilterSuccessHandler(res, $clickTarget)
            });
        },
        applyFilterSuccessHandler(response, $clickTarget) {
            const additionalSelectors = [];
            if ($clickTarget.hasClass('js-category-link')) {
                additionalSelectors.push('.js-plp-banner');
            }

            parseResults(response, additionalSelectors);
            // scroll to top after filter is applied
            $(window).scrollTop(0);
            if ($clickTarget && $clickTarget.length > 0) {
                analyticsNotifyFilter($clickTarget, $(response));
            }
            collapseTilesAndUpdateCount();
            search.recentlyViewedBadge();

            $body.trigger('components:init');
            const productIDs = $(response).find('.wishlist-productIDs').length > 0 ? $(response).find('.wishlist-productIDs').val() : null;
            $body.trigger('wishlistSuggestion:update', productIDs);
        },
        beforeLoadMoreRequest() {
            const $gridFooter = $('.js-grid_footer');
            if (typeof $gridFooter.spinner === 'function') {
                $gridFooter.spinner().start();
            }
        },
        afterLoadMoreRequest() {
            isLoading = 0;
            const $gridFooter = $('.js-grid_footer');
            if (typeof $gridFooter.spinner === 'function') {
                $('body').removeClass('plp-loading');
                $gridFooter.spinner().stop();
            }
        },
        showMoreDefaultRequest: (url, data, $container, $clickTarget) => {
            return $.ajax({
                url: url,
                data: data,
                method: 'GET',
                beforeSend: searchModule.methods.beforeLoadMoreRequest,
                success: (response) => {
                    searchModule.methods.showMoreSuccessHandler(response, $container, $clickTarget);
                },
                complete: searchModule.methods.afterLoadMoreRequest
            });
        },
        showMoreSuccessHandler: (response, $lazyWrapper, $clickTarget) => {
            updateSortOptions(response);
            isLoading = 0;
            const $gridFooter = $('.js-grid_footer');

            var headerHeight = $header.height();
            const urlParam = $(response).filter('.b-products_grid-tile').find('.currentPageNumber').val();

            if (isInViewport('.js-grid_footer', headerHeight)) {
                $gridFooter.eq(0).replaceWith(response);
                modifyUrl(urlParam);
            } else {
                $lazyWrapper.html(response);
                $lazyWrapper.find('.b-products_grid-tile').addClass('hide');
                $lazyWrapper.find('.updateBrowserUrl').addClass('hide');
                $lazyWrapper.addClass('loadedAlready');
                $gridFooter.eq(0).replaceWith($lazyWrapper.html());
                $lazyWrapper.empty();
            }

            $body.trigger('adobeTagManager:productArrayUpdate', $clickTarget);
            $body.find('.b-tile-swatches_slider').trigger('mainCarousel:update');
            $body.trigger('components:init');
            search.recentlyViewedBadge();
            collapseTilesAndUpdateCount();

            const productIDs = $(response).filter('.wishlist-productIDs').length > 0 ? $(response).filter('.wishlist-productIDs').val() : null;
            $body.trigger('wishlistSuggestion:update', productIDs);
        }
    },
    sort: () => {
        const $sortOrder = $('#sort-order');
        const $productsGrid = $('.b-products_grid');
        const $plpContainer = $('.l-plp-container');
        const $gSelectricBSortSelect = $('.g-selectric-b-sort-select');

        // Handle sort order menu selection
        $page.on('change', '[name=sort-order]', (e) => {
            e.preventDefault();

            startSpinner();

            const selectedOptionText = $sortOrder.find(`[value="${e.target.value}"]`).text();
            let newUrl = getSelectedModelSizeUrl(e.target.value);
            const data = { selectedUrl: newUrl };

            if (window.constructorIOSettings && (window.constructorIOSettings.search_enabled || window.constructorIOSettings.browse_enabled) && window.searchParams) {
                getConstructorioSearch({ url: newUrl, data })
                    .then((res) => {
                        return constructorIOPLP.convertCIOToHTMLString(res, 'gridTiles');
                    })
                    .catch(() => {
                        searchModule.methods.constractorRequestErrorHandler();
                    })
                    .then((response) => {
                        if (!response) {
                            return;
                        }
                        searchModule.methods.applySortingSuccessHandler(response, $productsGrid, selectedOptionText);
                        stopSpinner();
                    });
            } else {
                searchModule.methods.applySortingRequest({ url: newUrl, data, $productsGrid, selectedOptionText });
            }
        });

        $productsGrid.find('.b-sort-content').remove();

        if ($plpContainer.find('li.b-sort-item.m-selected:first').length > 0) {
            const selectedId = $plpContainer.find('li.b-sort-item.m-selected:first').data('id');
            $gSelectricBSortSelect.find(`li.${selectedId}`).addClass('highlighted');
            $gSelectricBSortSelect.find('.g-selectric .label').text($gSelectricBSortSelect.find('li.highlighted').text());
        }

        // Mobile sort trigger
        $page.on('change', '[name=sortMobileOption]', (e) => {
            e.preventDefault();
            $('#sort-order').find(`[data-id="${$('input[name="sortMobileOption"]:checked').val()}"]`).prop('selected', 'selected');
            $('#sort-order').trigger('change');
        });
    },

    onScroll: () => {
        $(window).on('scroll', function () {
            var headerHeight = $header.height();
            if ($('.js-grid_footer button.triggerMore').length) {
                if (isLoading === 0 && isInViewport('.js-grid_footer', headerHeight)) {
                    isLoading = 1;
                    if ($('section.b-products_grid-tile.hide').length) {
                        var urlParam = $('.updateBrowserUrl.hide').data('url');
                        if (urlParam === undefined) {
                            $('body .js-grid_footer button.triggerMore').click();
                        } else {
                            var windowUrl = window.location.href.split('&start')[0];
                            if (windowUrl.indexOf(urlParam) === -1) {
                                modifyUrl(urlParam);
                            }
                            $('section.b-products_grid-tile.hide').removeClass('hide').find('.js-cmp-inited').trigger('mainCarousel:update');
                            $('.updateBrowserUrl.hide').removeClass('hide');
                            $('body .js-grid_footer button.triggerMore').click();
                            collapseTilesAndUpdateCount();
                        }
                    } else {
                        $('body .js-grid_footer button.triggerMore').click();
                        $('.lazyLoadwrapper').removeClass('loadedAlready');
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
                var pageHeaderHeight = $('.l-plp-header').outerHeight();
                var scrollPosition = $(window).scrollTop();
                var outerContentHeight = headerHeight + pageHeaderHeight;
                var scrollHeight;
                if (scrollPosition > filterSidebarOffset) {
                    scrollHeight = 'calc(100vh - ' + headerHeight + 'px)';
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
    },

    showMore: () => {
        // Show more products
        $page.on('click', '.js-grid_footer button.triggerMore', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const $clickTarget = $(e.target);
            const $lazyWrapper = $('.lazyLoadwrapper');

            isLoading = 1;

            let showMoreUrl = $clickTarget.data('url');
            if (showMoreUrl === '') {
                return false;
            }

            if (showMoreUrl) {
                showMoreUrl = getSelectedModelSizeUrl(showMoreUrl);
            }

            const data = {
                showMore: true,
                previous: false,
                pageSize: $('.pageSize').val(),
                breadCrumbLast: $('.breadCrumbLast').val()
            };

            $clickTarget.trigger('search:showMore', e);
            $('body').addClass('plp-loading');

            if (window.constructorIOSettings && (window.constructorIOSettings.search_enabled || window.constructorIOSettings.browse_enabled) && window.searchParams) {
                searchModule.methods.beforeLoadMoreRequest();
                getConstructorioSearch({ url: showMoreUrl, data })
                    .then((res)=>{
                        return constructorIOPLP.convertCIOToHTMLString(res, 'gridTiles');
                    })
                    .catch(() => {
                        searchModule.methods.afterLoadMoreRequest();
                        searchModule.methods.constractorRequestErrorHandler();
                    })
                    .then((response) => {
                        if (!response) {
                            return;
                        }
                        searchModule.methods.afterLoadMoreRequest();
                        searchModule.methods.showMoreSuccessHandler(response, $lazyWrapper, $clickTarget);
                    });
            } else {
                searchModule.methods.showMoreDefaultRequest(showMoreUrl, data, $lazyWrapper, $clickTarget);
            }
            return true;
        });
    },

    applyFilter: () => {
        // Handle refinement value selection and reset click
        $page.on('click change', '.js-select-model-size, .js-plp-sidebar li a:not(".b-refinements_category-link"), .js-category-link, .js-plp-sidebar .js-refinements_clear, .js-refinement_swatch, .js-selected-refinements a',
            (e, isTriggered) => {
                e.preventDefault();
                e.stopPropagation();
                const $currentTarget = $(e.currentTarget);

                if (e.type === 'click' && $currentTarget.hasClass('js-select-model-size')) {
                    return false;
                }

                if (isTriggered && $currentTarget.hasClass('js-select-model-size')) {
                    return false;
                }

                // Disable unselected team refinement values on PLP page
                const teamRefinement = $('.b-refinements-item[data-refinement-id="team"]:visible');
                const selectedTeam = teamRefinement ? teamRefinement.find('li a.m-selected') : '';
                if (isSearchPage() === -1 && teamRefinement && selectedTeam.length > 0) {
                    const updateRefinement = disableTeamRefinements(teamRefinement, selectedTeam, $currentTarget);
                    if (!updateRefinement) {
                        return false;
                    }
                }

                isLoading = 0;
                let newUrl = $currentTarget.data('href');

                if (newUrl === undefined) {
                    const $canonicalUrl = $('.js-canonical-url');
                    if ($canonicalUrl.attr('data-action-sizeModelUrl') !== null && $canonicalUrl.attr('data-queryString') !== null) {
                        newUrl = $canonicalUrl.attr('data-action-sizeModelUrl') + '?' + $canonicalUrl.attr('data-queryString');
                    }
                }

                newUrl = getSelectedModelSizeUrl(newUrl);

                if ($(window).width() < 1024) {
                    const currentUrl = window.location.href;
                    if (currentUrl.indexOf('isShopAllUrl') > -1) {
                        const urlParams = {
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
                let showFilters = [];
                let filters = '';
                if ($('.b-refinements-content.show').length) {
                    $('.b-refinements-content.show').each(() => {
                        const filter = $(this).attr('data-refinementattr');
                        showFilters.push(filter);
                    });
                }

                filters = showFilters.join(',');

                if (!$currentTarget.hasClass('m-disabled')) {
                    $currentTarget.trigger('search:filter', e);
                    const $gridFooter = $('.js-grid_footer');

                    const data = {
                        page: $gridFooter.data('page-number'),
                        selectedUrl: newUrl,
                        selectedFilter: filters
                    };

                    const cIOSettings = getConstructorIOSettings();

                    if ((cIOSettings.search_enabled || cIOSettings.browse_enabled) && window.searchParams) {
                        getConstructorioSearch({ url: newUrl, data })
                            .then((res) => {
                                const a = constructorIOPLP.convertCIOToHTMLString(res, 'searchResultsNoDecorator');
                                return a;
                            })
                            .catch(() => {
                                searchModule.methods.constractorRequestErrorHandler();
                            })
                            .then((response) => {
                                if (!response) {
                                    return;
                                }
                                searchModule.methods.applyFilterSuccessHandler(response, $currentTarget);
                            });
                    } else {
                        searchModule.methods.applyFilterRequest(newUrl, data, $currentTarget);
                    }
                }
                return true;
            });
    },

    showContentTab: () => {
        const $container = $('.container');
        const $contentSearchResults = $('#content-search-results');
        const $showMoreContentButton = $('.show-more-content button');

        $container.on('click', '.content-search', function () {
            if ($contentSearchResults.html() === '') {
                getContent($(this), $contentSearchResults);
            }
        });

        $container.on('click', '.show-more-content button', function () {
            getContent($(this), $contentSearchResults);
            $showMoreContentButton.remove();
        });

        setTimeout(() => {
            const $plpCategoryBanner = $('.l-plp-category_banner');
            if ($plpCategoryBanner.find('.hero').length > 0) {
                $plpCategoryBanner.removeClass('hide');
            } else {
                $plpCategoryBanner.addClass('hide');
            }
        }, 2000);
    },

    checkFilterHeight: () => {
        checkFilterSize();
        $body.on('click', '.b-refinements-header', function () {
            setTimeout(() => {
                checkFilterSize();
            }, 800);
        });
    },

    updateTilesAndCount: () => {
        collapseTilesAndUpdateCount();
    },

    waitCIOData: () => {
        const checkCIOData = () => {
            const $container = $('.l-plp-container');
            if (window.initialConstuctorResponse && window.initialConstuctorResponse.response.results.length > 0) {
                $container.html(constructorIOPLP.convertCIOToHTMLString(window.initialConstuctorResponse));
                $('body').trigger('components:init');
                checkFilterSize();
                delete window.initialConstuctorResponse;
            }
            $('.l-plp-container').removeClass('constructor-loading');
        };

        var initialRequestTSWithTimeout = window.cioClient ? ((window.initialTS || 0) + (window.constructorIOSettings.timeout || 0)) : 0;
        waitTimeout = initialRequestTSWithTimeout - new Date().getTime();
        if (waitTimeout > 0 && !window.initialConstuctorResponse) {
            setTimeout(() => {
                checkCIOData();
            }, waitTimeout + 50);
            $body.one('cio:initialDataLoaded', checkCIOData);
        } else {
            checkCIOData();
        }
    },

    initialLoadMore: () => {
        if (window.location.href.indexOf('start=') !== -1) {
            $('.js-grid_footer button.triggerMore').removeClass('triggerMore');
        } else {
            setTimeout(function () {
                $('body .js-grid_footer button.triggerMore').click();
            }, waitTimeout + 1000);
        }
    },

    onPageLoad: () => {
        $(window).ready(function () {
            const urlParam = window.location.search;
            if (urlParam.indexOf('srule') > -1) {
                const sortValue = new RegExp('[?&]' + 'srule' + '=([^&]*)').exec(urlParam); // eslint-disable-line
                $(`#sort-order [data-id="${sortValue[1]}"]`).prop('selected', 'selected');
                $('#sort-order').trigger('change');
            }
        });

        $(window).on('load', function () {
            const urlParam = window.location.search;
            if (urlParam.indexOf('viewPreference') > -1) {
                const modelSize = new RegExp('[?&]' + 'viewPreference' + '=([^&]*)').exec(urlParam);  // eslint-disable-line
                $body.find('.js-select-model-size', this.$el).val(modelSize[1]).trigger('change', [true]);
            }
            updateMobileSortOptions();
            onHideTeamRefinement();
        });
    },

    updateWishlistIndicatorOnLoad: () => {
        const productIDs = $('.wishlist-productIDs:last').length > 0 ? $('.wishlist-productIDs:last').val() : null;
        $body.trigger('wishlistSuggestion:update', productIDs);
    }
};

module.exports = searchModule;
