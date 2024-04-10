'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

var productHookMocks = {
    'dw/system/Site': {
        current: {
            preferences: {
                custom: {
                    processCurrencyBasedOnCurrencyParam: true
                }
            }
        },
        getCurrent() {
            return {
                getID: function () {
                    return 'US';
                }
            };
        }
    },
    'dw/web/URLUtils': {
        url: function () {
            return '';
        }
    }
};

describe('int_ocapi/cartridge/hooks/shop/product/product.js', () => {
    beforeEach(() => {
        global.request = {
            getLocale: function () {
                return '';
            }
        };
    });
    var product = proxyquire('../../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/product/product.js', {
        'dw/system/Status': function () { },
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
                    return {};
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
                    value: 2,
                    available: true,
                    compareTo: function () {
                        return 1;
                    }
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
                        decimalValue: 2
                    },
                    maxSalePrice: {
                        decimalValue: 2
                    },
                    minListPrice: {}
                };
            },
            getFirstVariantForGrid: function () {
                return 'FirstVariant';
            }
        },
        '*/cartridge/scripts/helpers/pricing': {
            getPromotionPrice: function (param1, param2, param3) {
                return {
                    value: 2,
                    decimalValue: 2,
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
        './productHookUtils': proxyquire('../../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/product/productHookUtils', productHookMocks),
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
        '*/cartridge/scripts/util/collections': {
            map: function () {
                return []
            }
        }
    });

    it('Testing modifyGETResponse', () => {
        global.customer.isMemberOfCustomerGroup = function () {
            return true;
        };
        global.request.getHttpParameters = function () {
            return {
                get: function () {
                    return {
                        currency: ['currency']
                    };
                }
            };
        };
        global.session.getCurrency = function () {
            return {
                getCurrencyCode: function () {
                    return 'USD';
                }
            };
        };

        global.session.setCurrency = function () {
            return {
                getCurrencyCode: function () {
                    return 'USD';
                }
            };
        };
        var productObj = {
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
                    value: 1
                },
                maxPrice: {
                    value: 1
                }
            },
            isMaster: function () {
                return {};
            }
        };
        var productResponse = {
            c_sizeCalloutAssetID: 'c_sizeCalloutAssetID',
            type: {
                master: {},
                variant: {}
            },
            price: 3
        };
        var result = product.modifyGETResponse(productObj, productResponse);
        assert.isNotNull(result);
    });

    it('Testing modifyGETResponse --> isPriceRange return false', () => {

        product = proxyquire('../../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/product/product.js', {
            'dw/system/Status': function () { },
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
                        return {};
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
                        value: 2,
                        available: true,
                        compareTo: function () {
                            return 1;
                        }
                    };
                },
                getAllPriceRanges: function () {
                    return {
                        minSalePrice: {
                            value: 2
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
                            return {};
                        },
                        getMasterProduct: function () {
                            return {
                                ID: 'ID'
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
                        value: 2,
                        decimalValue: 2,
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
            './productHookUtils': proxyquire('../../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/product/productHookUtils', productHookMocks),
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
            '*/cartridge/scripts/util/collections': {
                map: function () {
                    return []
                }
            }
        });
        global.customer.isMemberOfCustomerGroup = function () {
            return true;
        };
        global.request.getHttpParameters = function () {
            return {
                get: function () {
                    return {
                        currency: ['currency']
                    };
                }
            };
        };
        global.session.getCurrency = function () {
            return {
                getCurrencyCode: function () {
                    return 'USD';
                }
            };
        };

        global.session.setCurrency = function () {
            return {
                getCurrencyCode: function () {
                    return 'USD';
                }
            };
        };
        var productObj = {
            custom: {
                isLoyaltyExclusive: 'isLoyaltyExclusive',
                productTileUpperLeftBadge: 'productTileUpperLeftBadge',
                productTileUpperLeftFlameIconBadge: 'productTileUpperLeftFlameIconBadge'
            },
            master: {},
            priceModel: {
                isPriceRange: function () {
                    return false;
                },
                minPrice: {
                    value: 2
                },
                maxPrice: {
                    value: 1
                }
            },
            isMaster: function () {
                return {};
            },
            getMasterProduct: function () {
                return {
                    ID: 'ID'
                };
            },
            ID: 'ID'
        };
        var productResponse = {
            c_sizeCalloutAssetID: 'c_sizeCalloutAssetID',
            type: {
                master: {},
                variant: {}
            },
            price: 3
        };
        var result = product.modifyGETResponse(productObj, productResponse);
        assert.isNotNull(result);
    });

    it('Testing modifyGETResponse --> productResponse.type.master not null', () => {
        global.customer.isMemberOfCustomerGroup = function () {
            return true;
        };
        global.request.getHttpParameters = function () {
            return {
                get: function () {
                    return {
                        currency: ['currency']
                    };
                }
            };
        };
        global.session.getCurrency = function () {
            return {
                getCurrencyCode: function () {
                    return 'USD';
                }
            };
        };

        global.session.setCurrency = function () {
            return {
                getCurrencyCode: function () {
                    return 'USD';
                }
            };
        };
        var productObj = {
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
                    value: 1
                },
                maxPrice: {
                    value: 1
                }
            },
            isMaster: function () {
                return {};
            },
            getMasterProduct: function () {
                return {
                    ID: 'ID'
                };
            },
            ID: 'ID'
        };
        var productResponse = {
            c_sizeCalloutAssetID: 'c_sizeCalloutAssetID',
            type: {
                master: null,
                variant: {}
            },
            price: 3
        };
        var result = product.modifyGETResponse(productObj, productResponse);
        assert.isNotNull(result);
    });

    it('Testing modifyGETResponse --> isLoyaltyProduct', () => {
        global.customer.isMemberOfCustomerGroup = function () {
            return false;
        };
        global.request.getHttpParameters = function () {
            return {
                get: function () {
                    return {
                        currency: ['currency']
                    };
                }
            };
        };
        global.session.getCurrency = function () {
            return {
                getCurrencyCode: function () {
                    return 'USD';
                }
            };
        };

        global.session.setCurrency = function () {
            return {
                getCurrencyCode: function () {
                    return 'USD';
                }
            };
        };
        var productObj = {
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
                    value: 1
                },
                maxPrice: {
                    value: 1
                }
            },
            isMaster: function () {
                return {};
            },
            getMasterProduct: function () {
                return {
                    ID: 'ID'
                };
            },
            ID: 'ID'
        };
        var productResponse = {
            c_sizeCalloutAssetID: 'c_sizeCalloutAssetID',
            type: {
                master: null,
                variant: {}
            },
            price: 3
        };
        var result = product.modifyGETResponse(productObj, productResponse);
        assert.isNotNull(result);
    });
});
