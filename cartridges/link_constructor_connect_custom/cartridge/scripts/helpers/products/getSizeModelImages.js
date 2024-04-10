var Site = require('dw/system/Site');

/**
 * Returns size model images for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @param {number} imageCount The number of images to be returned.
 * @returns {Array} The size model images.
 */
module.exports = function getSizeModelImages(product, imageCount) {
  // get fit model site pref
  var fitModelEnable = 'enableFitModels' in Site.current.preferences.custom ? Site.current.getCustomPreferenceValue('enableFitModels') : false;

  if (!empty(fitModelEnable) && fitModelEnable) {
    var sizeModelImages = [];

    if (!empty(product.custom.size)) {
      // get image view types
      var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');
      var imageViewType = productHelpers.sizeModelImagesMapping(product.custom.size.toLowerCase());

      if (!empty(imageViewType)) {
        // get images
        sizeModelImages = product.getImages(imageViewType);

        if (!empty(sizeModelImages) && sizeModelImages.length) {
            // add recipes
          sizeModelImages = sizeModelImages.toArray();
          sizeModelImages = productHelpers.addRecipeToSizeModelImage(sizeModelImages, imageCount);

          if (!empty(sizeModelImages) && sizeModelImages.length) {
            return sizeModelImages;
          }
        }
      }
    }
  }

  return [];
};

