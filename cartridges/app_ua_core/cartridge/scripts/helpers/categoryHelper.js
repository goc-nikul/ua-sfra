/* eslint-disable */
'use strict';

/**
 * Find current category
 * @returns {string} Category ID or blank string
 */
function getCurrentCategory(pdict) {
    if (pdict.categoryID && !empty(pdict.categoryID)) {
        return pdict.categoryID;
    }
    if (pdict.Category && !empty(pdict.Category.ID)) {
        return pdict.Category.ID;
    }
    if (pdict.category && !empty(pdict.category.ID)) {
        return pdict.category.ID;
    }
    if (!empty(pdict.categoryid)) {
        return pdict.categoryid;
    }
    if (!empty(pdict.categoryId)) {
        return pdict.categoryId;
    }
    //the template of a content slot of category context can access the current category
    //via the contextAUID
    if (!empty(pdict.contextAUID) && pdict.contextAUIDType === 'CATEGORY') {
        return pdict.contextAUID;
    }
    if (request.httpParameterMap.cgid.stringValue) {
        return request.httpParameterMap.cgid.stringValue;
    }
    return '';
}

/**
 * To find the subcategories that are displayed in dropdown menu
 * @param {Object} result - object that contains category
 * @returns {object} an object that holds category header and items in dropdown menu
 */
function getCategoryObject(result) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var collections = require('*/cartridge/scripts/util/collections');
    var Site = require('dw/system/Site');
    var thirdLevelCategoryCollection = new dw.util.ArrayList();
    var Category = CatalogMgr.getCategory(getCurrentCategory(result));
    var headerCategory = Category;
    var CategoryItems = Category.getOnlineSubCategories();
    var newCategory;

    var categoryLocaleCheck = Site.current.getCustomPreferenceValue('isCategoryLocaleCheckEnabled');
    if (categoryLocaleCheck && (!Category.hasOnlineSubCategories()) && ('isCategoryOnline' in Category.custom && !Category.custom.isCategoryOnline.valueOf() !== 'true')) {
        headerCategory = result.category.parent;
        CategoryItems = result.category.parent.getSubCategories();
    } else if(!Category.hasOnlineSubCategories()) {
	    headerCategory = result.category.parent;
        CategoryItems = result.category.parent.getSubCategories();
    }
    if (Category.custom.mobileCategoryOverride) {
        if (newCategory === CatalogMgr.getCategory(result.category.custom.mobileCategoryOverride)) {
            headerCategory = result.category;
            CategoryItems = newCategory;
        }
    }

    collections.forEach(result.category.getOnlineSubCategories(), function (subcategory) {
        if (subcategory.custom.displaySubCategoriesInMenuRefinement && subcategory.hasOnlineSubCategories()) {
            headerCategory = subcategory.getParent();
            collections.forEach(subcategory.getOnlineSubCategories(), function (thirdLevelcategory) {
                thirdLevelCategoryCollection.add(thirdLevelcategory);
            });
            CategoryItems = thirdLevelCategoryCollection;
        }
    });
    var CategoryObject = {
    		headerCategory: headerCategory,
            CategoryItems: CategoryItems
    };
    return CategoryObject;
}
module.exports = exports = {
    getCurrentCategory: getCurrentCategory,
    getCategoryObject: getCategoryObject
};
