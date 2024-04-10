var getSearchRefinements = require('*/cartridge/scripts/helpers/categories/getSearchRefinements');
var getCustomPreference = require('*/cartridge/scripts/helpers/config/getCustomPreference');
var sitePreferences = require('*/cartridge/scripts/constants/sitePreferences');
var logger = require('*/cartridge/scripts/helpers/logger');
var SystemObjectMgr = require('dw/object/SystemObjectMgr');

/**
 * Builds a map of SFCC attribute IDs to Constructor keys based on the site's custom preferences.
 *
 * @returns {Object} A mapping of SFCC attribute IDs to Constructor keys.
 */
function buildConstructorKeyMap() {
  var attributeIDs = (getCustomPreference(sitePreferences.CUSTOM_CONSTRUCTOR_BUCKETED_ATTRIBUTE_IDS_TO_SEND) || '').split(',');
  var keyMap = {};

  attributeIDs.forEach(function (attributeID) {
    var def = SystemObjectMgr.describe('Product').getCustomAttributeDefinition(attributeID);
    if (!empty(def)) {
      var mappedKey = {
        merchCollection: 'collection',
        agegroup: 'ageGroup',
        colorgroup: 'colorGroup',
        fittype: 'fitType'
      }[attributeID] || attributeID;

      keyMap[attributeID] = mappedKey;
    } else {
      logger.log('bucketedAttributeValues', 'error', 'Attribute ' + attributeID + ' does not exist in the Product object. Check Constructor_BucketedAttributeIdsToSend preference.');
    }
  });

  return keyMap;
}

/**
 * Filters a given value for purposes of data consistency, particularly converting string representations of boolean values to actual booleans.
 *
 * @param {*} value The value to filter.
 * @returns {*} The filtered value.
 */
function filterValue(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

/**
 * Populates and returns the attribute and/or refinement values for a given product,
 * based on the attributes specified by the site's custom preferences.
 * Only attributes present in the constructorKeyMap are processed.
 *
 * @param {dw.catalog.Product} product The product from which to populate attribute values.
 * @returns {Array} An array of objects representing the attribute values to send.
 */
module.exports = function getAttributeValuesMap(product) {
  var attributeValues = [];
  var refinementDefinitions;
  var constructorKeyMap = buildConstructorKeyMap();

  // search for the product
  var productSearchRefinements = getSearchRefinements(product, 'product', null);

  // get the refinement definitions
  if (!empty(productSearchRefinements)) {
    refinementDefinitions = productSearchRefinements.getAllRefinementDefinitions().toArray();
  }

  Object.keys(constructorKeyMap).forEach(function (attributeID) {
    // build the key
    var key = attributeID === 'length' ? 'length' : constructorKeyMap[attributeID];

    if (!empty(refinementDefinitions)) {
      if (!empty(product.custom[attributeID])) {
        // get the refinement definition for the current attribute
        var index = refinementDefinitions.findIndex(item => (item.attributeID === attributeID));

        if (index >= 0) {
          // get the refinement values
          var refinementValues = productSearchRefinements.getRefinementValues(refinementDefinitions[index]).toArray();

          if (Array.isArray(refinementValues) && refinementValues.length) {
            var values = [];

            // filter and save refinement display values only
            values = refinementValues
              .filter(refinementValue =>
                'displayValue' in refinementValue &&
                !empty(refinementValue.displayValue) &&
                refinementValue.displayValue !== 'N/A')
              .map(refinementValue => filterValue(refinementValue.displayValue));

            // add the array of refinement values
            if (values.length > 0) {
              attributeValues.push({
                key: key,
                value: values
              });
            }
          }
        }
      }
    } else {
      // if no refinement value present, get the attribute value
      var attributeValue = typeof product.custom[attributeID] === 'object' ? product.custom[attributeID].value : product.custom[attributeID];

      // add the attribute value
      attributeValues.push({
        key: key,
        value: filterValue(attributeValue)
      });
    }
  });

  return attributeValues;
};
