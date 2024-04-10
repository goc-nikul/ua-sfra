'use strict';

const CustomObjectMgr = require('../../../mocks/dw/dw_object_CustomObjectMgr');

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

module.exports = {
    buildSimpleProductAttributeList: buildSimpleProductAttributeList
};
