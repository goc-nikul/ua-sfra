const CustomObjectMgr = require('dw/object/CustomObjectMgr');

/**
 * Builds a list of product attributes to be pushed to Constructor.
 * This list only contains attributes that do not require manipulation
 * before being pushed to Constructor. For each attribute, we get:
 * - type of product(master or variant) feed
 * - type of Constructor data(facet or metadata)
 * - id of product attribute in SFCC
 * - key of product attribute in Constructor
 *
 * @returns {Array} The list of simple product attributes to push to Constructor.
 */
function buildSimpleProductAttributeList() {
    var attributeList = [];

    // get SFCC product attributes in the SFCC ConstructorIOFeedData custom object
    var customObjIterator = CustomObjectMgr.getAllCustomObjects('ConstructorIOFeedData');
    while (customObjIterator.hasNext()) {
        var customObj = customObjIterator.next();

        // add attributes to list
        attributeList.push({ cioKey: customObj.custom.constructorKey,
            sfccKey: customObj.custom.sfccAttribute,
            feedType: Array.from(customObj.custom.constructorFeedType),
            dataType: Array.from(customObj.custom.constructorDataType)
        });
    }

    return attributeList;
}

module.exports.buildSimpleProductAttributeList = buildSimpleProductAttributeList;
