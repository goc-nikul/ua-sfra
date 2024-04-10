'use strict';

const { isEmpty, intersection } = require('lodash');
const { getConstructorIOSettings, getURL, getResource } = require('../clientWrapper');
const {
    determineNoBorderClass
} = require('../utils/utils');

const numberWithCommas = (price, separators) => {
    var parts = price.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separators.length > 1 ? separators[0] : ',');
    return parts.join(separators.length > 1 ? separators[1] : separators[0]);
};

const convertNumberToPrice = (value) => {
    const { samplePrice = '0', samplePriceThousand = '0' } = getConstructorIOSettings();
    const separators = samplePrice.match(/[.,]/g);
    const separatorsThousand = samplePriceThousand.match(/[.,]/g);
    let modifiedPrice = numberWithCommas(value.toFixed(2), separators);
    if (value >= 1000) {
        modifiedPrice = numberWithCommas(value.toFixed(2), separatorsThousand);
    }

    return samplePrice.replace(/\d{1,}[,.]{1}\d{1,}/g, modifiedPrice);
};

const padColorId = (value, padding = 3) => {
    if (!value) return undefined;

    let zeroes = new Array(4).join('0');
    return (zeroes + value).slice(-padding);
};

const getCioColorWayId = (colorway = '001') => padColorId(typeof colorway === 'string' ? colorway : colorway.color, 3);

const getVisibleVariants = (variations) => {
    let uniqueColors = [];
    let visible = [];
    variations.forEach((variant) => {
        const variantColor = getCioColorWayId(variant.data.colorWayId);
        if (!variant.data.hideColorWay && variant.data.orderable && variant.data.image_url && !uniqueColors.includes(variantColor)) {
            visible.push(variant);
            uniqueColors.push(variantColor);
        }
    });

    return visible;
};

/**
 * Generates the default color way product tile data including image and hover image
 * to display on a single tile.
 *
 * @param {Object} product - Product data.
 * @returns {productTileData} product image details
 */
function getDefaultColorWayDetails(product) {
    const colorwayId = product.data.colorWayId ? product.data.colorWayId.color : '';
    const defaultColorWayId = product.data.defaultColorwayId ? product.data.defaultColorwayId.id.split(',')[0] : '';
    let selectedColorWayId = defaultColorWayId;
    var productTileData = {
        defaultColorWayId: null,
        image_url: null,
        imageName: null,
        gridTileHoverImageURL: null
    };

    if (defaultColorWayId) {
        let variationProduct = product.variations_map.filter(variation => variation.colorWayId === defaultColorWayId)[0];

        // if defaultcolorway is not online, then use colorwayId to find variant
        if (!variationProduct) {
            variationProduct = product.variations_map.filter(variation => variation.colorWayId === colorwayId)[0];
            selectedColorWayId = colorwayId;
        }

        // if colorwayId variant is also not online, take the first color
        if (!variationProduct && product.variations_map.length > 0) {
            variationProduct = product.variations_map[0];
            selectedColorWayId = variationProduct.colorWayId;
        }

        if (variationProduct) {
            productTileData.image_url = (variationProduct.data.image_url || '').replace('http://', 'https://') || null;
            productTileData.gridTileHoverImageURL = (variationProduct.data.gridTileHoverImageURL || '').replace('http://', 'https://') || null;
            productTileData.imageName = variationProduct.data.imageName || null;
        }

        productTileData.defaultColorWayId = padColorId(selectedColorWayId);
    }

    return productTileData;
}

const getProductColorSwatches = (product, showColorCarousel) => {
    let swatches = '';

    const resources = {
        'product.view.color': getResource('product.view.color')
    };

    const productVariations = product.variations ? product.variations : product.variations_map;
    let productColors = getVisibleVariants(productVariations)
        .map((variant) => {
            const imageUrl = variant.data.image_url ? variant.data.image_url.replace('http://', 'https://') : null;
            const hex = typeof variant.data.hexColor === 'number' ? padColorId(variant.data.hexColor, 6) : variant.data.hexColor;
            const colorId = getCioColorWayId(variant.data.colorWayId);

            if (colorId) {
                return {
                    id: colorId,
                    url: variant.data.url,
                    upc: variant.data.upc,
                    colorway: variant.data.colorWay || null,
                    hex: `${hex}` || '',
                    hideColorway: false,
                    isLoyaltyExclusiveColor: variant.data.isLoyaltyExclusive || false,
                    name: variant.data.colorValue || '',
                    secondaryHex: variant.data.secondaryHexColor || null,
                    orderable: variant.data.orderable || false,
                    assets: {
                        alt: variant.data.imageName || '',
                        images: [
                            {
                                assetName: variant.data.imageName || '',
                                url: imageUrl
                            },
                            {
                                assetName: variant.data.imageName || '',
                                url: variant.data.gridTileHoverImageURL ? variant.data.gridTileHoverImageURL.replace('http://', 'https://') : imageUrl
                            }
                        ],
                        title: variant.value || null
                    }
                };
            }
            return '';
        });

    productColors.forEach((color, index) => {
        const pid = product.data.id;
        const dataIndex = `${index}.0`;
        const includeFirstClass = index === 0 ? 'first' : '';
        const secondaryHex = color.secondaryHex || color.hex;
        const url = `${getURL('productShow')}${pid}&dwvar_${pid}_color=${color.id}`;
        const dataProductImage = color.assets.images[0].url;
        const numberOfColors = product.data.colorCount;
        const carouselAttributes = showColorCarousel ? (
            `role="group"
            aria-label="${index + 1} / ${numberOfColors + 1}"`) : '';
        const defaultColorwayDetails = getDefaultColorWayDetails(product);
        const productColor = !isEmpty(product.data.colorWayId) ? getCioColorWayId(product.data.colorWayId) : defaultColorwayDetails.defaultColorWayId;
        const isSelectedColor = color.id === productColor;

        let noBorderClass = '';
        noBorderClass = determineNoBorderClass(color.hex, color.secondaryHex);

        swatches = swatches.concat(`
            <li
                data-index="${dataIndex}"
                class="b-swatches_circle-item swiper-slide ${includeFirstClass}"
                data-url="${url}"
                ${carouselAttributes}
            >
                <a
                    href="${url}"
                    data-attr-url="${url}"
                    data-index="${dataIndex}"
                    data-product-img="${dataProductImage}"
                    data-product-imgmain="null"
                    data-product-sizemodel=""
                    data-product-modelspec=""
                    data-product-hoverimagedefault="null"
                    data-attr-value="${color.id}"
                    title="${resources['product.view.color'].supplant([color.name, color.id])}"
                    class="b-swatches_circle-link js-swatch-link pdp-open-new-tab ${noBorderClass} ${isSelectedColor ? 'm-active' : ''}"
                >
                    <span
                        class="b-swatches_circle-value"
                        style="background-image: linear-gradient(90deg, #${color.hex} 0%, #${color.hex} 50%, #${secondaryHex} 50%, #${secondaryHex} 100%);"
                    ></span>
                </a>
            </li>`);
    });

    return swatches;
};

const getProductPrice = (product) => {
    const data = product.data;
    if (!data.listPriceHigh) return '';
    const list = { min: data.listPriceLow, max: data.listPriceHigh };
    const sale = { min: data.salePriceLow, max: data.salePriceHigh };

    const { customerGroups } = getConstructorIOSettings();

    if (product.data && product.data.groupPricing) {
        const matchedPriceGroup = Object.keys(product.data.groupPricing).find((groupName) =>
            customerGroups.includes(groupName)
        );

        if (matchedPriceGroup) {
            sale.min = product.data.groupPricing[matchedPriceGroup].min;
            sale.max = product.data.groupPricing[matchedPriceGroup].max;
        }
    }

    const showSalesPrice = list.max !== sale.max || list.min !== sale.min;
    const showRange = showSalesPrice
        ? sale.min !== sale.max
        : list.min !== list.max;

    const defaultPrice = convertNumberToPrice(list.max);
    if (showRange) {
        const low = convertNumberToPrice(showSalesPrice ? sale.min : list.min);
        const high = convertNumberToPrice(showSalesPrice ? sale.max : list.max);

        return (
            `<span class="b-price-value bfx-price" content="${low}">${low}</span>
            <span class="b-price-range_divider">-</span>
            <span class="b-price-value bfx-price" content="${high}">${high}</span>`
        );
    } else if (showSalesPrice) {
        const saleLow = convertNumberToPrice(sale.min);

        return (
            `<span class="b-price-value m-strikethrough bfx-price highlighted" content="${defaultPrice}">${defaultPrice}</span>
            <span class="b-price-value highlighted bfx-price m-actual spacer" content="${saleLow}">${saleLow}</span>`
        );
    }
    return `<span class="b-price-value bfx-price" content="${defaultPrice}">${defaultPrice}</span>`;
};

const chooseActivePromotion = (currentPromotions, customerGroups) => {
    let promotionsWithRank = [];
    let promotionsWithStartDate = [];
    let filteredPromotions = [];

    if (currentPromotions.length > 0) {
        currentPromotions.forEach((promotion) => {
            if ((!('hasCoupon' in promotion) || promotion.hasCoupon === false) && !isEmpty(intersection(promotion.customerGroups, customerGroups))) {
                if (promotion.rank && promotion.rank !== '') {
                    promotionsWithRank.push(promotion);
                } else if (promotion.startDate) {
                    promotionsWithStartDate.push(promotion);
                } else {
                    filteredPromotions.push(promotion);
                }
            }
        });
    }

    if (promotionsWithRank.length > 0) {
        promotionsWithRank.sort((first, second) => {
            const firstRank = typeof first.rank === 'string' ? Number(first.rank) : first.rank;
            const secondRank = typeof second.rank === 'string' ? Number(second.rank) : second.rank;
            return firstRank - secondRank;
        });

        return promotionsWithRank[0];
    } else if (promotionsWithStartDate.length > 0) {
        promotionsWithStartDate.sort((first, second) => new Date(first.startDate) - new Date(second.startDate));

        return promotionsWithStartDate[0];
    }

    return filteredPromotions.length > 0 ? filteredPromotions[0] : undefined;
};

const getProductPromotion = (promotions) => {
    let promotionHTML = '';
    const { customerGroups } = getConstructorIOSettings();
    const activePromotion = chooseActivePromotion(promotions, customerGroups);

    if (activePromotion && activePromotion.customerGroups && !isEmpty(intersection(activePromotion.customerGroups, customerGroups))) {
        promotionHTML = activePromotion.callOut ? (
            `<div class="b-promo-tooltip-content">
                <span class="hide-mobile">
                    <span class="b-promo-tooltip-content-text" style="word-break: break-all">${activePromotion.callOut}</span>
                    ${activePromotion.toolTipText ? `
                    <span class="g-tooltip-icon g-tooltip bfx-remove-element">
                        <span class="g-tooltip-text">
                            ${activePromotion.toolTipText}
                        </span>
                    </span>` : ''}
                </span>
                <span class="hide-desktop">
                    <span class="b-promo-tooltip-content-text" style="word-break: break-all">${activePromotion.callOut}</span>
                    ${activePromotion.toolTipText ? `
                    <span class="g-tooltip-icon g-tooltip bfx-remove-element">
                        <span class="g-tooltip-arrow"></span>
                    </span>
                    <span class="g-tooltip-text">
                        ${activePromotion.toolTipText}
                    </span>` : ''}
                </span>
            </div>`) : '';
    }

    return promotionHTML;
};

/**
 * Generates the HTML markup for a single tile using the product data.
 *
 * @param {Object} product - Product data.
 * @returns {string} HTML markup for the tile.
 */
const getTileHtml = (product) => {
    const pid = product.data.id;
    const defaultColorwayDetails = getDefaultColorWayDetails(product);
    const productColor = !isEmpty(product.data.colorWayId) ? getCioColorWayId(product.data.colorWayId) : defaultColorwayDetails.defaultColorWayId;
    const url = productColor ? `${getURL('productShow')}${pid}&dwvar_${pid}_color=${productColor}` : `${getURL('productShow')}${pid}`;
    var imageUrl = defaultColorwayDetails.image_url ? defaultColorwayDetails.image_url : product.data.image_url ? product.data.image_url.replace('http://', 'https://') : '';
    var hoverImageUrl = defaultColorwayDetails.gridTileHoverImageURL ? defaultColorwayDetails.gridTileHoverImageURL : product.data.gridTileHoverImageURL ? product.data.gridTileHoverImageURL.replace('http://', 'https://') : imageUrl;

    if (productColor) {
        imageUrl = product.data.image_url ? product.data.image_url.replace('http://', 'https://') : '';
        hoverImageUrl = product.data.gridTileHoverImageURL ? product.data.gridTileHoverImageURL.replace('http://', 'https://') : imageUrl;
    }

    const image = {
        url: imageUrl,
        urlHov: hoverImageUrl
    };
    const productVariations = product.variations ? product.variations : product.variations_map;
    const numColors = product.data.colorCount === 0 ? getVisibleVariants(productVariations).length : product.data.colorCount;
    const showColorCarousel = numColors > 6;
    const colorSwatches = getProductColorSwatches(product, showColorCarousel);
    const productPrice = getProductPrice(product);
    const badge = product.data.badge || null;
    const upperLeftFlameIcon = product.data.upperLeftFlameIcon || null;
    const comingSoon = product.exclusiveType === 'COMING_SOON';
    const isOrderable = product.data.orderable || (product.variations && product.variations.length > 0) || (product.variations_map && product.variations_map.length > 0);
    const hasPromo = product.data.promotions && product.data.promotions.length > 0;
    const productTileJSONConfig = '{"initOnDevice": [null, null, null, "large", "extra-large"]}';
    const swatchTileJSONConfig = {
        direction: 'horizontal',
        centerInsufficientSlides: false,
        loop: false,
        navigation: {
            nextEl: '.js-swiper-button-next',
            prevEl: '.js-swiper-button-prev',
            disabledClass: 'm-disabledClass'
        },
        slidesPerView: 6,
        spaceBetween: 0,
        slidesPerGroup: 5,
        breakpoints: {
            480: {
                slidesPerView: 6,
                spaceBetween: 1
            },
            767: {
                slidesPerView: 6,
                spaceBetween: 1
            }
        }
    };

    return `
        <div class="b-tile b-tile-constructorio bfx-price-product" data-cmp="productTile" data-json-config='${productTileJSONConfig}'>
            <div class="b-tile-variations_container" data-product="${pid}">
                <div class="b-tile-images_outer">
                    <button
                        class="b-tile-fav_defultButton wishlistTile product"
                        remove-href="${getURL('wishlistRemoveProduct')}"
                        href="${getURL('wishlistAddProduct')}"
                        aria-label="${getResource('wishlistButtonLabel')}"
                        data-pid="${pid}"
                        type="button"
                        data-analytics-style="${pid}">
                        <span class="js-whislist-icon b-tile-fav_button"></span>
                    </button>
                    <a href="${url}" class="b-tile-images_container">
                        <picture>
                            <img
                                class="b-tile-image b-tile-main_image js-tile-carousel_image lazyload"
                                src="${getResource('tileSkeletonLoader')}"
                                data-src="${image.url}"
                                data-rollover="${image.urlHov}"
                                onerror="this.style.visibility='hidden'"
                                alt="${product.data.value || ''}"
                                title="${defaultColorwayDetails.imageName || product.data.imageName}"
                            >
                        </picture>
                    </a>
                </div>
            </div>
            <div class="b-tile-info">
                <div class="b-tile-gift-container">
                    <div class="b-tile-swatches_container">
                        <div class="b-tile-swatches js-tile-swatches">
                            <div
                                class="swiper-container b-tile-swatches_slider ${showColorCarousel ? 'swatch-carousel' : ''}"
                                data-cmp="carousel"
                                data-json-config='${JSON.stringify(swatchTileJSONConfig)}'
                            >
                                ${showColorCarousel
                                    ? '<button class="b-tile-swatches_slider_button js-swiper-button-prev m-left"></button>'
                                    : ''
                                }
                                <ul class="b-swatches_circle swiper-wrapper js-swiper-wrapper">
                                    ${colorSwatches}
                                </ul>
                                ${showColorCarousel
                                    ? '<button class="b-tile-swatches_slider_button js-swiper-button-next m-right"></button>'
                                    : ''
                                }
                            </div>
                        </div>
                        ${numColors !== 0 ? (
                                `<a href="${url}" class="b-tile-swatches_count">
                                    ${numColors > 1
                                        ? `${numColors + ' ' + getResource('searchColorsLabel')}`
                                        : `${numColors + ' ' + getResource('searchColorLabel')}`
                                    }
                                </a>`
                            ) : '<a href="" class="b-tile-swatches_count" style="min-height: 28px"></a>'
                        }
                    </div>
                    ${upperLeftFlameIcon ? `
                    <div class="b-tile-badge-emea b-flameIcon">
                        <span class="b-flameIcon-sec">
                            <img class="img-flameIcon" alt="${getResource('flameIconAlt')}" src="${getResource('flameIcon')}">
                            <span class="flameIcon-text">${product.data.badgeImage}</span>
                        </span>
                    </div>
                    ` : '' }
                    ${!upperLeftFlameIcon && badge ? `<div class="b-tile-badge-emea hide-top_left_badge">${badge}</div>` : ''}
                    <a class="b-tile-name" href="${url}">
                        <h3>
                            ${product.value}
                        </h3>
                    </a>
                    <div class="b-price">
                        ${productPrice}
                    </div>
                </div>
                <div class="plp-outofstock">${ product.data.preorderable ? product.data.preorderMessage.tileMessage : '' }</div>
                <div class="plp-outofstock">${ !isOrderable && !comingSoon ? ('<span>' + getResource('soldOut') + '</span>') : '' }</div>
                <div class="plp-outofstock">${ !isOrderable && comingSoon ? `<span>${product.data.comingSoonMessage || getResource('buttonComingsoon')}</span>` : '' }</div>
                <div class="b-product_promo b-promo-tooltip-information">
                ${hasPromo ? getProductPromotion(product.data.promotions) : ''}
                </div>
            </div>
        </div>
    `;
};

/**
 * Converts an array of products into a string of HTML tiles.
 *
 * @param {Array} products - Array of products.
 * @returns {string} HTML tiles markup.
 */
const convertProductsToTiles = (products) => {
    let tiles = '';
    products.forEach((product, index) => {
        try {
            tiles = tiles.concat(`
                <li class="b-suggestions_products-item js-item b-tile" id="product-${index}" role="option" data-analytics-track="search-suggestion" data-analytics-value="product|${product.value}">
                    ${getTileHtml(product)}
                </li>
            `);
        } catch (error) {
            // Return in case of tile data failure
            return;
        }
    });
    return tiles;
};

module.exports = {
    getTileHtml,
    convertProductsToTiles
};
