'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

global.empty = (data) => {
    return !data;
};
var pdict;
var Product = require('../../mocks/dw/dw_catalog_Product');
var sinon = require('sinon');
var stubhasOnlineSubCategories = sinon.stub();
var  category = {
    parent: {
        getSubCategories: () => null
    },
    custom: {
        mobileCategoryOverride: null
    },
    getOnlineSubCategories: () => {
        return new ArrayList()
    }
};

class CatalogMgr {
    static getCategory(categoryID) {
        this.ID = categoryID;
        this.getProducts = function () {
            return [new Product()];
        };
        this.hasOnlineSubCategories = stubhasOnlineSubCategories;
        this.getOnlineProducts = function () {
            return [new Product()];
        };
        this.hasOnlineProducts = function () {
            return false;
        };
        this.getOnlineSubCategories = function () {
            return [];
        };
        this.custom = {
            mobileCategoryOverride: true
        };
        return this;
    }
}

var categoryHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/categoryHelper.js', {
    'dw/catalog/CatalogMgr': CatalogMgr,
    'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
    '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections.js')
});

var ArrayList = require('../../mocks/dw/dw_util_Collection');
global.dw = {
    util: {
        ArrayList: ArrayList
    }
}

describe('categoryHelper.js file test cases', function () {
    describe('getCurrentCategory method test cases', function () {
        it('test case with categoryID', () => {
            pdict = {
                categoryID: 123
            };
            global.request = {
                httpParameterMap: {
                    cgid: {
                        stringValue: null
                    }
                }
            };
            global.dw = {
                util: {
                    ArrayList: ArrayList
                }
            };
            var result = categoryHelper.getCurrentCategory(pdict);
            assert.isDefined(result, 'Is not defined');
        });
        it('test case with no categoryID ', () => {
            pdict = { categoryID: null };
            global.request = {
                httpParameterMap: {
                    cgid: {
                        stringValue: null
                    }
                }
            };
            global.dw = {
                util: {
                    ArrayList: ArrayList
                }
            };
            var result = categoryHelper.getCurrentCategory(pdict);
            assert.isDefined(result, 'Is not defined');
        });
        it('test case with Category.ID', () => {
            pdict = {
                Category: {
                    ID: 123
                }
            };
            global.dw = {
                util: {
                    ArrayList: ArrayList
                }
            };
            global.request = { httpParameterMap: { cgid: { stringValue: null } } };
            var result = categoryHelper.getCurrentCategory(pdict);
            assert.isDefined(result, 'Is not defined');
        });
        it('test case with no Category.ID', () => {
            pdict = {
                Category: {
                    ID: null
                }
            };
            global.dw = {
                util: {
                    ArrayList: ArrayList
                }
            };
            global.request = { httpParameterMap: { cgid: { stringValue: null } } };
            var result = categoryHelper.getCurrentCategory(pdict);
            assert.isDefined(result, 'Is not defined');
        });
        it('test case with category.ID', () => {
            pdict = {
                category: {
                    ID: 1
                }
            };
            global.dw = {
                util: {
                    ArrayList: ArrayList
                }
            };
            global.request = { httpParameterMap: { cgid: { stringValue: null } } };
            var result = categoryHelper.getCurrentCategory(pdict);
            assert.isDefined(result, 'Is not defined');
        });
        it('test case with categoryid', () => {
            pdict = { categoryid: 1 };
            global.request = { httpParameterMap: { cgid: { stringValue: null } } };
            global.dw = {
                util: {
                    ArrayList: ArrayList
                }
            };
            var result = categoryHelper.getCurrentCategory(pdict);
            assert.isDefined(result, 'Is not defined');
        });
        it('test case with categoryId', () => {
            pdict = { categoryId: 1 };
            global.dw = {
                util: {
                    ArrayList: ArrayList
                }
            };
            global.request = { httpParameterMap: { cgid: { stringValue: null } } };
            var result = categoryHelper.getCurrentCategory(pdict);
            assert.isDefined(result, 'Is not defined');
        });
        it('test case with contextAUID,contextAUIDType', () => {
            pdict = {
                contextAUID: 1,
                contextAUIDType: "CATEGORY"
            };
            global.dw = {
                util: {
                    ArrayList: ArrayList
                }
            };
            global.request = { httpParameterMap: { cgid: { stringValue: null } } };
            var result = categoryHelper.getCurrentCategory(pdict);
            assert.isDefined(result, 'Is not defined');
        });
        it('test case with no contextAUID,contextAUIDType', () => {
            pdict = {
                contextAUID: null,
                contextAUIDType: null
            };
            global.dw = {
                util: {
                    ArrayList: ArrayList
                }
            };
            global.request = { httpParameterMap: { cgid: { stringValue: null } } };
            var result = categoryHelper.getCurrentCategory(pdict);
            assert.isDefined(result, 'Is not defined');
        });
        it('test case with stringValue ', () => {
            global.request = {
                 httpParameterMap: {
                     cgid: {
                         stringValue: 'abc' 
                        } 
                    } 
                };
                global.dw = {
                    util: {
                        ArrayList: ArrayList
                    }
                };
            var result = categoryHelper.getCurrentCategory(pdict);
            assert.isDefined(result, 'Is not defined');
        });

    });
    describe('getCategoryObject method test cases', function () {
        it('Test case when stubhasOnlineSubCategories() returns true', () => {
            var resultObj = {
                category: {
                    parent: {
                        getSubCategories: () => null
                    },
                    custom: {
                        mobileCategoryOverride: null
                    },
                    getOnlineSubCategories: () => null
                }
            };
            global.dw = {
                util: {
                    ArrayList: ArrayList
                }
            };
            stubhasOnlineSubCategories.returns(true);
            var result = categoryHelper.getCategoryObject(resultObj);
            stubhasOnlineSubCategories.reset();
            assert.isDefined(result, 'Is not defined');
        });
        it('Test case when stubhasOnlineSubCategories() returns false', () => {
            var resultObj = {
                category: {
                    parent: {
                        getSubCategories: () => null
                    },
                    custom: {
                        mobileCategoryOverride: null
                    },
                    getOnlineSubCategories: () => null
                }
            };
            global.dw = {
                util: {
                    ArrayList: ArrayList
                }
            };
            stubhasOnlineSubCategories.returns(false);
            var result = categoryHelper.getCategoryObject(resultObj);
            assert.isDefined(result, 'Is not defined');
        });
        it('should return defined value', () => {
            class CatalogMgr {
                static getCategory(categoryID) {
                    this.ID = categoryID;
                    this.getProducts = function () {
                        return [new Product()];
                    };
                    this.hasOnlineSubCategories = stubhasOnlineSubCategories;
                    this.getOnlineProducts = function () {
                        return [new Product()];
                    };
                    this.hasOnlineProducts = function () {
                        return false;
                    };
                    this.getOnlineSubCategories = function () {
                        return [];
                    };
                    this.custom = {
                        mobileCategoryOverride: false
                    };
                    return this;
                }
            }
            var categoryHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/categoryHelper.js', {
                'dw/catalog/CatalogMgr': CatalogMgr,
                'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
                '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections.js')
            });
            var resultObj = {
                category: {
                    parent: {
                        getSubCategories: () => null
                    },
                    custom: {
                        mobileCategoryOverride: null
                    },
                    getOnlineSubCategories: () => null
                }
            };
            global.dw = {
                util: {
                    ArrayList: ArrayList
                }
            };
            var result = categoryHelper.getCategoryObject(resultObj);
            assert.isDefined(result, 'Is not defined');
        });
        it('Test case when hasOnlineSubCategories() returns true', () => {
            var subcategory = {
                hasOnlineSubCategories: () => true,
                custom: {
                    displaySubCategoriesInMenuRefinement: true
                },
                getParent: () => true,
                getOnlineSubCategories: () => true
            }
            var categoryHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/categoryHelper.js', {
                'dw/catalog/CatalogMgr': CatalogMgr,
                'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
                '*/cartridge/scripts/util/collections': {
                    forEach: function (params, callback) {
                        params,
                            callback(subcategory)
                    }
                }
            });
            var resultObj = {
                category: {
                    parent: {
                        getSubCategories: () => null
                    },
                    custom: {
                        mobileCategoryOverride: null
                    },
                    getOnlineSubCategories: () => null
                },
            };
            global.dw = {
                util: {
                    ArrayList: ArrayList
                }
            };
            var result = categoryHelper.getCategoryObject(resultObj);
            assert.isDefined(result, 'Is not defined');
        });
        it('Test case when hasOnlineSubCategories() returns false', () => {
            var subcategory = {
                hasOnlineSubCategories: () => false,
                custom: {
                    displaySubCategoriesInMenuRefinement: false
                },
                getParent: () => true,
                getOnlineSubCategories: () => true,
            }
            var categoryHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/categoryHelper.js', {
                'dw/catalog/CatalogMgr': CatalogMgr,
                'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
                '*/cartridge/scripts/util/collections': {
                    forEach: function (params, callback) {
                        params,
                            callback(subcategory)
                    }
                }
            });
            var resultObj = {
                category: {
                    parent: {
                        getSubCategories: () => null
                    },
                    custom: {
                        mobileCategoryOverride: null
                    },
                    getOnlineSubCategories: () => null
                },
            };
            global.dw = {
                util: {
                    ArrayList: ArrayList
                }
            };
            var result = categoryHelper.getCategoryObject(resultObj);
            assert.isDefined(result, 'Is not defined');
        });
    });
});
