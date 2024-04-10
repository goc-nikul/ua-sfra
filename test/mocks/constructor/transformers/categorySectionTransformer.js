'use strict';

function transformCategorySection(category) {
    var customizeCategorySectionData = require('../../../mocks/constructor/transformers/customizeCategorySectionData');

    return customizeCategorySectionData.getCategorySectionData(category);
}

module.exports.transformCategorySection = transformCategorySection;
