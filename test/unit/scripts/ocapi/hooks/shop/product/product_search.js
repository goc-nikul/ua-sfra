'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var sinon = require('sinon');
describe('int_ocapi/cartridge/hooks/shop/product/product_search.js', () => {
    beforeEach(() => {
        global.session = {};
        global.request = {};
    });

    var ArrayList = require('../../../../../../mocks/dw/dw.util.Collection.js');
    var productSearch = proxyquire('../../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/product/product_search.js', {
        'dw/system/Status': function () { },
        'dw/util': {
            HashMap: function () {
                return {
                    put: function () {
                        return {};
                    }
                };
            },
            ArrayList
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
        '*/cartridge/scripts/helpers/pricing': {
            getPromotionPrice: function () {
                return {
                    value: 1,
                    decimalValue: 1
                };
            }
        },
        'dw/content/ContentMgr': {
            getContent: function () {
                return {
                    online: 'online',
                    custom: {
                        appBody: {}
                    }
                };
            }
        },
        './productHookUtils': {
            getProductUrl: function () {
                return 'url';
            }
        },
        '*/cartridge/scripts/utils/PreferencesUtil': {
            getValue: function () {
                return {};
            }
        },
        'dw/system/Site': {
            current: {
                preferences: {
                    custom: {
                        processCurrencyBasedOnCurrencyParam: true
                    }
                }
            }
        },
        'dw/util/Currency': {
            getCurrency: function () {
                return 'USD';
            }
        },
        'dw/catalog/ProductMgr': {
            getProduct: function () {
                return {
                    isMaster: function () {
                        return true;
                    },
                    isVariant: function () {
                        return false;
                    },
                    custom: {
                        productTileBottomLeftBadge: 'productTileBottomLeftBadge',
                        productTileUpperLeftBadge: 'productTileUpperLeftBadge',
                        productTileUpperLeftFlameIconBadge: 'productTileUpperLeftFlameIconBadge',
                        giftCard: {
                            value: 'value'
                        },
                        defaultColorway: 'defaultColorway',
                        outletColors: '100,825'
                    },
                    variants: [{
                        custom: {
                            color: '001',
                            colorway: '001 / black / something',
                            hexcolor: '000000',
                            secondaryhexcolor: '000',
                            team: ''
                        }
                    }]
                };
            }
        },
        'dw/catalog/CatalogMgr': {
            getCategory: function (catalogID) {
                return {
                    id: catalogID,
                    custom: {
                        experienceType: {
                            value: 'outlet'
                        }
                    }
                };
            }
        },
        'dw/catalog/PriceBookMgr': {
            getPriceBook: function () {
                return {
                    getID: function () {
                        return 'ID';
                    }
                };
            }
        },
        '*/cartridge/scripts/errorLogHelper': {
            handleOcapiHookErrorStatus: function () {
                return {};
            }
        },
        'dw/system/Logger': {
            error: function () {
                return 'error';
            },
            warn: function () {
                return 'warn';
            }
        },
        '*/cartridge/scripts/util/ProductUtils.ds': {
            getOutletPricing: function () {
                return {
                    salesPrice: {}
                };
            },
            getAllPriceRanges: function () {
                return {
                    minListPrice: {
                        value: 1
                    },
                    maxListPrice: {
                        value: 2
                    },
                    minSalePrice: {
                        value: 1
                    },
                    maxSalePrice: {
                        value: 2
                    }
                };
            }
        },
        '*/cartridge/models/product/productImages': function () {
            return {
                gridTileDesktop: [{}]
            };
        }
    });

    it('Testing product modifyGETResponse', () => {
        global.session.getCurrency = function () {
            return {
                getCurrencyCode: function () {
                    return 'USD';
                }
            };
        };
        global.request.getLocale = function () {
            return {};
        };
        var currentSearch = {
            hits: [
                {
                    product1: {}
                }
            ],
            selected_refinements: {
                c_premiumFilter: {}
            }
        };
        var result = productSearch.modifyGETResponse(currentSearch);
        assert.isNotNull(result);
    });

    it('Testing product modifyGETResponse --> outlet colors', () => {
        global.session.getCurrency = function () {
            return {
                getCurrencyCode: function () {
                    return 'USD';
                }
            };
        };
        global.request.getLocale = function () {
            return {};
        };
        var currentSearch = {
            hits: [
                {
                    product1: {
                        variationAttributes: new ArrayList([{
                            id: 'color',
                            values: new ArrayList([{
                                value: '100'
                            }, {
                                value: '825'
                            }])
                        }])
                    }
                }
            ],
            selected_refinements: {
                c_premiumFilter: {}
            }
        };
        var result = productSearch.modifyGETResponse(currentSearch);
        assert.isNotNull(result);
    });

    it('Testing product modifyGETResponse --> outlet colors empty category experience', () => {
        global.session.getCurrency = function () {
            return {
                getCurrencyCode: function () {
                    return 'USD';
                }
            };
        };
        global.request.getLocale = function () {
            return {};
        };
        productSearch['dw/catalog/CatalogMgr'] = {
            getCategory: function (catalogID) {
                return {
                    id: catalogID,
                    custom: {
                        experienceType: {
                            value: ''
                        }
                    }
                };
            }
        };
        var currentSearch = {
            hits: [
                {
                    product1: {
                        variationAttributes: new ArrayList([{
                            id: 'color',
                            values: new ArrayList([{
                                value: '100'
                            }, {
                                value: '825'
                            }])
                        }])
                    }
                }
            ],
            selected_refinements: {
                c_premiumFilter: {}
            }
        };
        var result = productSearch.modifyGETResponse(currentSearch);
        assert.isNotNull(result);
    });

    it('Testing product modifyGETResponse --> outlet colors filtered outletColors', () => {
        global.session.getCurrency = function () {
            return {
                getCurrencyCode: function () {
                    return 'USD';
                }
            };
        };
        global.request.getLocale = function () {
            return {};
        };
        productSearch['dw/catalog/CatalogMgr'] = {
            getCategory: function (catalogID) {
                return {
                    id: catalogID,
                    custom: {
                        experienceType: {
                            value: 'color'
                        }
                    }
                };
            },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {
                        isMaster: function () {
                            return true;
                        },
                        isVariant: function () {
                            return false;
                        },
                        custom: {
                            productTileBottomLeftBadge: 'productTileBottomLeftBadge',
                            productTileUpperLeftBadge: 'productTileUpperLeftBadge',
                            productTileUpperLeftFlameIconBadge: 'productTileUpperLeftFlameIconBadge',
                            giftCard: {
                                value: 'value'
                            },
                            defaultColorway: 'defaultColorway',
                            outletColors: '100'
                        }
                    };
                }
            }
        };
        var currentSearch = {
            hits: [
                {
                    product1: {
                        variationAttributes: new ArrayList([{
                            id: 'color',
                            values: new ArrayList([{
                                value: '100'
                            }, {
                                value: '825'
                            }])
                        }])
                    }
                }
            ],
            selected_refinements: {
                c_premiumFilter: {}
            }
        };
        var result = productSearch.modifyGETResponse(currentSearch);
        assert.isNotNull(result);
    });

    it('Testing product modifyGETResponse --> outlet colors empty outletColors', () => {
        global.session.getCurrency = function () {
            return {
                getCurrencyCode: function () {
                    return 'USD';
                }
            };
        };
        global.request.getLocale = function () {
            return {};
        };
        productSearch['dw/catalog/CatalogMgr'] = {
            getCategory: function (catalogID) {
                return {
                    id: catalogID,
                    custom: {
                        experienceType: {
                            value: 'color'
                        }
                    }
                };
            },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {
                        isMaster: function () {
                            return true;
                        },
                        isVariant: function () {
                            return false;
                        },
                        custom: {
                            productTileBottomLeftBadge: 'productTileBottomLeftBadge',
                            productTileUpperLeftBadge: 'productTileUpperLeftBadge',
                            productTileUpperLeftFlameIconBadge: 'productTileUpperLeftFlameIconBadge',
                            giftCard: {
                                value: 'value'
                            },
                            defaultColorway: 'defaultColorway',
                            outletColors: ''
                        }
                    };
                }
            }
        };
        var currentSearch = {
            hits: [
                {
                    product1: {
                        variationAttributes: new ArrayList([{
                            id: 'color',
                            values: new ArrayList([{
                                value: '100'
                            }, {
                                value: '825'
                            }])
                        }])
                    }
                }
            ],
            selected_refinements: {
                c_premiumFilter: {}
            }
        };
        var result = productSearch.modifyGETResponse(currentSearch);
        assert.isNotNull(result);
    });

    it('Testing product modifyGETResponse --> showRangePrice is true', () => {
        productSearch = proxyquire('../../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/product/product_search.js', {
            'dw/system/Status': function () { },
            'dw/util': {
                HashMap: function () {
                    return {
                        put: function () {
                            return {};
                        }
                    };
                },
                ArrayList
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
            '*/cartridge/scripts/helpers/pricing': {
                getPromotionPrice: function () {
                    return {
                        value: 1,
                        decimalValue: 1
                    };
                }
            },
            'dw/content/ContentMgr': {
                getContent: function () {
                    return {
                        online: 'online',
                        custom: {
                            appBody: {}
                        }
                    };
                }
            },
            './productHookUtils': {
                getProductUrl: function () {
                    return 'url';
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return {};
                }
            },
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            processCurrencyBasedOnCurrencyParam: true
                        }
                    }
                }
            },
            'dw/util/Currency': {
                getCurrency: function () {
                    return 'USD';
                }
            },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {
                        isMaster: function () {
                            return true;
                        },
                        isVariant: function () {
                            return false;
                        },
                        custom: {
                            productTileBottomLeftBadge: 'productTileBottomLeftBadge',
                            productTileUpperLeftBadge: 'productTileUpperLeftBadge',
                            productTileUpperLeftFlameIconBadge: 'productTileUpperLeftFlameIconBadge',
                            giftCard: {
                                value: 'value'
                            },
                            defaultColorway: 'defaultColorway',
                            outletColors: 'outletColors'
                        }
                    };
                }
            },
            'dw/catalog/CatalogMgr': {
                getCategory: function (catalogID) {
                    return {
                        id: catalogID,
                        custom: {
                            experienceType: {
                                value: 'outlet'
                            }
                        }
                    };
                }
            },
            'dw/catalog/PriceBookMgr': {
                getPriceBook: function () {
                    return {
                        getID: function () {
                            return 'ID';
                        }
                    };
                }
            },
            '*/cartridge/scripts/errorLogHelper': {
                handleOcapiHookErrorStatus: function () {
                    return {};
                }
            },
            'dw/system/Logger': {
                error: function () {
                    return 'error';
                },
                warn: function () {
                    return 'warn';
                }
            },
            '*/cartridge/scripts/util/ProductUtils.ds': {
                getOutletPricing: function () {
                    return {
                        salesPrice: {},
                        showRangePrice: {},
                        saleLowest: {},
                        saleHighest: {}
                    };
                },
                getAllPriceRanges: function () {
                    return {
                        minListPrice: {
                            value: 1
                        },
                        maxListPrice: {
                            value: 2
                        },
                        minSalePrice: {
                            value: 1
                        },
                        maxSalePrice: {
                            value: 2
                        }
                    };
                }
            },
            '*/cartridge/models/product/productImages': function () {
                return {
                    gridTileDesktop: [{}]
                };
            }
        });

        global.session.getCurrency = function () {
            return {
                getCurrencyCode: function () {
                    return 'USD';
                }
            };
        };
        global.request.getLocale = function () {
            return {};
        };
        var currentSearch = {
            hits: [
                {
                    product1: {}
                }
            ],
            selected_refinements: {
                c_premiumFilter: {}
            }
        };
        var result = productSearch.modifyGETResponse(currentSearch);
        assert.isNotNull(result);
    });

    it('Testing product modifyGETResponse --> getExperienceTypePricing --> Custom Exception', () => {
        var stub = sinon.stub();
        stub.throwsException('Custom Exception');
        productSearch = proxyquire('../../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/product/product_search.js', {
            'dw/system/Status': function () { },
            'dw/util': {
                HashMap: function () {
                    return {
                        put: function () {
                            return {};
                        }
                    };
                },
                ArrayList
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
                    return {
                        available: true,
                        compareTo: function () {
                            return 1;
                        },
                        value: 3
                    };
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
                            decimalValue: 1,
                            value: 1
                        },
                        maxSalePrice: {
                            decimalValue: 1,
                            value: 1
                        },
                        minListPrice: {
                            value: 3
                        }
                    };
                },
                getFirstVariantForGrid: function () {
                    return {
                        custom: {
                            isLoyaltyExclusive: 'isLoyaltyExclusive',
                            productTileUpperLeftBadge: 'productTileUpperLeftBadge',
                            productTileUpperLeftFlameIconBadge: 'productTileUpperLeftFlameIconBadge'
                        },
                        master: {},
                        priceModel: {
                            isPriceRange: function () {
                                return {};
                            },
                            minPrice: {
                                value: 2
                            },
                            maxPrice: {
                                value: 1
                            }
                        },
                        isMaster: function () {
                            return true;
                        },
                        isVariant: function () {
                            return false;
                        },
                        getMasterProduct: function () {
                            return {
                                ID: 'ID11'
                            };
                        },
                        ID: 'FirstVariant'
                    };
                }
            },
            '*/cartridge/scripts/helpers/pricing': {
                getPromotionPrice: function (param1, param2, param3) {
                    if (param1.ID === 'FirstVariant') {
                        return {
                            value: 1,
                            decimalValue: 1,
                            available: true
                        };
                    }
                    return {
                        value: 3,
                        decimalValue: 3,
                        available: true
                    };
                }
            },
            'dw/content/ContentMgr': {
                getContent: function () {
                    return {
                        online: 'online',
                        custom: {
                            appBody: {}
                        }
                    };
                }
            },
            './productHookUtils': {
                getProductUrl: function () {
                    return 'url';
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return {};
                },
                getJsonValue: function () {
                    return [{
                        'countryCode': 'AU',
                        'locales': [
                            'en_AU'
                        ],
                        'currencyCode': 'AUD',
                        'hostname': 'development-ap01.ecm.underarmour.com.au',
                        'priceBooks': [
                            'AUD-list',
                            'AUD-sale'
                        ],
                        '"regexp': '^[0-9- )(+]{8,20}$'
                    }];
                }
            },
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            processCurrencyBasedOnCurrencyParam: true
                        }
                    }
                }
            },
            'dw/util/Currency': {
                getCurrency: function () {
                    return 'USD';
                }
            },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {
                        isMaster: function () {
                            return true;
                        },
                        isVariant: function () {
                            return false;
                        },
                        custom: {
                            productTileBottomLeftBadge: 'productTileBottomLeftBadge',
                            productTileUpperLeftBadge: 'productTileUpperLeftBadge',
                            productTileUpperLeftFlameIconBadge: 'productTileUpperLeftFlameIconBadge',
                            giftCard: {
                                value: 'value'
                            },
                            defaultColorway: 'defaultColorway',
                            outletColors: 'premium'
                        },
                        master: true,
                        getMasterProduct: function () {
                            return {
                                ID: 'ID111',
                                custom: {
                                    productTileBottomLeftBadge: 'productTileBottomLeftBadge',
                                    productTileUpperLeftBadge: 'productTileUpperLeftBadge',
                                    productTileUpperLeftFlameIconBadge: 'productTileUpperLeftFlameIconBadge',
                                    giftCard: {
                                        value: 'value'
                                    },
                                    defaultColorway: 'defaultColorway',
                                    outletColors: 'premium'
                                },
                                master: true
                            };
                        }
                    };
                }
            },
            'dw/catalog/CatalogMgr': {
                getCategory: function (catalogID) {
                    return {
                        id: catalogID,
                        custom: {
                            experienceType: {
                                value: 'outlet'
                            }
                        }
                    };
                }
            },
            'dw/catalog/PriceBookMgr': {
                getPriceBook: function () {
                    return null;
                }
            },
            '*/cartridge/scripts/errorLogHelper': {
                handleOcapiHookErrorStatus: function () {
                    return {};
                }
            },
            'dw/system/Logger': {
                error: function () {
                    return 'error';
                },
                warn: function () {
                    return 'warn';
                }
            },
            '*/cartridge/scripts/util/ProductUtils.ds': {
                getOutletPricing: function () {
                    return {
                        salesPrice: {},
                        showRangePrice: {},
                        saleLowest: {},
                        saleHighest: {}
                    };
                },
                getAllPriceRanges: function () {
                    return {
                        minListPrice: {
                            value: 1
                        },
                        maxListPrice: {
                            value: 1
                        },
                        minSalePrice: {
                            value: 2
                        },
                        maxSalePrice: {
                            value: 1
                        }
                    };
                },
                getFirstVariantForGrid: function () {
                    return {
                        custom: {
                            isLoyaltyExclusive: 'isLoyaltyExclusive',
                            productTileUpperLeftBadge: 'productTileUpperLeftBadge',
                            productTileUpperLeftFlameIconBadge: 'productTileUpperLeftFlameIconBadge'
                        },
                        master: {},
                        priceModel: {
                            isPriceRange: function () {
                                return {};
                            },
                            minPrice: {
                                value: 2
                            },
                            maxPrice: {
                                value: 1
                            }
                        },
                        isMaster: function () {
                            return true;
                        },
                        isVariant: function () {
                            return false;
                        },
                        getMasterProduct: function () {
                            return {
                                ID: 'ID11'
                            };
                        },
                        ID: 'FirstVariant'
                    };
                }
            },
            '*/cartridge/models/product/productImages': function () {
                return {
                    gridTileDesktop: [{}]
                };
            }
        });


        var currentSearch = {
            hits: [
                {
                    product1: {}
                }
            ],
            selected_refinements: {
                c_premiumFilter: 'premium'
            }
        };
        var result = productSearch.modifyGETResponse(currentSearch);
        assert.isNotNull(result);
    });

    it('Testing product modifyGETResponse --> minPrice === maxPrice', () => {
        var stub = sinon.stub();
        stub.throwsException('Custom Exception');
        productSearch = proxyquire('../../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/product/product_search.js', {
            'dw/system/Status': function () { },
            'dw/util': {
                HashMap: function () {
                    return {
                        put: function () {
                            return {};
                        }
                    };
                },
                ArrayList
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
                    return {
                        available: true,
                        compareTo: function () {
                            return 1;
                        },
                        value: 3
                    };
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
                            decimalValue: 1,
                            value: 1
                        },
                        maxSalePrice: {
                            decimalValue: 1,
                            value: 1
                        },
                        minListPrice: {
                            value: 1
                        }
                    };
                },
                getFirstVariantForGrid: function () {
                    return {
                        custom: {
                            isLoyaltyExclusive: 'isLoyaltyExclusive',
                            productTileUpperLeftBadge: 'productTileUpperLeftBadge',
                            productTileUpperLeftFlameIconBadge: 'productTileUpperLeftFlameIconBadge'
                        },
                        master: {},
                        priceModel: {
                            isPriceRange: function () {
                                return {};
                            },
                            minPrice: {
                                value: 2
                            },
                            maxPrice: {
                                value: 1
                            }
                        },
                        isMaster: function () {
                            return true;
                        },
                        isVariant: function () {
                            return false;
                        },
                        getMasterProduct: function () {
                            return {
                                ID: 'ID11'
                            };
                        },
                        ID: 'FirstVariant'
                    };
                }
            },
            '*/cartridge/scripts/helpers/pricing': {
                getPromotionPrice: function (param1, param2, param3) {
                    if (param1.ID === 'FirstVariant') {
                        return {
                            value: 1,
                            decimalValue: 1,
                            available: true
                        };
                    }
                    return {
                        value: 3,
                        decimalValue: 3,
                        available: true
                    };
                }
            },
            'dw/content/ContentMgr': {
                getContent: function () {
                    return {
                        online: 'online',
                        custom: {
                            appBody: {}
                        }
                    };
                }
            },
            './productHookUtils': {
                getProductUrl: function () {
                    return 'url';
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return {};
                },
                getJsonValue: function () {
                    return [{
                        'countryCode': 'AU',
                        'locales': [
                            'en_AU'
                        ],
                        'currencyCode': 'AUD',
                        'hostname': 'development-ap01.ecm.underarmour.com.au',
                        'priceBooks': [
                            'AUD-list',
                            'AUD-sale'
                        ],
                        '"regexp': '^[0-9- )(+]{8,20}$'
                    }];
                }
            },
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            processCurrencyBasedOnCurrencyParam: true
                        }
                    }
                }
            },
            'dw/util/Currency': {
                getCurrency: function () {
                    return 'USD';
                }
            },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {
                        isMaster: function () {
                            return true;
                        },
                        isVariant: function () {
                            return false;
                        },
                        custom: {
                            productTileBottomLeftBadge: 'productTileBottomLeftBadge',
                            productTileUpperLeftBadge: 'productTileUpperLeftBadge',
                            productTileUpperLeftFlameIconBadge: 'productTileUpperLeftFlameIconBadge',
                            giftCard: {
                                value: 'value'
                            },
                            defaultColorway: 'defaultColorway',
                            outletColors: 'premium'
                        },
                        master: true,
                        getMasterProduct: function () {
                            return {
                                ID: 'ID111',
                                custom: {
                                    productTileBottomLeftBadge: 'productTileBottomLeftBadge',
                                    productTileUpperLeftBadge: 'productTileUpperLeftBadge',
                                    productTileUpperLeftFlameIconBadge: 'productTileUpperLeftFlameIconBadge',
                                    giftCard: {
                                        value: 'value'
                                    },
                                    defaultColorway: 'defaultColorway',
                                    outletColors: 'premium'
                                },
                                master: true
                            };
                        }
                    };
                }
            },
            'dw/catalog/CatalogMgr': {
                getCategory: function (catalogID) {
                    return {
                        id: catalogID,
                        custom: {
                            experienceType: {
                                value: 'outlet'
                            }
                        }
                    };
                }
            },
            'dw/catalog/PriceBookMgr': {
                getPriceBook: function () {
                    return null;
                }
            },
            '*/cartridge/scripts/errorLogHelper': {
                handleOcapiHookErrorStatus: function () {
                    return {};
                }
            },
            'dw/system/Logger': {
                error: function () {
                    return 'error';
                },
                warn: function () {
                    return 'warn';
                }
            },
            '*/cartridge/scripts/util/ProductUtils.ds': {
                getOutletPricing: function () {
                    return {
                        salesPrice: {},
                        showRangePrice: {},
                        saleLowest: {},
                        saleHighest: {}
                    };
                },
                getAllPriceRanges: function () {
                    return {
                        minListPrice: {
                            value: 1
                        },
                        maxListPrice: {
                            value: 1
                        },
                        minSalePrice: {
                            value: 2
                        },
                        maxSalePrice: {
                            value: 1
                        }
                    };
                },
                getFirstVariantForGrid: function () {
                    return {
                        custom: {
                            isLoyaltyExclusive: 'isLoyaltyExclusive',
                            productTileUpperLeftBadge: 'productTileUpperLeftBadge',
                            productTileUpperLeftFlameIconBadge: 'productTileUpperLeftFlameIconBadge'
                        },
                        master: {},
                        priceModel: {
                            isPriceRange: function () {
                                return {};
                            },
                            minPrice: {
                                value: 2
                            },
                            maxPrice: {
                                value: 1
                            }
                        },
                        isMaster: function () {
                            return true;
                        },
                        isVariant: function () {
                            return false;
                        },
                        getMasterProduct: function () {
                            return {
                                ID: 'ID11'
                            };
                        },
                        ID: 'FirstVariant'
                    };
                }
            },
            '*/cartridge/models/product/productImages': function () {
                return {
                    gridTileDesktop: [{}]
                };
            }
        });

        global.session.getCurrency = function () {
            return {
                getCurrencyCode: function () {
                    return 'USD';
                }
            };
        };
        global.request.getLocale = function () {
            return 'en_AU';
        };
        var currentSearch = {
            hits: [
                {
                    product1: {}
                }
            ],
            selected_refinements: {
                c_premiumFilter: 'premium'
            }
        };
        var result = productSearch.modifyGETResponse(currentSearch);
        assert.isNotNull(result);
    });

    it('Testing product modifyGETResponse --> getExperienceTypePricing --> Custom Exception', () => {
        var stub = sinon.stub();
        stub.throwsException('Custom Exception');
        productSearch = proxyquire('../../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/product/product_search.js', {
            'dw/system/Status': function () { },
            'dw/util': {
                HashMap: function () {
                    return {
                        put: function () {
                            return {};
                        }
                    };
                },
                ArrayList
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
                    return {
                        available: true,
                        compareTo: function () {
                            return 1;
                        },
                        value: 3
                    };
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
                            decimalValue: 1,
                            value: 1
                        },
                        maxSalePrice: {
                            decimalValue: 1,
                            value: 1
                        },
                        minListPrice: {
                            value: 3
                        }
                    };
                },
                getFirstVariantForGrid: function () {
                    return {
                        custom: {
                            isLoyaltyExclusive: 'isLoyaltyExclusive',
                            productTileUpperLeftBadge: 'productTileUpperLeftBadge',
                            productTileUpperLeftFlameIconBadge: 'productTileUpperLeftFlameIconBadge'
                        },
                        master: {},
                        priceModel: {
                            isPriceRange: function () {
                                return {};
                            },
                            minPrice: {
                                value: 2
                            },
                            maxPrice: {
                                value: 1
                            }
                        },
                        isMaster: function () {
                            return true;
                        },
                        isVariant: function () {
                            return false;
                        },
                        getMasterProduct: function () {
                            return {
                                ID: 'ID11'
                            };
                        },
                        ID: 'FirstVariant'
                    };
                }
            },
            '*/cartridge/scripts/helpers/pricing': {
                getPromotionPrice: function (param1, param2, param3) {
                    if (param1.ID === 'FirstVariant') {
                        return {
                            value: 1,
                            decimalValue: 1,
                            available: true
                        };
                    }
                    return {
                        value: 3,
                        decimalValue: 3,
                        available: true
                    };
                }
            },
            'dw/content/ContentMgr': {
                getContent: function () {
                    return {
                        online: 'online',
                        custom: {
                            appBody: {}
                        }
                    };
                }
            },
            './productHookUtils': {
                getProductUrl: function () {
                    return 'url';
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return {};
                },
                getJsonValue: function () {
                    return [{
                        'countryCode': 'AU',
                        'locales': [
                            'en_AU'
                        ],
                        'currencyCode': 'AUD',
                        'hostname': 'development-ap01.ecm.underarmour.com.au',
                        'priceBooks': [
                            'AUD-list',
                            'AUD-sale'
                        ],
                        '"regexp': '^[0-9- )(+]{8,20}$'
                    }];
                }
            },
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            processCurrencyBasedOnCurrencyParam: true
                        }
                    }
                }
            },
            'dw/util/Currency': {
                getCurrency: function () {
                    return 'USD';
                }
            },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {
                        isMaster: function () {
                            return true;
                        },
                        isVariant: function () {
                            return false;
                        },
                        custom: {
                            productTileBottomLeftBadge: 'productTileBottomLeftBadge',
                            productTileUpperLeftBadge: 'productTileUpperLeftBadge',
                            productTileUpperLeftFlameIconBadge: 'productTileUpperLeftFlameIconBadge',
                            giftCard: {
                                value: 'value'
                            },
                            defaultColorway: 'defaultColorway',
                            outletColors: 'premium'
                        },
                        master: true,
                        getMasterProduct: function () {
                            return {
                                ID: 'ID111',
                                custom: {
                                    productTileBottomLeftBadge: 'productTileBottomLeftBadge',
                                    productTileUpperLeftBadge: 'productTileUpperLeftBadge',
                                    productTileUpperLeftFlameIconBadge: 'productTileUpperLeftFlameIconBadge',
                                    giftCard: {
                                        value: 'value'
                                    },
                                    defaultColorway: 'defaultColorway',
                                    outletColors: 'premium'
                                },
                                master: true
                            };
                        }
                    };
                }
            },
            'dw/catalog/CatalogMgr': {
                getCategory: function (catalogID) {
                    return {
                        id: catalogID,
                        custom: {
                            experienceType: {
                                value: 'outlet'
                            }
                        }
                    };
                }
            },
            'dw/catalog/PriceBookMgr': {
                getPriceBook: function () {
                    return null;
                }
            },
            '*/cartridge/scripts/errorLogHelper': {
                handleOcapiHookErrorStatus: function () {
                    return {};
                }
            },
            'dw/system/Logger': {
                error: function () {
                    return 'error';
                },
                warn: function () {
                    return 'warn';
                }
            },
            '*/cartridge/scripts/util/ProductUtils.ds': {
                getOutletPricing: function () {
                    return {
                        salesPrice: {},
                        showRangePrice: {},
                        saleLowest: {},
                        saleHighest: {}
                    };
                },
                getAllPriceRanges: function () {
                    return {
                        minListPrice: {
                            value: 1
                        },
                        maxListPrice: {
                            value: 1
                        },
                        minSalePrice: {
                            value: 2
                        },
                        maxSalePrice: {
                            value: 1
                        }
                    };
                },
                getFirstVariantForGrid: function () {
                    return {
                        custom: {
                            isLoyaltyExclusive: 'isLoyaltyExclusive',
                            productTileUpperLeftBadge: 'productTileUpperLeftBadge',
                            productTileUpperLeftFlameIconBadge: 'productTileUpperLeftFlameIconBadge'
                        },
                        master: {},
                        priceModel: {
                            isPriceRange: function () {
                                return {};
                            },
                            minPrice: {
                                value: 2
                            },
                            maxPrice: {
                                value: 1
                            }
                        },
                        isMaster: function () {
                            return false;
                        },
                        isVariant: function () {
                            return true;
                        },
                        getMasterProduct: function () {
                            return {
                                ID: 'ID11'
                            };
                        },
                        ID: 'FirstVariant'
                    };
                }
            },
            '*/cartridge/models/product/productImages': function () {
                return {
                    gridTileDesktop: [{}]
                };
            }
        });

        global.session.getCurrency = function () {
            return {
                getCurrencyCode: function () {
                    return 'USD';
                }
            };
        };
        global.request.getLocale = function () {
            return 'en_AU';
        };
        var currentSearch = {
            hits: [
                {
                    product1: {}
                }
            ],
            selected_refinements: {
                c_premiumFilter: 'premium'
            }
        };
        var result = productSearch.modifyGETResponse(currentSearch);
        assert.isNotNull(result);
    });

    it('Testing product modifyGETResponse --> custom Exception', () => {
        var result = productSearch.modifyGETResponse({});
        assert.isNotNull(result);
    });

    it('Testing product modifyGETResponse --> identifies isLoyaltyExclusive color', () => {
        global.session = {};
        global.request = {};
        global.session.getCurrency = function () {
            return {
                getCurrencyCode: function () {
                    return 'USD';
                }
            };
        };
        global.request.getLocale = function () {
            return '';
        };
        const productSearch2 = proxyquire('../../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/product/product_search.js', {
            'dw/system/Status': function () { },
            'dw/util': {
                HashMap: function () {
                    return {
                        put: function () {
                            return {};
                        }
                    };
                },
                ArrayList
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
            '*/cartridge/scripts/helpers/pricing': {
                getPromotionPrice: function () {
                    return {
                        value: 1,
                        decimalValue: 1
                    };
                }
            },
            './productHookUtils': proxyquire('../../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/product/productHookUtils', {
                getProductUrl: function () {
                    return 'url';
                }
            }),
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return {};
                }
            },
            'dw/system/Site': require('../../../../../../mocks/dw/dw_system_Site.js'),
            'dw/util/Currency': {
                getCurrency: function () {
                    return 'USD';
                }
            },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {
                        isMaster: function () {
                            return true;
                        },
                        isVariant: function () {
                            return false;
                        },
                        custom: {
                            isLoyaltyExclusive: false
                        },
                        variants: [
                            {
                                custom: {
                                    color: '001',
                                    isLoyaltyExclusive: false,
                                    size: 'XS'
                                }
                            },
                            {
                                custom: {
                                    color: '001',
                                    isLoyaltyExclusive: false,
                                    size: 'MD'
                                }
                            },
                            {
                                custom: {
                                    color: '006',
                                    isLoyaltyExclusive: false,
                                    size: 'XD'
                                }
                            },
                            {
                                custom: {
                                    color: '006',
                                    isLoyaltyExclusive: true,
                                    size: 'MD'
                                }
                            },
                            {
                                custom: {
                                    color: '006',
                                    isLoyaltyExclusive: false,
                                    size: 'LG'
                                }
                            },
                            {
                                custom: {
                                    color: '009',
                                    isLoyaltyExclusive: false,
                                    size: 'XD'
                                }
                            },
                            {
                                custom: {
                                    color: '009',
                                    isLoyaltyExclusive: false,
                                    size: 'MD'
                                }
                            },
                            {
                                custom: {
                                    color: '009',
                                    isLoyaltyExclusive: false,
                                    size: 'LG'
                                }
                            },
                            {
                                custom: {
                                    color: '010',
                                    isLoyaltyExclusive: true,
                                    size: 'XD'
                                }
                            },
                            {
                                custom: {
                                    color: '010',
                                    isLoyaltyExclusive: true,
                                    size: 'MD'
                                }
                            },
                            {
                                custom: {
                                    color: '010',
                                    isLoyaltyExclusive: true,
                                    size: 'LG'
                                }
                            }
                        ]
                    };
                }
            },
            'dw/catalog/CatalogMgr': require('../../../../../../mocks/dw/dw_catalog_CatalogMgr.js'),
            'dw/catalog/PriceBookMgr': require('../../../../../../mocks/dw/dw_catalog_ProductMgr.js'),
            '*/cartridge/scripts/errorLogHelper': {
                handleOcapiHookErrorStatus: function () {
                    return {};
                }
            },
            'dw/system/Logger': require('../../../../../../mocks/dw/dw_system_Logger.js'),
            '*/cartridge/scripts/util/ProductUtils.ds': {
                getOutletPricing: function () {
                    return {
                        salesPrice: {},
                        showRangePrice: {},
                        saleLowest: {},
                        saleHighest: {}
                    };
                },
                getAllPriceRanges: function () {
                    return {
                        minListPrice: {
                            value: 1
                        },
                        maxListPrice: {
                            value: 2
                        },
                        minSalePrice: {
                            value: 1
                        },
                        maxSalePrice: {
                            value: 2
                        }
                    };
                }
            },
            '*/cartridge/models/product/productImages': function () {
                return {
                    gridTileDesktop: [{}]
                };
            }
        });


        var currentSearch = {
            hits: [
                {
                    product1: {}
                }
            ]
        };
        productSearch2.modifyGETResponse(currentSearch);
        assert.isFalse(currentSearch.hits[0].c_variantColors[0].isLoyaltyExclusiveColor);
        assert.isTrue(currentSearch.hits[0].c_variantColors[1].isLoyaltyExclusiveColor);
        assert.isFalse(currentSearch.hits[0].c_variantColors[2].isLoyaltyExclusiveColor);
        assert.isTrue(currentSearch.hits[0].c_variantColors[3].isLoyaltyExclusiveColor);
    });
});
