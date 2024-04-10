'use strict';

var categoryHelper = require('../../../mocks/constructor/custom/categoryHelper');

function getCategorySectionData(category) {
    return {
        // id fields
        uuid: category.UUID,
        id: category.ID,

        // name fields
        name: category.displayName || category.ID,

        // hierarchy fields
        parentId: null,

        metadata: [
            {
                key: 'data',
                value: {
                    categoryUrl: categoryHelper.getCategoryUrl(category),
                    categoryDisplayName: category.displayName,
                    categoryParentId: categoryHelper.getCategoryParentID(category),
                    categoryParentName: categoryHelper.getCategoryParentName(category),
                    categoryAltUrl: categoryHelper.getCategoryAltUrl(category)
                }
            }
        ]
    };
}

module.exports.getCategorySectionData = getCategorySectionData;
