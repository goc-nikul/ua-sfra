'use strict';

/**
 * Builds a product inventory iterator.
 * It will return the product inventories based on a product search hit iterator.
 */
var ProductInventoryIterator = function build() {
  this.productSearchHits = null;
  this.buffer = null;
  this.size = null;
};

/**
 * Reads a new product inventory.
 * @param {*} productSearchHits The product search hits.
 * @returns The product inventory, or null.
 */
function readProductInventory(productSearchHits) {
  var hit = null;

  if (productSearchHits.hasNext()) {
    hit = productSearchHits.next();
  }

  return hit;
}

/**
 * Creates the iterator.
 * @param size The total size of results. Must be calculated before.
 * @param productSearchHits The product search hits.
 * @returns The file iterator.
 */
ProductInventoryIterator.create = function create(size, productSearchHits) {
  var newProductInventoryIterator = new ProductInventoryIterator();
  newProductInventoryIterator.productSearchHits = productSearchHits;
  newProductInventoryIterator.size = size;

  // Load first object to buffer
  if (newProductInventoryIterator.size > 0) {
    newProductInventoryIterator.buffer = readProductInventory(
      newProductInventoryIterator.productSearchHits
    );
  }

  return newProductInventoryIterator;
};

/**
 * Closes the iterator.
 */
ProductInventoryIterator.prototype.close = function close() {
  this.productSearchHits = null;
  this.buffer = null;
  this.size = null;

  return true;
};

/**
 * Returns the next object from the file, if any.
 */
ProductInventoryIterator.prototype.next = function next() {
  var result = null;

  if (empty(this.buffer)) {
    return result;
  }

  result = this.buffer;

  try {
    this.buffer = readProductInventory(this.productSearchHits);
  } catch (_error) {
    this.close();
    return null;
  }

  return result;
};

/**
 * Returns a boolean indicating whether the iterator has more objects.
 */
ProductInventoryIterator.prototype.hasNext = function hasNext() {
  return !empty(this.buffer);
};

/**
 * Returns the number of objects in the file.
 */
ProductInventoryIterator.prototype.getSize = function getSize() {
  return this.size;
};

/**
 * Returns the number of objects that have been read.
 */
ProductInventoryIterator.prototype.getRecordSize = function getRecordSize() {
  if (!this.buffer) {
    return 0;
  }

  try {
    return JSON.stringify(this.buffer).length;
  } catch (_error) {
    return 0;
  }
};

module.exports = ProductInventoryIterator;
