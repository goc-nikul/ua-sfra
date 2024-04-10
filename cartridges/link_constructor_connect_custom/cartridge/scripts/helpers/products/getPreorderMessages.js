/**
 * Returns pre-order messages for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {Object|string} The pre-order messages
 */
module.exports = function getPreorderMessages(product) {
  var preOrderObj = {};
  if ('preOrderPDPMessage' in product.custom && !empty(product.custom.preOrderPDPMessage)) {
    preOrderObj.pdpMessage = product.custom.preOrderPDPMessage;
  }
  if ('preOrderProductTileMessage' in product.custom && !empty(product.custom.preOrderProductTileMessage)) {
    preOrderObj.tileMessage = product.custom.preOrderProductTileMessage;
  }

  // return message
  if (Object.keys(preOrderObj).length) {
    return JSON.stringify(preOrderObj);
  }

  return '';
};
