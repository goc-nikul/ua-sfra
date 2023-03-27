'use strict';

var VariationAttributesModel = require('*/cartridge/models/product/productAttributes');

module.exports = function (object, variationModel, config, productSearchHit, exchangeOrderItem, exchangeVariationModel, fitModelPreference) {
    Object.defineProperty(object, 'variationAttributes', {
        enumerable: true,
        value: variationModel
            ? (new VariationAttributesModel(
                variationModel,
                config,
                config.selectedOptionsQueryParams,
                object.selectedQuantity,
                exchangeOrderItem,
                exchangeVariationModel, fitModelPreference)).slice(0)
            : null
    });
};
