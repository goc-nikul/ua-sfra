'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var Collections = require('../../mocks/dw/dw_util_Collection');
var sinon = require('sinon');

describe('app_ua_core/cartridge/scripts/helpers/ProductHelper test', () => {
    global.empty = (data) => {
        return !data;
    };

    var mProduct = {
        master: true,
        isMaster: function() {
            return true;
        },
        priceModel: {
            price: { valueOrNull: 'value' },
            priceInfo: { priceBook: {} },
            priceRange: true,
            getPriceTable: function () {
                return {
                    quantities: { length: 1 }
                };
            },
            getPriceBookPrice: function () {
                return { available: true };
            }
        },
        getPriceModel: function () {
            return this.priceModel;
        },
        variationModel: {
            variants: [{}, {}]
        },
        custom: {
            defaultColorway: '003',
            outletColors: '003'
        },
        getVariants: function () {
            
            var variants = {
                productID: '123456',
                onlineFlag: true,
                availabilityModel: {
                    orderable: true
                },
                custom: { 
                    color: '003',
                    defaultColorway: '003'
                },
                masterProduct: {
                    ID: '98765'
                },
                isVariant: function() {
                    return true;
                },
                online: true,
                availabilityModel: {
                    availability: 12,
                    orderable: true,
                    inStock: true
                },
                getPriceModel: function () {
                    return {};
                }
            };
            return [variants];
        }
    };

    let ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/ProductHelper', {
        'dw/catalog/ProductSearchModel': require('../../mocks/dw/dw_catalog_ProductSearchModel'),
        '*/cartridge/scripts/helpers/productHelpers': {
            fixProductColorNames: function () {
                return 'testProduct';
            }
        },
        '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
        'dw/util/HashMap': function () {
            return {
                result: {},
                put: function (key, context) {
                    this.result[key] = context;
                }
            };
        },
        'dw/web/Resource': {
            msgf: function (params) { return params; },
            msg: function (params) { return params; }
        },
        'dw/system/Site': {
            current: {
                preferences: {
                    custom: {
                        enableAvailablePerLocale: 'YES',
                        enablePLPImageSlider: 'YES'
                    }
                },
                getCustomPreferenceValue: function () {
                    return 'YES'
                }
            }
        },
        'dw/system/Logger': {
            debug: function (text) {
                return text;
            },
            error: function (text) {
                return text;
            }
        }
    });

    it('Testing method: getProductSearchHit', () => {
        let result = ProductHelper.getProductSearchHit({
            ID: 1
        });

        assert.equal(result.ID, 'testProduct');
    });

    it('Testing method: getProductSearchHit', () => {

        class ProductSearchModel {
            constructor() {
                this.searchPhrase = '';
                this.categoryID = '';
                this.productID = '';
                this.priceMin = '';
                this.priceMax = '';
                this.sortingRule = '';
                this.recursiveCategorySearch = false;
                this.count = 0;
            }

            setSearchPhrase(searchPhrase) {
                this.searchPhrase = searchPhrase;
            }
            search() {
                this.count = 0;
                return;
            }

            getProductSearchHit(product) {
                return null;
            }

            getSearchRedirect (queryString) {
                return {
                    getLocation: function () {
                        return 'some value';
                    }
                };
            }

            getProductSearchHits (queryString) {
                return {
                    hasNext: function () {
                        return true;
                    },
                    next: function () {
                        return {
                            firstRepresentedProductID: '1'
                        }
                    }
                }
            }
        }
        let ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/ProductHelper', {
            'dw/catalog/ProductSearchModel':ProductSearchModel,
            '*/cartridge/scripts/helpers/productHelpers': {},
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'dw/util/HashMap': function () {
                return {
                    result: {},
                    put: function (key, context) {
                        this.result[key] = context;
                    }
                };
            },
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            enableAvailablePerLocale: 'YES',
                            enablePLPImageSlider: 'YES'
                        }
                    },
                    getCustomPreferenceValue: function () {
                        return 'YES'
                    }
                }
            },
            'dw/system/Logger': {
                debug: function (text) {
                    return text;
                },
                error: function (text) {
                    return text;
                }
            }
        });
        let result = ProductHelper.getProductSearchHit({
            ID: '1'
        });

        assert.equal(result.firstRepresentedProductID, '1');
    });

    it('Testing method: getProductImageUrl', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        let resultL = ProductHelper.getProductImageUrl(product, 'large');
        product.master = true;
        product.variationModel.defaultVariant = {
            getImage: function () {
                return {
                    URL:'testUrlSmall'
                };
            }
        }
        let resultS = ProductHelper.getProductImageUrl(product, 'small');

        assert.equal(resultS, 'testUrlSmall');
        assert.equal(resultL, 'testUrlLarge');
    });

    it('Testing method: getDefaultColorVariant', () => {
        var colorId = '003';
        var result = ProductHelper.getDefaultColorVariant(mProduct);
        assert.equal(result.custom.color, colorId);
    });

    it('Testing method: getVariantForColor', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        var colorId = '003';
        
        var result = ProductHelper.getVariantForColor(product, colorId);
        assert.equal(result.custom.color, colorId);
    });

    it('Testing method: getVariantForColor --> getVariants is null', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        product.getVariants = function () {
            return null
        }
        var colorId = '003';
        var result = ProductHelper.getVariantForColor(product, colorId);
        assert.isUndefined(result.custom.color, 'Color Undefined');
    });

    it('Testing method: getOrderableVariant', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        var result = ProductHelper.getOrderableVariant(product, '');
        assert.equal(result.masterProduct.ID, product.ID);
    });

    it('Testing method: getOrderableVariant --> experienceType equals to premium', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        product.custom.outletColors = '002';
        var result = ProductHelper.getOrderableVariant(product, 'premium');
        assert.equal(result.masterProduct.ID, product.ID);
    });

    it('Testing method: getOrderableVariant --> experienceType equals to outlet', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        product.custom.outletColors = '003';
        var result = ProductHelper.getOrderableVariant(product, 'outlet');
        assert.equal(result.masterProduct.ID, product.ID);
    });

    it('Testing method: getOrderableVariant --> empty experienceType and defaultVariant.availabilityModel.orderable = false', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        product.variationModel.getProductVariationAttribute = function () {
            return {
                ID: 'ID'
            }
        }
        product.variationModel.getVariationValue = function () {
            return {
                ID: 'ID'
            };
        }
        product.variationModel.hasOrderableVariants = function () {
            return {};
        }
        var variants = {
            onlineFlag: true,
            availabilityModel: {
                orderable: true
            },
            custom: {
                color: '003'
            },
            masterProduct: {
                ID: '883814258849'
            }
        };
        product.variationModel.getVariants = function () {
            return new Collections(
                {
                    availabilityModel: true,
                    availabilityModel: {
                        orderable: true
                    },
                    custom: {
                        earlyAccessConfigs: {
                            value: 'NO'
                        }
                    }
                });
        }
        product.getVariationModel = function () {
            var variants = {
                onlineFlag: true,
                availabilityModel: {
                    orderable: true
                },
                custom: {
                    color: '003'
                },
                masterProduct: {
                    ID: '883814258849'
                },
                master: false
            };
            return {
                getDefaultVariant: function () {
                    return {
                        availabilityModel: {
                            orderable: false
                        },
                        custom: {
                            earlyAccessConfigs: {
                                value: 'NO'
                            }
                        }
                    };
                }
            };
        };
        product.custom.outletColors = '003';
        var result = ProductHelper.getOrderableVariant(product, '');
        assert.isNotNull(result);
    });

    it('Testing method: getOrderableVariant --> premium experienceType and defaultVariant.availabilityModel.orderable = false', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        product.variationModel.getProductVariationAttribute = function () {
            return {
                ID: 'ID'
            }
        }
        product.variationModel.getVariationValue = function () {
            return {
                ID: 'ID'
            };
        }
        product.variationModel.hasOrderableVariants = function () {
            return {};
        }
        var variants = {
            onlineFlag: true,
            availabilityModel: {
                orderable: true
            },
            custom: {
                color: '003'
            },
            masterProduct: {
                ID: '883814258849'
            }
        };
        product.variationModel.getVariants = function () {
            return new Collections(
                {
                    availabilityModel: true,
                    availabilityModel: {
                        orderable: true
                    },
                    custom: {
                        color: '003',
                        earlyAccessConfigs: {
                            value: 'NO'
                        }
                    }
                });
        }
        product.getVariationModel = function () {
            var variants = {
                onlineFlag: true,
                availabilityModel: {
                    orderable: true
                },
                custom: {
                    color: '003'
                },
                masterProduct: {
                    ID: '883814258849'
                },
                master: false
            };
            return {    
                getDefaultVariant: function () {
                    return {
                        availabilityModel: {
                            orderable: false
                        },
                        custom: {
                            earlyAccessConfigs: {
                                value: 'NO'
                            }
                        }
                    };
                }
            };
        };
        product.custom.outletColors = '002';
        var result = ProductHelper.getOrderableVariant(product, 'premium');
        assert.isNotNull(result);
    });

    it('Testing method: getOrderableVariant --> outlet experienceType and defaultVariant.availabilityModel.orderable = false', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        product.variationModel.getProductVariationAttribute = function () {
            return {
                ID: 'ID'
            }
        }
        product.variationModel.getVariationValue = function () {
            return {
                ID: 'ID'
            };
        }
        product.variationModel.hasOrderableVariants = function () {
            return {};
        }
        var variants = {
            onlineFlag: true,
            availabilityModel: {
                orderable: true
            },
            custom: {
                color: '003'
            },
            masterProduct: {
                ID: '883814258849'
            }
        };
        product.variationModel.getVariants = function () {
            return new Collections(
                {
                    availabilityModel: true,
                    availabilityModel: {
                        orderable: true
                    },
                    custom: {
                        color: '003',
                        earlyAccessConfigs: {
                            value: 'NO'
                        }
                    }
                });
        }
        product.getVariationModel = function () {
            var variants = {
                onlineFlag: true,
                availabilityModel: {
                    orderable: true
                },
                custom: {
                    color: '003'
                },
                masterProduct: {
                    ID: '883814258849'
                },
                master: false
            };
            return {
                getDefaultVariant: function () {
                    return {
                        availabilityModel: {
                            orderable: false
                        },
                        custom: {
                            earlyAccessConfigs: {
                                value: 'NO'
                            }
                        }
                    };
                }
            };
        };
        product.custom.outletColors = '002';
        var result = ProductHelper.getOrderableVariant(product, 'outlet');
        assert.isNotNull(result);
    });

    it('Testing method: getOrderableVariant --> hidden color', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        product.variationModel.getProductVariationAttribute = function () {
            return {
                ID: 'ID'
            }
        }
        product.variationModel.getVariationValue = function () {
            return {
                ID: 'ID'
            };
        }
        product.variationModel.hasOrderableVariants = function () {
            return {};
        }
        var variants = {
            onlineFlag: true,
            availabilityModel: {
                orderable: true
            },
            custom: {
                color: '003'
            },
            masterProduct: {
                ID: '883814258849'
            }
        };
        product.variationModel.getVariants = function () {
            return new Collections(
                {
                    availabilityModel: true,
                    availabilityModel: {
                        orderable: true
                    },
                    custom: {
                        color: '003',
                        earlyAccessConfigs: {
                            value: 'HIDE'
                        }
                    }
                });
        }
        product.getVariationModel = function () {
            var variants = {
                onlineFlag: true,
                availabilityModel: {
                    orderable: true
                },
                custom: {
                    color: '003'
                },
                masterProduct: {
                    ID: '883814258849'
                },
                master: false
            };
            return {
                getDefaultVariant: function () {
                    return {
                        availabilityModel: {
                            orderable: false
                        },
                        custom: {
                            earlyAccessConfigs: {
                                value: 'HIDE'
                            }
                        }
                    };
                }
            };
        };
        product.custom.outletColors = '002';
        var result = ProductHelper.getOrderableVariant(product, 'outlet');
        assert.isNotNull(result);
    });

    it('Testing method: getOrderableVariant --> outlet experienceType and defaultVariant.availabilityModel.orderable = false', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        product.variationModel.getProductVariationAttribute = function () {
            return {
                ID: 'ID'
            }
        }

        product.variationModel.getVariationValue = function () {
            return {
                ID: 'ID'
            };
        }
        product.variationModel.hasOrderableVariants = function () {
            return {};
        }
        var variants = {
            onlineFlag: true,
            availabilityModel: {
                orderable: true
            },
            custom: {
                color: '003'
            },
            masterProduct: {
                ID: '883814258849'
            }
        };
        product.variationModel.getVariants = function (map) {
            return new Collections(
                {
                    availabilityModel: true,
                    availabilityModel: {
                        orderable: true
                    },
                    custom: {
                        color: '003',
                        earlyAccessConfigs: {
                            value: 'NO'
                        }
                    }
                });
        }
        product.getVariationModel = function () {
            var variants = {
                onlineFlag: true,
                availabilityModel: {
                    orderable: true
                },
                custom: {
                    color: '003'
                },
                masterProduct: {
                    ID: '883814258849'
                },
                master: false
            };
            return {
                getDefaultVariant: function () {
                    return {
                        availabilityModel: {
                            orderable: false
                        },
                        custom: {
                            earlyAccessConfigs: {
                                value: 'NO'
                            }
                        }
                    };
                }
            };
        };
        product.custom.outletColors = '003';
        var result = ProductHelper.getOrderableVariant(product, 'outlet');
        assert.isNotNull(result);
    });

    it('Testing method: getVariantForCustomAttribute', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        var result = ProductHelper.getVariantForCustomAttribute(product, 'colorId', true);
        assert.equal(result.name, product.name);
    });

    it('Testing method: getVariantForCustomAttribute --> team equals to colorId', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        product.getVariants = function () {
            var variants = {
                onlineFlag: true,
                availabilityModel: {
                    orderable: true
                },
                custom: {
                    color: '003',
                    team: 'colorId'
                },
                masterProduct: {
                    ID: '883814258849'
                }
            };
            return [variants];
        };
        var result = ProductHelper.getVariantForCustomAttribute(product, 'colorId', true);
        assert.isTrue(result.onlineFlag);
    });

    it('Testing method: getVariantForCustomAttribute --> colorgroup equals to colorId', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        product.getVariants = function () {
            var variants = {
                onlineFlag: true,
                availabilityModel: {
                    orderable: true
                },
                custom: {
                    color: '003',
                    colorgroup: 'colorId'
                },
                masterProduct: {
                    ID: '883814258849'
                }
            };
            return [variants];
        };
        var result = ProductHelper.getVariantForCustomAttribute(product, 'colorId', false);
        assert.isTrue(result.onlineFlag);
    });

    it('Testing method: getVariantForCustomAttribute --> color equals to colorId', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        product.getVariants = function () {
            var variants = {
                onlineFlag: true,
                availabilityModel: {
                    orderable: true
                },
                custom: {
                    color: '003',
                },
                masterProduct: {
                    ID: '883814258849'
                }
            };
            return [variants];
        };
        var result = ProductHelper.getVariantForCustomAttribute(product, '003', true);
        assert.isTrue(result.onlineFlag);
    });

    it('Testing method: getVariantForCustomAttribute --> getVariants return null', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        product.getVariants = function () {
            return null;
        };
        var result = ProductHelper.getVariantForCustomAttribute(product, '003', true);
        assert.equal(result.name, product.name);
    });

    it('Testing method: variationPriceColorJSON --> productObj.custom.team !== N/A', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        product.custom.team = 'team';
        product.custom.color = 'color'
        var result = ProductHelper.variationPriceColorJSON(product, {id: '003'}, 0);
        assert.equal(result.colorName, 'team-color');
    });

    it('Testing method: variationPriceColorJSON --> productObj.custom.team === N/A', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        product.custom.team = 'N/A';
        product.custom.color = 'color'
        product.custom.colorway = 'colorway'
        var result = ProductHelper.variationPriceColorJSON(product, {id: '003'}, 0);
        assert.equal(result.colorName, 'testProduct-color');
    });

    it('Testing method: variationPriceColorJSON --> productObj.custom.team === N/A and colorway custom att is empty', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        product.custom.team = 'N/A';
        var result = ProductHelper.variationPriceColorJSON(product, {id: '003'}, 0);
        assert.isNotNull(result.colorName);
    });

    it('Testing method: getVariantForColorSize --> get a variant for the color and size provided', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        product.getVariants = function () {
            var variants = {
                onlineFlag: true,
                availabilityModel: {
                    orderable: true
                },
                custom: {
                    color: '001',
                    size:'MD'
                },
                masterProduct: {
                    ID: '1361588'
                }
            };
            return [variants];
        };

        product.variationModel = 
        {
            onlineFlag: true,
            availabilityModel: true,
            availabilityModel: {
                orderable: true
            },
            custom: {
                color: '001',
                size:'MD'
            },
            master: false
        }
        var color = '001';
        var size = 'MD';
        var result = ProductHelper.getVariantForColorSize(product,color,size);
        assert.isNotNull(result);
    });

    it('Testing method: getVariantForColorSize --> get a orderable variant for the color provided and size provided', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        product.getVariants = function () {
            var variants = {
                onlineFlag: true,
                availabilityModel: {
                    orderable: true
                },
                custom: {
                    color: '001',
                    size:'MD'
                },
                masterProduct: {
                    ID: '1361588'
                }
            };
            return [variants];
        };

        var color = '001';
        var size = 'MD';
        var result = ProductHelper.getVariantForColorSize(product,color,size);
        assert.isTrue(result.availabilityModel.orderable)
    });
    
    it('Testing method: getVariantForColorSize --> get a orderable variant for the color empty and size empty', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        product.getVariants = function () {
            var variants = {
                onlineFlag: true,
                availabilityModel: {
                    orderable: true
                },
                custom: {
                    color: '001',
                    size:'MD'
                },
                masterProduct: {
                    ID: '1361588'
                }
            };
            return [variants];
        };

        
        var color = '';
        var size = '';
        var result = ProductHelper.getVariantForColorSize(product,color,size);
        assert.isUndefined(result.availabilityModel.orderable)
    });

    it('Testing method: isProductAvailableForLocale --> product availableForLocale', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        product.custom.availableForLocale ={
            value: 'YES'
        }
        var result = ProductHelper.isProductAvailableForLocale(product);
        assert.isTrue(result);
    });

    it('Testing method: isProductAvailableForLocale --> not availableForLocale ', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        product.custom.availableForLocale ={
            value: 'No'
        }
        var result = ProductHelper.isProductAvailableForLocale(product);
        assert.isFalse(result);
    });

    it('Testing method: isProductAvailableForLocale --> Empty Product ', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        product.custom.availableForLocale ={
            value: 'No'
        }
        var result = ProductHelper.isProductAvailableForLocale(null);
        assert.isFalse(result);
    });

    it('Testing method: isProductAvailableForLocale --> custom Exception', () => {
        let Product = require('../../mocks/dw/dw_catalog_Product');
        let product = new Product();
        var result = ProductHelper.isProductAvailableForLocale(product);
        assert.isFalse(result);
    });

    it('Testing method: enableAvailablePerLocale --> enableAvailablePerLocale is enabled ', () => {
        var result = ProductHelper.enableAvailablePerLocale();
        assert.isTrue(result);
    });

    it('Testing method: enableAvailablePerLocale --> enableAvailablePerLocale is disabled', () => {
        let ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/ProductHelper', {
            'dw/catalog/ProductSearchModel':{},
            '*/cartridge/scripts/helpers/productHelpers': {},
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            enableAvailablePerLocale: false
                        }
                    },
                    getCustomPreferenceValue: function () {
                        return false
                    }
                }
            },
            'dw/system/Logger': {
                debug: function (text) {
                    return text;
                },
                error: function (text) {
                    return text;
                }
            }
        });
        var result = ProductHelper.enableAvailablePerLocale();
        assert.isFalse(result);
    });

    it('Testing method: enableAvailablePerLocale --> custom exception', () => {
        var stubFormat = sinon.stub();
        let ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/ProductHelper', {
            'dw/catalog/ProductSearchModel':{},
            '*/cartridge/scripts/helpers/productHelpers': {},
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            enableAvailablePerLocale: false
                        }
                    },
                    getCustomPreferenceValue: stubFormat
                }
            },
            'dw/system/Logger': {
                debug: function (text) {
                    return text;
                },
                error: function (text) {
                    return text;
                }
            }
        });
        stubFormat.throws(new Error('custom exception'));
        var result = ProductHelper.enableAvailablePerLocale();
        assert.isFalse(result);
    });

    it('Testing method: enablePLPImageSlider --> enablePLPImageSlider is enabled ', () => {
        var result = ProductHelper.enablePLPImageSlider();
        assert.isTrue(result);
    });

    it('Testing method: enablePLPImageSlider --> enablePLPImageSlider is disabled', () => {
        let ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/ProductHelper', {
            'dw/catalog/ProductSearchModel':{},
            '*/cartridge/scripts/helpers/productHelpers': {},
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            enablePLPImageSlider: false
                        }
                    },
                    getCustomPreferenceValue: function () {
                        return false
                    }
                }
            },
            'dw/system/Logger': {
                debug: function (text) {
                    return text;
                },
                error: function (text) {
                    return text;
                }
            }
        });
        var result = ProductHelper.enablePLPImageSlider();
        assert.isFalse(result);
    });

    it('Testing method: enablePLPImageSlider --> custom exception', () => {
        var stubFormat = sinon.stub();
        let ProductHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/ProductHelper', {
            'dw/catalog/ProductSearchModel':{},
            '*/cartridge/scripts/helpers/productHelpers': {},
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            enablePLPImageSlider: false
                        }
                    },
                    getCustomPreferenceValue: stubFormat
                }
            },
            'dw/system/Logger': {
                debug: function (text) {
                    return text;
                },
                error: function (text) {
                    return text;
                }
            }
        });
        stubFormat.throws(new Error('custom exception'));
        var result = ProductHelper.enablePLPImageSlider();
        assert.isFalse(result);
    });
});