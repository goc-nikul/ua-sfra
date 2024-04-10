var getAttributeValuesFromName = require('*/cartridge/scripts/helpers/products/getAttributeValuesFromName');

/**
 * Gets and puts product attribute data in the appropriate arrays
 *
 * @param {*} product The product.
 * @param {Object} data Product and feed data.
 * @returns {Object} Product and feed data with added attribute lists.
 */
module.exports = function prepAttributeData(product, data) {
  var attributeData = {};

  // clear arrays we're pushing custom object data into
  attributeData.itemFacets = [];
  attributeData.itemMeta = [];
  attributeData.variationFacets = [];
  attributeData.variationMeta = [];

  // loop through list of simple product attributes
  data.attributeList.forEach(function (attribute) {
    // get attribute value(s) for the passed product
    var attributeValue = getAttributeValuesFromName(product, attribute.sfccKey);

    if (empty(attributeValue) && attribute.sfccKey === 'searchableIfUnavailableFlag') {
      attributeValue = false;
    }

    if (!empty(attributeValue)) {
      // for each type of:
      // * constructor data(facet or metadata) AND
      // * each type of sfcc product(master/parent or variant),
      // push the constructor key and attribute value to the appropriate array

      // build the object that will be passed to Constructor
      var obj = { key: attribute.cioKey, value: attributeValue };

      // get type of data and type of feed options
      var onVariation = attribute.feedType.find(item => (item.value === 'variation'));
      var onMaster = attribute.feedType.find(item => (item.value === 'master'));
      var onFacet = attribute.dataType.find(item => (item.value === 'facet'));
      var onMeta = attribute.dataType.find(item => (item.value === 'metadata'));

      if (onFacet) {
        if (onVariation) {
          // facets for variation products
          attributeData.variationFacets.push(obj);
        }

        if (onMaster) {
          attributeData.itemFacets.push(obj);
        }
      }

      if (onMeta) {
        if (onVariation) {
          attributeData.variationMeta.push(obj);
        }

        if (onMaster) {
          attributeData.itemMeta.push(obj);
        }
      }
    }
  });

  return attributeData;
};
