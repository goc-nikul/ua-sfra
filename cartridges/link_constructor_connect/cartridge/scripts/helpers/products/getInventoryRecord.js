/**
 * @param {dw.catalog.Product} product
 */
module.exports = function getInventoryRecord(product) {
  return (
    product
    && product.availabilityModel
    && product.availabilityModel.inventoryRecord
  ) || null;
};
