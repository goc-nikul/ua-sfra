'use strict';

const {
    assert
} = require('chai');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const sinon = require('sinon');
const Product = require('../../../../../mocks/dw/dw_catalog_Product');
class ProductManager {

    static getProduct(productID) {
        this.product = new Product(productID);
        this.isVariant = function () {
            return true;
        };
        this.product.variants = this.product.getVariants();
        return this.product;
    }
    variantModel() {
        return null;
    }
}

class ProductImages {
    constructor() {
        return {
            gridTileDesktop: []
        };
    }
}

global.empty = (data) => {
    return !data;
};

global.session = {};

global.session.getCurrency = function () {
    return {
        getCurrencyCode: function () {
            return 'USD';
        }
    };
};

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
            'dw/catalog/ProductMgr': ProductManager,
            'dw/catalog/PriceBookMgr': {
                setApplicablePriceBooks: function () {},
                getApplicablePriceBooks: function () {}
            },
            'dw/catalog/CatalogMgr': {
                getCategory(cgid) {
                    return cgid || '';
                }
            },
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
            'dw/catalog/ProductSearchModel': ProductSearchModel,
            '*/cartridge/models/product/productImages': ProductImages
        });
        var currentSearch = {
            query: '',
            selected_refinements: {
                cgid: 'shoes-slip-on-sneakers',
                c_premiumFilter: 'premium'
            },
            hits: [{
                product_id: '196039201812',
                custom: {
                    experienceType: 'premium',
                    shopTheLookJson: '',
                    comingSoonMessage: '',
                    preOrderProductTileMessage: '',
                    isPreOrder: false
                },
                variants: [
                    {
                        custom: {
                            color: '100',
                            hexcolor: '',
                            colorway: '',
                            secondaryHex: '',
                            team: '',
                            isLoyaltyExclusive: false,
                            style: ''
                        }
                    }
                ]
            },
            {
                product_id: '3027049',
                custom: {
                    experienceType: 'premium',
                    shopTheLookJson: '',
                    comingSoonMessage: '',
                    preOrderProductTileMessage: '',
                    isPreOrder: false,
                    variants: []
                }
            }]
        };
        assert.doesNotThrow(() => productSearch.modifyGETResponse(currentSearch));
    });
});
