'use strict';
var ProductHelper = require('~/cartridge/scripts/helpers/ProductHelper');
var decorators = require('*/cartridge/models/product/decorators/index');


/**
 * Decorate product with full product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 * @property {dw.catalog.ProductVarationModel} options.variationModel - Variation model returned by the API
 * @property {Object} options.options - Options provided on the query string
 * @property {dw.catalog.ProductOptionModel} options.optionModel - Options model returned by the API
 * @property {dw.util.Collection} options.promotions - Active promotions for a given product
 * @property {number} options.quantity - Current selected quantity
 * @property {Object} options.variables - Variables passed in on the query string
 * @param {boolean} exchangeOrderItem - trigger custom hasOrderableVariants
 * @param {Object} exchangeVariationModel - exchange items variation model
 *
 * @returns {Object} - Decorated product model
 */
module.exports = function fullProduct(product, apiProduct, options, exchangeOrderItem, exchangeVariationModel) {
    decorators.base(product, apiProduct, options.productType);
    decorators.price(product, apiProduct, options.promotions, false, options.optionModel);
    if (options.variationModel) {
        decorators.images(product, options.variationModel, { types: ['pdpMainDesktop', 'pdpMainMobile', 'pdpZoomDesktop'], quantity: 'all' }, options.viewPreference);
        decorators.fitModelImagesAvailability(product, options.variationModel);
    } else {
        decorators.images(product, apiProduct, { types: ['pdpMainDesktop', 'pdpMainMobile', 'pdpZoomDesktop'], quantity: 'all' }, options.viewPreference);
        decorators.fitModelImagesAvailability(product, apiProduct);
    }
    decorators.videoMaterial(product, apiProduct, options.variables);

    var productSearchHit = ProductHelper.getProductSearchHit(apiProduct);
    decorators.tileSwatches(product, productSearchHit);
    decorators.badges(product, apiProduct);

    decorators.quantity(product, apiProduct, options.quantity);
    decorators.variationAttributes(product, options.variationModel, {
        attributes: '*',
        endPoint: 'Variation'
    }, productSearchHit, exchangeOrderItem, exchangeVariationModel, options.viewPreference);
    decorators.description(product, apiProduct);
    decorators.ratings(product);
    decorators.promotions(product, options.promotions);
    decorators.attributes(product, apiProduct.attributeModel);
    decorators.customAttributes(product, apiProduct, options);
    decorators.availability(product, options.quantity, apiProduct.minOrderQuantity.value, apiProduct.availabilityModel);
    decorators.options(product, options.optionModel, options.variables, options.quantity);
    // Updating the parameter of qtySelector decorator, as this is required for fetching the qty for Employee and regular customer.
    // We need to make this change for bonusProduct and productBundle model by over riding the scripts from base to include this change.
    // Not committing now because we don't have this as of 04/02 to validate the change.
    decorators.quantitySelector(product, apiProduct, apiProduct.stepQuantity.value, options.variables, options.options, options.PDPSelectedPID);

    if (apiProduct.custom.sizeChartID) {
        decorators.sizeChart(product, apiProduct.custom.sizeChartID);
    } else {
        var category = apiProduct.getClassificationCategory();
        if (!category && (options.productType === 'variant' || options.productType === 'variationGroup')) {
            category = apiProduct.getMasterProduct().getClassificationCategory();
        }
        if (!empty(category) && category.custom && category.custom.sizeChartID === null) {
            category = apiProduct.getPrimaryCategory();
            if (!category && (options.productType === 'variant' || options.productType === 'variationGroup')) {
                category = apiProduct.getMasterProduct().getPrimaryCategory();
            }
        }
        if (!category) {
            category = apiProduct.getPrimaryCategory();
            if (!category && (options.productType === 'variant' || options.productType === 'variationGroup')) {
                category = apiProduct.getMasterProduct().getPrimaryCategory();
            }
        }
        if (category) {
            decorators.sizeChart(product, category.custom.sizeChartID);
        }
    }

    decorators.currentUrl(product, options.variationModel, options.optionModel, 'Product-Show', apiProduct.ID, options.quantity);
    decorators.readyToOrder(product, options.variationModel);
    decorators.online(product, apiProduct);
    decorators.raw(product, apiProduct);
    decorators.pageMetaData(product, apiProduct);
    decorators.template(product, apiProduct);
    decorators.inStorePickup(product, apiProduct, options.variationModel);
    decorators.employeeShowTerms(product, apiProduct);
    return product;
};
