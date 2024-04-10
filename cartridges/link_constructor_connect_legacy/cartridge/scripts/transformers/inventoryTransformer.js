var variationTransformer = require('./variationTransformer');

/**
 * This function is responsible for transforming the inventory data into the format
 * that will be written to the final catalog files before sending it to the
 * Constructor API, and into a format that is understood by our API.
 *
 * @param {*} product The product.
 * @returns The transformed data.
 */
function transformInventory(product) {
  var inventoryRecord = (
    product
    && product.availabilityModel
    && product.availabilityModel.inventoryRecord
  ) || null;

  var inventoryAttribute = {
    key: 'inventory',
    value: inventoryRecord && inventoryRecord.ATS
      ? inventoryRecord.ATS.value
      : 0
  };

  return {
    id: product.ID,
    parentId: variationTransformer.parseParentId(product),
    metadata: [inventoryAttribute],
    facets: [inventoryAttribute]
  };
}

module.exports.transformInventory = transformInventory;
