'use strict';

/**
 * Get product schema information
 * @param {Object} product - Product Object
 *
 * @returns {Object} - Product Schema object
 */
function getProductSchema(product) {
    // var ProductMgr = require('dw/catalog/ProductMgr');

    var productType = product.productType;
    // var apiProduct = (productType !== 'master') ? ProductMgr.getProduct(product.custom.style) : product;
    var productID = (productType !== 'master') && (product.custom && product.custom.masterID) ? product.custom.masterID : product.id;

    var schema = {
        '@context': 'http://schema.org/',
        '@type': 'Product',
        '@id': require('dw/web/URLUtils').http('Product-Show', 'pid', productID).toString(),
        productID: productID,
        name: product.productName,
        description: !empty(product.custom.whatsItDo) ? product.custom.whatsItDo.toString() : '',
        url: require('dw/web/URLUtils').http('Product-Show', 'pid', productID).toString(),
        mpn: productID
    };
    if (productType !== 'master') {
        schema.sku = product.custom.sku;
    }

    schema.brand = {
        '@type': 'Brand',
        name: 'UnderArmour'
    };

    if (product.images && product.images.pdpMainDesktop) {
        schema.image = [];
        product.images.pdpMainDesktop.forEach(function (image) {
            schema.image.push(image.absURL);
        });
    }
    if (product.price) {
        schema.offers = {
            url: require('dw/web/URLUtils').abs('Product-Show', 'pid', productID).toString()
        };
        if (product.price.type === 'range') {
            schema.offers['@type'] = 'AggregateOffer';
            schema.offers.priceCurrency = product.price.currency;
            schema.offers.lowprice = product.price.min;
            schema.offers.highprice = product.price.max;
        } else {
            schema.offers['@type'] = 'Offer';
            if (product.price.sales) {
                schema.offers.priceCurrency = product.price.sales.currency;
                schema.offers.price = product.price.sales.decimalPrice;
            } else if (product.price.list) {
                schema.offers.priceCurrency = product.price.list.currency;
                schema.offers.price = product.price.list.decimalPrice;
            }
        }
        schema.offers.availability = 'http://schema.org/InStock';
        if (product.available) {
            if (product.availability && product.availability.messages[0] === require('dw/web/Resource').msg('label.preorder', 'common', null)) {
                schema.offers.availability = 'http://schema.org/PreOrder';
            }
        } else {
            schema.offers.availability = 'http://schema.org/OutOfStock';
        }
    }

    // commenting the below block as it introduces duplicate reference to aggregateRating
    /*
    if ('bvAverageRating' in apiProduct.custom && 'bvReviewCount' in apiProduct.custom) {
        schema.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: apiProduct.custom.bvAverageRating ? Number(apiProduct.custom.bvAverageRating).toFixed(1) : '',
            reviewCount: apiProduct.custom.bvReviewCount ? apiProduct.custom.bvReviewCount : ''
        };
    }
    */
    return schema;
}

/**
 * Get product listing page schema information
 * @param {List} productIds - Product Ids
 *
 * @returns {Object} - Listing Schema object
 */
function getListingPageSchema(productIds) {
    var schema = {
        '@context': 'http://schema.org/',
        '@type': 'ItemList',
        itemListElement: []
    };
    Object.keys(productIds).forEach(function (item) {
        var productID = productIds[item].productID;
        schema.itemListElement.push({
            '@type': 'ListItem',
            position: Number(item) + 1,
            url: require('dw/web/URLUtils').abs('Product-Show', 'pid', productID).toString()
        });
    });
    return schema;
}

/**
 * Get homepage schema information
 *
 * @returns {Object} - Listing Schema object
 */
function getHomePageSchema() {
    var homeUrl = require('dw/web/URLUtils').abs('Home-Show').toString();
    var searchUrl = homeUrl + 'search?q={search_term_string}';
    var schema = {
        '@context': 'http://schema.org',
        '@type': 'WebSite',
        url: homeUrl
    };
    schema.potentialAction = {
        '@type': 'SearchAction',
        'query-input': 'required name=search_term_string'
    };
    schema.potentialAction.target = {
        '@type': 'EntryPoint',
        urlTemplate: searchUrl
    };
    return schema;
}

/**
 * function to get breadcrumbs schema
 *
 * @param {dw/util/Collection} breadCrumbs - breadcrumb collection
 * @returns {Object} schema - breadcrumb schema object
 */
function getBreadCrumbsSchema(breadCrumbs) {
    var schema = {
        '@context': 'http://schema.org/',
        '@type': 'BreadcrumbList',
        itemListElement: []
    };
    var URL = require('dw/web/URL');
    if (breadCrumbs) {
        var index = 1;
        var collections = require('*/cartridge/scripts/util/collections');
        collections.forEach(breadCrumbs, function (item) {
            if (!item.hide) {
                var itemURL = item.url instanceof URL ? item.url.abs().toString() : item.url;
                schema.itemListElement.push({
                    '@type': 'ListItem',
                    position: index,
                    name: item.htmlValue,
                    item: itemURL
                });
                index++;
            }
        });
    }
    return schema;
}

module.exports = {
    getProductSchema: getProductSchema,
    getListingPageSchema: getListingPageSchema,
    getHomePageSchema: getHomePageSchema,
    getBreadCrumbsSchema: getBreadCrumbsSchema
};
