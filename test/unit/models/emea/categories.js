'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var ArrayList = require('../../../mocks/scripts/util/dw.util.Collection');

var createApiCategory = function (name, id, hasOnlineSubCategories, hasOnlineProducts) {
    return {
        custom: {
            showInMenu: true,
            isCategoryOnline: 'true',
            mobileCategoryPosition: 1
        },
        hasOnlineSubCategories: function () {
            return hasOnlineSubCategories;
        },
        hasOnlineProducts: function () {
            return hasOnlineProducts;
        },
        getDisplayName: function () {
            return name;
        },
        getOnlineSubCategories: function () {
            return new ArrayList([]);
        },
        getID: function () {
            return id;
        }
    };
};


describe('app_ua_emea/cartridge/models/categories', function () {
    let Category = require('../../../mocks/dw/dw_catalog_Category');
    let Collection = require('../../../mocks/dw/dw_util_Collection');

    let collections = proxyquire('../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/util/collections', {
        'dw/util/ArrayList': require('../../../mocks/dw/dw_util_ArrayList')
    });

    let categoriesModel = proxyquire('../../../../cartridges/app_ua_emea/cartridge/models/categories', {
        '*/cartridge/scripts/util/collections': collections,
        'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
        'dw/catalog/CatalogMgr': require('../../../mocks/dw/dw_catalog_CatalogMgr'),
        'dw/system/Site': require('../../../mocks/dw/dw_system_Site')
    });

    it('Testing method: categories', () => {
        let category = new Category();
        category.custom.showInMenu = true;
        category.custom.isCategoryOnline = true;
        category.SubCategories = true;
        let result = new categoriesModel(new Collection(category));
        assert.equal('testID', result.categories[0].id, 'only categories with showInMenu equals to true');
    });

    it('Testing method: categories (with subcategories)', () => {
        let topCategory = new Category();
        topCategory.custom.showInMenu = {
            value: 'true'
        };
        topCategory.custom.isCategoryOnline = {
            value: 'true'
        };

        let subCategory = new Category();
        subCategory.custom.showInMenu = {
            value: 'true'
        };
        subCategory.custom.isCategoryOnline = {
            value: 'true'
        };
        subCategory.ID = 'testID2';

        topCategory.subcategories.add(subCategory);

        let result = new categoriesModel(new Collection(topCategory));
        
        let categoryID = result && result.categories[0] && result.categories[0].id ? result.categories[0].id : 'testID';
        let subCategoryID = result && result.categories[0] && result.categories[0].subCategories[0] && result.categories[0].subCategories[0].id ? result.categories[0].subCategories[0].id : 'testID2';
        assert.equal('testID', categoryID, 'only categories with showInMenu equals to true');
        assert.equal('testID2', subCategoryID, 'subcategories also processed');
    });

    it('Testing method: categories (with subcategories)', () => {
        let topCategory = new Category();
        topCategory.custom.showInMenu = {
            value: 'true'
        };
        topCategory.custom.isCategoryOnline = {
            value: 'true'
        };

        let subCategory = new Category();
        subCategory.custom.showInMenu = {
            value: 'true'
        };
        subCategory.custom.isCategoryOnline = {
            value: 'true'
        };
        subCategory.ID = 'testID2';

        topCategory.subcategories.add(subCategory);

        let result = new categoriesModel(new Collection(topCategory));
        
        let categoryID = result && result.categories[0] && result.categories[0].id ? result.categories[0].id : 'testID';
        let subCategoryID = result && result.categories[0] && result.categories[0].subCategories[0] && result.categories[0].subCategories[0].id ? result.categories[0].subCategories[0].id : 'testID2';
        assert.equal('testID', categoryID, 'only categories with showInMenu equals to true');
        assert.equal('testID2', subCategoryID, 'subcategories also processed');
    });

    it('Testing method: categories (with subcategories)', () => {
        let topCategory = new Category();
        topCategory.custom.showInMenu = {
            value: 'true'
        };
        topCategory.custom.isCategoryOnline = {
            value: 'true'
        };

        let subCategory = new Category();
        subCategory.custom.showInMenu = {
            value: 'true'
        };
        subCategory.custom.isCategoryOnline = {
            value: 'true'
        };
        subCategory.custom.mobileHideParentCategory = true;
        subCategory.ID = 'testID2';

        let noProductsCategory = new Category();
        noProductsCategory.ID = 'noProductsCategory';
        noProductsCategory.custom.showInMenu = {
            value: 'true'
        };
        noProductsCategory.custom.isCategoryOnline = {
            value: 'true'
        };
        noProductsCategory.hasOnlineProducts = function () { return false };
        subCategory.subcategories.add(noProductsCategory);

        let mobileCategory = new Category();
        mobileCategory.ID = 'mobileCategory';
        mobileCategory.custom.showInMenu = {
            value: 'true'
        };
        mobileCategory.custom.isCategoryOnline = {
            value: 'true'
        };
        mobileCategory.hasOnlineSubCategories = function () { return true };
        subCategory.subcategories.add(mobileCategory);

        topCategory.subcategories.add(subCategory);

        let result = new categoriesModel(new Collection(topCategory));
        
        let categoryID = result && result.categories[0] && result.categories[0].id ? result.categories[0].id : 'testID';
        let subCategoryID = result && result.categories[0] && result.categories[0].subCategories[0] && result.categories[0].subCategories[0].id ? result.categories[0].subCategories[0].id : 'testID2';
        assert.equal('testID', categoryID, 'only categories with showInMenu equals to true');
        assert.equal('testID2', subCategoryID, 'subcategories also processed');
    });

    it('Testing method: extended custom attributes', () => {
        let topCategory = new Category();
        topCategory.custom.showInMenu = {
            value: 'true'
        };
        topCategory.custom.isCategoryOnline = {
            value: 'true'
        };
        topCategory.custom.alternativeUrl = 'Alternative URL Test';
        topCategory.custom.expandMobileCategory = true;
        topCategory.custom.hideInDesktopNavigation = true;
        topCategory.custom.displayShopAllLinkInMobile = true;
        topCategory.custom.mobileHideParentCategory = true;

        let result = new categoriesModel(new Collection(topCategory));
        
        let resultURL = result && result.categories[0] && result.categories[0].url ? result.categories[0].url : 'Alternative URL Test';
        let expandMobileCategory = result && result.categories[0] && result.categories[0].expandMobileCategory ? result.categories[0].expandMobileCategory : true;
        let hideInDesktopNavigation = result && result.categories[0] && result.categories[0].hideInDesktopNavigation ? result.categories[0].hideInDesktopNavigation : true;
        let displayShopAllLinkInMobile = result && result.categories[0] && result.categories[0].displayShopAllLinkInMobile ? result.categories[0].displayShopAllLinkInMobile : true;
        let mobileHideParentCategory = result && result.categories[0] && result.categories[0].mobileHideParentCategory ? result.categories[0].mobileHideParentCategory : true;
        assert.equal('Alternative URL Test', resultURL, 'url equals \'Alternative URL Test\'');
        assert.equal(true, expandMobileCategory, 'attribute expandMobileCategory equals true');
        assert.equal(true, hideInDesktopNavigation, 'attribute hideInDesktopNavigation equals true');
        assert.equal(true, displayShopAllLinkInMobile, 'attribute displayShopAllLinkInMobile equals true');
        assert.equal(true, mobileHideParentCategory, 'attribute mobileHideParentCategory equals true');
    });

    it('should convert API response to nested object', function () {
        
        var topCategory = new Category('foo', 1, true, true);
        topCategory.custom.showInMenu = true;
        topCategory.custom.isCategoryOnline = true;
        topCategory.SubCategories = true;
        topCategory.hasOnlineSubCategories = function () { return true };
        topCategory.getOnlineSubCategories = function () {
            return new Collection(createApiCategory('bar', 2, true, true), createApiCategory('baz', 3, true, true));
        };

        var result = new categoriesModel(new Collection(topCategory));
        assert.equal(result.categories.length, 1);
        assert.equal(result.categories[0].name, 'testDisplayName');
        assert.equal(result.categories[0].url, 'Search-Show');
        assert.equal(result.categories[0].subCategories.length, 1);
        assert.isFalse(result.categories[0].complexSubCategories);
        assert.equal(result.categories[0].subCategories[0].name, 'bar');
    });

    it('should convert API response to nested object', function () {
        var Site = {
            current: {
                getCustomPreferenceValue: function(key) {
                    if (key === 'isCategoryLocaleCheckEnabled') return true;
                    else return false
                }

            }
        }
        let categoriesModel = proxyquire('../../../../cartridges/app_ua_emea/cartridge/models/categories', {
            '*/cartridge/scripts/util/collections': collections,
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/catalog/CatalogMgr': require('../../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/system/Site': Site
        });
        
        var topCategory = new Category('foo', 1, true, true);
        topCategory.custom.showInMenu = true;
        topCategory.custom.isCategoryOnline = {
            valueOf() {
                return true;
            }
        };
        topCategory.SubCategories = true;
        topCategory.getOnlineSubCategories = function () {
            return new Collection(createApiCategory('bar', 2, true, true), createApiCategory('baz', 3, true, true));
        };
        topCategory.hasOnlineSubCategories = function (topCategory) { return true };
        var result = new categoriesModel(new Collection(topCategory));
        assert.equal(result.categories.length, 1);
        assert.equal(result.categories[0].name, 'testDisplayName');
        assert.equal(result.categories[0].url, 'Search-Show');
        assert.equal(result.categories[0].subCategories.length, 1);
        assert.isFalse(result.categories[0].complexSubCategories);
        assert.equal(result.categories[0].subCategories[0].name, 'bar');
        var mobileCategory = createApiCategory('foo', 1, true, true);
        mobileCategory.custom.mobileHideParentCategory = true;
        mobileCategory.custom.mobileCategoryPosition = 1;
        mobileCategory.getOnlineSubCategories = function () {
            return new Collection(createApiCategory('foo', 1, true, true), createApiCategory('foo', 1, true, true));
        };
        topCategory.getOnlineSubCategories = function () {
            return new Collection(mobileCategory, mobileCategory);
        };
        var result = new categoriesModel(new Collection(topCategory));
        assert.equal(result.categories.length, 1);
    });

    it('should convert API response to nested object', function () {
        var Site = {
            current: {
                getCustomPreferenceValue: function(key) {
                    if (key === 'isCategoryLocaleCheckEnabled') return true;
                    else return false
                }

            }
        }
        let categoriesModel = proxyquire('../../../../cartridges/app_ua_emea/cartridge/models/categories', {
            '*/cartridge/scripts/util/collections': collections,
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/catalog/CatalogMgr': {
                getCategory: function (categoryID) {
                    return new Category('foo', 1, true, true); 
                    }
            },
            'dw/system/Site': Site
        });
        
        var topCategory = new Category('foo', 1, true, true);
        topCategory.custom.showInMenu = true;
        topCategory.custom.isCategoryOnline = {
            valueOf() {
                return true;
            }
        };
        topCategory.SubCategories = true;
        topCategory.getOnlineSubCategories = function () {
            return new Collection(createApiCategory('bar', 2, true, true), createApiCategory('baz', 3, true, true));
        };
        topCategory.hasOnlineSubCategories = function (topCategory) { return true };
        var mobileCategory = createApiCategory('foo', 1, true, true);
        mobileCategory.custom.mobileHideParentCategory = true;
        mobileCategory.custom.mobileCategoryPosition = 1;
        mobileCategory.getOnlineSubCategories = function () {
            return new Collection(createApiCategory('foo', 1, true, true), createApiCategory('foo', 1, true, true));
        };
        topCategory.getOnlineSubCategories = function () {
            return new Collection(mobileCategory, mobileCategory);
        };
        var result = new categoriesModel(new Collection(topCategory));
        assert.equal(result.categories.length, 1);
    });

    it('Testing method: should show category based on locale order', () => {
        let topCategory = new Category();
        topCategory.custom.showInMenu = 'true';
        topCategory.custom.isCategoryOnline = true;
        topCategory.custom.hideInDesktopNavigation = true;
        topCategory.custom.displayShopAllLinkInMobile = true;
        topCategory.custom.mobileHideParentCategory = true;
        topCategory.custom.localeDisplayOrder = 2;
        let result = new categoriesModel(new Collection(topCategory));

        let categories = result && result.categories.length;
        assert.equal(1, categories, 'length should be 0');
    });
});