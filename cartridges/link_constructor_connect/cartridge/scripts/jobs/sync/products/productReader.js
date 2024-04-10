var queryProducts = require('*/cartridge/scripts/helpers/products/queryProducts');

/**
 * Product Type shorthand constants
 */
var VARIATION_GROUP_TYPE = 'dw.catalog.VariationGroup';
var VARIANT_TYPE = 'dw.catalog.Variant';

/**
 * Builds a product reader.
 */
var ProductReader = function () {
  this.currentRecord = null;
  this.parameters = null;
  this.iterator = null;

  /**
   * A function that returns the last modified date of a product.
   *
   * This is useful when syncing or patching products partially by the last modified date.
   * This function can change depending on the job type, since the last modified date of a
   * product can be different depending on job (e.g. inventory, price, etc).
   *
   * By default, it uses the function that returns the product last modified date.
   *
   * @see {@link ('cartridges/link_constructor_connect/cartridge/scripts/helpers/products/getLastModifiedDate.js')}
   * @type {(product: dw.catalog.Product) => Date | null)}
   */
  this.getLastModifiedDate = require('*/cartridge/scripts/helpers/products/getLastModifiedDate');
};

/**
 * Creates the product reader.
 * @param {import('../../../types').SyncJobReaderAdapterCreateArgs} args The create arguments.
 * @returns {ProductReader} The product reader.
 */
ProductReader.create = function (args) {
  var reader = new ProductReader();

  reader.parameters = args.parameters;

  if (args.getLastModifiedDate) {
    reader.getLastModifiedDate = args.getLastModifiedDate;
  }

  reader.reset();

  return reader;
};

/**
 * Resets the reader.
 */
ProductReader.prototype.reset = function () {
  this.iterator = queryProducts(this.parameters);
  this.currentRecord = null;
};

/**
 * Defines if a product should be added to the feed.
 * @param {dw.catalog.Product} product The product.
 * @returns {boolean} A boolean.
 */
ProductReader.prototype.shouldAddProduct = function (product) {
  // Do not add variation groups, since those should not be exported
  if (product.constructor.name === VARIATION_GROUP_TYPE) {
    return false;
  }

  // Do not add variants by default, since those are after the master product
  if (product.constructor.name === VARIANT_TYPE) {
    return false;
  }

  // Do not add products that have not been modified since the last sync
  if (this.parameters.lastSyncDate && this.parameters.lastSyncDate >= this.getLastModifiedDate(product)) {
    return false;
  }

  return true;
};

/**
 * Defines if a variant should be added to the feed.
 * @param {dw.catalog.Product} variant The variant.
 * @returns {boolean} A boolean.
 */
ProductReader.prototype.shouldAddVariant = function (variant) {
  // Do not add variants that have not been modified since the last sync
  if (this.parameters.lastSyncDate && this.parameters.lastSyncDate >= this.getLastModifiedDate(variant)) {
    return false;
  }

  // Do not add variants that are offline
  if (!this.parameters.sendOfflineVariants && !variant.isOnline()) {
    return false;
  }

  return true;
};

/**
 * Reads the next record line, which can be either a product or a variant.
 *
 * It relines on the active iterator, so that we can use the same logic both for calculating
 * the total count and to actually process the catalog itself.
 *
 * This function will either return `null` if there are no more records or an object
 * with the following properties:
 * - `valid`: Whether the record should be processed or not.
 * - `record`: The record to process.
 *
 * NOTE: Returning an object with `valid` instead of the record itself is necessary, otherwise
 * the cartridge could fail with `java.StackOverflowError`. The explanation for this is:
 *
 * 1. This function is expected to run lots of times. Specifically, once per product + variant.
 *
 * 2. We're likely running in Rhino Engine, instead of Node.js due to the Salesforce ecosystem.
 *
 * 3. Rhino Engine automagically detects if a function returns the same value lots of times and
 *    trips the execution throwing `java.StackOverflowError`, since it probably means that we
 *    have an an infinite loop in the code. Usually this happens at around ~1000 calls.
 *
 * 4. Now imagine that we're processing a catalog where the first 5k products should not be added.
 *    If this function returned `null` repeatedly for more than ~1000 times times, even if it is
 *    totally valid since we do want to skip those products, it would trigger the stack overflow
 *    detector from Rhino Engine, and the cartridge would fail the job. 🧨
 *
 * 5. If we return an object that changes at every function call instead, it will not trip the
 *    detection and can process the catalog, no matter its size or how many records we skip.
 *
 * So in short, this is all fine and we're happy. :D
 *
 * @see https://github.com/mozilla/rhino
 *
 * @returns {import('../../../types').ReaderReadNextLineResult | null} The result.
*/
ProductReader.prototype.readNextLine = function () {
  var valid = false;

  // If there is no current record, we'll initialize a new one
  if (!this.currentRecord) {
    // If the iterator has no more records, we return null to signal the end of the read phase
    if (!this.iterator.hasNext()) {
      return null;
    }

    var hit = this.iterator.next();

    /**
     * Get the next product to iterate over.
     * You may want to customize this in case you want to switch the base product to be sent.
     */
    var product = hit.product;

    /**
     * This defines the variants you want to send for this product.
     * You may want to customize this in case you want to send only a subset of the variants.
     */
    var variants = product.variants || [];

    this.currentRecord = {
      hasAddedAnyVariant: false,
      hasAddedMaster: false,
      hasReadMaster: false,
      variants: variants,
      product: product,
      variantIndex: 0
    };
  }

  // First, we read the master product
  if (!this.currentRecord.hasReadMaster) {
    valid = this.shouldAddProduct(this.currentRecord.product);
    this.currentRecord.hasReadMaster = true;

    if (valid) {
      this.currentRecord.hasAddedMaster = true;
    }

    return {
      record: this.currentRecord.product,
      valid: valid,
      data: {}
    };
  }

  // Then, we loop through the variants
  if (this.currentRecord.variants.length > this.currentRecord.variantIndex) {
    var currentVariant = this.currentRecord.variants[this.currentRecord.variantIndex];
    this.currentRecord.variantIndex += 1;

    valid = this.shouldAddVariant(currentVariant);

    if (valid) {
      this.currentRecord.hasAddedAnyVariant = true;
    }

    return {
      record: currentVariant,
      valid: valid,
      data: {}
    };
  }

  // If we have added a variant, we need to add the master product as well
  // to make sure the variant is linked to the master product
  if (this.currentRecord.hasAddedAnyVariant && !this.currentRecord.hasAddedMaster) {
    this.currentRecord.hasAddedMaster = true;

    return {
      record: this.currentRecord.product,
      valid: true,
      data: {}
    };
  }

  // If we reach this point, it means we have read the master product and all its variants
  // so we need to move on to the next product
  this.currentRecord = null;

  return this.readNextLine();
};

ProductReader.prototype.readNextCountLine = function () {
  return this.readNextLine();
};

ProductReader.prototype.readNextRecordLine = function () {
  return this.readNextLine();
};

module.exports = ProductReader;
