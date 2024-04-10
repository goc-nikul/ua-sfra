'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var Collections = require('../../mocks/dw/dw_util_Collection');

describe('app_ua_core/cartridge/scripts/helpers/ProductHelpers test', () => {
    global.empty = (data) => {
        return !data;
    };

    let ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
        '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
        'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
        'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
        'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
        'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
        'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
        'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),
        'dw/catalog/ProductSearchModel': require('../../mocks/dw/dw_catalog_ProductSearchModel'),
        'int_mao/cartridge/scripts/availability/MAOAvailabilityHelper': {
            isCheckPointEnabled: function (checkPoint) {
                return true;
            },
            getGiftBoxSKUS: function (products) {
                return {};
            }
        },
        'int_mao/cartridge/scripts/availability/MAOAvailability': {
            getMaoAvailability: function (items) {
                return {};
            }
        },
        '*/cartridge/scripts/helpers/ProductHelper': {
        	getOrderableVariant: function (product) {
        		return product;
        	}
        },
        '*/cartridge/scripts/cart/cartHelpers': {
            getExistingProductLineItemInCart: function() {
                return true;
            }
        },
        'dw/util/HashMap' : require('../../mocks/dw/dw_util_HashMap'),
    });

    it('Testing method: getConfig', () => {
        global.request = {
            httpPath: '/'
        };
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        var param = {pid:'883814258849', variantColor:'003'};
        var result = ProductHelper.getConfig(product, param);
        assert.equal(result.colorAttrSelection.color , param.variantColor);
        assert.equal(result.apiProduct.ID , product.ID);
    });

    it('Testing method: showGiftBoxes', () => {
        var result = ProductHelper.showGiftBoxes();
        assert.isTrue(result.length > 0)
    });

    it('Testing method: filterColorSwatches', () => {
        var product = {
            raw: {
                custom: {
                    outletColors: null
                },
                variationModel: {
                    getVariants: function (map) {
                        return new Collections(
                            {
                                custom: {
                                    earlyAccessConfigs: {
                                        value: 'NO'
                                    }
                                }
                            });
                    }
                }
            }
        };
        var sourceValue = [{color:{hex: '#4C6B81'}, displayValue:'Black', value: '303',id:'303'}];
        var result = ProductHelper.filterColorSwatches(sourceValue, product , '');
        assert.equal(result[0].id , sourceValue[0].id);
    });

    it('Testing method: isMFOItem', () => {

        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/util/HashMap' : require('../../mocks/dw/dw_util_HashMap'),
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            },
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            hideMFOItems: true
                        }
                    },
                    getCustomPreferenceValue: function () {
                        return true;
                    }
                }
            },
            'dw/system/Logger': {
                error: function () {
                    return {};
                }
            }
        });
      var product = {
        variant: {},
        variationModel: {
            master: {
                custom: {
                    isMFOItem: true
                }
            }
        }
      }
        var result = ProductHelper.isMFOItem(product);
        assert.isTrue(result);
    });

    it('Testing method: isMFOItem --> pass null value', () => {

        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/util/HashMap' : require('../../mocks/dw/dw_util_HashMap'),
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            },
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            hideMFOItems: true
                        }
                    },
                    getCustomPreferenceValue: function () {
                        return true;
                    }
                }
            },
            'dw/system/Logger': {
                error: function () {
                    return {};
                }
            }
        });
          var result = ProductHelper.isMFOItem(null);
          assert.isFalse(result);
    });

      it('Testing method: isMFOItem -->Test Custom Exception', () => {

        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            'dw/util/HashMap' : require('../../mocks/dw/dw_util_HashMap'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            },
            'dw/system/Site': {
                current: {
                }
            },
            'dw/system/Logger': {
                error: function () {
                    return {};
                }
            }
        });

        var product = {
            variant: {},
            variationModel: {
                master: {
                    custom: {
                        isMFOItem: true
                    }
                }
            }
        }
        var result = ProductHelper.isMFOItem(product);
        assert.isFalse(result);
    });

    it('Testing method: isPdpReturnExchangeMsgEnable', () => {

        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/util/HashMap' : require('../../mocks/dw/dw_util_HashMap'),
            'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),        
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            },'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            isPdpReturnExchangeEnable: true
                        }
                    },
                    getPreferences: function () {
                        return {
                            getCustom: function () {
                              return {
                                isPdpReturnExchangeEnable: true
                              }
                            }
                        }
                    }
                }
            },
            'dw/system/Logger': {
                error: function () {
                    return {};
                }
            }
        });
        var product = {
            variant: {},
            variationModel: {
                master: {
                    custom: {
                        isPdpReturnMsgExcluded: false
                    }
                }
            }
        }
        var result = ProductHelper.isPdpReturnExchangeMsgEnable(product);
        assert.isTrue(result);
    });

    it('Testing method: isPdpReturnExchangeMsgEnable --> pass null value', () => {

        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/util/HashMap' : require('../../mocks/dw/dw_util_HashMap'),
            'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),        
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            },'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            isPdpReturnExchangeEnable: true
                        }
                    },
                    getPreferences: function () {
                        return {
                            getCustom: function () {
                              return {
                                isPdpReturnExchangeEnable: true
                              }
                            }
                        }
                    }
                }
            },
            'dw/system/Logger': {
                error: function () {
                    return {};
                }
            }
        });
          var result = ProductHelper.isPdpReturnExchangeMsgEnable(null);
          assert.isFalse(result);
    });

    it('Testing method: isPdpReturnExchangeMsgEnable -->Test Custom Exception', () => {

        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/util/HashMap' : require('../../mocks/dw/dw_util_HashMap'),
            'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),        
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            },'dw/system/Site': {
                current: {
                }
            },
            'dw/system/Logger': {
                error: function () {
                    return {};
                }
            }
        });
        var product = {
            variant: {},
            variationModel: {
                master: {
                    custom: {
                        isPdpReturnMsgExcluded: false
                    }
                }
            }
        }
        var result = ProductHelper.isPdpReturnExchangeMsgEnable(product);
        assert.isFalse(result);
    });

    it('Testing method: getConfig --> master', () => {
        var ArrayList = require('../../../cartridges/storefront-reference-architecture/test/mocks/dw.util.Collection');
        var product = {
            variationModel: {
                productVariationAttributes: new ArrayList([
                    {
                        ID: 'color'
                    },
                    {
                        ID: 'color'
                    },
                    {
                        ID: 'length'
                    }
                ]),
                getAllValues: function () {
                    return  new ArrayList([{
                        length: 1,
                        ID: 'color',
                        value: 'variantColor',
                        get: function () {
                            return {
                                ID: 'ID',
                                value: 'variantColor'
                            }
                        }
                    }])
                },
                master: {},
                selectedVariant: null,
                setSelectedAttributeValue: function () {
                    return {};
                }
            },
            master: {},
            optionModel: {
                options: new ArrayList([{
                    length: 1,
                    ID: 'color',
                    value: 'variantColor',
                    get: function () {
                        return {
                            ID: 'ID',
                            value: 'variantColor'
                        }
                    }
                }]),
                getOptionValue: function () {
                    return {}
                },
                setSelectedOptionValue: function () {
                    return {};
                }
            }
        };
        var param = {
            variables: {
                color: 'color'
            },
            variantColor: 'variantColor',
            options: [{optionId:'color'}]
        }
        var result = ProductHelper.getConfig(product, param);
        assert.isNotNull(result);
    });

    it('Testing method: getConfig --> Test all product types', () => {
        var ArrayList = require('../../../cartridges/storefront-reference-architecture/test/mocks/dw.util.Collection');
        var product = {
            variationModel: {
                productVariationAttributes: new ArrayList([
                    {
                        ID: 'color'
                    },
                    {
                        ID: 'color'
                    },
                    {
                        ID: 'length'
                    }
                ]),
                getAllValues: function () {
                    return  new ArrayList([{
                        length: 1,
                        ID: 'color',
                        get: function () {
                            return {
                                ID: 'ID'
                            }
                        }
                    }])
                },
                master: {},
                selectedVariant: null
            },
            master:null,
            optionModel: {
                options: new ArrayList([{
                    length: 1,
                    ID: 'color',
                    get: function () {
                        return {
                            ID: 'ID'
                        }
                    }
                }]),
                getOptionValue: function () {
                    return {}
                },
                setSelectedOptionValue: function () {
                    return {};
                }
            }
        };
        var param = {
            variables: {
                color: 'color'
            },
            variantColor: 'variantColor',
            options: [{optionId:'color'}]
        }
        var result = ProductHelper.getConfig(product, param);
        assert.isNotNull(result);
        // Test Product Type Function
        product.variant = 'variant';
        var result = ProductHelper.getConfig(product, param);

        product.variant = null;
        product.variationGroup = 'product'
        var result = ProductHelper.getConfig(product, param);

        product.variationGroup = null;
        product.productSet = 'product'
        var result = ProductHelper.getConfig(product, param);

        product.productSet = null;
        product.bundle = 'bundle'
        var result = ProductHelper.getConfig(product, param);

        product.bundle = null;
        product.optionProduct = 'optionProduct'
        var result = ProductHelper.getConfig(product, param);
        assert.equal(result.productType, 'optionProduct');
    });

    it('Testing method: showGiftBoxes', () => {

        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),
            'dw/catalog/ProductSearchModel': require('../../mocks/dw/dw_catalog_ProductSearchModel'),
            'dw/util/HashMap' : require('../../mocks/dw/dw_util_HashMap'),
            'int_mao/cartridge/scripts/availability/MAOAvailabilityHelper': {
                isCheckPointEnabled: function (checkPoint) {
                    return true;
                },
                getGiftBoxSKUS: function (products) {
                    return {};
                }
            },
            'int_mao/cartridge/scripts/availability/MAOAvailability': {
                getMaoAvailability: function (items) {
                    return {};
                }
            },
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return false;
                }
            }
        });
        var result = ProductHelper.showGiftBoxes();
        assert.isTrue(result.length > 0)
    });

    it('Testing method: filterColorSwatches --> hide early access product', () => {
        var product = {
            raw: {
                custom: {
                    outletColors: ['outletColors', 'outletColors1']
                },
                variationModel: {
                    getVariants: function (map) {
                        return new Collections(
                            {
                                custom: {
                                    earlyAccessConfigs: {
                                        value: 'HIDE'
                                    }
                                }
                            });
                    }
                }
            }
        }
        var sourceValues = [{ id: 'outletColors' }, { id: 'outletColors1' }]
        var result = ProductHelper.filterColorSwatches(sourceValues, product, 'premium');
        assert.isFalse(result.length > 0)
    });

    it('Testing method: filterColorSwatches --> premium experienceType', () => {
        var product = {
            raw: {
                custom: {
                    outletColors: ['outletColors', 'outletColors1']
                },
                variationModel: {
                    getVariants: function (map) {
                        return new Collections(
                            {
                                custom: {
                                    earlyAccessConfigs: {
                                        value: 'NO'
                                    }
                                }
                            });
                    }
                }
            }
        }
        var sourceValues = [ {id: 'outletColors'}, {id : 'outletColors1'}]
        var result = ProductHelper.filterColorSwatches(sourceValues, product, 'premium');
        assert.isFalse(result.length > 0)
    });

    it('Testing method: filterColorSwatches --> outlet experienceType', () => {
        var product = {
            raw: {
                custom: {
                    outletColors: ['outletColors1', 'outletColors2']
                },
                variationModel: {
                    getVariants: function (map) {
                        return new Collections(
                            {
                                custom: {
                                    earlyAccessConfigs: {
                                        value: 'NO'
                                    }
                                }
                            });
                    }
                }
            }
        }
        var sourceValues = [ {id: 'outletColor3'}, {id : 'outletColors4'}]
        var result = ProductHelper.filterColorSwatches(sourceValues, product, 'outlet');
        assert.isFalse(result.length > 0)
    });

    it('Testing method: filterColorSwatches --> empty experienceType', () => {
        var product = {
            raw: {
                custom: {
                    outletColors: ['outletColors', 'outletColors1']
                },
                variationModel: {
                    getVariants: function (map) {
                        return new Collections(
                            {
                                custom: {
                                    earlyAccessConfigs: {
                                        value: 'NO'
                                    }
                                }
                            });
                    }
                }
            }
        }
        var sourceValues = [ {id: 'outletColors'}, {id : 'outletColors1'}]
        var result = ProductHelper.filterColorSwatches(sourceValues, product, '');
        assert.isTrue(result.length > 0)
    });

    it('Testing method: fixProductColorNames --> the input not the same', () => {
        var inputValue = 'color/length';
        var result = ProductHelper.fixProductColorNames(inputValue);
        assert.isNotNull(result)
    });

    it('Testing method: getAllBreadcrumbs --> the second and third inputs are the same', () => {
        var inputValue = 'color/color/length';
        var result = ProductHelper.fixProductColorNames(inputValue);
        assert.isNotNull(result)
    });

    it('Testing method:getAllBreadcrumbs', () => {
        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr':{
                getCategory: function () {
                    return {
                        custom: {}
                    }
                }
            },
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return false;
                }
            },
            'dw/web/URLUtils': {
                url: function () {
                    return 'url';
                }
            },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {
                        primaryCategory: {
                            custom: {},
                            parent: {
                                ID: 'ID'
                            }
                        }
                    }
                }
            }
        });
        var result = ProductHelper.getAllBreadcrumbs('','pid', []);
        assert.isNotNull(result)
    });

    it('Testing method:getResources', () => {
        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr':{
                getCategory: function () {
                    return {
                        custom: {}
                    }
                }
            },
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return false;
                }
            },
            'dw/web/Resource': {
                msg: function () {
                    return 'msg'
                }
            },
            'dw/web/URLUtils': {
                url: function () {
                    return 'url';
                }
            }
        });
        var result = ProductHelper.getResources('','pid', []);
        assert.isNotNull(result)
    });

    it('Testing method:showProductPage --> bundle product type', () => {
        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr':{
                getCategory: function () {
                    return {
                        custom: {}
                    }
                }
            },
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return false;
                }
            },
            'dw/web/Resource': {
                msg: function () {
                    return 'msg'
                }
            },
            'dw/web/URLUtils': {
                url: function () {
                    return 'url';
                },
                http: function () {
                    return 'url';
                }
            },
            '*/cartridge/scripts/factories/product': {
                get: function () {
                    return {
                        custom: {
                            masterID: 'masterID',
                        },
                        productType: 'bundle'
                    }
                }
            },
            '*/cartridge/scripts/helpers/pageMetaHelper': {
                setPageMetaData: function () {
                    return {};
                },
                setPageMetaTags: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/helpers/structuredDataHelper':  {
                getProductSchema: function () {
                    return {};
                }
            },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {
                        primaryCategory: {
                            custom: {},
                            parent: {
                                ID: 'ID'
                            }
                        }
                    }
                }
            }
        });
        var result = ProductHelper.showProductPage({}, {});
        assert.isNotNull(result)
    });

    it('Testing method:showProductPage --> set product type', () => {
        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr':{
                getCategory: function () {
                    return {
                        custom: {}
                    }
                }
            },
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return false;
                }
            },
            'dw/web/Resource': {
                msg: function () {
                    return 'msg'
                }
            },
            'dw/web/URLUtils': {
                url: function () {
                    return 'url';
                },
                http: function () {
                    return 'url';
                }
            },
            '*/cartridge/scripts/factories/product': {
                get: function () {
                    return {
                        custom: {
                            masterID: 'masterID',
                        },
                        productType: 'set'
                    }
                }
            },
            '*/cartridge/scripts/helpers/pageMetaHelper': {
                setPageMetaData: function () {
                    return {};
                },
                setPageMetaTags: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/helpers/structuredDataHelper':  {
                getProductSchema: function () {
                    return {};
                }
            },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {
                        primaryCategory: {
                            custom: {},
                            parent: {
                                ID: 'ID'
                            }
                        }
                    }
                }
            }
        });
        var result = ProductHelper.showProductPage({}, {});
        assert.isNotNull(result)
    });

    it('Testing method:showProductPage', () => {
        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr':{
                getCategory: function () {
                    return {
                        custom: {}
                    }
                }
            },
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return false;
                }
            },
            'dw/web/Resource': {
                msg: function () {
                    return 'msg'
                }
            },
            'dw/web/URLUtils': {
                url: function () {
                    return 'url';
                },
                http: function () {
                    return 'url';
                }
            },
            '*/cartridge/scripts/factories/product': {
                get: function () {
                    return {
                        custom: {
                            masterID: 'masterID',
                        },
                        productType: '',
                        template: 'template'
                    }
                }
            },
            '*/cartridge/scripts/helpers/pageMetaHelper': {
                setPageMetaData: function () {
                    return {};
                },
                setPageMetaTags: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/helpers/structuredDataHelper':  {
                getProductSchema: function () {
                    return {};
                }
            },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {
                        primaryCategory: {
                            custom: {},
                            parent: {
                                ID: 'ID'
                            }
                        }
                    }
                }
            }
        });
        var result = ProductHelper.showProductPage({}, {});
        assert.isNotNull(result)
    });

    it('Testing method:removeSizeParamFromUrl', () => {
        var result = ProductHelper.removeSizeParamFromUrl('https://www.underarmour.com?a=1&b=2');
        assert.isNotNull(result)
    });

    it('Testing method:getNoImageURL', () => {

        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            noImageURLs: '{"en":[]}',
                            noImageDISConfiguration: '{}'
                        }
                    },
                    getCustomPreferenceValue:function () {
                        return '{"en":[]}'
                    }
                }
            },
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            },
            'dw/util/Locale': {
                getLocale: function() {
                    return {
                        ID:'en'
                    }
                }
            }
        });
        var result = ProductHelper.getNoImageURL('');
        assert.isNull(result)
    });

    it('Testing method:getNoImageURL Test Custom Exception', () => {
        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            noImageURLs: '{en:[]}',
                            noImageDISConfiguration: '{}'
                        }
                    },
                    getCustomPreferenceValue:function () {
                        return '{en:[]}'
                    }
                }
            },
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            },
            'dw/util/Locale': {
                getLocale: function() {
                    return {
                        ID:'en'
                    }
                }
            }
        });
        var result = ProductHelper.getNoImageURL('');
        assert.isNull(result);
    });

    it('Testing method:getCallOutMessagePromotions', () => {
        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': {
                getPromotion: function () {
                    return {
                        isActive: function () {
                            return true;
                        },
                        getPromotionalPrice: function () {
                            return {
                                available: false
                            }
                        },
                        rank: true
                    }
                },
                getCampaign: function () {
                    return {}
                }
            },
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            }
        });
        var product = {
            custom: {
                excludedPromoIDs: 'promo1,promo2'
            }
        }
        var promo =
            [
                {
                    promo1: 'promo2',
                    campaign: {},
                    rank: true
                },
                {
                    promo2: 'promo2',
                    campaign: {}
                },
                {
                    promo3: 'promo3',
                    campaign: {},
                    rank: true
                }
            ]
        var result = ProductHelper.getCallOutMessagePromotions(promo, product);
        assert.isNotNull(result)
    });

    it('Testing method:getCallOutMessagePromotions --> inclusionPromoList length is 1', () => {
        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': {
                getPromotion: function () {
                    return {
                        isActive: function () {
                            return true;
                        },
                        getPromotionalPrice: function () {
                            return {
                                available: false
                            }
                        },
                        rank: true
                    }
                },
                getCampaign: function () {
                    return {}
                }
            },
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            }
        });
        var product = {
            custom: {
                excludedPromoIDs: 'promo1'
            }
        }
        var promo =
            [
                {
                    promo1: 'promo2',
                    campaign: {},
                    rank: true
                },
            ]
        var result = ProductHelper.getCallOutMessagePromotions(promo, product);
        assert.isNotNull(result)
    });

    it('Testing method:getCallOutMessagePromotions --> promoCampaignWithStartDate has length > 1', () => {
        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': {
                getPromotion: function () {
                    return {
                        isActive: function () {
                            return true;
                        },
                        getPromotionalPrice: function () {
                            return {
                                available: false
                            }
                        },
                        rank: true
                    }
                },
                getCampaign: function () {
                    return {
                        startDate: 'startDate'
                    }
                }
            },
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            }
        });
        var product = {
            custom: {
                excludedPromoIDs: 'promo1,promo2'
            }
        }
        var promo =
            [
                {
                    promo1: 'promo2',
                    campaign: {},
                    rank: false
                },
                {
                    promo2: 'promo2',
                    campaign: {}
                },
                {
                    promo3: 'promo3',
                    campaign: {},
                    rank: false
                }
            ]
        var result = ProductHelper.getCallOutMessagePromotions(promo, product);
        assert.isNotNull(result)
        assert.equal(result.inclusionPromotions.length, 1);
    });

    it('Testing method:getCallOutMessagePromotions --> promoCampaignWithNoStartDate has length > 1', () => {
        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': {
                getPromotion: function () {
                    return {
                        isActive: function () {
                            return true;
                        },
                        getPromotionalPrice: function () {
                            return {
                                available: false
                            }
                        },
                        rank: true
                    }
                },
                getCampaign: function () {
                    return {}
                }
            },
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            }
        });
        var product = {
            custom: {
                excludedPromoIDs: 'promo1,promo2'
            }
        }
        var promo =
            [
                {
                    promo1: 'promo2',
                    campaign: {},
                    rank: false
                },
                {
                    promo2: 'promo2',
                    campaign: {}
                },
                {
                    promo3: 'promo3',
                    campaign: {},
                    rank: false
                }
            ]
        var result = ProductHelper.getCallOutMessagePromotions(promo, product);
        assert.isNotNull(result)
    });

    it('Testing method:getCallOutMessagePromotions', () => {
        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'dw/util/HashMap' : require('../../mocks/dw/dw_util_HashMap'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': {
                getPromotion: function () {
                    return {
                        isActive: function () {
                            return true;
                        },
                        getPromotionalPrice: function () {
                            return {
                                available: false
                            }
                        },
                        rank: false
                    }
                },
                getCampaign: function () {
                    return {
                        startDate: 'startDate'
                    }
                }
            },
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            }
        });
        var product = {
            custom: {
                excludedPromoIDs: 'promo1,promo2'
            }
        }
        var promo =
            [
                {
                    promo1: 'promo1',
                    campaign: {},
                },
                {
                    promo2: 'promo2',
                    campaign: {}
                },
                {
                    promo3: 'promo3',
                    campaign: {},
                    rank: true
                }
            ]
        var result = ProductHelper.getCallOutMessagePromotions(promo, product);
        assert.isNotNull(result)
    });

    it('Testing method:getUpsellType --> outlet experienceType', () => {
        var product = {
            variationAttributes: {
                [0]: {
                    values: ['color1', 'color2']
                }
            },
            custom: {
                outletColors:  ['color1', 'color2']
            }
        }
        var sourceValues =  [{id: 'color1'}, {id: 'color2'}]
        var result = ProductHelper.getUpsellType(sourceValues, product, '', 'tealium');
        assert.isNotNull(result)
    });

    it('Testing method:getUpsellType --> mixed experienceType', () => {
        var product = {
            variationAttributes: {
                [0]: {
                    values: ['color1', 'color2']
                }
            },
            custom: {
                outletColors:  ['color1', 'color2']
            }
        }
        var sourceValues =  [{id: 'color1'}, {id: 'color3'}]
        var result = ProductHelper.getUpsellType(sourceValues, product, '', 'tealium');
        assert.isNotNull(result);
        assert.equal(result, 'mixed')
    });

    it('Testing method:getUpsellType --> premium experienceType', () => {
        var product = {
            variationAttributes: {
                [0]: {
                    values: ['color1', 'color2']
                }
            },
            custom: {
                outletColors:  ['color1', 'color2']
            },
            variationModel: {
                getVariants: function (map) {
                    return new Collections(
                        {
                            custom: {
                                earlyAccessConfigs: {
                                    value: 'NO'
                                }
                            }
                        });
                }
            }
        }
        var sourceValues =  [{id: 'color4'}, {id: 'color3'}]
        var result = ProductHelper.getUpsellType(sourceValues, product, '', 'tealium');
        assert.isNotNull(result)
    });

    it('Testing method:getUpsellType --> pass empty experienceType', () => {
        var product = {
            variationAttributes: {
                [0]: {
                    values: ['color1', 'color2']
                }
            },
            custom: {
                outletColors:  ['color1', 'color2'],
            },
            raw: {
                custom: {
                    outletColors:  ''
                },
                variationModel: {
                    getVariants: function (map) {
                        return new Collections(
                            {
                                custom: {
                                    earlyAccessConfigs: {
                                        value: 'NO'
                                    }
                                }
                            });
                    }
                }
            }
        }
        var sourceValues =  [{id: 'color1'}, {id: 'color2'}]
        var result = ProductHelper.getUpsellType(sourceValues, product, '', '');
        assert.isNotNull(result)
    });

    it('Testing method:getUpsellType --> pass empty experienceType', () => {
        var product = {
            variationAttributes: {
                [0]: {
                    values:[{id: 'color3'}, {id: 'color2'}]
                }
            },
            custom: {
                outletColors:  ['color1', 'color2'],
            },
            raw: {
                custom: {
                    outletColors:   ['color1', 'color2']
                },
                variationModel: {
                    getVariants: function (map) {
                        return new Collections(
                            {
                                custom: {
                                    earlyAccessConfigs: {
                                        value: 'NO'
                                    }
                                }
                            });
                    }
                }
            }
        }
        var sourceValues =  [{id: 'color3'}, {id: 'color2'}]
        var result = ProductHelper.getUpsellType(sourceValues, product, 'premium', '');
        assert.isNotNull(result);
    });

    it('Testing method:sizeModelImagesMapping', () => {
        ProductHelper.sizeModelImagesMapping('xs');
        ProductHelper.sizeModelImagesMapping('sm');
        ProductHelper.sizeModelImagesMapping('md');
        ProductHelper.sizeModelImagesMapping('lg');
        ProductHelper.sizeModelImagesMapping('xl');
        ProductHelper.sizeModelImagesMapping('xxl');
        ProductHelper.sizeModelImagesMapping('');
    });

    it('Testing method:addRecipeToSizeModelImage', () => {
        var sizeModelImage = [{}, {}]
        var result = ProductHelper.addRecipeToSizeModelImage(sizeModelImage, null);
        assert.equal(result.length, 2);
    });

    it('Testing method:recipeForPDPSizeModelImage', () => {
        var result = ProductHelper.recipeForPDPSizeModelImage('pdpMainDesktop');
        assert.isNotNull(result);
        ProductHelper.recipeForPDPSizeModelImage('pdpZoomDesktop');
        ProductHelper.recipeForPDPSizeModelImage('');
    });

    it('Testing method:fetchSizeModelJSON', () => {
        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            },
            'dw/content/ContentMgr': {
                getContent: function () {
                    return {
                        custom: {
                            body: {
                                markup: '{"markup": "aa"}'
                            }
                        },
                        online: true
                    };
                }
            }
        });
        var result = ProductHelper.fetchSizeModelJSON('pdpMainDesktop');
        assert.equal(result.markup, 'aa');
    });

    it('Testing method:getSelectedModelSpecObj', () => {
        global.dw = {
            catalog: {
                ProductVariationModel: Object
            }
        }
        var product = {
            getMaster: function () {
                return {
                    custom: {
                        shopTheLookDisable: false,
                        shopTheLookJson: '{"red": "aa"}'
                    }
                }
            },
            getProductVariationAttribute: function () {
                return {
                    getID: function () {
                        return 'red'
                    }
                }
            },
            getSelectedValue: function () {
                return {
                    getProductVariationAttribute: function () {
                        return {
                            getID: function () {
                                return 'red'
                            }
                        }
                    },
                    getID: function () {
                        return 'red'
                    }
                }
            },
        }
        var result = ProductHelper.getSelectedModelSpecObj(product);
        assert.isNotNull(result);
    });

    it('Testing method:getImageSpecificModelSpec --> modelHeightFtIn', () => {
        var modelSpec = {'www.underarmour.com': {modelHeightFtIn: 'modelHeightFtIn'}};
        var ImageURL = 'https://www.underarmour.com?a=1&b=2';
        var result = ProductHelper.getImageSpecificModelSpec(modelSpec, ImageURL);
        assert.isNotNull(result.modelHeightFtIn);
    });

    it('Testing method:modelSize', () => {
        var modelSpec = {'www.underarmour.com': {modelSize: 'M'}};
        var ImageURL = 'https://www.underarmour.com?a=1&b=2';
       var result = ProductHelper.getImageSpecificModelSpec(modelSpec, ImageURL);
       assert.isNotNull(result.modelSize);
    });
    it('Testing method:changeSwatchBorder --> getLightnessValue return false', () => {
        ProductHelper.changeSwatchBorder('#FFFF', '#FFFF');
    });
    it('Testing method:changeSwatchBorder swatchColor === swatchColorII', () => {
        ProductHelper.changeSwatchBorder('#FFFF11', '#FFFF11');
    });

    it('Testing method:changeSwatchBorder swatchColor !== swatchColorII', () => {
        ProductHelper.changeSwatchBorder('#CCCC11', '#AAAA11');
    });

    it('Testing method:changeSwatchBorder swatchColor !== swatchColorII -> g and b cases', () => {
        ProductHelper.changeSwatchBorder('#001100', '#110000');
    });

    it('Testing method:changeSwatchBorder switch r case', () => {
        ProductHelper.changeSwatchBorder('#000011', '#000011');
    });
    it('Testing method:changeSwatchBorder', () => {
        ProductHelper.changeSwatchBorder('#111111', '#111111');
    });
    it('Testing method:privacyBannerCookie', () => {
        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
             'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            hideMFOItems: true
                        }
                    },
                    getCustomPreferenceValue: function () {
                        return true;
                    }
                },
                getCurrent: function () {
                   return {
                    getCustomPreferenceValue: function() {
                        return {};
                    }
                   }
                }
            },
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                create: function () {
                    return {};
                },
                read: function () {
                    return {};
                }
            }
        });
        var result = ProductHelper.privacyBannerCookie();
    });

    it('Testing method:selectTeamFilter', () => {
        var ArrayList = require('../../../cartridges/storefront-reference-architecture/test/mocks/dw.util.Collection');

        var array = new ArrayList([
            {
                onlineFlag:true,
                availabilityModel: {
                    orderable: true
                },
                custom: {
                    team: 'team'
                }
            },
        ]);
        var product = {
            productSearchHit: {
                getProduct: function () {
                    return {
                        getVariants: function () {
                            return array
                        }
                    }
                }
            }
        }
        var result = ProductHelper.selectTeamFilter('team', product);
        assert.equal(result, 'team');
    });

    it('Testing method:getFitModelSpecs', () => {
        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
             'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            enableFitModels: true,
                            enableModelSpec: true
                        }
                    },
                    getCustomPreferenceValue: function () {
                        return true;
                    }
                },
                getCurrent: function () {
                   return {
                    getCustomPreferenceValue: function() {
                        return {};
                    }
                   }
                }
            },
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {
                        primaryCategory: {
                            custom: {},
                            parent: {
                                ID: 'ID'
                            }
                        },
                        masterProduct: {
                            custom: {
                                hasSizeModel: true,
                                shopTheLookDisable: false,
                                shopTheLookJson: '{"blue":{"absURL_suffix_XS":{"showModelInfo":"true","modelSize":"true","modelHeightCm":1,"modelHeightFtIn":1}}}'
                            }
                        }
                    }
                }
            }
        });
        var product = {
            productType: 'variant',
            images: {
                pdpMainDesktop:[{absURL: 'absURL_suffix'}, 'a2']
            }
        }
        var result = ProductHelper.getFitModelSpecs(product, 'blue');
        assert.isFalse(result.error);
    });

    it('Testing method:getFitModelSpecs --> Test Custom Exception', () => {
        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
             'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            enableFitModels: true,
                            enableModelSpec: true
                        }
                    },
                    getCustomPreferenceValue: function () {
                        return true;
                    }
                },
                getCurrent: function () {
                   return {
                    getCustomPreferenceValue: function() {
                        return {};
                    }
                   }
                }
            },
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {
                        primaryCategory: {
                            custom: {},
                            parent: {
                                ID: 'ID'
                            }
                        },
                        masterProduct: {
                            custom: {
                                hasSizeModel: true,
                                shopTheLookDisable: false,
                                shopTheLookJson: '{"blue":"aaa"}'
                            }
                        }
                    }
                }
            },
            'dw/system/Logger': {
                error: function () {
                    return 'error';
                }
            }
        });
        var product = {
            productType: 'variant',
            images: {
                pdpMainDesktop:[{absURL:1}, 'a2']
            }
        }
        var result = ProductHelper.getFitModelSpecs(product, 'blue');
        assert.isTrue(result.error);
    });

    it('Testing method:getFitModelOptions', () => {
        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            },
            'dw/util/Locale': {
                getLocale: function () {
                    return {}
                }
            },
            'dw/web/Resource': {
                msgf: function () {
                    return 'msgf'
                }
            },
        });
        var sizeModelSpecs = {
           error: false,
           options: [
            {
                modelSize: '',
                modelHeightFt: false
            }
           ]
        }
        ProductHelper.getFitModelOptions(sizeModelSpecs);
    });

    it('Testing method:getFitModelOptions', () => {
        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            },
            'dw/util/Locale': {
                getLocale: function () {
                    return {
                        country: 'CA'
                    }
                }
            },
            'dw/web/Resource': {
                msgf: function () {
                    return 'msgf'
                }
            },
        });
        var sizeModelSpecs = {
           error: false,
           options: [
            {
                modelSize: 'default',
                modelHeightFt: false,
                modelHeightCm: 'modelHeightCm',
                modelHeightFt: 'modelHeightFt'
            }
           ]
        }
        var result = ProductHelper.getFitModelOptions(sizeModelSpecs);
        assert.equal(result.length, 1);
    });

    it('Testing method:getFitModelOptions', () => {
        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            },
            'dw/util/Locale': {
                getLocale: function () {
                    return {
                        country: 'US'
                    }
                }
            },
            'dw/web/Resource': {
                msgf: function () {
                    return 'msgf'
                }
            },
        });
        var sizeModelSpecs = {
           error: false,
           options: [
            {
                modelSize: 'default',
                modelHeightFt: false,
                modelHeightCm: 'modelHeightCm',
                modelHeightFt: 'modelHeightFt'
            }
           ]
        }
        var result = ProductHelper.getFitModelOptions(sizeModelSpecs);
        assert.equal(result.length, 1);
    });

    it('Testing method:getFitModelOptions --> error not equal to false', () => {
        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            },
            'dw/util/Locale': {
                getLocale: function () {
                    return {
                        country: 'US'
                    }
                }
            },
            'dw/web/Resource': {
                msgf: function () {
                    return 'msgf'
                }
            },
            'dw/content/ContentMgr': {
                getContent: function () {
                    return {
                        online: true,
                        custom: {
                            body: {
                                markup: '[{"modelSize":"default"}]'
                            }
                        }
                    };
                }
            }
        });
        var sizeModelSpecs = {
           error: true,
           options: [
            {
                modelSize: 'default',
                modelHeightFt: false,
                modelHeightCm: 'modelHeightCm',
                modelHeightFt: 'modelHeightFt'
            }
           ]
        }
        var result = ProductHelper.getFitModelOptions(sizeModelSpecs);
        assert.equal(result.length, 1);
    });

    it('Testing method:getFitModelOptions --> Test Custom Exception', () => {
        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            },
            'dw/util/Locale': {
                getLocale: function () {
                    return {
                        country: 'US'
                    }
                }
            },
            'dw/web/Resource': {},
            'dw/content/ContentMgr': {
                getContent: function () {
                    return {
                        online: true,
                        custom: {
                            body: {
                                markup: '[{"modelSize":"default"}]'
                            }
                        }
                    };
                }
            },
            'dw/system/Logger':{
                error: function () {
                    return 'error';
                }
            }
        });
        var sizeModelSpecs = {
           error: false,
           options: [
            {
                modelSize: 'default',
                modelHeightFt: false,
                modelHeightCm: 'modelHeightCm',
                modelHeightFt: 'modelHeightFt'
            }
           ]
        }
       var result = ProductHelper.getFitModelOptions(sizeModelSpecs);
       assert.equal(result.length, 0);
    });

    it('Testing method:getMaterialCode', () => {
        var productObj = {
            isVariant: function () {
                return false;
            },
            custom: {
                disableShopthisOutfit: false,
                shopTheLookJson: '{"colorId": {"shopTheLookOutfit":{"size": "aa"}}, "shopTheLookOutfit": "true"}'
            }
        }
        ProductHelper.getMaterialCode(productObj, 'colorId', 'size');
    });

    it('Testing method:isShopThisOutFitCTAEnable', () => {

        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {
                        isVariant: function () {
                            return false;
                        },
                        availabilityModel: {
                            inStock: true
                        },
                        ID: 'ID'
                    };
                }
            }
        });
        var product = {
            getVariationModel: function () {
                return {
                    getProductVariationAttribute: function () {
                        return {
                            getID: function () {
                                return 'colorId'
                            }
                        }
                    },
                    getSelectedValue: function () {
                        return {
                            getProductVariationAttribute: function () {
                                return {
                                    getID: function () {
                                        return 'colorId'
                                    }
                                }
                            },
                            getID: function () {
                                return 'colorId'
                            }
                        }
                    },
                }
            },
            isVariant: function () {
                return false;
            },
            custom: {
                disableShopthisOutfit: false,
                shopTheLookJson: '{"colorId": {"shopTheLookOutfit":{"modelSize": {"materialCodes":[{}]}}}, "shopTheLookOutfit": "true"}'
            }
        };
        var images = {
            pdpMainDesktop: [{modelSpec: {modelSize: {toLowerCase: function () {
                return 'modelSize';
            }}}}],
        }
        var result = ProductHelper.isShopThisOutFitCTAEnable(product,images);
        assert.isTrue(result);
    });

    it('Testing method:isShopThisOutFitCTAEnable', () => {

        ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/productHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'app_storefront_base/cartridge/scripts/helpers/productHelpers': {},
            'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/catalog/CatalogMgr': require('../../mocks/dw/dw_catalog_CatalogMgr'),
            'dw/order/BasketMgr': require('../../mocks/dw/dw_order_BasketMgr'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/helpers/ProductHelper': {
                getOrderableVariant: function (product) {
                    return product;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                getExistingProductLineItemInCart: function() {
                    return true;
                }
            },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {
                        isVariant: function () {
                            return false;
                        },
                        availabilityModel: {
                            inStock: false
                        },
                        ID: 'ID'
                    };
                }
            }
        });
        var product = {
            getVariationModel: function () {
                return {
                    getProductVariationAttribute: function () {
                        return {
                            getID: function () {
                                return 'colorId'
                            }
                        }
                    },
                    getSelectedValue: function () {
                        return {
                            getProductVariationAttribute: function () {
                                return {
                                    getID: function () {
                                        return 'colorId'
                                    }
                                }
                            },
                            getID: function () {
                                return 'colorId'
                            }
                        }
                    },
                }
            },
            isVariant: function () {
                return false;
            },
            custom: {
                disableShopthisOutfit: false,
                shopTheLookJson: '{"colorId": {"shopTheLookOutfit":{"modelSize": {"materialCodes":[{}]}}}, "shopTheLookOutfit": "true"}'
            }
        };
        var images = {
            pdpMainDesktop: [{modelSpec: {modelSize: {toLowerCase: function () {
                return 'modelSize';
            }}}}],
        }
        var result = ProductHelper.isShopThisOutFitCTAEnable(product,images);
        assert.isFalse(result);
    });
});