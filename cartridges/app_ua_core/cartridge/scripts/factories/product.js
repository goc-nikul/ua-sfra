'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var PromotionMgr = require('dw/campaign/PromotionMgr');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var productTile = require('*/cartridge/models/product/productTile');
var bonusProduct = require('*/cartridge/models/product/bonusProduct');
var fullProduct = require('*/cartridge/models/product/fullProduct');
var productSet = require('*/cartridge/models/product/productSet');
var productBundle = require('*/cartridge/models/product/productBundle');
var productLineItem = require('*/cartridge/models/productLineItem/productLineItem');
var bonusProductLineItem = require('*/cartridge/models/productLineItem/bonusProductLineItem');
var bundleProductLineItem = require('*/cartridge/models/productLineItem/bundleLineItem');
var orderLineItem = require('*/cartridge/models/productLineItem/orderLineItem');
var bonusOrderLineItem = require('*/cartridge/models/productLineItem/bonusOrderLineItem');
var bundleOrderLineItem = require('*/cartridge/models/productLineItem/bundleOrderLineItem');

module.exports = {
    get: function (params) {
        var productId = params.pid;
        var exchangeOrderItem = false;
        var exchangeVariationModel = '';
        if (params && params.exchangeItem === 'true') {
            exchangeOrderItem = true;
            if (params && params.exchangeVariationModel) {
                exchangeVariationModel = params.exchangeVariationModel;
            }
        }
        var product = Object.create(null);
        var apiProduct = ProductMgr.getProduct(productId);
        if (apiProduct === null) {
            return product;
        }
        var productType = productHelper.getProductType(apiProduct);
        var options = null;
        var promotions;

        switch (params.pview) {
            case 'tile':
                var productSearchHit = productHelper.getProductSearchHit(apiProduct);
                if (productSearchHit) {
                    promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(apiProduct);
                    options = {
                        promotions: promotions,
                        experienceType: params.experienceType,
                        outletColors: (params.swatches && params.experienceType) ? apiProduct.custom.outletColors : '',
                        viewPreference:	'viewPreference' in params ? params.viewPreference : '',
                        isFilterByTeam: 'team' in params && !empty(params.team) && 'breadCrumbLast' in params && !empty(params.breadCrumbLast) ? true : false, // eslint-disable-line no-unneeded-ternary
                        team: 'team' in params && !empty(params.team) ? params.team : ''
                    };
                    product = productTile(product, apiProduct, productType, options);
                }
                break;
            case 'bonusProductLineItem':
                promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(apiProduct);
                options = {
                    promotions: promotions,
                    quantity: params.quantity,
                    variables: params.variables,
                    lineItem: params.lineItem,
                    productType: productType
                };

                switch (productType) {
                    case 'bundle':
                        // product = bundleProductLineItem(product, apiProduct, options, this);
                        break;
                    default:
                        var variationsBundle = productHelper.getVariationModel(apiProduct, params.variables);
                        if (variationsBundle) {
                            apiProduct = variationsBundle.getSelectedVariant() || apiProduct; // eslint-disable-line
                        }

                        var optionModelBundle = apiProduct.optionModel;
                        var optionLineItemsBundle = params.lineItem.optionProductLineItems;
                        var currentOptionModelBundle = productHelper.getCurrentOptionModel(
                            optionModelBundle,
                            productHelper.getLineItemOptions(optionLineItemsBundle, productId)
                        );
                        var lineItemOptionsBundle = optionLineItemsBundle.length
                            ? productHelper.getLineItemOptionNames(optionLineItemsBundle)
                            : productHelper.getDefaultOptions(optionModelBundle, optionModelBundle.options);


                        options.variationModel = variationsBundle;
                        options.lineItemOptions = lineItemOptionsBundle;
                        options.currentOptionModel = currentOptionModelBundle;

                        if (params.containerView === 'order') {
                            product = bonusOrderLineItem(product, apiProduct, options);
                        } else {
                            product = bonusProductLineItem(product, apiProduct, options);
                        }

                        break;
                }

                break;
            case 'productLineItem':
                promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(apiProduct);
                options = {
                    promotions: promotions,
                    quantity: params.quantity,
                    variables: params.variables,
                    lineItem: params.lineItem,
                    productType: productType
                };

                switch (productType) {
                    case 'bundle':

                        if (params.containerView === 'order') {
                            product = bundleOrderLineItem(product, apiProduct, options, this);
                        } else {
                            product = bundleProductLineItem(product, apiProduct, options, this);
                        }
                        break;
                    default:
                        var variationsPLI = productHelper.getVariationModel(apiProduct, params.variables);
                        if (variationsPLI) {
                            apiProduct = variationsPLI.getSelectedVariant() || apiProduct; // eslint-disable-line
                        }

                        var optionModelPLI = apiProduct.optionModel;
                        var optionLineItemsPLI = params.lineItem.optionProductLineItems;
                        var currentOptionModelPLI = productHelper.getCurrentOptionModel(
                            optionModelPLI,
                            productHelper.getLineItemOptions(optionLineItemsPLI, productId)
                        );
                        var lineItemOptionsPLI = optionLineItemsPLI.length
                            ? productHelper.getLineItemOptionNames(optionLineItemsPLI)
                            : productHelper.getDefaultOptions(optionModelPLI, optionModelPLI.options);


                        options.variationModel = variationsPLI;
                        options.lineItemOptions = lineItemOptionsPLI;
                        options.currentOptionModel = currentOptionModelPLI;

                        if (params.containerView === 'order') {
                            product = orderLineItem(product, apiProduct, options);
                        } else {
                            product = productLineItem(product, apiProduct, options);
                        }

                        break;
                }

                break;
            case 'bonus':
                options = productHelper.getConfig(apiProduct, params);
                options.viewPreference = 'viewPreference' in params ? params.viewPreference : '';
                switch (productType) {
                    case 'set':
                        break;
                    case 'bundle':
                        break;
                    default:
                        product = bonusProduct(product, options.apiProduct, options, params.duuid, exchangeOrderItem, exchangeVariationModel);
                        break;
                }

                break;
            default: // PDP
                options = productHelper.getConfig(apiProduct, params);
               // add viewPref in option obj
                options.viewPreference = 'viewPreference' in params ? params.viewPreference : '';
                switch (productType) {
                    case 'set':
                        product = productSet(product, options.apiProduct, options, this);
                        break;
                    case 'bundle':
                        product = productBundle(product, options.apiProduct, options, this);
                        break;
                    default:
                        if (!exchangeOrderItem && params.variantColor && (empty(options.variationModel.selectedVariant) || options.variationModel.selectedVariant.variationModel.getImages('pdpMainDesktop').toArray().length === 0)) {
                            var ATTRIBUTE_NAME = 'color';
                            var LENGTH_ATTRIBUTE_NAME = 'length';
                            var SIZE_ATTRIBUTE_NAME = 'size';
                            if (options.apiProduct.variant) {
                                apiProduct = options.apiProduct.getVariationModel().getMaster();
                            }
                            var variationModel = apiProduct.getVariationModel();
                            variationModel.setSelectedAttributeValue(ATTRIBUTE_NAME, params.variantColor);
                            if (params.variantLength != null) {
                                variationModel.setSelectedAttributeValue(LENGTH_ATTRIBUTE_NAME, params.variantLength);
                            }
                            if (params.variantSize != null) {
                                variationModel.setSelectedAttributeValue(SIZE_ATTRIBUTE_NAME, params.variantSize);
                            }
                            options.PDPSelectedPID = params.PDPSelectedPID;
                            options.variationModel = variationModel;
                            if (variationModel.getImages('pdpMainDesktop') && variationModel.getImages('pdpMainDesktop').toArray().length === 0) {
                                var desktopImages = [];
                                var hit = productHelper.getProductSearchHit(apiProduct);
                                if (hit) {
                                    var colorVariationValues = hit.getRepresentedVariationValues(ATTRIBUTE_NAME);
                                    for (var m = 0; m < colorVariationValues.size(); ++m) {
                                        var HashMap = require('dw/util/HashMap');
                                        var variationMap = new HashMap();
                                        variationMap.put(ATTRIBUTE_NAME, colorVariationValues.get(m).ID);
                                        var variants = variationModel.getVariants(variationMap);
                                        variationModel.setSelectedAttributeValue(ATTRIBUTE_NAME, colorVariationValues.get(m).ID);
                                        for (var i = 0; i < variants.length; i++) {
                                            if (variationModel.getImages('pdpMainDesktop').toArray().length === 0) {
                                                break;
                                            } else if (variants[i].onlineFlag && variants[i].availabilityModel.availability !== 0 && variants[i].availabilityModel.orderable) {
                                                desktopImages = variationModel.getImages('pdpMainDesktop').toArray();
                                                if (desktopImages.length > 0) {
                                                    options.apiProduct = variants[i];
                                                    if ('variables' in options && 'color' in options.variables && 'size' in options.variables) {
                                                        options.variationModel = variants[i].getVariationModel();
                                                    } else {
                                                        options.variationModel = variationModel;
                                                    }
                                                    options.colorAttrSelection.color = colorVariationValues.get(m).ID;
                                                    options.colorAttrSelection.colorway = variants[i].custom.colorway;
                                                    break;
                                                }
                                            }
                                        }
                                        if (desktopImages.length > 0) {
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        product = fullProduct(product, options.apiProduct, options, exchangeOrderItem, exchangeVariationModel);
                        break;
                }
        }

        return product;
    }
};
