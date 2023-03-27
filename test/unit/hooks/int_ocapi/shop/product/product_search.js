'use strict';

const {
    assert
} = require('chai');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const sinon = require('sinon');

describe('int_ocapi/cartridge/hooks/shop/product/product_search.js', () => {
    it('should list page meta tags', function () {
        let searchSpy = sinon.spy();
        let categoryMock = {
            parent: {
                ID: 'root'
            },
            template: 'rendering/category/categoryproducthits'
        };
        let productSearchModelMock = {
            search: searchSpy,
            getSearchRedirect: function () {
                return {
                    getLocation: function () {
                        return 'some value';
                    }
                };
            },
            category: categoryMock,
            pageMetaTags: [{
                ID: 'test',
                name: 'test',
                property: false,
                title: true,
                content: true
            }]
        };
        let ProductSearchModel = function () {
            return productSearchModelMock;
        };
        let productSearch = proxyquire('../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/product/product_search.js', {
            './productHookUtils': {
                getProductUrl: function () {
                    return 'url';
                }
            },
            'dw/system/Status': require('../../../../../mocks/dw/dw_system_Status'),
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../../../mocks/dw/dw_system_Site'),
            'dw/system/Logger': require('../../../../../mocks/dw/dw_system_Logger'),
            'dw/catalog/ProductMgr': new (require('../../../../../mocks/dw/dw_catalog_ProductMgr'))(),
            'dw/catalog/PriceBookMgr': {
                setApplicablePriceBooks: function () {},
                getApplicablePriceBooks: function () {}
            },
            'dw/catalog/CatalogMgr': function () { },
            'dw/util': {
                HashMap: function () {
                    return {
                        put: function () {
                            return {};
                        }
                    };
                }
            },
            'dw/campaign/PromotionMgr': {
                activeCustomerPromotions: {
                    getProductPromotions: function () {
                        return [
                            {
                                promotionClass: {
                                    toLowerCase: function () {
                                        return {};
                                    }
                                },
                                calloutMsg: {
                                    markup: 'markup'
                                }
                            }
                        ];
                    }
                }
            },
            'int_customfeeds/cartridge/scripts/util/ProductUtils': {
                getValue: function () {
                    return {};
                },
                getPriceBooks: function () {
                    return {
                        listPriceBookID: 'listPriceBookID',
                        salePriceBookID: 'salePriceBookID'
                    };
                },
                getPriceByPricebook: function () {
                    return {};
                },
                getAllPriceRanges: function () {
                    return {
                        minSalePrice: {
                            value: 4
                        },
                        maxListPrice: {
                            compareTo: function () {
                                return 1;
                            },
                            decimalValue: 2
                        },
                        maxSalePrice: {
                            decimalValue: 2
                        },
                        minListPrice: {}
                    };
                }
            },
            '*/cartridge/scripts/errorLogHelper': {
                handleOcapiHookErrorStatus: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/helpers/pricing': {
                getPromotionPrice: function () {
                    return {
                        value: 1,
                        decimalValue: 1
                    };
                }
            },
            'dw/catalog/ProductSearchModel': ProductSearchModel
        });
        var currentSearch = { query: '' };
        assert.doesNotThrow(() => productSearch.modifyGETResponse(currentSearch));
    });
});
