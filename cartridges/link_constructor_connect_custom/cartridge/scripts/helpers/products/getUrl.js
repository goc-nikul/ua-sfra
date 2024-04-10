var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');

/**
 * Parses the product URL.
 *
 * @param {dw.catalog.Product} product The product.
 * @returns The url.
 */
module.exports = function getURL(product) {
  var productUrl;
  if (product.isVariant()) {
    productUrl = URLUtils.url('Product-Show', 'pid', product.getMasterProduct().ID).toString();
  } else {
    productUrl = URLUtils.url('Product-Show', 'pid', product.ID).toString();
  }

  // Remove site and locale data from URL
  var siteId = Site.getCurrent().getID();
  var sitePattern = '/s/' + siteId;
  var localePattern = '/' + request.locale.toLowerCase().replace('_', '-');
  productUrl = productUrl.replace(sitePattern, '').replace(localePattern, '');

  return productUrl;
};
