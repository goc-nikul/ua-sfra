'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

var ArrayList = require('../../../../../cartridges/storefront-reference-architecture/test/mocks/dw.util.Collection');

var stubRangePrice = sinon.stub();
var stubDefaultPrice = sinon.stub();
var stubPriceModel = sinon.stub();
var stubRootPriceBook = sinon.stub();

var pricModelMock = {
    priceInfo: {
        priceBook: { ID: 'somePriceBook' }
    }
};

var searchHitMock = {
    minPrice: { value: 100, available: true },
    maxPrice: { value: 100, available: true },
    firstRepresentedProduct: {
        ID: 'someProduct',
        getPriceModel: stubPriceModel
    },
    discountedPromotionIDs: ['someID'],
    getProduct: function () {
        return {
            custom: {
                outletColors: 'outletColors',
                selectedProductVariant: 'selectedProductVariant',
                colorSelected: 'colorSelected'
            }
        };
    }
};

var noActivePromotionsMock = [];
var activePromotionsMock = ['someID'];
var activePromotionsNoMatchMock = ['someOtherID'];
const apiProduct = searchHitMock.getProduct();
const getSelectedProductVariant = () => {};
const experienceType =  null;
const sizeModeViewPref = null;

describe('search price decorator', function () {
    var searchPrice = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/product/decorators/searchPrice', {
        'dw/campaign/PromotionMgr': {
            getPromotion: function () {
                return {};
            }
        },
        'dw/util/ArrayList': ArrayList,
        '*/cartridge/scripts/helpers/pricing': {
            getRootPriceBook: stubRootPriceBook,
            getPromotionPrice: function () { return { value: 50, available: true }; }
        },
        'dw/catalog/PriceBookMgr': {
            setApplicablePriceBooks: function () {},
            getApplicablePriceBooks: function () {
                return {
                    length: 1,
                    toArray: function () {
                        return [];
                    }
                };
            }
        },
        '*/cartridge/models/price/default': stubDefaultPrice,
        '*/cartridge/models/price/range': stubRangePrice,
        'dw/system/Logger': {},
        '*/cartridge/models/product/decorators/tileImages': {
            tileImageHelper: function() {}
        },
        '*/cartridge/scripts/util/ProductUtils.ds': {
            getOutletPricing: function () {
                return {
                    showRangePrice: 'showRangePrice'
                };
            }
        },
        'dw/value/Money': require('../../../../mocks/dw/dw_value_Money'),
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
    });

    afterEach(function () {
        stubRangePrice.reset();
        stubDefaultPrice.reset();
    });
    function getSearchHit() {
        return searchHitMock;
    }

    it('should create a property on the passed in object called price with no active promotions', function () {
        searchPrice = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/product/decorators/searchPrice', {
            'dw/campaign/PromotionMgr': {
                getPromotion: function () {
                    return {};
                }
            },
            'dw/util/ArrayList': ArrayList,
            '*/cartridge/scripts/helpers/pricing': {
                getRootPriceBook: stubRootPriceBook,
                getPromotionPrice: function () { return { value: 50, available: true }; }
            },
            'dw/catalog/PriceBookMgr': {
                setApplicablePriceBooks: function () {},
                getApplicablePriceBooks: function () {}
            },
            '*/cartridge/models/price/default': stubDefaultPrice,
            '*/cartridge/models/price/range': stubRangePrice,
            'dw/system/Logger': {
                error: function () {
                    return {};
                }
            },
            '*/cartridge/models/product/decorators/tileImages': {
                tileImageHelper: function() {}
            },
            '*/cartridge/scripts/util/ProductUtils.ds': {
                getOutletPricing: function () {
                    return {};
                }
            },
            'dw/value/Money': require('../../../../mocks/dw/dw_value_Money'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        var object = {};
        stubPriceModel.returns(pricModelMock);
        stubRootPriceBook.returns({ ID: 'someOtherPriceBook' });
        searchPrice(object, searchHitMock, noActivePromotionsMock, getSearchHit, experienceType, getSelectedProductVariant, apiProduct, sizeModeViewPref);
        assert.isTrue(stubDefaultPrice.withArgs({ value: 100, available: true }).calledOnce);
    });

    it('should create a property on the passed in object called price with no active promotions --> experienceType = outletColors', function () {
        var object = {};
        stubPriceModel.returns(pricModelMock);
        stubRootPriceBook.returns({ ID: 'someOtherPriceBook' });
        searchPrice(object, searchHitMock, noActivePromotionsMock, getSearchHit, 'outletColors');
        assert.isFalse(stubDefaultPrice.withArgs({ value: 100, available: true }).calledOnce);
    });

    it('should create a property on the passed in object called price when there are active promotion but they do not match --> LRAPriceObj contains showStandardPrice', function () {
        searchPrice = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/product/decorators/searchPrice', {
            'dw/campaign/PromotionMgr': {
                getPromotion: function () {
                    return {};
                }
            },
            'dw/util/ArrayList': ArrayList,
            '*/cartridge/scripts/helpers/pricing': {
                getRootPriceBook: stubRootPriceBook,
                getPromotionPrice: function () { return { value: 50, available: true }; }
            },
            'dw/catalog/PriceBookMgr': {
                setApplicablePriceBooks: function () {},
                getApplicablePriceBooks: function () {}
            },
            '*/cartridge/models/price/default': stubDefaultPrice,
            '*/cartridge/models/price/range': stubRangePrice,
            'dw/system/Logger': {},
            '*/cartridge/models/product/decorators/tileImages': {
                tileImageHelper: function() {}
            },
            '*/cartridge/scripts/util/ProductUtils.ds': {
                getOutletPricing: function () {
                    return {
                        showStandardPrice: 'showStandardPrice'
                    };
                }
            },
            'dw/value/Money': require('../../../../mocks/dw/dw_value_Money'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        var object = {};
        stubPriceModel.returns(pricModelMock);
        stubRootPriceBook.returns({ ID: 'someOtherPriceBook' });

        searchPrice(object, searchHitMock, activePromotionsNoMatchMock, getSearchHit, 'outletColors');

        assert.isFalse(stubDefaultPrice.withArgs({ value: 100, available: true }).calledOnce); //
    });

    it('should create a property on the passed in object called price when there active promotions that do match --> LRAPriceObj does not contains showRangePrice or showStandardPrice', function () {
        searchPrice = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/product/decorators/searchPrice', {
            'dw/campaign/PromotionMgr': {
                getPromotion: function () {
                    return {};
                }
            },
            'dw/util/ArrayList': ArrayList,
            '*/cartridge/scripts/helpers/pricing': {
                getRootPriceBook: stubRootPriceBook,
                getPromotionPrice: function () { return { value: 50, available: true }; }
            },
            'dw/catalog/PriceBookMgr': {
                setApplicablePriceBooks: function () {},
                getApplicablePriceBooks: function () {}
            },
            '*/cartridge/models/price/default': stubDefaultPrice,
            '*/cartridge/models/price/range': stubRangePrice,
            'dw/system/Logger': {
                error: function () {
                    return {};
                }
            },
            '*/cartridge/models/product/decorators/tileImages': {
                tileImageHelper: function() {}
            },
            '*/cartridge/scripts/util/ProductUtils.ds': {
                getOutletPricing: function () {
                    return {};
                }
            },
            'dw/value/Money': require('../../../../mocks/dw/dw_value_Money'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        var object = {};
        stubPriceModel.returns(pricModelMock);
        stubRootPriceBook.returns({ ID: 'someOtherPriceBook' });
        searchPrice(object, searchHitMock, activePromotionsMock, getSearchHit, 'outletColors'); //

        assert.isFalse(stubDefaultPrice.withArgs({ value: 50, available: false }, { value: 100, available: false }).calledOnce);
    });

    it('should create a property on the passed in object called price', function () {
        searchPrice = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/product/decorators/searchPrice', {
            'dw/campaign/PromotionMgr': {
                getPromotion: function () {
                    return {};
                }
            },
            'dw/util/ArrayList': ArrayList,
            '*/cartridge/scripts/helpers/pricing': {
                getRootPriceBook: stubRootPriceBook,
                getPromotionPrice: function () { return { value: 50, available: true }; }
            },
            'dw/catalog/PriceBookMgr': {
                setApplicablePriceBooks: function () {},
                getApplicablePriceBooks: function () {}
            },
            '*/cartridge/models/price/default': stubDefaultPrice,
            '*/cartridge/models/price/range': stubRangePrice,
            'dw/system/Logger': {
                error: function () {
                    return {};
                }
            },
            '*/cartridge/models/product/decorators/tileImages': {
                tileImageHelper: function() {}
            },
            '*/cartridge/scripts/util/ProductUtils.ds': {
                getOutletPricing: function () {
                    return {};
                }
            },
            'dw/value/Money': require('../../../../mocks/dw/dw_value_Money'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        var object = {};
        stubPriceModel.returns(pricModelMock);
        stubRootPriceBook.returns({ ID: 'somePriceBook' });
        searchPrice(object, searchHitMock, activePromotionsMock, getSearchHit, experienceType, getSelectedProductVariant, apiProduct, sizeModeViewPref);

        assert.isTrue(stubDefaultPrice.withArgs({ value: 50, available: true }, { value: 100, available: true }).calledOnce);
    });

    it('should create a property on the passed in object called price', function () {
        searchPrice = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/product/decorators/searchPrice', {
            'dw/campaign/PromotionMgr': {
                getPromotion: function () {
                    return {};
                }
            },
            'dw/util/ArrayList': ArrayList,
            '*/cartridge/scripts/helpers/pricing': {
                getRootPriceBook: stubRootPriceBook,
                getPromotionPrice: function () { return { value: 50, available: true }; }
            },
            'dw/catalog/PriceBookMgr': {
                setApplicablePriceBooks: function () {},
                getApplicablePriceBooks: function () {}
            },
            '*/cartridge/models/price/default': stubDefaultPrice,
            '*/cartridge/models/price/range': stubRangePrice,
            'dw/system/Logger': {
                error: function () {
                    return {};
                }
            },
            '*/cartridge/models/product/decorators/tileImages': {
                tileImageHelper: function() {}
            },
            '*/cartridge/scripts/util/ProductUtils.ds': {
                getOutletPricing: function () {
                    return {};
                }
            },
            'dw/value/Money': require('../../../../mocks/dw/dw_value_Money'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        var object = {};
        stubPriceModel.returns(pricModelMock);
        stubRootPriceBook.returns({ ID: 'someOtherPriceBook' });
        searchHitMock.maxPrice.value = 200;
        searchPrice(object, searchHitMock, noActivePromotionsMock, getSearchHit, experienceType, getSelectedProductVariant, apiProduct, sizeModeViewPref);

        assert.isTrue(stubRangePrice.withArgs({ value: 100, available: true }, { value: 200, available: true }).calledOnce);
    });

    it('should create a property on the passed in object called price', function () {
        searchPrice = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/product/decorators/searchPrice', {
            'dw/campaign/PromotionMgr': {
                getPromotion: function () {
                    return {};
                }
            },
            'dw/util/ArrayList': ArrayList,
            '*/cartridge/scripts/helpers/pricing': {
                getRootPriceBook: stubRootPriceBook,
                getPromotionPrice: function () { return { value: 50, available: true }; }
            },
            'dw/catalog/PriceBookMgr': {
                setApplicablePriceBooks: function () {},
                getApplicablePriceBooks: function () {}
            },
            '*/cartridge/models/price/default': stubDefaultPrice,
            '*/cartridge/models/price/range': stubRangePrice,
            'dw/system/Logger': {
                error: function () {
                    return {};
                }
            },
            '*/cartridge/models/product/decorators/tileImages': {
                tileImageHelper: function() {}
            },
            '*/cartridge/scripts/util/ProductUtils.ds': {
                getOutletPricing: function () {
                    return {};
                }
            },
            'dw/value/Money': require('../../../../mocks/dw/dw_value_Money'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        function getSearchHit2() {
            return { minPrice: {}, maxPrice: {} };
        }
        var object = {};
        stubPriceModel.returns(pricModelMock);
        stubRootPriceBook.returns({ ID: 'someOtherPriceBook' });
        searchHitMock.maxPrice.value = 200;
        searchPrice(object, searchHitMock, noActivePromotionsMock, getSearchHit2, experienceType, getSelectedProductVariant, apiProduct, sizeModeViewPref);

        assert.isTrue(stubRangePrice.withArgs({ value: 100, available: true }, { value: 200, available: true }).calledOnce);
    });

    it('getListPrices retutn empty object, range price returned', function () {
        searchPrice = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/product/decorators/searchPrice', {
            'dw/campaign/PromotionMgr': {
                getPromotion: function () {
                    return {};
                }
            },
            'dw/util/ArrayList': ArrayList,
            '*/cartridge/scripts/helpers/pricing': {
                getRootPriceBook: stubRootPriceBook,
                getPromotionPrice: function () { return { value: 50, available: true }; }
            },
            'dw/catalog/PriceBookMgr': {
                setApplicablePriceBooks: function () {},
                getApplicablePriceBooks: function () {}
            },
            '*/cartridge/models/price/default': stubDefaultPrice,
            '*/cartridge/models/price/range': stubRangePrice,
            'dw/system/Logger': {
                error: function () {
                    return {};
                }
            },
            '*/cartridge/models/product/decorators/tileImages': {
                tileImageHelper: function() {}
            },
            '*/cartridge/scripts/util/ProductUtils.ds': {
                getOutletPricing: function () {
                    return {};
                }
            },
            'dw/value/Money': require('../../../../mocks/dw/dw_value_Money'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        function getSearchHit1() {
            return null;
        }
        var object = {};
        stubPriceModel.returns(pricModelMock);
        stubRootPriceBook.returns({ ID: 'someOtherPriceBook' });
        searchHitMock.maxPrice.value = 200;
        searchPrice(object, searchHitMock, noActivePromotionsMock, getSearchHit1, experienceType, getSelectedProductVariant, apiProduct, sizeModeViewPref);

        assert.isTrue(stubRangePrice.withArgs({ value: 100, available: true }, { value: 200, available: true }).calledOnce);
    });

    it('Test custom error', function () {
        var stub = sinon.stub();
        var expectedError = new Error('Custom Error Check');
        stub.throws(expectedError);
        searchPrice = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/product/decorators/searchPrice', {
            'dw/campaign/PromotionMgr': {
                getPromotion: function () {
                    return {};
                }
            },
            'dw/util/ArrayList': ArrayList,
            '*/cartridge/scripts/helpers/pricing': {
                getRootPriceBook: stubRootPriceBook,
                getPromotionPrice: function () { return { value: 50, available: true }; }
            },
            'dw/catalog/PriceBookMgr': {
                setApplicablePriceBooks: function () {},
                getApplicablePriceBooks: function () {}
            },
            '*/cartridge/models/price/default': stubDefaultPrice,
            '*/cartridge/models/price/range': stubRangePrice,
            'dw/system/Logger': {
                error: function () {
                    return {};
                }
            },
            '*/cartridge/models/product/decorators/tileImages': {
                tileImageHelper: function() {}
            },
            '*/cartridge/scripts/util/ProductUtils.ds': {
                getOutletPricing: stub
            },
            'dw/value/Money': require('../../../../mocks/dw/dw_value_Money'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        var object = {};
        stubPriceModel.returns({});
        stubRootPriceBook.returns({ ID: 'someOtherPriceBook' });
        searchPrice(object, searchHitMock, activePromotionsMock, getSearchHit, 'outletColors', getSelectedProductVariant, apiProduct, sizeModeViewPref);
    });

    it('Test custom error in getListPrices function', function () {
        searchPrice = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/product/decorators/searchPrice', {
            'dw/campaign/PromotionMgr': {
                getPromotion: function () {
                    return {};
                }
            },
            'dw/util/ArrayList': ArrayList,
            '*/cartridge/scripts/helpers/pricing': {
                getRootPriceBook: stubRootPriceBook,
                getPromotionPrice: function () { return { value: 50, available: true }; }
            },
            'dw/catalog/PriceBookMgr': {
                setApplicablePriceBooks: function () {},
                getApplicablePriceBooks: function () {}
            },
            '*/cartridge/models/price/default': stubDefaultPrice,
            '*/cartridge/models/price/range': stubRangePrice,
            'dw/system/Logger': {
                error: function () {
                    return {};
                }
            },
            '*/cartridge/models/product/decorators/tileImages': {
                tileImageHelper: function() {}
            },
            '*/cartridge/scripts/util/ProductUtils.ds': {
                getOutletPricing: function () {
                    return {};
                }
            },
            'dw/value/Money': require('../../../../mocks/dw/dw_value_Money'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        var object = {};
        stubPriceModel.returns(pricModelMock);
        stubRootPriceBook.returns({ ID: 'someOtherPriceBook' });
        searchPrice(object, searchHitMock, activePromotionsMock, experienceType, getSelectedProductVariant, apiProduct, sizeModeViewPref);
    });
});
