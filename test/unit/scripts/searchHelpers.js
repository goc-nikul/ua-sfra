const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const sinon = require('sinon');
var Arraylist = require('../../mocks/scripts/util/dw.util.Collection');

// Extended SFRA searchHelpers
/* eslint-disable */

describe('app_ua_core/cartridge/scripts/helpers/searchHelpers', function() {
    let productSearchStub = sinon.stub();
    let searchSpy = sinon.spy();
    let categoryMock = {
        parent: {
            ID: 'root'
        },
        template: 'rendering/category/categoryproducthits'
    };
    let productSearchModelMock = {
        search: searchSpy,
        getSearchRedirect: function() {
            return {
                getLocation: function() {
                    return 'some value';
                }
            };
        },
        category: categoryMock
    };
    let res = {
        cachePeriod: '',
        cachePeriodUnit: '',
        personalized: false
    };
    let mockRequest1 = {
        querystring: {}
    };
    let mockRequest2 = {
        querystring: {
            q: 'someValue'
        }
    };
    let mockRequest3 = {
        querystring: {
            cgid: 'someCategory',
            preferences: 'preferences',
            pmin: 'pmin',
            pmax: 'pmax'
        }
    };
    let CatalogMgr = {
        getSortingOptions: function() {
            return;
        },
        getSiteCatalog: function() {
            return {
                getRoot: function() {
                    return;
                }
            };
        },
        getSortingRule: function(rule) {
            return rule;
        },
        getCategory: function() {
            return {
                ID: 'mens',
                online: true,
                custom: {
                    canonicalCategory: {
                        online: {},
                        ID: 'ID'
                    }
                }
            };
        }
    };
    let ProductSearchModel = function() {
        return productSearchModelMock;
    };
    let URLUtils = {
        url: function() {
            return {
                append: function() {
                    return 'some appened URL';
                }
            };
        },
        abs: function() {
            return {
                append: function() {
                    return 'some appened URL';
                }
            };
        }
    }
    let pageMetaHelper = {
        setPageMetaTags: function() {
            return;
        },
        setPageMetaData: function() {
            return;
        }
    };
    let structuredDataHelper = {
        getListingPageSchema: function() {
            return 'some schema';
        }
    };
    let reportingUrls = {
        getProductSearchReportingURLs: function() {
            return ['something', 'something else'];
        }
    };
    let search = {
        setProductProperties: function() {
            return;
        },
        addRefinementValues: function() {
            return;
        }
    };
    let productHelper = {
        enableAvailablePerLocale: function() {
            return false;
        }
    };
    let PreferencesUtil = {
        getValue: function(key) {        
            return true;
        }
    };
    let baseSearchHelpers = proxyquire('../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/helpers/searchHelpers', {
        'dw/catalog/CatalogMgr': CatalogMgr,
        'dw/catalog/ProductSearchModel': ProductSearchModel,
        'dw/web/URLUtils': URLUtils,
        '*/cartridge/scripts/helpers/pageMetaHelper': pageMetaHelper,
        '*/cartridge/scripts/helpers/structuredDataHelper': structuredDataHelper,
        '*/cartridge/models/search/productSearch': productSearchStub,
        '*/cartridge/scripts/reportingUrls': reportingUrls,
        '*/cartridge/scripts/search/search': search
    });
    let searchHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/searchHelpers', {
        'app_storefront_base/cartridge/scripts/helpers/searchHelpers': baseSearchHelpers,
        'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
        'dw/catalog/CatalogMgr': CatalogMgr,
        'dw/catalog/ProductSearchModel': ProductSearchModel,
        'dw/web/URLUtils': URLUtils,
        'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList'),
        '*/cartridge/scripts/helpers/pageMetaHelper': pageMetaHelper,
        '*/cartridge/scripts/helpers/structuredDataHelper': structuredDataHelper,
        '*/cartridge/models/search/productSearch': productSearchStub,
        '*/cartridge/scripts/reportingUrls': reportingUrls,
        '*/cartridge/scripts/search/search': search,
        '*/cartridge/config/preferences': {
            defaultPageSize: 12
        },
        '*/cartridge/scripts/helpers/ProductHelper': productHelper,
        '*/cartridge/scripts/utils/PreferencesUtil': PreferencesUtil
    });

    const isMemberOfCustomerGroup = function (groupID) {
        return true;
    }

    if (!global.session.customer) {
        global.session.customer = {
            isMemberOfCustomerGroup: isMemberOfCustomerGroup
        }
    } else {
        global.session.customer.isMemberOfCustomerGroup = isMemberOfCustomerGroup;
    }

    afterEach(function() {
        productSearchStub.reset();
        searchSpy.reset();
    });

    it('Testing method search: should category search', function() {
        productSearchStub.returns({
            isCategorySearch: true,
            isRefinedCategorySearch: false
        });
        if (!global.session.customer) {
            global.session.customer = {
                isMemberOfCustomerGroup: isMemberOfCustomerGroup
            }
        } else {
            global.session.customer.isMemberOfCustomerGroup = isMemberOfCustomerGroup;
        }
        let result = searchHelpers.search(mockRequest1, res);

        assert.isTrue(searchSpy.calledOnce);
        assert.equal(result.maxSlots, 4);
        assert.deepEqual(result.category, {
            parent: {
                ID: 'root'
            },
            template: 'rendering/category/categoryproducthits'
        });
        assert.equal(result.categoryTemplate, 'rendering/category/categoryproducthits');
        assert.equal(result.reportingURLs.length, 2);
        assert.isDefined(result.canonicalUrl);
        assert.isDefined(result.schemaData);
    });

    it('Testing method search: should search', function() {
        productSearchStub.returns({
            isCategorySearch: false,
            isRefinedCategorySearch: false
        });

        categoryMock = null;

        let result = searchHelpers.search(mockRequest1, res);

        assert.isTrue(searchSpy.calledOnce);
        assert.equal(result.maxSlots, 4);
        assert.equal(result.category, null);
        assert.equal(result.categoryTemplate, null);
        assert.equal(result.reportingURLs.length, 2);
    });

    it('Testing method search: should get a search redirect url', function() {
        let result = searchHelpers.search(mockRequest2);

        assert.equal(result.searchRedirect, 'some value');
        assert.isTrue(searchSpy.notCalled);
        assert.equal(result.maxSlots, null);
    });

    it('Testing method search: should search with query string params', function() {
        searchHelpers.search(mockRequest3, res);

        assert.isTrue(searchSpy.calledOnce);
    });

    it('Testing method search: should search with query string params --> canonicalCategory.online is false', function() {

        CatalogMgr = {
            getSortingOptions: function() {
                return;
            },
            getSiteCatalog: function() {
                return {
                    getRoot: function() {
                        return;
                    }
                };
            },
            getSortingRule: function(rule) {
                return rule;
            },
            getCategory: function() {
                return {
                    ID: 'mens',
                    online: false,
                    custom: {
                        canonicalCategory: {
                            online: false,
                            ID: 'ID'
                        }
                    }
                };
            }
        };
        searchHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/searchHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/searchHelpers': baseSearchHelpers,
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/catalog/CatalogMgr': CatalogMgr,
            'dw/catalog/ProductSearchModel': ProductSearchModel,
            'dw/web/URLUtils': URLUtils,
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList'),
            '*/cartridge/scripts/helpers/pageMetaHelper': pageMetaHelper,
            '*/cartridge/scripts/helpers/structuredDataHelper': structuredDataHelper,
            '*/cartridge/models/search/productSearch': productSearchStub,
            '*/cartridge/scripts/reportingUrls': reportingUrls,
            '*/cartridge/scripts/search/search': search,
            '*/cartridge/config/preferences': {
                defaultPageSize: 12
            },
            '*/cartridge/scripts/helpers/ProductHelper': productHelper,
            '*/cartridge/scripts/utils/PreferencesUtil': PreferencesUtil
        });
        searchHelpers.search(mockRequest3, res);

        assert.isTrue(searchSpy.calledOnce);
    });

    it('Testing method search: should category search --> querystring.start not defined', function() {
        let mockRequest1 = {
            querystring: {
                start: 1,
                sz: undefined
            }
        };
        productSearchStub.returns({
            isCategorySearch: true,
            isRefinedCategorySearch: false
        });
        if (!global.session.customer) {
            global.session.customer = {
                isMemberOfCustomerGroup: isMemberOfCustomerGroup
            }
        } else {
            global.session.customer.isMemberOfCustomerGroup = isMemberOfCustomerGroup;
        }
        let result = searchHelpers.search(mockRequest1, res);

        assert.isTrue(searchSpy.calledOnce);
        assert.equal(result.maxSlots, 4);
        assert.deepEqual(result.category, {
            parent: {
                ID: 'root'
            },
            template: 'rendering/category/categoryproducthits'
        });
        assert.equal(result.categoryTemplate, 'rendering/category/categoryproducthits');
        assert.isDefined(result.canonicalUrl);
        assert.isDefined(result.schemaData);
    });

    it('Testing method search: should category search --> Test viewPreference and isShopAllUrl and selectedFilter', function() {
        let mockRequest1 = {
            querystring: {
                viewPreference: 1,
                sz: undefined,
                selectedFilter: 1,
                isShopAllUrl: 1,
            }
        };
        productSearchStub.returns({
            isCategorySearch: true,
            isRefinedCategorySearch: false
        });
        if (!global.session.customer) {
            global.session.customer = {
                isMemberOfCustomerGroup: isMemberOfCustomerGroup
            }
        } else {
            global.session.customer.isMemberOfCustomerGroup = isMemberOfCustomerGroup;
        }
        let result = searchHelpers.search(mockRequest1, res);

        assert.isTrue(searchSpy.calledOnce);
        assert.equal(result.maxSlots, 4);
        assert.deepEqual(result.category, {
            parent: {
                ID: 'root'
            },
            template: 'rendering/category/categoryproducthits'
        });
        assert.equal(result.categoryTemplate, 'rendering/category/categoryproducthits');
        assert.isDefined(result.canonicalUrl);
        assert.isDefined(result.schemaData);
    });

    it('Testing method: setupSearch', function() {

        let CatalogMgr = {
            getSortingOptions: function() {
                return;
            },
            getSiteCatalog: function() {
                return {
                    getRoot: function() {
                        return;
                    }
                };
            },
            getSortingRule: function(rule) {
                return rule;
            },
            getCategory: function() {
                return {
                    ID: 'mens',
                    online: true,
                    custom: {
                        canonicalCategory: {
                            online: {},
                            ID: 'ID'
                        },
                        experienceType: {
                            value: {}
                        }
                    }
                };
            }
        };

        searchHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/searchHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/searchHelpers': baseSearchHelpers,
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            enableExperienceTypes: 'enableExperienceTypes',
                            experienceTypeFilter: 'experienceTypeFilter',
                            hideMFOItems: 'hideMFOItems',
                            enableAvailablePerLocale: 'enableAvailablePerLocale'
                        }
                    },
                    getCustomPreferenceValue: function (param) {
                        if (param === 'enableExperienceTypes') {
                            return true;
                        }
                        if (param === 'experienceTypeFilter') {
                            return true;
                        }
                        if (param === 'hideMFOItems') {
                            return true;
                        }
                        if (param === 'enableAvailablePerLocale') {
                            return true;
                        }
                        return false;
                    }
                }
            },
            'dw/catalog/CatalogMgr': CatalogMgr,
            'dw/catalog/ProductSearchModel': ProductSearchModel,
            'dw/web/URLUtils': URLUtils,
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList'),
            '*/cartridge/scripts/helpers/pageMetaHelper': pageMetaHelper,
            '*/cartridge/scripts/helpers/structuredDataHelper': structuredDataHelper,
            '*/cartridge/models/search/productSearch': productSearchStub,
            '*/cartridge/scripts/reportingUrls': reportingUrls,
            '*/cartridge/scripts/search/search': search,
            '*/cartridge/config/preferences': {
                defaultPageSize: 12
            },
            '*/cartridge/scripts/helpers/ProductHelper': productHelper,
            '*/cartridge/scripts/utils/PreferencesUtil': PreferencesUtil
        });
        var param = {
            cgid: {},
            preferences: {}
        }
        let result = searchHelpers.setupSearch({}, param, {});
        assert.isNotNull(result);
        // pass param without cgid attribute
        var param = {};
        result = searchHelpers.setupSearch({}, param, {});
    });

    it('Testing method: setupSearch with preferences', function() {

        let CatalogMgr = {
            getSortingOptions: function() {
                return;
            },
            getSiteCatalog: function() {
                return {
                    getRoot: function() {
                        return;
                    }
                };
            },
            getSortingRule: function(rule) {
                return rule;
            },
            getCategory: function() {
                return {
                    ID: 'mens',
                    online: true,
                    custom: {
                        canonicalCategory: {
                            online: {},
                            ID: 'ID'
                        },
                        experienceType: {
                            value: {}
                        }
                    }
                };
            }
        };

        searchHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/searchHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/searchHelpers': baseSearchHelpers,
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            enableExperienceTypes: 'enableExperienceTypes',
                            experienceTypeFilter: 'experienceTypeFilter',
                            hideMFOItems: 'hideMFOItems',
                            enableAvailablePerLocale: 'enableAvailablePerLocale'
                        }
                    },
                    getCustomPreferenceValue: function (param) {
                        if (param === 'enableExperienceTypes') {
                            return true;
                        }
                        if (param === 'experienceTypeFilter') {
                            return true;
                        }
                        if (param === 'hideMFOItems') {
                            return true;
                        }
                        if (param === 'enableAvailablePerLocale') {
                            return true;
                        }
                        return false;
                    }
                }
            },
            'dw/catalog/CatalogMgr': CatalogMgr,
            'dw/catalog/ProductSearchModel': ProductSearchModel,
            'dw/web/URLUtils': URLUtils,
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList'),
            '*/cartridge/scripts/helpers/pageMetaHelper': pageMetaHelper,
            '*/cartridge/scripts/helpers/structuredDataHelper': structuredDataHelper,
            '*/cartridge/models/search/productSearch': productSearchStub,
            '*/cartridge/scripts/reportingUrls': reportingUrls,
            '*/cartridge/scripts/search/search': search,
            '*/cartridge/config/preferences': {
                defaultPageSize: 12
            },
            '*/cartridge/scripts/helpers/ProductHelper': productHelper,
            '*/cartridge/scripts/utils/PreferencesUtil': PreferencesUtil
        });
        var param = {
            cgid: {},
            preferences: null
        }
        var isMemberOfCustomerGroup = function (groupID) {
            return false;
        }
        global.session.customer.isMemberOfCustomerGroup = isMemberOfCustomerGroup;
        let result = searchHelpers.setupSearch({}, param, {});
        assert.isNotNull(result);
    });

    it('Testing method: setupPageURLs', function() {

        mockRequest3 = {
            querystring: {
                cgid: 'someCategory',
                preferences: 'preferences',
                pmin: 'pmin',
                pmax: 'pmax'
            }
        };
        var res = {
            productSearch: {
                count: 14
            }
        }
        let result = searchHelpers.setupPageURLs(mockRequest3, res);
        assert.isNotNull(result);
    });

    it('Testing method: getCategoryTemplate', function() {

        mockRequest3 = {
            isShopAllUrl: 'true'
        }

        var apiProductSearch = {
            category: {
                count: 14,
                custom: {
                    displayShopAllLinkInMobile: 'displayShopAllLinkInMobile'
                }
            }
        }
        let result = searchHelpers.getCategoryTemplate(apiProductSearch, mockRequest3);
        assert.isNotNull(result);
    });

    it('Testing method: setupCategoryDisplayName', function() {
        var queryParamsValues = [
            {
                key: 'division',
                value : 'division'
            },
            {
                key: 'enduse',
                value : 'v|al|ue'
            },
            ];
        let result = searchHelpers.setupCategoryDisplayName('categoryDisplayName', queryParamsValues);
        assert.isNotNull(result);
        assert.equal(result.displayName, 'categoryDisplayName');
    });

    it('Testing method: setupCategoryDisplayName --> pass empty queryParamsValues', function() {
        var queryParamsValues = {}
        let result = searchHelpers.setupCategoryDisplayName('categoryDisplayName', queryParamsValues);
        assert.isNotNull(result);
        assert.equal(result.displayName, 'categoryDisplayName');
    });

    it('Test case for when querystring is not given', () => {
        var querystring = '';
        var result = searchHelpers.isUserRefinedSearch(querystring);
        assert.isFalse(result, 'Is true');
    });
    it('Test case for when querystring is given with preferences value', () => {
        var querystring = {
            preferences: {
                isMFOItem: true,
                premiumFilter: {},
            },
            pmin: 1000,
            pmax: 1100
        };
        var result = searchHelpers.isUserRefinedSearch(querystring);
        assert.isTrue(result, 'Is not True');
    });
    it('Test case for when querystring is given with different preferences value', () => {
        var querystring = {
            preferences: {
                test: 'test'
            }
        };
        var result = searchHelpers.isUserRefinedSearch(querystring);
        assert.isTrue(result, 'Is not false');
    });
    it('Test case for when querystring is given with differnt value', () => {
        var querystring = {
            NOTpreferences: {
                test: 'test'
            }
        };
        var result = searchHelpers.isUserRefinedSearch(querystring);
        assert.isFalse(result, 'Is not false');
    });

    it('Test case for when querystring is not given', () => {
        var querystring = {
            NOTpreferences: null
        };
        var result = searchHelpers.hasTwoOrMoreRefinementValuesOfSameType(querystring);
        assert.isFalse(result, 'Is true');
    });
    it('Test case for when querystring is not given', () => {
        var querystring = {
            preferences: {
                test: 'test|test1'
            },
        };
        var result = searchHelpers.hasTwoOrMoreRefinementValuesOfSameType(querystring);
        assert.isTrue(result, 'Is not true');
    });
    it('Test case for when querystring is not given', () => {
        var querystring = {
            preferences: {
                test: 'test or test1'
            },
        };
        var result = searchHelpers.hasTwoOrMoreRefinementValuesOfSameType(querystring);
        assert.isFalse(result, 'Is not False');
    });
    it('Test case for when querystring is not given', () => {
        var queryParamsValues = new Arraylist([{ key: 'gender' },{ key: 'colorgroup' },{ key: 'enduse' },{ key: 'silhouette' },{ key: 'subsilhouette' },{ key: 'division' }]);
        var result = searchHelpers.setupRefinementsDisplayTitle(queryParamsValues);
        assert.isNotNull(result,'Is null');
    });
    it('Test case for when querystring is not given', () => {
        var queryParamsValues = new Arraylist([{ key: 'gender' },{ key: 'fittype' },{ key: 'size'}]);
        var result = searchHelpers.setupRefinementsDisplayTitle(queryParamsValues);
        assert.isNotNull(result,'Is null');
    });

    it('Testing Method: breadcrumRefinement', () => {
        var selectedRefinements = [{id: 'gender', displayValue: 'displayValue'},{id: 'colorgroup', displayValue: 'displayValue1'}, {id: 'colorgroup', displayValue: 'displayValue1'}]
        var querystring = {
            preferences: {
                gender: 'gender',
                premiumFilter: {},
            },
            viewPreference: {},
            pmin: 1000,
            pmax: 1100
        };
        var result = searchHelpers.breadcrumRefinement(selectedRefinements, querystring);
        assert.isNotNull(result,'Is null');
    });

    it('Testing Method: setupCatRefinementFilteredUrl - test a string filtered PLP URL is returned', function() {
        searchHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/searchHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/searchHelpers': baseSearchHelpers,
            '*/cartridge/config/preferences': {
                defaultPageSize: 12
            },
            'dw/system/Site': {
                current: {
                    preferences: {
                            custom: {
                                enabledCategorySearchRefinements: 'gender, colorgroup, fittype, enduse, silhouette, division, team, subsilhouette, gearline, subsubsilhouette',
                        }
                    }
                }
            },
            'dw/web/URLUtils': {
                url: function () {
                    return {
                        append: function () {
                            return 'some appened URL';
                        }
                    };
                }
            },
        });
        let req = {
            querystring: {
                cgid : 'root'
            }
        }
        var queryParamsValues = new Arraylist([{ key: 'gender' },{ key: 'colorgroup' },{ key: 'enduse' },{ key: 'silhouette' },{ key: 'subsilhouette' },{ key: 'division' }]);
        let result = searchHelpers.setupCatRefinementFilteredUrl(req, queryParamsValues);
        assert.isString(result);
    });
});
