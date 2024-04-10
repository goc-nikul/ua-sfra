'use strict';

function parseParentId(product) {
  var variationModel = null;
  var master = null;

  if (!product.variant) return null;

  variationModel = product.variationModel;
  master = variationModel && variationModel.master;

  if (!master) return null;

  return master.ID;
}

module.exports = {
    parseParentId: parseParentId
};
