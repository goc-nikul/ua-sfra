/**
 * Parses one image from a product.
 *
 * Retrieves image data for a given product, including the URL, file name, title, and image recipe.
 * @param {dw.catalog.Product} product The product to retrieve image data from.
 * @returns {Object|null} An object containing image data, or null if no image is found.
 */
module.exports = function getImage(product) {
  if (empty(product)) return null;

  var viewType = 'gridTileDesktop';
  var image = product.getImage(viewType);

  if (empty(image)) return null;

  var imageUrl = image.getURL().toString();
  if (!imageUrl) return null;

  // Extract fileName from URL
  var lastSlashIndex = imageUrl.lastIndexOf('/');
  var queryStartIndex = imageUrl.indexOf('?', lastSlashIndex);
  var fileName = imageUrl.substring(lastSlashIndex + 1, queryStartIndex !== -1 ? queryStartIndex : imageUrl.length);

  // Initialize recipe to an empty string
  var recipe = '';

  // Attempt to extract the recipe from URL parameters
  var recipeStart = '?rp=';
  var urlParams = imageUrl.split('&');
  for (var i = 0; i < urlParams.length; i++) {
    var param = urlParams[i];
    if (param.indexOf(recipeStart) >= 0) {
      var recipeValue = param.split(recipeStart)[1];
      var pipeLocation = recipeValue.indexOf('|');
      recipe = pipeLocation !== -1 ? recipeValue.substring(0, pipeLocation) : recipeValue;
      break;
    }
  }

  return {
    viewType: viewType,
    url: imageUrl,
    fileName: fileName,
    title: image.getTitle(),
    recipe: recipe
  };
};
