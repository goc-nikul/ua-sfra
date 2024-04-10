/* eslint-disable no-mixed-operators */

const {
    generatePLPURL,
    getPriceRange
} = require('../utils/utils');
const {
    getConstructorIOSettings,
    getURL,
    getResource
} = require('../clientWrapper');
const { cloneDeep } = require('lodash');

const getSizeSortIndex = (value) => {
    const { SIZE_SORT_RULES } = getConstructorIOSettings();
    if (SIZE_SORT_RULES && SIZE_SORT_RULES[value]) {
        return SIZE_SORT_RULES[value];
    } else if (value.includes('K')) {
        const youthSizes = value.split('K');
        return parseInt(youthSizes[0], 10) + 100;
    } else if (value.includes('/')) {
        const pants = value.split('/');
        return 300 + parseInt(pants[0], 10) + parseInt(pants[1], 10);
    } else if (!isNaN(parseInt(value, 10))) {
        const shoeSizes = parseInt(value, 10);
        return 200 + shoeSizes;
    }

    return 10000;
};

const getShowMoreButton = () => {
    const resources = {
        'refinements.show.button': getResource('refinements.show.button'),
        'refinements.hide.button': getResource('refinements.hide.button')
    };

    return `<button class="b-show_more-btn js-toggle-refinements"
            data-cmp="showMore"
    >
        <span class="b-show_more-copy--show">${resources['refinements.show.button']}</span>
        <span class="b-show_more-copy--hide">${resources['refinements.hide.button']}</span>
    </button>
    `;
};

const getRefinementOptionsArray = (allFacets, facet) => {
    let options = facet.options;
    const category = facet.name;
    const lcCategory = category.toLowerCase();
    const { SIZE_RANGE_MAP, DISPLAYABLE_REFINEMENT_CATEGORIES } = getConstructorIOSettings();
    const isPrice = DISPLAYABLE_REFINEMENT_CATEGORIES[facet.name].isPrice;
    const isSize = !isPrice && lcCategory === 'size';

    if (isPrice) {
        if (window.searchParams && window.searchParams.buckets) {
            options = window.searchParams.buckets;
        } else {
            options = [];
        }

        allFacets.forEach((facetCategory) => {
            if (facetCategory.name === 'salePriceLow' || facetCategory.name.includes('Price ')) {
                const mergedArray = [...options, ...facetCategory.options];

                let set = new Set();
                options = mergedArray.filter((item) => {
                    if (!set.has(item.display_name) && item.range) {
                        set.add(item.display_name);
                        return true;
                    }
                    return false;
                });
            }
        });
        const selectedOption = options.find(o => {
            const priceRange = getPriceRange(o);
            return JSON.stringify(priceRange) === JSON.stringify(window.searchParams.priceRange);
        });
        const searchBuckets = cloneDeep(window.searchParams.buckets);
        if (selectedOption && selectedOption.value) {
            options = searchBuckets.map((bucket) => bucket.display_name === selectedOption.display_name ? Object.assign(bucket, { status: 'selected' }) : bucket);
        } else {
            options = searchBuckets;
        }
        options = options.sort((a, b) => getPriceRange(window.searchParams.buckets.find(i => i.display_name === a.display_name))[0] - getPriceRange(window.searchParams.buckets.find(i => i.display_name === b.display_name))[0]);
    } else if (isSize) {
        options.sort((a, b) => getSizeSortIndex(a.value) - getSizeSortIndex(b.value));
    } else if (lcCategory === 'length') {
        // Update Size Range Filter names
        options = options.map((o) => {
            const opt = cloneDeep(o);
            if (SIZE_RANGE_MAP[o.value]) opt.display_name = SIZE_RANGE_MAP[o.value];
            return opt;
        });
    } else if (lcCategory === 'discountpercentage') {
        // Update Discount filter
        options = options.map((o) => {
            const opt = cloneDeep(o);
            let disVal = o.value;
            if (disVal) {
                opt.display_name = getResource('refinement.discountpercentage.' + disVal);
            }
            return opt;
        });
        options = options.sort((a, b) => a.value - b.value);
    }

    return options;
};

const buildRefinementOptions = (facet, options, cutoffThreshold) => {
    let refinementOptions = '';
    const { DISPLAYABLE_REFINEMENT_CATEGORIES } = getConstructorIOSettings();
    const category = facet.name;
    const categoryDisplayName = DISPLAYABLE_REFINEMENT_CATEGORIES[facet.name].displayName;
    const isPrice = DISPLAYABLE_REFINEMENT_CATEGORIES[facet.name].isPrice;
    const lcCategory = category.toLowerCase();
    const isSize = !isPrice && lcCategory === 'size';

    const resources = {
        'refine.title': getResource('refine.title')
    };

    if (lcCategory === 'colorgroup') {
        options.forEach((option, index) => {
            const urlConfig = { params: { filterParams: { [category]: option.value }, start: 0 }, action: 'toggle' };
            const hrefUrl = generatePLPURL(urlConfig);
            const dataUrl = generatePLPURL(Object.assign({}, urlConfig, { url: getURL('searchShowAjax') }));
            const isSelected = option.status === 'selected';
            const noBorderClass = (option.data && (option.data.hexCode === '#fff' || option.data.hexCode === '#ffffff')) ? '' : ' no-border';
            let backgroundStyle = '';

            if (option.data && option.data.hexCode) {
                backgroundStyle = `background-color: ${option.data.hexCode};`;
            } else if (option.data && option.data.imgUrl) {
                backgroundStyle = `background: ${option.data.imgUrl};`;
            }

            refinementOptions = refinementOptions.concat(
                `<li class="b-swatches_circle-item b-show_more-item${cutoffThreshold && (index === cutoffThreshold) ? ' m-break' : ''}">
                    <a
                        href="${hrefUrl}"
                        data-href="${dataUrl}"
                        onclick="$(this).hasClass('m-active')?$(this).removeClass('m-active'):$(this).addClass('m-active')"
                        data-analytics-plp-filter-value="${option.display_name}"
                        title="${resources['refine.title'].supplant([categoryDisplayName, option.display_name])}"
                        class="b-swatches_circle-link${noBorderClass}${isSelected ? ' m-active' : ''}"
                    >
                        <span class="b-swatches_circle-value" style="${backgroundStyle}"></span>
                    </a>
                </li>`
            );
        });
    } else if (isPrice) {
        options.forEach((option, index) => {
            const isSelected = option.status === 'selected';
            let priceRange;
            const optionData = window.searchParams.buckets.find(
                (item) => item.display_name === option.display_name
            );
            if (
                !isSelected &&
                optionData
            ) {
                priceRange = getPriceRange(optionData);
            }
            const urlConfig = { params: { priceRange, start: 0 } };
            const hrefUrl = generatePLPURL(urlConfig);
            const dataUrl = generatePLPURL(Object.assign({}, urlConfig, { url: getURL('searchShowAjax') }));

            refinementOptions = refinementOptions.concat(
                `<li class="b-refinements_price-item b-show_more-item${cutoffThreshold && (index === cutoffThreshold) ? ' m-break' : ''}">
                    <a
                        href="${hrefUrl}"
                        data-href="${dataUrl}"
                        onclick="$(this).hasClass('m-selected')?$(this).removeClass('m-selected'):$(this).addClass('m-selected').siblings().removeClass('m-selected')"
                        title="${resources['refine.title'].supplant([categoryDisplayName, option.display_name])}"
                        class="b-refinements_price-btn${isSelected ? ' m-selected' : ''}"
                      >
                        <span aria-hidden="true" class="bfx-price">${option.display_name} (${option.count})</span>
                    </a>
                </li>`
            );
        });
    } else if (isSize) {
        options.forEach((option, index) => {
            const urlConfig = { params: { filterParams: { [category]: option.value }, start: 0 }, action: 'toggle' };
            const hrefUrl = generatePLPURL(urlConfig);
            const dataUrl = generatePLPURL(Object.assign({}, urlConfig, { url: getURL('searchShowAjax') }));
            const isSelected = option.status === 'selected';

            refinementOptions = refinementOptions.concat(
                `<li class="b-refinements_attributes-item m-size b-show_more-item${index === cutoffThreshold ? ' m-break' : ''}">
                    <a
                        href="${hrefUrl}"
                        data-href="${dataUrl}"
                        data-analytics-plp-filter-value="${option.display_name}"
                        title="${resources['refine.title'].supplant([categoryDisplayName, option.display_name])}"
                        class="b-refinements_attributes-size${isSelected ? ' m-selected' : ''}"
                    >
                    ${option.display_name}
                    </a>
                </li>`
            );
        });
    } else if (lcCategory === 'discountpercentage') {
        options.forEach((option, index) => {
            const urlConfig = { params: { filterParams: { [category]: option.value }, start: 0 }, action: 'toggle' };
            const hrefUrl = generatePLPURL(urlConfig);
            const dataUrl = generatePLPURL(Object.assign({}, urlConfig, { url: getURL('searchShowAjax') }));
            const isSelected = option.status === 'selected';
            const displayCnt = option.count > 0 ? '(' + option.count + ')' : '';

            refinementOptions = refinementOptions.concat(
                `<li class="b-refinements_attributes-item m-checkbox b-show_more-item${index === cutoffThreshold ? ' m-break' : ''}">
                    <a
                        href="${hrefUrl}"
                        data-href="${dataUrl}"
                        onclick="$(this).hasClass('m-selected')?$(this).removeClass('m-selected'):$(this).addClass('m-selected')"
                        data-analytics-plp-filter-value="${option.display_name}"
                        title="${resources['refine.title'].supplant([categoryDisplayName, option.display_name])}"
                        class="b-refinements_attributes-checkbox${isSelected ? ' m-selected' : ''}"
                    >
                        ${option.display_name}${displayCnt}
                    </a>
                </li>`
            );
        });
    } else {
        options.forEach((option, index) => {
            const urlConfig = { params: { filterParams: { [category]: option.value }, start: 0 }, action: 'toggle' };
            const hrefUrl = generatePLPURL(urlConfig);
            const dataUrl = generatePLPURL(Object.assign({}, urlConfig, { url: getURL('searchShowAjax') }));
            const isSelected = option.status === 'selected';

            if (option.value !== 'N/A') {
                refinementOptions = refinementOptions.concat(
                    `<li class="b-refinements_attributes-item m-checkbox b-show_more-item${index === cutoffThreshold ? ' m-break' : ''}">
                        <a
                            href="${hrefUrl}"
                            data-href="${dataUrl}"
                            onclick="$(this).hasClass('m-selected')?$(this).removeClass('m-selected'):$(this).addClass('m-selected')"
                            data-analytics-plp-filter-value="${option.display_name}"
                            title="${resources['refine.title'].supplant([categoryDisplayName, option.display_name])}"
                            class="b-refinements_attributes-checkbox${isSelected ? ' m-selected' : ''}"
                        >
                            ${option.display_name}
                        </a>
                    </li>`
                );
            }
        });
    }

    return refinementOptions;
};

const buildRefinementCategory = (cioFacets, selectedFilters) => {
    let refinementCategories = '';
    const { DISPLAYABLE_REFINEMENT_CATEGORIES, DEFAULT_CUTOFFTHRESHOLD } = getConstructorIOSettings();

    cioFacets.forEach((facet) => {
        if (DISPLAYABLE_REFINEMENT_CATEGORIES[facet.name]) {
            const cutoffThreshold = DISPLAYABLE_REFINEMENT_CATEGORIES[facet.name].cutoffThreshold || DEFAULT_CUTOFFTHRESHOLD;
            const isPrice = DISPLAYABLE_REFINEMENT_CATEGORIES[facet.name].isPrice;
            const showFacetOptionsCutOff = cutoffThreshold && facet.options.length > cutoffThreshold;
            const options = getRefinementOptionsArray(cioFacets, facet);
            const optionsHtml = buildRefinementOptions(facet, options, showFacetOptionsCutOff && cutoffThreshold);
            let selectedValuesArr = selectedFilters[facet.name] && selectedFilters[facet.name].options || [];

            if (isPrice && options.length > 0) {
                selectedValuesArr = options.find((o) => o.status === 'selected') || [];
            }

            const selectedValuesLength = selectedValuesArr.length;
            const isCollapsed = selectedValuesLength === 0;
            const containerClass = isPrice ? 'b-refinements_price b-show_more m-collapsed js-refinements-parent' : 'b-refinements_attributes b-show_more js-refinements-parent m-collapsed';
            const ulClass = isPrice ? 'b-refinements_price-list b-show_more-list' : 'b-refinements_attributes-list b-swatches b-show_more-list';
            const resources = {
                'refinements.amount': getResource('refinements.amount')
            };

            refinementCategories = refinementCategories.concat(
                `<div class="b-refinements-item js-refinements-item m-${
                    facet.name
                }" data-analytics-plp-filter-title="${
                    DISPLAYABLE_REFINEMENT_CATEGORIES[facet.name].displayName
                }" data-refinement-id="${facet.name}">
                    <div
                        class="b-refinements-header${isCollapsed ? ' collapsed' : ''}"
                        data-toggle="collapse"
                        aria-expanded="${!isCollapsed}"
                        aria-controls="refinement-${facet.name}"
                        data-target="#refinement-${facet.name}"
                        data-amount-selected-items="${selectedValuesLength}.0"
                    >
                        ${DISPLAYABLE_REFINEMENT_CATEGORIES[facet.name].displayName}
                        ${selectedValuesLength > 0 ? resources['refinements.amount'].supplant([selectedValuesLength]) : ''}
                    </div>
                    <div class="b-refinements-content collapse${!isCollapsed ? ' show' : ''}" id="refinement-${facet.name}" data-refinementattr="${facet.name}">
                        <div class="${containerClass}">
                            <ul class="${ulClass}">
                                ${optionsHtml}
                            </ul>
                            ${showFacetOptionsCutOff ? getShowMoreButton() : ''}
                        </div>
                    </div>
                </div>`);
        }
    });

    return refinementCategories;
};

const getClearAllButton = (selectedFilters) => {
    const resources = {
        'refinements.clear': getResource('refinements.clear')
    };
    const selectedFilterKeys = selectedFilters && Object.keys(selectedFilters) || [];
    const showClearAllButton = selectedFilterKeys.length > 0 && !(selectedFilterKeys.length === 1 && selectedFilterKeys.some(selectedFilterKey => ['isMFOItem', 'experienceType', 'premiumFilter'].indexOf(selectedFilterKey) > -1));
    if (!showClearAllButton) {
        return '';
    }

    const urlConfig = { params: { filterParams: {}, start: 0, priceRange: null, sortRule: null } };
    const hrefUrl = generatePLPURL(urlConfig);
    const dataUrl = generatePLPURL(Object.assign({}, urlConfig, { url: getURL('searchShowAjax') }));
    return `
    <div class="b-refinements_header-clear js-selected-refinements">
        <a href="${hrefUrl}" role="button" class="b-refinements_header-btn js-refinements_clear" data-href="${dataUrl}">
            ${resources['refinements.clear']}
        </a>
    </div>`;
};

const getMobileSorting = (sortingOptions) => {
    const resources = {
        sort: getResource('label.sort')
    };

    const { SORT_OPTIONS_URL_MAP } = getConstructorIOSettings();

    return `
    <div class="b-refinements-item js-refinements-item m-sort-filter">
        <div class="b-refinements-header collapsed" data-toggle="collapse" aria-expanded="false" aria-controls="refinement-sort" data-target="#refinement-sort">
            ${resources.sort}
        </div>
        <div class="b-refinements-content collapse" id="refinement-sort">
            <ul class="b-refinement_sort-list">
                ${sortingOptions.map(sortingOption => {
                    const id = SORT_OPTIONS_URL_MAP[sortingOption.sort_by][sortingOption.sort_order].name;
                    const isSelected = sortingOption.status === 'selected';

                    return `
                    <li class="b-refinement_sort-item">
                        <input type="radio" id="id-sort-${id}"${isSelected ? ' checked="checked"' : '' } name="sortMobileOption" value="${id}">
                        <label for="id-sort-${id}">${sortingOption.display_name}</label>
                    </li>
                    `;
                }).join('')}
            </ul>
        </div>
    </div>`;
};

const getMobileFilterFooter = (productsCount) => {
    const resources = {
        'refinements.apply': getResource('refinements.apply')
    };
    return `
    <div class="b-refinements-footer">
        <button class="b-refinements-apply g-button_base g-button_primary--black js-close-filter">
            ${resources['refinements.apply'].supplant([productsCount])}
        </button>
    </div>
    `;
};

const getRefinementsHtml = ({ facets, selectedFilters, sortingOptions = [], productsCount }) => {
    const categories = buildRefinementCategory(facets, selectedFilters);
    const categoryConfig = {
        initOnDevice: ['extra-small', 'small', 'medium', null, null]
    };

    const resources = {
        'assistive.text.remove.filter.button': getResource('assistive.text.remove.filter.button'),
        close: getResource('refinements.close'),
        filter: getResource('refinements.title')
    };
    const currentURL = generatePLPURL({ url: getURL('searchShowAjax') });
    const queryStr = new URL(currentURL).search.substr(1);

    const mobileSorting = getMobileSorting(sortingOptions);

    return `
    <div class="l-plp-sidebar js-plp-sidebar" data-cmp="searchRefinement" data-json-config='${JSON.stringify(categoryConfig)}'>
        <div class="js-slim-scrollbar">
            <div class="l-plp-sidebar-categories"></div>
            <div class="l-plp-sidebar-filter">
                <div class="b-refinements js-refinements">
                    <div class="b-refinements-container js-canonical-url"
                        data-action-sizemodelurl="${getURL('searchShowAjax')}"
                        data-querystring="${queryStr}">
                        <div class="b-refinements_header">
                            <div class="b-refinements_header-content">
                                <div class="b-refinements_header-title">${resources.filter}</div>
                                ${getClearAllButton(selectedFilters)}

                                <button class="b-refinements_header-close js-close-filter">${resources.close}</button>
                            </div>
                            <ul class="b-refinements_swatch">
                                ${Object.keys(selectedFilters).map(key => {
                                    if (['premiumFilter', 'isMFOItem', 'availableForLocale', 'experienceType'].indexOf(key) > -1) {
                                        return '';
                                    }

                                    const selectedFilterAttribute = selectedFilters[key];
                                    return selectedFilterAttribute.options.map(selectedFilterValue => {
                                        const urlConfig = ['salePriceLow', 'price'].indexOf(key) > -1 ?
                                            { params: { priceRange: undefined, start: 0 } } :
                                            { params: { filterParams: { [key]: selectedFilterValue.value }, start: 0 }, action: 'toggle' };
                                        const hrefUrl = generatePLPURL(urlConfig);
                                        const dataUrl = generatePLPURL(Object.assign({}, urlConfig, { url: getURL('searchShowAjax') }));
                                        var filterDisplayName = selectedFilterValue.display_name;
                                        if (['discountPercentage'].indexOf(key) > -1 && selectedFilterValue.value) {
                                            filterDisplayName = getResource('refinement.discountpercentage.' + selectedFilterValue.value);
                                        }

                                        return `
                                        <li class="b-refinements_swatch-item">
                                            <a href="${hrefUrl}" data-href="${dataUrl}" data-analytics-plp-selected-filter-value="${selectedFilterValue.display_name}" class="b-refinements_swatch-btn js-refinement_swatch">
                                                <span class="b-refinements_swatch-text" aria-hidden="true">${filterDisplayName}</span>
                                                <span class="b-refinements_swatch-remove">
                                                ${resources['assistive.text.remove.filter.button'].supplant([selectedFilterValue.value])}
                                                </span>
                                            </a>
                                        </li>
                                        `;
                                    }).join('');
                                }).join('')}
                            </ul>
                        </div>
                        ${mobileSorting}
                        ${categories}
                        ${getMobileFilterFooter(productsCount)}
                    </div>
                </div>
            </div>
        </div>
    </div>`;
};

module.exports = {
    getRefinementsHtml
};
