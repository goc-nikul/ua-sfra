/**
 * Returns the last modified date of a product for a patch sync.
 *
 * Since patch syncs are supposed to run more frequently, sometimes you don't want to use the
 * product last modified date here.
 *
 * For example, if you're using the job to sync the inventory at every 15 minutes, you'd
 * want to use the inventory record last modified date.
 *
 * @param {dw.catalog.Product} product The product.
 */
module.exports = function getLastModifiedDatePatch(product) {
  // Example: if you're syncing inventories, you can use the inventory record last modified date.
  var result = (
    product.availabilityModel
    && product.availabilityModel.inventoryRecord
    && product.availabilityModel.inventoryRecord.lastModified
  ) || null;

  if (!result) {
    result = product.lastModified;
  }

  return new Date(result);
};
