var getCustomerGroupPricing = require('*/cartridge/scripts/helpers/products/getCustomerGroupPricing');
var getDefaultColorwayId = require('*/cartridge/scripts/helpers/products/getDefaultColorwayId');
var getInventoryRecord = require('*/cartridge/scripts/helpers/products/getInventoryRecord');
var getPriceMap = require('*/cartridge/scripts/helpers/categories/getPriceMap');

var PromotionMgr = require('dw/campaign/PromotionMgr');
var CatalogMgr = require('dw/catalog/CatalogMgr');

/**
 * Returns primary hex color for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {string} the primary hex color.
 */
function getHexColor(product) {
  if ('hexcolor' in product.custom && !empty(product.custom.hexcolor)) {
    return JSON.stringify(product.custom.hexcolor.replace(/#/g, ''));
  }

  return '';
}

/**
 * Returns color way ID for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {string} The color way ID
 */
function getColorWayId(product) {
  return 'color' in product.custom && !empty(product.custom.color) ? JSON.stringify({ color: product.custom.color }) : '';
}

/**
 * Returns the color for the specified product variant.
 * @param {dw.catalog.Product} product The product.
 * @param {dw.catalog.ProductVariationAttribute} colorAttr color attributes for this product.
 * @returns {string} color attribute display value.
 */
function getColorValue(product, colorAttr) {
  if (product.master) {
    return '';
  }

  var color = product.custom.color;

  if (!empty(color) && !empty(colorAttr)) {
    var pvv = product.variationModel.getVariationValue(product, colorAttr);
    return !empty(pvv) && 'displayValue' in pvv && pvv.displayValue ? pvv.displayValue : '';
  }

  return '';
}

/**
 * Returns the default color for the specified product variant.
 * @param {dw.catalog.Product} product The product.
 * @param {dw.catalog.ProductVariationAttribute} colorAttr color attributes for this product.
 * @returns {string} default color attribute display value.
 */
function getDefaultColor(product, colorAttr) {
  if (product.master) {
    return '';
  }

  var defaultColor = '';

  if (!empty(product.custom.color)) {
    var defaultVariant = product.variationModel.getDefaultVariant();
    if (!empty(defaultVariant) && !empty(colorAttr)) {
      var color = product.variationModel.getVariationValue(defaultVariant, colorAttr);
      defaultColor = !empty(color) && 'displayValue' in color && color.displayValue ? color.displayValue : '';
    }
  }

  return defaultColor;
}

/**
 * Returns the image url for the PLP hover image for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @param {Array} sizeModelImages List of image urls for the specified product.
 * @returns {string} the image url.
 */
function getGridTileHoverImage(product, sizeModelImages) {
  if (!empty(sizeModelImages) && sizeModelImages.length) {
    return sizeModelImages[1].URL.replace(/http:/g, 'https:');
  } else if (empty(sizeModelImages) || !('length' in sizeModelImages) || ('length' in sizeModelImages && sizeModelImages.length === 0)) {
    // if fit models are NOT enabled for this site, get the grid tile hover image
    var images = product.getImages('gridTileDesktop');
    if (!empty(images) && images.length > 1) {
      return images[1].getURL().https().toString();
    }
  }

  return '';
}

/**
 * Returns secondary hex color for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {string} the secondary hex color.
 */
function getSecondaryHexColor(product) {
  if ('secondaryhexcolor' in product.custom && !empty(product.custom.secondaryhexcolor)) {
    return JSON.stringify(product.custom.secondaryhexcolor.replace(/#/g, ''));
  }

  return '';
}

/**
 * Returns exclusivity type for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {string} The exclusivity type in snake case
 */
function getExclusiveType(product) {
  if ('exclusive' in product.custom && !empty(product.custom.exclusive)) {
    return product.custom.exclusive.value.replace(/-/g, '_');
  }

  return '';
}

/**
 * Returns last part of the url path.
 * @param {string} url The url.
 * @returns {string} The last part of the url path.
 */
function getLastTokenInURLPath(url) {
  const paths = url.split('/');
  var lastTokenAndParamsStr = paths[paths.length - 1];
  var lastTokenAndParamsArr = lastTokenAndParamsStr.split('?');
  return lastTokenAndParamsArr[0];
}

/**
 * Returns if the size model image is front facing.
 * @param {string} url The image url.
 * @returns {boolean} Whether or not the size model image is front facing.
 */
function isSizeModelImageFrontFacing(url) {
  return getLastTokenInURLPath(url).indexOf('_FC') > 0;
}

/**
* Returns if the size model image is rear facing.
* @param {string} url The image url.
* @returns {boolean} Whether or not the size model image is rear facing.
*/
function isSizeModelImageRearFacing(url) {
  return getLastTokenInURLPath(url).indexOf('_BC') > 0;
}

/**
* Returns if the image is front facing.
* @param {string} url The image url.
* @returns {boolean} Whether or not the image is front facing.
*/
function isImageFrontFacing(url) {
  return getLastTokenInURLPath(url).indexOf('_LDF') > 0;
}

/**
* Returns if the image is rear facing.
* @param {string} url The image url.
* @returns {boolean} Whether or not the image is rear facing.
*/
function isImageRearFacing(url) {
  return getLastTokenInURLPath(url).indexOf('_LDB') > 0;
}

/**
 * Returns size model image urls.
 * @param {Object} data The image data.
 * @returns {string} The size model image urls.
 */
function getSizeModelImageURLs(data) {
  if (!empty(data) && 'sizeModelImages' in data && !empty(data.sizeModelImages) && data.sizeModelImages.length) {
    var imageObj = { frontImage: '', backImage: '' };
    var secondaryImageObj = {};
    var hasFront = false;
    var hasBack = false;

    for (var i = 0; i < data.sizeModelImages.length; ++i) {
      if (!hasFront || !hasBack) {
        var startIndex = data.sizeModelImages[i].URL.lastIndexOf('/') + 1;
        var endIndex = data.sizeModelImages[i].URL.indexOf('?', startIndex);
        var fileName = data.sizeModelImages[i].URL.substring(startIndex, endIndex);

        // if front-facing image for the size model, get the url
        if (!hasFront && isSizeModelImageFrontFacing(data.sizeModelImages[i].URL)) {
          imageObj.frontImage = fileName;
          hasFront = true;
        }

        // if rear-facing image for the size model, get the url
        if (!hasBack && isSizeModelImageRearFacing(data.sizeModelImages[i].URL)) {
          imageObj.backImage = fileName;
          hasBack = true;
        }

        // if front-facing image, get the url just in case we don't have the size model images
        if (!hasFront && isImageFrontFacing(data.sizeModelImages[i].URL)) {
          secondaryImageObj.frontImage = fileName;
          hasFront = true;
        }

        // if rear-facing image, get the url just in case we don't have the size model images
        if (!hasBack && isImageRearFacing(data.sizeModelImages[i].URL)) {
          secondaryImageObj.backImage = fileName;
          hasBack = true;
        }
      } else {
        break;
      }
    }

    // if no front and/or rear image available of the size model, get the front and/or rear image of the product
    if (empty(imageObj.frontImage) && 'frontImage' in secondaryImageObj) {
      imageObj.frontImage = secondaryImageObj.frontImage;
    }

    if (empty(imageObj.backImage) && 'backImage' in secondaryImageObj) {
      imageObj.backImage = secondaryImageObj.backImage;
    }

    // if image list is not empty, stringify and return it
    if (Object.keys(imageObj).length) {
      return JSON.stringify(imageObj);
    }
  }

  return '';
}

/**
 * Returns whether or not the colorway id for the passed variant product matches the default colorway id on the master product.
 * @param {dw.catalog.Product} product The product.
 * @returns {boolean} whether or not the colorway ids match.
 */
function isDefaultColorwayId(product) {
  if (!empty(product) && product.isVariant()) {
    // get default colorway id of master product
    var defaultMasterColorway = getDefaultColorwayId(product.masterProduct);

    // compare default colorway id of master product to passed variant
    return defaultMasterColorway === product.custom.color;
  }

  return false;
}

/**
 * Returns the first color in the colorway string
 *
 * @param {string} colorway The product colorway.
 * @returns {string} The first color in the colorway string.
 */
function getColorwayPrimary(colorway) {
  if (!empty(colorway) && colorway.indexOf(' / ') > 0) {
    return colorway.split(' / ')[0];
  }

  return colorway;
}

/**
 * Returns price refinement value.
 * @param {*} price The price.
 * @param {Object} product The product.
 * @returns {string} The refinement.
 */
function getPriceRefinement(price, product) {
  if (!price || price === '' || !product || product === '') {
    return '';
  }

  var entry;
  var primaryCat = product.master ? product.primaryCategory : product.masterProduct.primaryCategory;

  // get price buckets
  var map = getPriceMap(primaryCat);

  // find bucket for the passed price
  entry = map.find(item => (price >= item.valueFrom && price < item.valueTo));

  return !empty(entry) && 'displayName' in entry ? entry.displayName : '';
}

/**
 * Returns display values for the specified product and attribute.
 * @param {dw.catalog.Product} product The product.
 * @param {string} attributeName The attribute name.
 * @returns {Array} The color display values.
 */
function getDisplayValues(product, attributeName) {
  var displayValues = [];

  // get product attribute and values
  var attribute = product.variationModel.getProductVariationAttribute(attributeName);
  if (!empty(attribute)) {
    var attributeValues = product.variationModel.getAllValues(attribute);

    if (!empty(attributeValues) && attributeValues.length) {
      attributeValues = attributeValues.toArray();

      // get display value for each attribute value
      attributeValues.forEach(function (value) {
        displayValues.push(value.displayValue);
      });
    }
  }

  return displayValues;
}

/**
 * Builds a map of variant inventory quantities by size(S, M, L, XL, etc).
 * @param {dw.catalog.Product} product The product.
 * @param {Map} sizeMap The list of inventory by size.
 * @returns {Map} The color display values.
 */
function buildInventorySizeMap(product, sizeMap) {
  // get size attribute for the passed product
  var sizeAttribute = product.variationModel.getProductVariationAttribute('size');
  if (!empty(sizeAttribute)) {
    // get size value for the passed product
    var sizeValue = product.variationModel.getVariationValue(product, sizeAttribute);
    if (!empty(sizeValue)) {
      // get inventory quantity for the passed product
      var qty = !empty(product) ? getInventoryRecord(product) : 0;

      // get inventory quantity from map(if any)
      var inventoryFromMap = sizeMap.get(sizeValue.value);

      // add inventory record qty to inventory from map and save
      if (!empty(inventoryFromMap) && qty > 0) {
        sizeMap.set(sizeValue.value, qty + inventoryFromMap);
      } else {
        sizeMap.set(sizeValue.value, qty);
      }
    }
  }

  return sizeMap;
}

/**
 * Builds a map for promo pricing by customer group for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @param {Array} variantPrices The list of promo prices by customer group.
 * @returns {Object} The customer group pricing.
 */
function buildCustomerGroupPromoPriceMap(product, variantPrices) {
  // get all active product promos applicable to the passed product
  var promos = PromotionMgr.getActivePromotions().getProductPromotions(product);

  // get list of prices for each customer group in each of the promos
  var prices = getCustomerGroupPricing(product, promos, false);
  prices.forEach(function (price) {
    if (!empty(price)) {
      // add customer group and price to the list if they are not in the list already
      if (variantPrices.findIndex(item => (item.key === price.key && item.value === price.value)) < 0) {
        variantPrices.push(price);
      }
    }
  });

  return variantPrices;
}

/**
 * Formats the customer group promo pricing list.
 * @param {Array} originalPrices The raw list of promo prices by customer group.
 * @returns {Object} The formatted group pricing list.
 */
function formatGroupPromoPricing(originalPrices) {
  var prices = {};

  if (!empty(originalPrices) && originalPrices.length) {
    originalPrices.forEach((originalPrice) => {
      if (!prices[originalPrice.key]) {
        // add customer group, min and max prices to the new list if not already present
        prices[originalPrice.key] = { min: originalPrice.value, max: originalPrice.value };
      } else {
        // update min price if price for the matching customer group < current price
        if (originalPrice.value < prices[originalPrice.key].min) {
          prices[originalPrice.key].min = originalPrice.value;
        }

        // update max price if price for the matching customer group > current price
        if (originalPrice.value > prices[originalPrice.key].max) {
          prices[originalPrice.key].max = originalPrice.value;
        }
      }
    });
  }

  return prices;
}

/**
 * Returns data for online variants.
 * @param {dw.catalog.Product} product The product.
 * @param {Object} data Supplemental product data.
 * @returns {Object|string} The variation data.
 */
function getVariantData(product, data) {
  if (product.variant) {
    return '';
  }

  // get variant data from shared variation attributes
  var variantData = {};
  var colors = [];
  var sizes = [];

  // list of variant colors
  colors = getDisplayValues(product, 'color');
  if (!empty(colors) && colors.length) {
    variantData.colors = colors.join(',');
  }

  // list of variant sizes(S, M, L, XL, etc)
  sizes = getDisplayValues(product, 'size');
  if (!empty(sizes) && sizes.length) {
    variantData.sizes = sizes.join(',');
  }

  // get variant data NOT from shared variation attributes
  var skus = [];
  var upcs = [];
  var sizeMap = new Map();
  var variants = product.getVariants();
  var variantPrices = [];

  if (!empty(variants) && variants.length) {
    variants = variants.toArray();

    variants.forEach(function (variant) {
      if (variant.onlineFlag) {
        // for each variant, add the sku
        skus.push(variant.custom.sku);

        // for each variant, add the upc(product id)
        upcs.push(variant.ID);

        // for each size(S, M, L, XL, etc), add up the inventory
        sizeMap = buildInventorySizeMap(variant, sizeMap);

        // for each variant, add customer group pricing for promos
        if (data.promoPricingEnabled) {
          variantPrices = buildCustomerGroupPromoPriceMap(variant, variantPrices);
        }
      }
    });
  }

  // list of variant skus
  if (!empty(skus) && skus.length) {
    variantData.skus = JSON.stringify(skus);
  }

  // list of variant upcs(product ids)
  if (!empty(upcs) && upcs.length) {
    variantData.upcs = JSON.stringify(upcs);
  }

  // list of inventory quantities for each variant
  if (!empty(sizeMap) && sizeMap.size > 0) {
    var sizeArray = Array.from(sizeMap.values());
    variantData.qtys = sizeArray.join(',');
  }

  // list of min/max prices for each variant by customer group(if they have at least one active promo)
  if (data.promoPricingEnabled && !empty(variantPrices) && variantPrices.length) {
    variantData.customerGroupPricing = JSON.stringify(formatGroupPromoPricing(Array.from(variantPrices)));
  }

  return variantData;
}

/**
 * Returns the model image url for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {string} model image url.
 */
function getOnModelImage(product) {
  var prodImages = product.getImages('onmodelImage');
  var onmodelImageUrl = '';

  if (prodImages.size() > 0) {
    onmodelImageUrl = encodeURI(prodImages[0].httpsURL.toString());
    onmodelImageUrl = onmodelImageUrl.replace(/,/g, '%2C');
  }
  return onmodelImageUrl;
}

/**
 * Returns classification category of a product if the classification category
 * is from current storefront catalog.
 * @param {dw.catalog.Product} product Product instance to get category from
 * @returns {(dw.catalog.Category|null)} classification category of the product
 */
function getClassificationCategory(product) {
  var classificationCategory = product.getClassificationCategory();
  var currentSiteCatalogCategory = null;

  if (empty(classificationCategory)) {
    return null;
  }

  currentSiteCatalogCategory = CatalogMgr.getCategory(classificationCategory.ID);

  if (empty(currentSiteCatalogCategory)) {
    return null;
  }

  // Comparing object's UUID to identify that they are belong to the same catalog
  if (classificationCategory.UUID !== currentSiteCatalogCategory.UUID) {
    classificationCategory = null;
  }

  return classificationCategory;
}

/**
 * Returns category of a product from current storefront catalog.
 * @param {dw.catalog.Product} product Product instance to get category from
 * @param {dw.catalog.Category|null} primaryCategory category
 * @returns {(dw.catalog.Category|null)} Category of the product
 */
function getProductCategory(product, primaryCategory) {
  var category = getClassificationCategory(product);

  if (!empty(category)) {
    return category;
  }

  category = primaryCategory;

  if (empty(category)) {
    var categories = product.getCategories();

    if (categories.size() > 0) {
      category = categories[0];
    }
  }

  return category;
}

/**
 * Returns the path for the specified category.
 * @param {dw.catalog.Product} product The product.
 * @param {dw.catalog.Category} primaryCategory category.
 * @returns {string} The category path.
 */
function getCategoryPath(product, primaryCategory) {
  var catOutput = [];
  var cat = getProductCategory(product, primaryCategory);

  if (!empty(cat)) {
    while (cat.ID !== 'root') {
      catOutput.push(cat.displayName);
      cat = cat.parent;
      if (empty(cat)) {
        return '';
      }
    }

    return catOutput.reverse().join(' > ');
  }

  return '';
}

/**
 * Returns the care instructions for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {string} the care instructions.
 */
function getFitCare(product) {
  var fitCareDes = 'fitCare' in product.custom ? product.custom.fitCare : null;
  var fitCareResult = '';

  if (fitCareDes) {
    fitCareDes.forEach(function (fitCare) {
      fitCareResult += fitCare + '|';
    });
  }

  fitCareResult = !empty(fitCareResult) && fitCareResult ? fitCareResult.substring(0, fitCareResult.length - 1) : fitCareResult;
  return fitCareResult;
}

/**
 * Returns the active promotions for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {string|null} the JSON list of promotions.
 */
function getPromotions(product) {
  if (!empty(product) && product) {
    // get active promos for the passed product
    var productPromotions = PromotionMgr.getActivePromotions().getProductPromotions(product);

    var promos = [];
    if (!empty(productPromotions) && productPromotions.length) {
      // convert promo collection to array
      productPromotions = productPromotions.toArray();

      for (var i = 0; i < productPromotions.length; i++) {
        if (!productPromotions[i].basedOnCoupons) {
          var promo = {};

          // get promo id
          promo.id = productPromotions[i].ID;

          // get promo messages
          if (!empty(productPromotions[i].calloutMsg) && productPromotions[i].calloutMsg) {
            promo.callOut = productPromotions[i].calloutMsg.source;
          }
          if (!empty(productPromotions[i].details) && productPromotions[i].details) {
            promo.toolTipText = productPromotions[i].details.source;
          }

          // get promo dates
          if (!empty(productPromotions[i].startDate) && productPromotions[i].startDate) {
            promo.startDate = productPromotions[i].startDate;
          }
          if (!empty(productPromotions[i].endDate) && productPromotions[i].endDate) {
            promo.endDate = productPromotions[i].endDate;
          }

          // get promo rank
          if (!empty(productPromotions[i].rank) && productPromotions[i].rank) {
            promo.rank = productPromotions[i].rank;
          }

          // get customer groups promo applies to
          var customerGroups = productPromotions[i].getCustomerGroups();
          if (!empty(customerGroups) && customerGroups.length) {
            customerGroups = customerGroups.toArray();

            // initialize promo.customerGroups and fill it with the ids in customerGroups
            promo.customerGroups = customerGroups.map(function (obj) {
              return obj.ID;
            }, []);
          }

          promos.push(promo);
        }
      }
    }

    if (!empty(promos) && promos.length) {
      return JSON.stringify(promos);
    }
  }

  return null;
}

/**
 * Returns flame icon badge shown in the upper left corner of the image for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {string} The flame icon badge
 */
function getTileUpperLeftFlameIconBadge(product) {
  if ('productTileUpperLeftFlameIconBadge' in product.custom && !empty(product.custom.productTileUpperLeftFlameIconBadge)) {
    return product.custom.productTileUpperLeftFlameIconBadge.toString();
  }

  return '';
}

/**
 * Returns the count of color chips for the specified product.
 * @param {string} id The product id.
 * @returns {number} the count of color chips.
 */
function getSwatchCount(id) {
  if (!empty(id)) {
    var ProductFactory = require('*/cartridge/scripts/factories/product');

    var params = { pid: id, swatches: true };
    var factoryProduct = ProductFactory.get(params);
    var swatches = !empty(factoryProduct) && 'swatches' in factoryProduct && !empty(factoryProduct.swatches) ? factoryProduct.swatches : '';

    if (!empty(swatches) && 'count' in swatches && !empty(swatches.count)) {
      return swatches.count;
    }
  }

  return 0;
}

/**
 * Returns the currency code for the product and price model.
 * @param {dw.catalog.ProductPriceModel} priceModel price model.
 * @returns {string} The currency code.
 */
function getPriceCurrency(priceModel) {
  var currencyCode = '';
  if (priceModel.isPriceRange()) {
    currencyCode = priceModel.getMaxPrice().getCurrencyCode();
  } else {
    currencyCode = priceModel.getPrice().getCurrencyCode();
  }
  if (currencyCode === 'N/A' && !priceModel.getPrice().available) {
    currencyCode = priceModel.getMaxPrice().getCurrencyCode();
  }

  return currencyCode;
}

/**
 * Returns the video url for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {string} the video url.
 */
function getVideoMaterials(product) {
  var videoURL = '';

  if (!product.master) {
    var videoMaterial = require('*/cartridge/models/product/decorators/videoMaterial');

    var videoModel = {};
    videoMaterial(videoModel, product);
    videoURL = videoModel.video360Material && videoModel.video360Material.length &&
        videoModel.video360Material[0] && videoModel.video360Material[0].video_url_mp4 ?
        videoModel.video360Material[0].video_url_mp4 : '';
  }

  return videoURL;
}

module.exports = {
  getTileUpperLeftFlameIconBadge: getTileUpperLeftFlameIconBadge,
  getGridTileHoverImage: getGridTileHoverImage,
  getSizeModelImageURLs: getSizeModelImageURLs,
  getSecondaryHexColor: getSecondaryHexColor,
  isDefaultColorwayId: isDefaultColorwayId,
  getColorwayPrimary: getColorwayPrimary,
  getPriceRefinement: getPriceRefinement,
  getVideoMaterials: getVideoMaterials,
  getExclusiveType: getExclusiveType,
  getPriceCurrency: getPriceCurrency,
  getCategoryPath: getCategoryPath,
  getDefaultColor: getDefaultColor,
  getOnModelImage: getOnModelImage,
  getVariantData: getVariantData,
  getSwatchCount: getSwatchCount,
  getColorWayId: getColorWayId,
  getColorValue: getColorValue,
  getPromotions: getPromotions,
  getHexColor: getHexColor,
  getFitCare: getFitCare
};
