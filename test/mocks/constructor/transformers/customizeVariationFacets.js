'use strict';

var productHelper = require('../../../mocks/constructor/custom/productHelper');
var facetHelper = require('../../../mocks/constructor/custom/facetHelper');
var config = require('../../../mocks/constructor/helpers/config');

function getVariationFacets(product, data) {
    var listPrice = product.priceModel.getPriceBookPrice(config.configKeys.CUSTOM_LIST_PRICEBOOK_NAME).value;

    var facets = [
        {
            key: 'price',
            value: facetHelper.getPriceRefinement(listPrice, product)
        },
        {
            key: 'currentHealth',
            value: data.inventory
        },
        {
            key: 'orderable',
            value: data.orderable
        },
        {
            key: 'hideColorWay',
            value: data.hideColorWay
        },
        {
            key: 'colorwayPrimary',
            value: productHelper.getColorwayPrimary(product.custom.colorway)
        },
        {
            key: 'giftsByPrice',
            value: data.inGiftsCategory ? data.minSalePrice : ''
        }
    ];

    // add customer group pricing for promos to facets
    if (data.promoPricingEnabled) {
        var customerGroupPricing = productHelper.getCustomerGroupPricing(product, data.promos, true);
        facets.push.apply(facets, Array.from(customerGroupPricing));
    }

    // add simple product attribute values to facets
    facets.push.apply(facets, Array.from(data.variationFacets));

    // add search refinement values to facets
    facets.push.apply(facets, Array.from(data.searchRefinements));

    return facets;
}

module.exports.getVariationFacets = getVariationFacets;
