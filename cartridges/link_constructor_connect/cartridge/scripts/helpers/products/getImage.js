/**
 * Parses one image from a product.
 *
 * @param {dw.catalog.Product} product The product.
 * @returns {string | null} The parsed image.
 */
module.exports = function getImage(product) {
  var image;

  /**
   * We set this index to 0 because we want to get the first image.
   * If you want to get a different image, you can change this index.
   */
  var imageIndex = 0;

  /**
   * Media types to scan. The first image found will be used.
   * If you want to use a different image, you can change the order of the media types or
   * add more media types to the list.
   */
  var viewTypes = [
    'Product',
    'large',
    'grid',
    'default'
  ];

  for (var i = 0; i < viewTypes.length; i += 1) {
    image = product.getImage(viewTypes[i], imageIndex);
    if (image) break;
  }

  if (!image) return null;

  return image.getURL().toString();
};
