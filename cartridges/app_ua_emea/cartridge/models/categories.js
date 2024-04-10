'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');

/**
 * Get category url
 * @param {dw.catalog.Category} category - Current category
 * @returns {string} - Url of the category
 */
function getCategoryUrl(category) {
    return category.custom && 'alternativeUrl' in category.custom && category.custom.alternativeUrl
        ? category.custom.alternativeUrl
        : URLUtils.url('Search-Show', 'cgid', category.getID()).toString();
}

/**
 * Return Online subcategories based on isCategoryOnline attribute value
 *  @param {dw.catalog.Category} category - A single category
 * @returns {boolean} - Boolean value
 */
function hasOnlineCategories(category) {
    var isSubSubCategoriesExists = false;
    var subSubCategories = category.hasOnlineSubCategories() ? category.getOnlineSubCategories() : null;
    if (subSubCategories && subSubCategories.length > 0) {
        collections.forEach(subSubCategories, function (subSubCategory) {
            if (subSubCategory.custom.isCategoryOnline.valueOf() === 'true') {
                isSubSubCategoriesExists = true;
                return;
            }
        });
    }
    return isSubSubCategoriesExists;
}


/**
 * Converts a given category from dw.catalog.Category to plain object
 * @param {dw.catalog.Category} category - A single category
 * @returns {Object} plain object that represents a category
 */
function categoryToObject(category) {
    let CatalogMgr = require('dw/catalog/CatalogMgr');
    if (!category.custom || !('showInMenu' in category.custom && category.custom.showInMenu.valueOf() && category.custom.showInMenu.valueOf().toString() === 'true')) {
        return null;
    }
    var result = {
        name: category.getDisplayName(),
        url: getCategoryUrl(category),
        id: category.ID,
        row: category,
        isClickable: !category.custom.disableClick,
        hideInMobileNavigation: category.custom.hideInMobileNavigation,
        expandMobileCategory: 'expandMobileCategory' in category.custom ? category.custom.expandMobileCategory : false,
        hideInDesktopNavigation: 'hideInDesktopNavigation' in category.custom ? category.custom.hideInDesktopNavigation : false,
        displayShopAllLinkInMobile: 'displayShopAllLinkInMobile' in category.custom ? category.custom.displayShopAllLinkInMobile : false,
        mobileHideParentCategory: 'mobileHideParentCategory' in category.custom ? category.custom.mobileHideParentCategory : false,
        isShowFlameIcon: 'isShowFlameIcon' in category.custom ? category.custom.isShowFlameIcon : false,
        mobileCategoryPosition: 'mobileCategoryPosition' in category.custom && !empty(category.custom.mobileCategoryPosition) ? category.custom.mobileCategoryPosition : 999,
        isCategoryOnline: 'isCategoryOnline' in category.custom && !empty(category.custom.isCategoryOnline) ? category.custom.isCategoryOnline.valueOf() : null
    };
    var categoryLocaleCheck = Site.current.getCustomPreferenceValue('isCategoryLocaleCheckEnabled');
    var subCategories;
    if (categoryLocaleCheck) {
        subCategories = hasOnlineCategories(category) ? category.getOnlineSubCategories() : null;
    } else {
        subCategories = category.hasOnlineSubCategories() ? category.getOnlineSubCategories() : null;
    }

    if (subCategories) {
        collections.forEach(subCategories, function (subcategory) {
            var converted = null;
            if (subcategory.hasOnlineProducts() || (categoryLocaleCheck ? hasOnlineCategories(subcategory) : subcategory.hasOnlineSubCategories())) {
                converted = categoryToObject(subcategory);
            }
            if (converted) {
                if (!result.subCategories) {
                    result.subCategories = [];
                    result.mobSubCategories = [];
                    result.subCategoriesArray = [];
                }
                result.subCategories.push(converted);
                result.mobSubCategories.push(converted);
                var position = '';
                if (subcategory.custom.mobileHideParentCategory) {
                    var subSubCategories = subcategory.hasOnlineSubCategories() ? subcategory.getOnlineSubCategories() : null;
                    collections.forEach(subSubCategories, function (subSubCategory) {
                        if (!subSubCategory.custom.hideInMobileNavigation) {
                            position = 'mobileCategoryPosition' in subSubCategory.custom && !empty(subSubCategory.custom.mobileCategoryPosition) ? subSubCategory.custom.mobileCategoryPosition : '999';
                            if (position.toString().length === 1) {
                                position = '0' + position;
                            }
                            result.subCategoriesArray.push(position + '_' + subSubCategory.displayName + '_' + subSubCategory.ID);
                        }
                    });
                } else {
                    position = 'mobileCategoryPosition' in subcategory.custom && !empty(subcategory.custom.mobileCategoryPosition) ? subcategory.custom.mobileCategoryPosition : '999';
                    if (position.toString().length === 1) {
                        position = '0' + position;
                    }
                    result.subCategoriesArray.push(position + '_' + converted.name + '_' + converted.id);
                }
            }
        });

        if (result.subCategories) {
            result.complexSubCategories = result.subCategories.some(function (item) {
                return !!item.subCategories;
            });
        }
        if (result.mobSubCategories !== undefined) {
            result.mobSubCategories.sort(function (obj1, obj2) {
                var num1 = obj1.mobileCategoryPosition;
                var num2 = obj2.mobileCategoryPosition;
                return num1 - num2;
            });
        }
    }
    if (result.subCategoriesArray && result.subCategoriesArray.length > 0) {
        result.subCategoriesArray.sort();
        result.subCategoriesArray.forEach(function (subCategoryFromArray) {
            var mobileSubCategory = CatalogMgr.getCategory(subCategoryFromArray.split('_')[2]);
            var convertedforMobile = null;
            if (mobileSubCategory.hasOnlineProducts() || mobileSubCategory.hasOnlineSubCategories()) {
                convertedforMobile = categoryToObject(mobileSubCategory);
            }
            if (convertedforMobile) {
                if (!result.mobileSubCategories) {
                    result.mobileSubCategories = [];
                }
                result.mobileSubCategories.push(convertedforMobile);
            }
        });
    }
    return result;
}

/**
 * Represents a single category with all of it's children
 * @param {dw.util.ArrayList<dw.catalog.Category>} items - Top level categories
 * @constructor
 */
function categories(items) {
    this.categories = [];
    var categoryLocaleCheckEnabled = Site.current.getCustomPreferenceValue('isCategoryLocaleCheckEnabled');
    collections.forEach(items, function (item) {
        if (((categoryLocaleCheckEnabled && 'isCategoryOnline' in item.custom && item.custom.isCategoryOnline.valueOf() === 'true' && ('showInMenu' in item.custom && item.custom.showInMenu.valueOf() && item.custom.showInMenu.valueOf().toString() === 'true')) ||
            ('showInMenu' in item.custom && item.custom.showInMenu.valueOf() && item.custom.showInMenu.valueOf().toString() === 'true')) && (item.hasOnlineProducts() || item.hasOnlineSubCategories())) {
            let hideInLocale = !empty(item.custom.localeDisplayOrder) && item.custom.localeDisplayOrder === 0;

            if (!hideInLocale) {
                this.categories.push(categoryToObject(item));
            }
        }
    }, this);
}
module.exports = categories;
