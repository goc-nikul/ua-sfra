var productHelper = require('int_constructor_custom_legacy/cartridge/scripts/custom/productHelper');
var inventoryTransformer = require('../transformers/inventoryTransformer');
var productTransformer = require('../transformers/productTransformer');
var cioConfig = require('./config');
var uaConfig = require('int_constructor_custom_legacy/cartridge/scripts/helpers/config');
var objectHelper = require('int_constructor_custom_legacy/cartridge/scripts/custom/objectHelper');
var categoryHelper = require('int_constructor_custom_legacy/cartridge/scripts/custom/categoryHelper');
var catalogMgr = require('dw/catalog/CatalogMgr');
var salePriceBookID = uaConfig.configKeys.CUSTOM_SALE_PRICEBOOK_NAME;
var listPriceBookID = uaConfig.configKeys.CUSTOM_LIST_PRICEBOOK_NAME;

/**
 * Product Type shorthand constants
 */
var VARIATION_GROUP_TYPE = 'dw.catalog.VariationGroup';
var VARIANT_TYPE = 'dw.catalog.Variant';

/**
 * Defines XML keys to write in XML files.
 */
var xmlKeys = {
  product: {
    root: 'products',
    element: 'product'

  },
  inventory: {
    root: 'inventories',
    element: 'inventory'
  }
};

/**
 * Escapes all invalids characters that would break an XML file otherwise
 *
 * @see https://stackoverflow.com/a/28152666/10745645
 *
 * @param {string} unsafeString
 * @returns The escaped string
 */
function escapeXml(unsafeString) {
    return unsafeString.replace(/[<>&'"]/g, function replaceFunc(c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

/**
 * Appends an object as JSON to an already existing xml file.
 *
 * @example The resulting file will be something like:
 * <element-name>{ "object as JSON" }</element-name>
 *
 * @param {string} rootElementName  The root element name.
 * @param {dw.io.XMLStreamWriter} xmlStreamWriter The xml stream writer.
 * @param {Object} obj - name of node XML object
 */
function appendObjectToXmlFile(rootElementName, xmlStreamWriter, obj) {
  var xml = null;
  var jsonObject = null;

  jsonObject = escapeXml(JSON.stringify(obj));
  xml = new XML('<' + rootElementName + '>' + jsonObject + '</' + rootElementName + '>');

  xmlStreamWriter.writeCharacters('\n');
  xmlStreamWriter.writeRaw(xml.toXMLString());
  xmlStreamWriter.writeCharacters('\n');
}

/**
 * Starts writing a new XML file.
 * @param {*} filePath The xml file path.
 * @param {string} rootElementName The root element name.
 * @returns An object with the writer objects.
 */
function startXmlWrite(filePath, rootElementName) {
  // DW objects
  var XMLStreamWriter = require('dw/io/XMLIndentingStreamWriter');
  var FileWriter = require('dw/io/FileWriter');
  var File = require('dw/io/File');

  // Init XML writer
  var file = new File(filePath);
  var fileWriter = new FileWriter(file, 'UTF-8');
  var xmlStreamWriter = new XMLStreamWriter(fileWriter);

  // Write XML start
  xmlStreamWriter.writeStartDocument();
  xmlStreamWriter.writeStartElement(rootElementName);

  return {
    xmlStreamWriter: xmlStreamWriter,
    fileWriter: fileWriter
  };
}

/**
 * Ends writing an XML file.
 * @param {*} xmlResult The result of the xml handler function.
 */
function endXmlWrite(xmlResult) {
  // Write XML end
  xmlResult.xmlStreamWriter.writeEndElement();
  xmlResult.xmlStreamWriter.writeEndDocument();

  // Close the XML
  xmlResult.xmlStreamWriter.close();
  xmlResult.fileWriter.close();
}

/**
 * Transforms and writes one record to a XML file.
 * @param {'product' | 'inventory'} type The record type.
 * @param {*} product The raw product or variant.
 * @param {*} xmlStreamWriter The XML stream writer.
 * @param {Object} feedData Generic feed data.
 */
function transformAndAppend(type, product, xmlStreamWriter, feedData) {
  var result;

  if (type === 'inventory') {
    result = inventoryTransformer.transformInventory(product);
  } else {
    feedData.type = type;
    result = productTransformer.transformProduct(product, feedData);
  }

  appendObjectToXmlFile(xmlKeys[type].element, xmlStreamWriter, result);
}

/**
 * @param {'product' | 'inventory'} type The record type.
 * @param {*} product The product.
 * @returns {Date} The last modified date.
 */
function getLastModifiedDate(type, product) {
  if (type === 'inventory') {
    return (
      product.availabilityModel
      && product.availabilityModel.inventoryRecord
      && product.availabilityModel.inventoryRecord.lastModified
    );
  }

  return product.lastModified;
}

/**
 * @param {*} product The product.
 * @returns {boolean} Whether the product should be added or not.
 */
function shouldAddOOSProduct(product) {
    // Bypass conditions if searchableIfUnavailableFlag is true
    if (productHelper.isSearchableIfUnavailable(product)) {
        return true;
    }

    // Do not add products with no inventory that do not have release date populated
    if (!product.availabilityModel.inStock) {
        var releaseDate = 'releaseDate' in product.custom && !empty(product.custom.releaseDate) ? product.custom.releaseDate : null;
        var now = new Date();

        if (empty(releaseDate) || releaseDate <= now) {
            return false;
        }
    }

    return true;
}

/**
 * @param {'product' | 'inventory'} type The record type.
 * @param {*} hit The product search hit.
 * @param {import('../types').WriteProductXmlParameters} writeParameters The arguments passed to the xml writer.
 * @param {*} hasAddedAnyVariant Indicates if at least one variant was written to the XML file.
 * @returns {boolean} Whether the variant should be added or not.
 */
function shouldAddProduct(type, hit, writeParameters, hasAddedAnyVariant) {
  var isSlicedProduct = hit.hitType === 'slicing_group';
  var product = !isSlicedProduct ? hit.product : hit.product.masterProduct;

  // Do not add variation groups, since those should not be exported
  if (product.constructor.name === VARIATION_GROUP_TYPE) {
    return false;
  }

  // Do not add variants by default, since those are after the master product
  if (product.constructor.name === VARIANT_TYPE) {
    return false;
  }

  // Do not add products that have not been modified since the last sync
  if (writeParameters.lastSyncDate && writeParameters.lastSyncDate >= getLastModifiedDate(type, product)) {
    return false;
  }

  // Do not add the master product if no variants were added
  if (!hasAddedAnyVariant) {
    return false;
  }

  return true;
}

/**
 * @param {'product' | 'inventory'} type The record type.
 * @param {*} variant The variant.
 * @param {import('../types').WriteProductXmlParameters} writeParameters The arguments passed to the xml writer.
 * @param {Object} data The custom product and feed data.
 * @returns {boolean} Whether the variant should be added or not.
 */
function shouldAddVariant(type, variant, writeParameters, data) {
  // Do not add variants that have not been modified since the last sync
  if (writeParameters.lastSyncDate && writeParameters.lastSyncDate >= getLastModifiedDate(type, variant)) {
    return false;
  }

  // Do not add variants that have not valid prices
  if (!productHelper.hasValidPrice(variant, listPriceBookID, salePriceBookID)) {
    return false;
  }

  // Bypass conditions if searchableIfUnavailableFlag is true for variant
  if (productHelper.isSearchableIfUnavailable(variant)) {
    return true;
  }

  // Do not add variants that are offline
  if (!writeParameters.sendOfflineVariants && !variant.isOnline()) {
    return false;
  }

  // Do not add products that do not have gridTileDesktop images
  if (data.imageData === null) {
    return false;
  }

  // if the master product does not have a future release date, check if the variant has a future release date
  if (!data.addOOSMasterProduct) {
    if (!shouldAddOOSProduct(variant)) {
        return false;
    }
  }

  return true;
}

/**
 * Creates a new XML file based on a new iterator of `ProductSearchHit` objects.
 *
 * @example The resulting XML file will be something like:
 * <root-element>
 *  <element-name>{ "object as JSON" }</element-name>
 *  <element-name>{ "object as JSON" }</element-name>
 * </root-element>
 *
 * @param {string} filePath The xml file path.
 * @param {*} productSearchHits The product search hits.
 * @param {import('../types').WriteProductXmlParameters} writeParameters The arguments passed to the xml writer.
 * @param {'product' | 'inventory'} type The record type.
 * @param {*} productGetterModel The product getter model.
 * @returns The written items count.
 */
function createXmlFileFrom(
  filePath,
  productSearchHits,
  writeParameters,
  type,
  productGetterModel
) {
  var xmlResult = startXmlWrite(filePath, xmlKeys[type].root);
  var count = 0;

  // check whether or not we get and push promo pricing to Constructor
  var data = {};
  var promoPricingEnabled = cioConfig.getConfig(uaConfig.configKeys.CUSTOM_PROMO_PRICING_ENABLED);
  data.promoPricingEnabled = !empty(promoPricingEnabled) && promoPricingEnabled ? promoPricingEnabled : false;
  data.attributeList = objectHelper.buildSimpleProductAttributeList();

  // get gifts categories
  data.giftsCategories = categoryHelper.getGiftsCategories(catalogMgr.getSiteCatalog().root);
  data.productGetterModel = productGetterModel;

  while (productSearchHits.hasNext()) {
    var hit = productSearchHits.next();
    var hasAddedAnyVariant = false;
    var hasAddedMaster = false;
    var isSlicedProduct = hit.hitType === 'slicing_group';
    var product = !isSlicedProduct ? hit.product : hit.product.masterProduct;

    // Do not add OOS products that do not have a future release date
    data.addOOSMasterProduct = shouldAddOOSProduct(product);

    // Add variants if present. Here, we add all variants to make sure they're exported
    // even if they're not categorized (e.g. only master product is categorized).
    variants = !isSlicedProduct ? hit.product.variants : hit.product.masterProduct.variants;

    for (var variantIndex = 0; variantIndex < variants.length; variantIndex += 1) {
        // get image
        data.imageData = productHelper.getImage(variants[variantIndex]);

        if (shouldAddVariant(type, variants[variantIndex], writeParameters, data)) {
            transformAndAppend(type, variants[variantIndex], xmlResult.xmlStreamWriter, data);
            hasAddedAnyVariant = true;
            count += 1;
        }
    }

    // Add the master product if valid
    if (shouldAddProduct(type, hit, writeParameters, hasAddedAnyVariant)) {
        // any custom data retrieved here is being used in the variations loop. we get it here b/c we only need to get it once.

        // get min/max pricebook prices
        data.minSalePrice = productHelper.getMinPrice(product, salePriceBookID);
        data.maxSalePrice = productHelper.getMaxPrice(product, salePriceBookID);
        data.minListPrice = productHelper.getMinPrice(product, listPriceBookID);
        data.maxListPrice = productHelper.getMaxPrice(product, listPriceBookID);

        transformAndAppend(type, product, xmlResult.xmlStreamWriter, data);
        hasAddedMaster = true;
        count += 1;

        // record whether or not master product is assigned to a category with the gifts by price search refinement
        data.inGiftsCategory = productHelper.inGiftsCategory(product, data.giftsCategories);
      }

      // If we have added a variant, we need to add the master product as well
      // to make sure the variant is linked to the master product
      if (hasAddedAnyVariant && !hasAddedMaster) {
          transformAndAppend(type, product, xmlResult.xmlStreamWriter, data);
          count += 1;
      }
    }
  
    endXmlWrite(xmlResult);
  
    return count;
}

/**
 * Creates a new XML file based on a new iterator of `ProductSearchHit` objects.
 *
 * @example The resulting XML file will be something like:
 * <root-element>
 *  <element-name>{ "object as JSON" }</element-name>
 *  <element-name>{ "object as JSON" }</element-name>
 * </root-element>
 *
 * @param {string} filePath The xml file path.
 * @param {*} productSearchHits The product search hits.
 * @param {import('../types').WriteProductXmlParameters} writeParameters The arguments passed to the xml writer.
 * @param {*} productGetterModel The product getter model.
 * @returns The written items count.
 */
function createXmlFileFromProductSearchHits(
  filePath,
  productSearchHits,
  writeParameters,
  productGetterModel
) {
  return createXmlFileFrom(
    filePath,
    productSearchHits,
    writeParameters,
    'product',
    productGetterModel
  );
}

/**
 * Creates a new inventory XML file based on a new `ProductInventoryIterator`.
 *
 * @example The resulting XML file will be something like:
 * <root-element>
 *  <element-name>{ "object as JSON" }</element-name>
 *  <element-name>{ "object as JSON" }</element-name>
 * </root-element>
 *
 * @param {string} filePath The xml file path.
 * @param {*} inventoriesIterator The product inventory iterator.
 * @param {import('../types').WriteProductXmlParameters} writeParameters The arguments passed to the xml writer.
 * @returns The written items count.
 */
function createInventoryXmlFileFromProductSearchHits(
  filePath,
  inventoriesIterator,
  writeParameters
) {
  return createXmlFileFrom(
    filePath,
    inventoriesIterator,
    writeParameters,
    'inventory'
  );
}

/**
 * Creates a new XML file based on a new array object.
 *
 * @example The resulting XML file will be something like:
 * <root-element>
 *  <element-name>{ "object as JSON" }</element-name>
 *  <element-name>{ "object as JSON" }</element-name>
 * </root-element>
 *
 * @param {string} filePath The xml file path.
 * @param {string} rootElementName The root element name.
 * @param {string} arrayElementName The array element name.
 * @param {*} array The array object.
 * @param {*} transformItem A function to transform the item.
 * @returns The written items count.
 */
function createXmlFileFromArray(
  filePath,
  rootElementName,
  arrayElementName,
  array,
  transformItem
) {
  var xmlResult = startXmlWrite(filePath, rootElementName);
  var transformedItem = null;

  array.forEach(function handler(item) {
    transformedItem = transformItem(item);

    appendObjectToXmlFile(arrayElementName, xmlResult.xmlStreamWriter, transformedItem);
  });

  endXmlWrite(xmlResult);

  return array.length;
}

module.exports = {
  createInventoryXmlFileFromProductSearchHits: createInventoryXmlFileFromProductSearchHits,
  createXmlFileFromProductSearchHits: createXmlFileFromProductSearchHits,
  createXmlFileFromArray: createXmlFileFromArray
};
