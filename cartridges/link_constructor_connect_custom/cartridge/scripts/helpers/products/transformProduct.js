/**
 * Getters
 */
var getSimpleProductAttributeList = require('*/cartridge/scripts/helpers/products/getSimpleProductAttributeList');
var getMetadataForVariation = require('*/cartridge/scripts/helpers/products/getMetadataForVariation');
var getFacetsForVariation = require('*/cartridge/scripts/helpers/products/getFacetsForVariation');
var getAttributeValuesMap = require('*/cartridge/scripts/helpers/products/getAttributeValuesMap');
var getDefaultColorwayId = require('*/cartridge/scripts/helpers/products/getDefaultColorwayId');
var getPrepAttributeData = require('*/cartridge/scripts/helpers/products/getPrepAttributeData');
var getPreorderMessages = require('*/cartridge/scripts/helpers/products/getPreorderMessages');
var getSizeModelImages = require('*/cartridge/scripts/helpers/products/getSizeModelImages');
var getInventoryRecord = require('*/cartridge/scripts/helpers/products/getInventoryRecord');
var getProductMetadata = require('*/cartridge/scripts/helpers/products/getProductMetadata');
var getProductFacets = require('*/cartridge/scripts/helpers/products/getProductFacets');
var getSortOptions = require('*/cartridge/scripts/helpers/products/getSortOptions');
var getDescription = require('*/cartridge/scripts/helpers/products/getDescription');
var getCategories = require('*/cartridge/scripts/helpers/products/getCategories');
var getProductId = require('*/cartridge/scripts/helpers/products/getProductId');
var getParentId = require('*/cartridge/scripts/helpers/products/getParentId');
var getUrl = require('*/cartridge/scripts/helpers/products/getUrl');

/**
 * Setters
 */
var setDiscountPercentageRange = require('*/cartridge/scripts/helpers/products/setDiscountPercentageRange');

/**
 * Helpers
 */
var giftCategoryChecker = require('*/cartridge/scripts/helpers/products/giftCategoryChecker');
var priceHelper = require('*/cartridge/scripts/helpers/products/priceHelper');

/**
 * SFCC API
 */
var PromotionMgr = require('dw/campaign/PromotionMgr');

/**
 * Transforms a product into the format expected by Constructor.
 *
 * @param {dw.catalog.Product} product The product.
 * @param {object} data The data computed by the reader.
 * @returns {object} The transformed data.
 */
module.exports = function transformProduct(product, _data) {
  var data = _data || {};

  /**
   * Custom Data fields.
   */
  data.promos = PromotionMgr.getActivePromotions().getProductPromotions(product);
  data.searchRefinements = getAttributeValuesMap(product);
  data.sortOptions = getSortOptions(product);
  data.defaultColorwayId = getDefaultColorwayId(product);
  data.preorderMessages = getPreorderMessages(product);
  data.attributeList = getSimpleProductAttributeList();
  data.promoPricingEnabled = _data.promoPricingEnabled || false;

  var result = {
    /**
     * ID fields. These are required for the integration to work.
     * You should not remove these.
     */
    uuid: product.UUID,
    id: getProductId(product),

    /**
     * Hierarchy fields. These are optional, but you need to fill them if you want the cartridge
     * to import your product hierarchy as items and variations in Constructor.
     *
     * In short, if `item_id` is null, the product will be imported as an item.
     * If `item_id` is not null, the product will be imported as a variation.
     *
     * Note that to import a variation, you need to have the item with the same id in the payload.
     * Note that the `item_id` should always point to another existing `id` field.
     */
    item_id: getParentId(product),

    /**
     * Data fields. These are optional, but you should keep them if you
     * want to ingest those pieces of data using the cartridge.
     */
    url: getUrl(product),
    item_name: product.name || product.ID || product.UUID,
    group_ids: getCategories(product),
    description: getDescription(product),
    active: product.online,
    image_url: _data.imageData && _data.imageData.url ? _data.imageData.url : null
  };

  if (result.item_id) {
    /**
     * Inventory fields.
     */
    data.inventory = getInventoryRecord(product);
    data.orderable = product.availabilityModel.isInStock();
    data.hideColorWay = typeof data.orderable === 'boolean' ? !data.orderable : null;

    /**
     * Price fields.
     */
    data.listPrice = product.priceModel.getPriceBookPrice(_data.listPriceBookID).value;
    data.salePrice = product.priceModel.getPriceBookPrice(_data.salePriceBookID).value;

    /**
     * Size model images fields.
     */
    data.sizeModelImages = getSizeModelImages(product, 99);
  } else {
    /**
     * Gift Category Check.
     */
    data.inGiftsCategory = giftCategoryChecker(product);

    /**
     * Price fields.
     */
    data.minSalePrice = priceHelper.getMinPrice(product, _data.salePriceBookID);
    data.maxSalePrice = priceHelper.getMaxPrice(product, _data.salePriceBookID);
    data.minListPrice = priceHelper.getMinPrice(product, _data.listPriceBookID);
    data.maxListPrice = priceHelper.getMaxPrice(product, _data.listPriceBookID);
  }

  // get SFCC product attributes in the SFCC ConstructorIOdata custom object
  var attributeData = getPrepAttributeData(product, data);

  // Set discount percentage filter range
  if (attributeData && attributeData.itemFacets) {
    attributeData.itemFacets.forEach(function (attr) {
      if (attr.key === 'discountPercentage') {
        var breakPointVal = setDiscountPercentageRange(attr.value);
        if (breakPointVal) {
          attr.value = breakPointVal;
        }
      }
    });
  }

  /**
   * Merge product data and passed data.
   */
  Object.assign(data, attributeData);

  /**
   * Here, we'll populate facets and metadata depending on whether
   * the product is a variation or not.
   */
  if (result.item_id) {
    result.metadata = getMetadataForVariation(product, data);
    result.facets = getFacetsForVariation(product, data);
  } else {
    result.metadata = getProductMetadata(product, data);
    result.facets = getProductFacets(product, data);
  }

  return result;
};
