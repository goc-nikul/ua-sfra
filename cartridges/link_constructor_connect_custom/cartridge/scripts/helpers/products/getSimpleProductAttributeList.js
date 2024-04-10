const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const CacheMgr = require('dw/system/CacheMgr');
var logger = require('*/cartridge/scripts/helpers/logger');

/**
 * Retrieves a cached list of simple product attributes for Constructor.io integration. If the cache is empty,
 * it fetches the attributes from custom objects and caches the result. Attributes include the product type (master or variant),
 * data type (facet or metadata), and attribute IDs for both SFCC and Constructor.io. Utilizes caching to enhance performance
 * by storing the attribute list in JSON format. In case of errors during the fetch or cache access process, logs the error
 * and returns an empty array.
 *
 * @returns {Array<Object>} An array of objects where each object contains the Constructor.io key, SFCC attribute key,
 * feed type, and data type. Returns an empty array if an error occurs during the operation.
 */
module.exports = function getSimpleProductAttributeList() {
  var cacheKey = 'simpleProductAttributeList_' + request.locale;
  var cache = CacheMgr.getCache('ConstructorProductFeedData');
  var attributeList = [];

  try {
    var attributeListJson = cache.get(cacheKey);

    if (!attributeListJson) {
      var customObjIterator = CustomObjectMgr.getAllCustomObjects('ConstructorIOFeedData');
      while (customObjIterator.hasNext()) {
        var customObj = customObjIterator.next();

        attributeList.push({
          cioKey: customObj.custom.constructorKey,
          sfccKey: customObj.custom.sfccAttribute,
          feedType: customObj.custom.constructorFeedType.map(ft => ({
            displayValue: ft.displayValue,
            value: ft.value
          })),
          dataType: customObj.custom.constructorDataType.map(dt => ({
            displayValue: dt.displayValue,
            value: dt.value
          }))
        });
      }

      cache.put(cacheKey, JSON.stringify(attributeList));
    } else {
      attributeList = JSON.parse(attributeListJson);
    }
  } catch (e) {
    logger.error('getSimpleProductAttributeList', 'Error in getSimpleProductAttributeList: ' + e.toString());

    return [];
  }

  return attributeList;
};
