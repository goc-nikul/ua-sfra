/**
 * Parses the parent id from one product.
 * Returns null if the product is not a variant.
 * Returns the parent id if the product is a variant.
 *
 * @param {*} product The product.
 * @returns {string | null} The parent id.
 */
function parseParentId(product) {
  var variationModel = null;
  var master = null;

  if (!product.variant) return null;

  variationModel = product.variationModel;
  master = variationModel && variationModel.master;

  if (!master) return null;

  return master.ID;
}

module.exports.parseParentId = parseParentId;
