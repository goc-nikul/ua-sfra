/**
 * Retrieves the inventory record for a given product. The function checks for specific conditions
 * to determine the inventory count to return, such as if the product is marked as exclusive and out-of-stock,
 * or if the inventory is perpetual. For products with a defined inventory record, it returns the available
 * to sell (ATS) inventory amount. If no product or inventory record is found, or if the product is exclusively
 * out-of-stock, it returns 0.
 *
 * @param {dw.catalog.Product} product - The product to check the inventory for.
 * @returns {number} The inventory count. Returns 0 for out-of-stock or undefined products, the highest allowed
 * integer for perpetual inventory, or the ATS value for normal inventory records.
 */
module.exports = function getInventoryRecord(product) {
  if (empty(product)) {
    // If there is no product, return 0 as the inventory count.
    return 0;
  }

  // Check if product is marked as 'out-of-stock' and return 0 immediately if so.
  if ('exclusive' in product.custom && !empty(product.custom.exclusive)) {
    if (product.custom.exclusive.value === 'out-of-stock') {
      return 0;
    }
  }

  var inventoryRecord = product.availabilityModel.inventoryRecord;

  // Ensure inventoryRecord exists and has properties.
  if (!empty(inventoryRecord) && Object.keys(inventoryRecord).length > 0) {
    // If the inventory is perpetual, return the highest allowed value for positive integers.
    if (inventoryRecord.isPerpetual()) {
      return 2147483647;
    }

    // Return available to sell (ATS) inventory amount.
    return inventoryRecord.ATS.value;
  }

  // Default return if inventory record is empty or unavailable.
  return 0;
};
