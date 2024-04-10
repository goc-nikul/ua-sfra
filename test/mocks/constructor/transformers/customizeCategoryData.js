'use strict';

var categoryHelper = require('../../../mocks/constructor/custom/categoryHelper');
var bucketedAttributesHelper = require('../../../mocks/constructor/custom/bucketedAttributesHelper');

function getCategoryData(category) {
    return {
        // id fields
        uuid: category.UUID,
        id: category.ID,

        // name fields
        displayName: category.displayName,

        // hierarchy fields
        parent: category.parent
        ? {
            displayName: category.parent.displayName,
            uuid: category.parent.UUID,
            id: category.parent.ID
        }
        : null,
        data: {
            categoryUrl: categoryHelper.getCategoryUrl(category),
            categoryDisplayName: category.displayName,
            categoryParentId: categoryHelper.getCategoryParentID(category),
            categoryParentName: categoryHelper.getCategoryParentName(category),
            categoryAltUrl: categoryHelper.getCategoryAltUrl(category),
            parents: categoryHelper.getParentCategories(category, [], 'desc', true, true),
            priceMap: bucketedAttributesHelper.getPriceMap(category)
        }
    };
}

module.exports.getCategoryData = getCategoryData;
