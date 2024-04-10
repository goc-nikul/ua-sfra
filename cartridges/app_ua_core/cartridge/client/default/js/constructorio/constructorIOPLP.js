/**
 * @file Initializes ConstructorIO using settings from the global window object.
 * @module constructorIO
 */

'use strict';

const { getRefinementsHtml } = require('./components/refinements');
const { getTileHtml } = require('./components/tiles');
const { getConstructorIOSettings,
    getResource,
    getURL
} = require('./clientWrapper');
const {
    getPriceRange,
    generatePLPURL
} = require('./utils/utils');

const getSortingOption = (sortingOption, isOption = false, withLink = false) => {
    const sortingRules = getResource('sortingRules') || {};
    const { SORT_OPTIONS_URL_MAP } = getConstructorIOSettings();
    const id = SORT_OPTIONS_URL_MAP[sortingOption.sort_by][sortingOption.sort_order].name;
    const sortURL = generatePLPURL({ url: getURL('updateGrid'), params: { sortRule: id, start: 0 } });
    const isSelected = sortingOption.status === 'selected';
    const displayName = sortingRules[[sortingOption.sort_by.toLowerCase(), sortingOption.sort_order.toLowerCase()].join('.')] || sortingRules[sortingOption.sort_by.toLowerCase()] || sortingOption.display_name;

    if (isOption) {
        return `<option class="select-option ${id}" label="${displayName}" value="${sortURL}" data-id="${id}"${isSelected ? ' selected="selected"' : ''}>
            ${displayName}
        </option>`;
    }

    return `<li class="b-sort-item js-sort-item${isSelected ? ' highlighted' : ''}" data-value="${sortURL}" data-id="${id}" data-analytics-sort-value="${displayName}">
        ${!withLink ? displayName : `<a href="${sortURL}"><isprint value="${displayName}"/></a>`}
    </li>`;
};

const getSortSelect = (sortOptions) => {
    const resources = {
        sort: getResource('label.sort')
    };

    const selectedSortingRule = sortOptions.filter(sortingOption => sortingOption.status === 'selected');

    return `
    <div class="b-sort" data-cmp="sortMobile" data-json-config='{"initOnDevice": ["extraSmall", "small", "medium", null, null]}' data-analytics-plp-sort-default="${selectedSortingRule && selectedSortingRule[0] && selectedSortingRule[0].display_name}">
        <label for="sort-order" class="b-sort-label js-sort-label">${resources.sort}</label>
        <div class="g-selectric-container form-group">
            <select data-cmp="customSelect" data-cmp-id="selectric" class="js-input_field input-select js-select b-sort-select" id="sort-order" name="sort-order">
                ${sortOptions.map(sortOption => getSortingOption(sortOption, true)).join('')}
            </select>
            <label class="g-selectric-label form-control-label js-input-label b-sort-label" for="sort-order">
                ${resources.sort}
            </label>
        </div>
        <div class="b-sort-content js-mob_sort">
            <ul class="b-sort-list">
                ${sortOptions.map(sortOption => getSortingOption(sortOption)).join('')}
            </ul>
        </div>
        <noscript>
            <div class="dropdown">
                <button class="dropbtn"></button>
                <ul class="dropdown-content">
                    ${sortOptions.map(sortOption => getSortingOption(sortOption, false, true)).join('')}
                </ul>
            </div>
        </noscript>
    </div>
    `;
};

const getPageBreadcrumbs = (selectedFilters) => {
    let breadcrumbsHTML = '';
    const selectedFilterKeys = Object.keys(selectedFilters);

    if (selectedFilterKeys.length === 0) {
        return `
        <div class="b-plp_header-breadcrumbs">
            <div class="b-breadcrumbs" role="navigation" aria-label="Breadcrumb">
                <ol class="b-breadcrumbs-list"> </ol>
            </div>
        </div>
        `;
    }
    const { ROUTE_REFINEMENT_ATTRIBUTES } = getConstructorIOSettings();
    const shownFilterAttributeInBreadcrumbs = {};

    ROUTE_REFINEMENT_ATTRIBUTES.forEach(function (key) {
        if (!selectedFilters[key]) {
            return;
        }
        shownFilterAttributeInBreadcrumbs[key] = selectedFilters[key].options.map(selectedFilterValue => selectedFilterValue.value);
        const urlConfig = { params: { filterParams: shownFilterAttributeInBreadcrumbs, start: 0 } };
        const hrefUrl = generatePLPURL(urlConfig);
        const dataUrl = generatePLPURL(Object.assign({}, urlConfig, { url: getURL('searchShowAjax') }));
        const title = selectedFilters[key].options.map(selectedFilterValue => selectedFilterValue.display_name).join(' + ');

        breadcrumbsHTML = breadcrumbsHTML.concat(
            `<li class="breadcrumb-refinement b-breadcrumbs-item">
                <a class="b-breadcrumbs-link js-refinement_swatch"
                    href="${hrefUrl}"
                    data-href="${dataUrl}"
                >
                    ${title}
                </a>
            </li>`
        );
    });

    return `
    <div class="b-plp_header-breadcrumbs">
        <script type="application/ld+json">
            {"@context":"http://schema.org/","@type":"BreadcrumbList","itemListElement":[]}
        </script>
        <div class="b-breadcrumbs" role="navigation" aria-label="Breadcrumb">
            <ol class="b-breadcrumbs-list">
                ${breadcrumbsHTML}
            </ol>
        </div>
    </div>
    `;
};

const getSearchHeader = (response, request, selectedFilters) => {
    const resources = {
        'search.results': getResource('label.search.title'),
        'items.more': getResource('label.num.items.more'),
        items: getResource('label.num.items'),
        item: getResource('label.num.item')
    };

    const { term } = request;
    const { total_num_results: resultsCount, sort_options: sortOptions } = response;
    const countLabel = resultsCount > 1 ? resultsCount > 4 ? 'items.more' : 'items' : 'item';

    return `
        <div class="l-plp-header b-plp_header l-plp-header-load_button">
            ${getPageBreadcrumbs(selectedFilters)}
            <div class="b-plp_header-row">
                <div class="b-plp_header-search_title">
                    ${resources['search.results']}
                </div>
                <div class="b-plp_header-search">
                    “${term}”
                </div>
                <div class="b-plp_header-results_count js-products_count" data-analytics-plp-count="${resultsCount}">${resources[countLabel].supplant([resultsCount])}</div>
                <div class="b-plp_header-sort js-header-sort">
                    ${getSortSelect(sortOptions)}
                </div>
            </div>
        </div>
    `;
};

const getTopLoadMore = (response, request) => {
    if (request.offset > 0) {
        const resources = {
            'label.load.more.products': getResource('label.load.more.products')
        };
        const loadMoreURL = generatePLPURL({ params: { start: null, sz: null } });

        return `
            <div class="l-plp-load_button">
                <a href="${loadMoreURL}" class="g-button_base g-button_secondary--black">${resources['label.load.more.products']}</a>
            </div>
        `;
    }
    return '';
};

const getBottomLoadMore = (response, request) => {
    const pageSize = request.num_results_per_page;
    const isShowMore = response.total_num_results > (request.offset + pageSize);
    if (isShowMore) {
        const pageNumber = Math.floor(request.offset / pageSize) + 1;
        const { SORT_OPTIONS_URL_MAP } = getConstructorIOSettings();

        const sortingOptions = Object.keys(SORT_OPTIONS_URL_MAP).map(id => {
            return {
                id,
                url: generatePLPURL({ url: getURL('updateGrid'), params: { sortRule: id, start: 0 } })
            };
        });
        const productSort = {
            options: sortingOptions
        };
        const params = {
            start: request.offset + pageSize,
            sz: pageSize
        };
        const showMoreUrl = generatePLPURL({ url: getURL('updateGrid'), params });
        const resources = {
            'button.more': getResource('button.more')
        };

        return `
            <div class="b-products_grid-footer b-grid_footer js-grid_footer"
                data-sort-options="${JSON.stringify(productSort)}"
                data-page-size="${pageSize}"
                data-page-number="${pageNumber}"
            >
                    <!--- More button --->
                    <button class="b-grid_footer-more_button js-show_more triggerMore g-button_base"
                            data-url="${showMoreUrl}"
                            data-pageSize="${pageSize}"
                    >
                        ${resources['button.more']}
                    </button>
                </div>
        `;
    }
    return '';
};

const getSortContent = (sortOptions) => {
    const sortingRules = getResource('sortingRules') || {};
    const { SORT_OPTIONS_URL_MAP } = getConstructorIOSettings();
    return `
        <div class="b-sort-content js-mob_sort" >
            <ul class="b-sort-list">
            ${sortOptions
                .map((sortOption) => {
                    const id = SORT_OPTIONS_URL_MAP[sortOption.sort_by][sortOption.sort_order].name;
                    const sortURL = generatePLPURL({
                        url: getURL('updateGrid'),
                        params: { sortRule: id, start: 0 }
                    });
                    const isSelected = sortOption.status === 'selected';
                    const displayName = sortingRules[[sortOption.sort_by.toLowerCase(), sortOption.sort_order.toLowerCase()].join('.')] || sortingRules[sortOption.sort_by.toLowerCase()] || sortOption.display_name;
                    return `
                        <li class="b-sort-item${isSelected ? ' m-selected' : ''} js-sort-item" data-value="${sortURL}"
                            data-id="${id.replace(/\s/g, '')}"
                            data-sorting-rule-id="${id}"
                            data-analytics-sort-value="${displayName}"
                        >
                            ${displayName}
                        </li>`;
                })
                .join('')}
            </ul>
        </div>
    `;
};

const getPaginationItem = (pageIndex, pageSize, type) => {
    const resources = {
        'title.previous': getResource('title.previous'),
        'title.next': getResource('title.next'),
        'title.default': getResource('title.default'),
        'label.previous': getResource('label.previous'),
        'label.next': getResource('label.next')
    };

    const pageNumber = pageIndex + 1;
    const URLParams = pageIndex > 0 ? { sz: pageSize, start: pageIndex * pageSize } : { sz: null, start: null };
    const url = generatePLPURL({ params: URLParams });

    let label = pageNumber;
    let title = resources['title.default'].supplant([pageNumber]);

    if (type === 'previous') {
        title = resources['title.previous'].supplant([pageNumber]);
        label = resources['label.previous'];
    } else if (type === 'next') {
        title = resources['title.next'].supplant([pageNumber]);
        label = resources['label.next'];
    }

    return `
        <li class="b-pagination_link${type ? ' ' + type : ''}">
            <a href="${url}" title="${title}">
                <span>
                    ${label}
                </span>
            </a>
        </li>
    `;
};

const getPagination = (response, request) => {
    const pageSize = request.num_results_per_page;
    const pagesCount = Math.floor(response.total_num_results / pageSize);
    const currentPageIndex = Math.floor(request.offset / pageSize);
    return `
        <noscript>
            <div class="b-pagination">
                <ul class="b-pagination_outer">
                    ${currentPageIndex > 0 ? getPaginationItem((currentPageIndex - 1), pageSize, 'previous') : ''}
                    ${pagesCount === 0 ? getPaginationItem(currentPageIndex, pageSize, 'current') : ''}
                    ${currentPageIndex < pagesCount ? getPaginationItem((currentPageIndex + 1), pageSize, 'next') : ''}
                    ${pagesCount > 0 ? new Array(pagesCount).fill(0).map((el, i) => getPaginationItem(i, pageSize, (i === currentPageIndex ? 'current' : ''))).join('') : ''}
                </ul>
            </div>
        </noscript>
    `;
};

const getGridTiles = (response, request) => {
    const pageSize = request.num_results_per_page;
    const offset = request.offset;
    const permalink = generatePLPURL({ params: { start: 0, sz: (request.offset + pageSize) } });

    return `
        ${response.results.map((productData, i) => {
            const id = productData.data.id;

            return `<section class="b-products_grid-tile js-products_grid-tile ${id}" data-pid="${id}" data-tile-num="${offset + i}" id="${id}" data-sizeModel="" data-analytics-plp-index="${i}">
                ${getTileHtml(productData)}
                ${(offset + i) % pageSize === 1 ?
                    `<input type="hidden" class="currentPageNumber" value="?start=${offset}&sz=${pageSize}"/>
                    <div class="updateBrowserUrl" data-url="?start=${offset}&sz=${pageSize}"></div>` : ''
                }
            </section>`;
        }).join('')}

        ${getBottomLoadMore(response, request)}

        <input type="hidden" class="pageSize" value="${pageSize}" />
        <input type="hidden" class="permalink" value="${permalink}" />

        ${getSortContent(response.sort_options)}
    `;
};

/**
 * Helper function used to convert ConstructorIO data into HTML string
 * that can be used in the processResponse function used to render
 * Search Page
 *
 * @param {Object} res - ConstructorIO query response object
 * @param {string} scope - scope of response: 'gridTiles'
 * @return {string} - HTML string with ConstructorIO data
 */
const convertCIOToHTMLString = (res, scope) => {
    const { response, request } = res;
    if (scope === 'gridTiles') {
        return getGridTiles(response, request);
    }

    const selectedFilters = {};
    response.facets.forEach(facet => {
        const selectedFilterOptions = (facet && facet.options && facet.options.filter(option => option.status === 'selected')) || [];
        if (selectedFilterOptions.length > 0) {
            selectedFilters[facet.name] = {
                display_name: facet.display_name,
                name: facet.name,
                options: selectedFilterOptions
            };
        }
    });

    // Add price filter to list of selected filters
    const selectedPriceRange = window.searchParams.priceRange;
    const priceMap = window.searchParams.buckets || [];
    if (selectedPriceRange) {
        priceMap.forEach((value) => {
            const priceRange = getPriceRange(value);
            if (priceRange[0] === selectedPriceRange[0] && priceRange[1] === selectedPriceRange[1]) {
                selectedFilters.price = {
                    display_name: 'Price',
                    name: 'price',
                    options: [
                        {
                            display_name: value.display_name,
                            value: value.display_name,
                            status: 'selected'
                        }
                    ]
                };
            }
        });
    }

    const canonicalUrl = generatePLPURL({ params: { start: null, sz: null } });
    return (`
        ${getSearchHeader(response, request, selectedFilters)}
        ${getTopLoadMore(response, request)}
        <div class="l-plp-content">
            ${getRefinementsHtml({ facets: response.facets, selectedFilters, sortingOptions: response.sort_options, productsCount: response.total_num_results })}
            <div class="l-plp-products_container" itemtype="http://schema.org/SomeProducts" itemid="#product">
            <div class="b-products_grid js-products_grid">
                ${getGridTiles(response, request)}
                <div class="hide lazyLoadwrapper"></div>
            </div>
        </div>
        <div class="canonical-div">
            <input type="hidden" data-canonical-url="${canonicalUrl}">
        </div>
        ${getPagination(response, request)}
    `);
};
module.exports = {
    convertCIOToHTMLString
};
