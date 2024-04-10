var queryCategories = require('*/cartridge/scripts/helpers/categories/queryCategories');

/**
 * Builds a category reader.
 */
var CategoryReader = function () {
  this.currentIndex = 0;
  this.categories = [];
};

/**
 * Creates the category reader.
 * @returns {CategoryReader} The category reader.
 */
CategoryReader.create = function () {
  var reader = new CategoryReader();

  reader.categories = queryCategories();

  return reader;
};

/**
 * Resets the reader.
 */
CategoryReader.prototype.reset = function () {
  this.currentIndex = 0;
};

CategoryReader.prototype.getTotalCount = function () {
  return this.categories.length;
};

/**
 * @returns {import('../../../types').ReaderReadNextLineResult | null} The result.
 */
CategoryReader.prototype.readNextRecordLine = function () {
  var category = this.categories[this.currentIndex];

  if (category) {
    this.currentIndex += 1;

    return {
      record: category,
      valid: true,
      data: {}
    };
  }

  return null;
};

module.exports = CategoryReader;
