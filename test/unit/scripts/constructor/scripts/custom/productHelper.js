const assert = require('chai').assert;
const expect = require('chai').expect;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var Collection = require('../../../../../mocks/dw/dw_util_Collection');

describe('parseAttributeValue', () => {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return null if the input value is falsy', () => {
        const result = productHelper.parseAttributeValue(null);
        expect(result).to.be.null;
    });

    it('should extract values from Java string arrays', () => {
        const javaStringArray = ['Value 1', 'Value 2', 'Value 3'];
        const result = productHelper.parseAttributeValue(javaStringArray);
        expect(result).to.deep.equal(['Value 1', 'Value 2', 'Value 3']);
    });

    it('should handle normal strings and return the value or null if falsy', () => {
        const stringValue = 'ExampleString';
        const nullValue = null;
        const emptyString = '';
        
        const resultString = productHelper.parseAttributeValue(stringValue);
        const resultNull = productHelper.parseAttributeValue(nullValue);
        const resultEmptyString = productHelper.parseAttributeValue(emptyString);

        expect(resultString).to.equal('ExampleString');
        expect(resultNull).to.be.null;
        expect(resultEmptyString).to.be.null;
    });
});

describe('getAttributeValue', () => {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return null if the attribute value is falsy', () => {
        const product = {
            custom: {
                attributeID: null
            }
        };
        const result = productHelper.getAttributeValue(product, 'attributeID');
        expect(result).to.be.null;
    });

    it('should return parsed attribute value for Java string arrays', () => {
        const javaStringArray = ['Value 1', 'Value 2', 'Value 3'];
        const product = {
            custom: {
                attributeID: javaStringArray
            }
        };
        const result = productHelper.getAttributeValue(product, 'attributeID');
        expect(result).to.deep.equal(['Value 1', 'Value 2', 'Value 3']);
    });

    it('should return attribute value for normal strings or null if falsy', () => {
        const stringValue = 'ExampleString';
        const nullValue = null;
        const emptyString = '';

        const productWithString = {
            custom: {
                attributeID: stringValue
            }
        };
        const productWithNull = {
            custom: {
                attributeID: nullValue
            }
        };
        const productWithEmptyString = {
            custom: {
                attributeID: emptyString
            }
        };

        const resultString = productHelper.getAttributeValue(productWithString, 'attributeID');
        const resultNull = productHelper.getAttributeValue(productWithNull, 'attributeID');
        const resultEmptyString = productHelper.getAttributeValue(productWithEmptyString, 'attributeID');

        expect(resultString).to.equal('ExampleString');
        expect(resultNull).to.be.null;
        expect(resultEmptyString).to.be.null;
    });
});

describe('getVariationGroupOrNull', () => {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return null if the product does not have a variation model', () => {
        const product = {
            variationModel: null
        };
        const result = productHelper.getVariationGroupOrNull(product);
        expect(result).to.be.null;
    });

    it('should return the variation group matching the product color', () => {
        const variationGroupRed = {
            custom: {
                color: 'Red'
            }
        };
        const variationGroupBlue = {
            custom: {
                color: 'Blue'
            }
        };
        const product = {
            variationModel: {
                variationGroups: {
                    toArray: () => [variationGroupRed, variationGroupBlue]
                }
            },
            custom: {
                color: 'Red'
            }
        };
        const result = productHelper.getVariationGroupOrNull(product);
        expect(result).to.deep.equal(variationGroupRed);
    });

    it('should return the first variation group if no matching color is found', () => {
        const variationGroup1 = {
            custom: {
                color: 'Green'
            }
        };
        const variationGroup2 = {
            custom: {
                color: 'Yellow'
            }
        };
        const product = {
            variationModel: {
                variationGroups: {
                    toArray: () => [variationGroup1, variationGroup2]
                }
            },
            custom: {
                color: 'Blue'
            }
        };
        const result = productHelper.getVariationGroupOrNull(product);
        expect(result).to.deep.equal(variationGroup1);
    });

    it('should return null if variation model is empty', () => {
        const product = {
            variationModel: {
                variationGroups: {
                    toArray: () => []
                }
            },
            custom: {
                color: 'Red'
            }
        };
        const result = productHelper.getVariationGroupOrNull(product);
        expect(result).to.be.null;
    });
});

describe('getInventoryAmount', function() {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return 2147483647 for perpetual inventory', function() {
        const product = {
            availabilityModel: {
                inventoryRecord: {
                    isPerpetual: () => true // Simulating a perpetual inventory record
                }
            },
            custom: {
                exclusive: null
            }
        };
        const result = productHelper.getInventoryAmount(product);
        expect(result).to.equal(2147483647);
    });

    it('should return the inventory amount for non-perpetual inventory', function() {
        const product = {
            availabilityModel: {
                inventoryRecord: {
                    isPerpetual: () => false, // Simulating a non-perpetual inventory record
                    ATS: {
                        value: 100 // Simulating an inventory amount
                    }
                }
            },
            custom: {
                exclusive: null
            }
        };
        const result = productHelper.getInventoryAmount(product);
        expect(result).to.equal(100);
    });

    it('should return 0 when exclusive equals out-of-stock', function() {
        const product = {
            custom: {
                exclusive: 'out-of-stock'
            }
        };
        const result = productHelper.getInventoryAmount(product);
        expect(result).to.equal(0);
    });

    it('should return 0 for empty products', function() {
        const result = productHelper.getInventoryAmount(null); // Simulating an empty product
        expect(result).to.equal(0);
    });

    it('should return 0 for empty inventory records', function() {
        const product = {
            availabilityModel: {
                inventoryRecord: {}
            },
            custom: {
                exclusive: null
            }
        };
        const result = productHelper.getInventoryAmount(product); // Simulating an empty inventory record
        expect(result).to.equal(0);
    });
});

describe('getCustomerGroupPricing', () => {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return an empty array if product promotions are empty', () => {
        const result = productHelper.getCustomerGroupPricing(null, [], false);
        expect(result).to.be.an('array').that.is.empty;
    });

    it('should return customer group pricing for applicable promotions with fancy keys', () => {
        const product = {};
        const promo1 = {
            basedOnCoupons: false,
            getPromotionalPrice: () => ({
                value: 50,
                isAvailable: () => true
            }),
            customerGroups: {
                toArray: () => [
                    { ID: 'group1' },
                    { ID: 'group2' }
                ]
            }
        };
        const promo2 = {
            basedOnCoupons: true, // should not be considered
            getPromotionalPrice: () => null,
            customerGroups: {
                toArray: () => [{ ID: 'group3' }]
            }
        };
        var productPromotions = new Collection();
        productPromotions.add(promo1);
        productPromotions.add(promo2);

        const result = productHelper.getCustomerGroupPricing(product, productPromotions, true);
        expect(result).to.deep.equal([
            { key: 'Price group1', value: 50 },
            { key: 'Price group2', value: 50 }
        ]);
    });

    it('should return customer group pricing for applicable promotions without fancy keys', () => {
        const product = {};
        const promo1 = {
            basedOnCoupons: false,
            getPromotionalPrice: () => ({
                value: 60,
                isAvailable: () => true
            }),
            customerGroups: {
                toArray: () => [
                    { ID: 'group1' },
                    { ID: 'group2' }
                ]
            }
        };
        var productPromotions = new Collection();
        productPromotions.add(promo1);

        const result = productHelper.getCustomerGroupPricing(product, productPromotions, false);
        expect(result).to.deep.equal([
            { key: 'group1', value: 60 },
            { key: 'group2', value: 60 }
        ]);
    });
});

describe('getDisplayValues function', function () {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return display values for a valid product and attribute', function () {
        var product = {
            variationModel: {
                getProductVariationAttribute: function (attributeName) {
                    if (attributeName === 'Color') {
                        return {
                            ID: 'Color'
                        };
                    }
                    return null;
                },
                getAllValues: function (attribute) {
                    if (attribute.ID === 'Color') {
                        return {
                            toArray: function () {
                                return [
                                    { displayValue: 'Red' },
                                    { displayValue: 'Blue' },
                                    { displayValue: 'Green' }
                                ];
                            }
                        };
                    }
                    return null;
                }
            }
        };

        var displayValues = productHelper.getDisplayValues(product, 'Color');
        expect(displayValues).to.deep.equal(['Red', 'Blue', 'Green']);
    });

    it('should return an empty array for an invalid attribute', function () {
        var product = {
            variationModel: {
                getProductVariationAttribute: function (attributeName) {
                    return null;
                }
            }
        };

        var displayValues = productHelper.getDisplayValues(product, 'InvalidAttribute');
        expect(displayValues).to.be.an('array').that.is.empty;
    });
});

describe('buildInventorySizeMap function', function () {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return a map with updated inventory quantity for a valid product and size map', function () {
        var product = {
            variationModel: {
                getProductVariationAttribute: function (attributeName) {
                    if (attributeName === 'size') {
                        return {
                            ID: 'size'
                        };
                    }
                    return null;
                },
                getVariationValue: function (product, sizeAttribute) {
                    if (sizeAttribute.ID === 'size') {
                        return {
                            value: 'M'
                        };
                    }
                    return null;
                }
            },
            availabilityModel: {
                inventoryRecord: {
                    getInventoryAmount: function () {
                        return 10;
                    },
                    isPerpetual: function() {
                        return false;
                    },
                    ATS: {
                        value: 10
                    }
                }
            },
            custom: {
                exclusive: null
            }
        };

        var sizeMap = new Map();
        sizeMap.set('M', 5);

        var updatedMap = productHelper.buildInventorySizeMap(product, sizeMap);

        expect(updatedMap.get('M')).to.equal(15);
    });

    it('should return the original size map for a product without inventory record', function () {
        var product = {
            variationModel: {
                getProductVariationAttribute: function (attributeName) {
                    return null;
                }
            },
            availabilityModel: {
                inventoryRecord: null
            }
        };

        var sizeMap = new Map();
        sizeMap.set('M', 5);

        var updatedMap = productHelper.buildInventorySizeMap(product, sizeMap);

        expect(updatedMap.get('M')).to.equal(5);
    });
});

describe('buildCustomerGroupPromoPriceMap function', function () {
    it('should return a map with promo prices by customer group for a valid product', function () {
        var productHelper = proxyquire('../../../../../mocks/constructor/custom/productHelper', {
            'dw/campaign/PromotionMgr': {
                getActivePromotions: function () {
                    return {
                        getProductPromotions: function(product) {
                            const promo1 = {
                                basedOnCoupons: false,
                                getPromotionalPrice: () => ({
                                    value: 50,
                                    isAvailable: () => true
                                }),
                                customerGroups: {
                                    toArray: () => [
                                        { ID: 'group3' },
                                        { ID: 'group4' }
                                    ]
                                }
                            };
    
                            var productPromotions = new Collection();
                            productPromotions.add(promo1);
    
                            return productPromotions;
                        }
                    };
                }
            }
        });

        var product = {
            ID: '12345'
        };

        var variantPrices = [
            { key: 'group1', value: 10 },
            { key: 'group2', value: 20 }
        ];

        var updatedPrices = productHelper.buildCustomerGroupPromoPriceMap(product, variantPrices);

        var expectedResult = [
            { key: 'group1', value: 10 },
            { key: 'group2', value: 20 },
            { key: 'group3', value: 50 },
            { key: 'group4', value: 50 }
        ];

        expect(updatedPrices).to.deep.equal(expectedResult);
    });

    it('should return the original variant prices for a product with no active promotions', function () {
        var productHelper = proxyquire('../../../../../mocks/constructor/custom/productHelper', {
            'dw/campaign/PromotionMgr': {
                getActivePromotions: function () {
                    return {
                        getProductPromotions: function(product) {
                            return null;
                        }
                    };
                }
            }
        });

        var product = {
            ID: '54321'
        };

        var variantPrices = [
            { key: 'groupA', value: 15 },
            { key: 'groupB', value: 25 }
        ];

        var updatedPrices = productHelper.buildCustomerGroupPromoPriceMap(product, variantPrices);

        expect(updatedPrices).to.deep.equal(variantPrices);
    });
});

describe('formatGroupPromoPricing function', function () {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should format the customer group promo pricing list with min and max prices', function () {
        var originalPrices = [
            { key: 'group1', value: 10 },
            { key: 'group2', value: 20 },
            { key: 'group1', value: 5 },
            { key: 'group2', value: 25 }
        ];

        var formattedPrices = productHelper.formatGroupPromoPricing(originalPrices);

        expect(formattedPrices).to.be.an('object');
        expect(formattedPrices).to.have.property('group1');
        expect(formattedPrices).to.have.property('group2');
        expect(formattedPrices.group1).to.deep.equal({ min: 5, max: 10 });
        expect(formattedPrices.group2).to.deep.equal({ min: 20, max: 25 });
    });

    it('should return an empty object for an empty list of original prices', function () {
        var originalPrices = [];

        var formattedPrices = productHelper.formatGroupPromoPricing(originalPrices);

        expect(formattedPrices).to.be.an('object').that.is.empty;
    });
});

describe('getVariantData function', function () {
    var productHelper = proxyquire('../../../../../mocks/constructor/custom/productHelper', {
        'dw/campaign/PromotionMgr': {
            getActivePromotions: function () {
                return {
                    getProductPromotions: function(product) {
                        const promo1 = {
                            basedOnCoupons: false,
                            getPromotionalPrice: () => ({
                                value: 50,
                                isAvailable: () => true
                            }),
                            customerGroups: {
                                toArray: () => [
                                    { ID: 'group3' },
                                    { ID: 'group4' }
                                ]
                            }
                        };

                        var productPromotions = new Collection();
                        productPromotions.add(promo1);

                        return productPromotions;
                    }
                };
            }
        }
    });

    it('should return an empty string for product with variants', function () {
        var product = {
            variant: true,
            getVariants: function () {
                return {
                    toArray: function () {
                        return [{ onlineFlag: true, custom: { sku: 'SKU123' }, ID: 'UPC123' }];
                    }
                };
            }
        };
        var supplementalData = { promoPricingEnabled: true };

        var variantData = productHelper.getVariantData(product, supplementalData);

        expect(variantData).to.equal('');
    });

    it('should return variant data for a product without variants', function () {
        var variant1 = {
            onlineFlag: true,
            custom: { sku: 'SKU123' },
            ID: 'UPC123',
            variationModel: {
                getProductVariationAttribute: function (attributeName) {
                    if (attributeName === 'Color') {
                        return {
                            ID: 'Color'
                        };
                    }
                    return null;
                },
                getAllValues: function (attribute) {
                    if (attribute.ID === 'Color') {
                        return {
                            toArray: function () {
                                return [
                                    { displayValue: 'Red' },
                                    { displayValue: 'Blue' },
                                    { displayValue: 'Green' }
                                ];
                            }
                        };
                    }
                    return null;
                }
            }
        };
        var variant2 = {
            onlineFlag: true,
            custom: { sku: 'SKU456' },
            ID: 'UPC456',
            variationModel: {
                getProductVariationAttribute: function (attributeName) {
                    if (attributeName === 'Color') {
                        return {
                            ID: 'Color'
                        };
                    }
                    return null;
                },
                getAllValues: function (attribute) {
                    if (attribute.ID === 'Color') {
                        return {
                            toArray: function () {
                                return [
                                    { displayValue: 'Yellow' },
                                    { displayValue: 'Brown' },
                                    { displayValue: 'Orange' }
                                ];
                            }
                        };
                    }
                    return null;
                }
            }
        };
        var product = {
            variant: false,
            getVariants: function () {
                return {
                    toArray: function () {
                        return [variant1, variant2];
                    }
                };
            },
            variationModel: {
                getProductVariationAttribute: function (attributeName) {
                    if (attributeName === 'color') {
                        return {
                            ID: 'Color'
                        };
                    }
                    if (attributeName === 'size') {
                        return {
                            ID: 'Size'
                        };
                    }
                    return null;
                },
                getAllValues: function (attribute) {
                    if (attribute.ID === 'Color') {
                        return {
                            toArray: function () {
                                return [
                                    { displayValue: 'Red' },
                                    { displayValue: 'Blue' },
                                    { displayValue: 'Green' }
                                ];
                            }
                        };
                    }
                    if (attribute.ID === 'Size') {
                        return {
                            toArray: function () {
                                return [
                                    { displayValue: 'S' },
                                    { displayValue: 'M' },
                                    { displayValue: 'L' }
                                ];
                            }
                        };
                    }
                    return null;
                }
            }
        };
        var supplementalData = { promoPricingEnabled: true };

        var variantData = productHelper.getVariantData(product, supplementalData);

        expect(variantData).to.be.an('object');
        expect(variantData).to.have.property('colors');
        expect(variantData).to.have.property('sizes');
    });
});

describe('isEGiftCard function', function () {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return true if product is an e-gift card', function () {
        var product = {
            custom: {
                giftCard: {
                    value: 'EGIFT_CARD'
                }
            }
        };

        var isEgift = productHelper.isEGiftCard(product);

        expect(isEgift).to.be.true;
    });

    it('should return false if product is not an e-gift card', function () {
        var product = {
            custom: {
                giftCard: {
                    value: 'PHYSICAL_CARD'
                }
            }
        };

        var isEgift = productHelper.isEGiftCard(product);

        expect(isEgift).to.be.false;
    });

    it('should return false if product does not have a giftCard property', function () {
        var product = {
            custom: {}
        };

        var isEgift = productHelper.isEGiftCard(product);

        expect(isEgift).to.be.false;
    });

    it('should return false if product has an empty giftCard property', function () {
        var product = {
            custom: {
                giftCard: {}
            }
        };

        var isEgift = productHelper.isEGiftCard(product);

        expect(isEgift).to.be.false;
    });
});

describe('getMinPrice function', function () {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return the minimum price for a product in the specified price book', function () {
        var product = {
            priceModel: {
                getMinPriceBookPrice: function (priceBookID) {
                    return { value: 10 };
                },
                getPrice: function () {
                    return { value: 20 };
                }
            },
            custom: {}
        };

        var minPrice = productHelper.getMinPrice(product, 'somePriceBookID');

        expect(minPrice).to.equal(10);
    });

    it('should return the product price if there is no minimum price in the specified price book', function () {
        var product = {
            priceModel: {
                getMinPriceBookPrice: function (priceBookID) {
                    return { value: null };
                },
                getPrice: function () {
                    return { value: 20 };
                }
            },
            custom: {}
        };

        var minPrice = productHelper.getMinPrice(product, 'somePriceBookID');

        expect(minPrice).to.equal(20);
    });

    it('should return the e-gift card minimum amount if the product is an e-gift card', function () {
        var product = {
            custom: {
                giftCard: {
                    value: 'EGIFT_CARD'
                }
            }
        };

        var minPrice = productHelper.getMinPrice(product, 'somePriceBookID');

        expect(minPrice).to.equal(10);
    });
});

describe('getMaxPrice function', function () {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return the maximum price for a product in the specified price book', function () {
        var product = {
            priceModel: {
                getMaxPriceBookPrice: function (priceBookID) {
                    return { value: 500 };
                },
                getPrice: function () {
                    return { value: 425 };
                }
            },
            custom: {}
        };

        var maxPrice = productHelper.getMaxPrice(product, 'somePriceBookID');

        expect(maxPrice).to.equal(500);
    });

    it('should return the product price if there is no maximum price in the specified price book', function () {
        var product = {
            priceModel: {
                getMaxPriceBookPrice: function (priceBookID) {
                    return { value: null };
                },
                getPrice: function () {
                    return { value: 330 };
                }
            },
            custom: {}
        };

        var maxPrice = productHelper.getMaxPrice(product, 'somePriceBookID');

        expect(maxPrice).to.equal(330);
    });

    it('should return the e-gift card maximum amount if the product is an e-gift card', function () {
        var product = {
            custom: {
                giftCard: {
                    value: 'EGIFT_CARD'
                }
            }
        };

        var maxPrice = productHelper.getMaxPrice(product, 'somePriceBookID');

        expect(maxPrice).to.equal(500);
    });
});

describe('getPriceCurrency function', function () {
    var productHelper = require('../../../../../../cartridges/int_constructor_custom_legacy/cartridge/scripts/custom/productHelper');

    it('should return the currency code for a price range', function () {
        var priceModel = {
            isPriceRange: function () {
                return true;
            },
            getMaxPrice: function () {
                return {
                    getCurrencyCode: function () {
                        return 'USD';
                    }
                };
            },
            getPrice: function () {}
        };

        var currencyCode = productHelper.getPriceCurrency(priceModel);

        expect(currencyCode).to.equal('USD');
    });

    it('should return the currency code for a single price', function () {
        var priceModel = {
            isPriceRange: function () {
                return false;
            },
            getMaxPrice: function () {},
            getPrice: function () {
                return {
                    getCurrencyCode: function () {
                        return 'EUR';
                    },
                    available: true
                };
            }
        };

        var currencyCode = productHelper.getPriceCurrency(priceModel);

        expect(currencyCode).to.equal('EUR');
    });

    it('should return the currency code for the max price if currency code is "N/A"', function () {
        var priceModel = {
            isPriceRange: function () {
                return false;
            },
            getMaxPrice: function () {
                return {
                    getCurrencyCode: function () {
                        return 'USD';
                    }
                };
            },
            getPrice: function () {
                return {
                    getCurrencyCode: function () {
                        return 'N/A';
                    },
                    available: false
                };
            }
        };

        var currencyCode = productHelper.getPriceCurrency(priceModel);

        expect(currencyCode).to.equal('USD');
    });
});

describe('getClassificationCategory function', function () {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return null for a product without a classification category', function () {
        var product = {
            getClassificationCategory: function () {
                return null;
            }
        };

        var classificationCategory = productHelper.getClassificationCategory(product);

        expect(classificationCategory).to.be.null;
    });

    it('should return null for a product with a classification category from a different catalog', function () {
        var productHelper = proxyquire('../../../../../mocks/constructor/custom/productHelper', {
            '../../../mocks/dw/dw_catalog_CatalogMgr': {
                getCategory: function (id) {
                    return null;
                }
            }
        });

        var classificationCategory = {
            ID: 'someCategoryId',
            UUID: 'someUUID'
        };

        var product = {
            getClassificationCategory: function () {
                return classificationCategory;
            }
        };

        var result = productHelper.getClassificationCategory(product);

        expect(result).to.be.null;
    });

    it('should return the classification category for a valid product with a valid category', function () {
        var classificationCategory = {
            ID: 'someCategoryId',
            UUID: 'someUUID'
        };

        var product = {
            getClassificationCategory: function () {
                return classificationCategory;
            }
        };

        var result = productHelper.getClassificationCategory(product);

        expect(result).to.deep.equal(classificationCategory);
    });
});

describe('getProductCategory function', function () {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return the classification category if available', function () {
        var classificationCategory = {
            ID: 'someCategoryId',
            UUID: 'someUUID'
        };

        var product = {
            getCategories: function () {
                return {
                    size: function () {
                        return 0;
                    }
                };
            },
            getClassificationCategory: function () {
                return classificationCategory;
            }
        };

        var result = productHelper.getProductCategory(product, null);

        expect(result).to.deep.equal(classificationCategory);
    });

    it('should return the primary category if classification category is empty', function () {
        var classificationCategory = null;

        var primaryCategory = {
            ID: 'someCategoryId'
        };

        var product = {
            getCategories: function () {
                return [primaryCategory];
            },
            getClassificationCategory: function () {
                return null;
            }
        };

        var result = productHelper.getProductCategory(product, primaryCategory);

        expect(result).to.deep.equal(primaryCategory);
    });
});

describe('getCategoryPath function', function () {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return an empty string if getProductCategory returns null', function () {
        var product = {
            getCategories: function () {
                return new Collection();
            },
            getClassificationCategory: function () {
                return null;
            }
        };

        var primaryCategory = null;

        var result = productHelper.getCategoryPath(product, primaryCategory);

        expect(result).to.equal('');
    });

    it('should return the correct category path for a valid category', function () {
        var classificationCategory = {
            ID: 'someCategoryId',
            UUID: 'someUUID',
            displayName: 'catDisplayName',
            parent: {
                ID: 'parentCategoryID',
                displayName: 'parentDisplayName',
                parent: {
                    ID: 'root',
                    displayName: 'MainCategory'
                }
            }
        };

        var product = {
            getCategories: function () {
                var categories = new Collection();
                categories.add({ ID: 'randomId' });
                return categories;
            },
            getClassificationCategory: function () {
                return classificationCategory;
            }
        };

        var primaryCategory = {
            displayName: 'myCategoryID',
            parent: {
                ID: 'parentCategoryID'
            }
        };

        var result = productHelper.getCategoryPath(product, primaryCategory);

        expect(result).to.equal('parentDisplayName > catDisplayName');
    });
});

describe('getColorValue function', function () {
    var productHelper = require('../../../../../../cartridges/int_constructor_custom_legacy/cartridge/scripts/custom/productHelper');

    it('should return an empty string for master product', function () {
        var product = {
            master: true,
            custom: {
                color: 'Red'
            }
        };
        var colorAttr = {};

        var result = productHelper.getColorValue(product, colorAttr);

        expect(result).to.equal('');
    });

    it('should return an empty string for empty color attribute', function () {
        var product = {
            master: false,
            custom: {
                color: 'Red'
            }
        };
        var colorAttr = null;

        var result = productHelper.getColorValue(product, colorAttr);

        expect(result).to.equal('');
    });

    it('should return the color display value for a valid color attribute', function () {
        var product = {
            master: false,
            custom: {
                color: 'Red'
            },
            variationModel: {
                getVariationValue: function (product, colorAttr) {
                    return {
                        displayValue: 'Red Color'
                    };
                }
            }
        };
        var colorAttr = {};

        var result = productHelper.getColorValue(product, colorAttr);

        expect(result).to.equal('Red Color');
    });
});

describe('getOnModelImage function', function () {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return an empty string if no onmodelImage found', function () {
        var product = {
            getImages: function (imageType) {
                if (imageType === 'onmodelImage') {
                    return [];
                }
                return {};
            }
        };

        var result = productHelper.getOnModelImage(product);

        expect(result).to.equal('');
    });

    it('should return the encoded URL for the onmodelImage', function () {
        var List = require('dw/util/List');
        var mockImageURL = 'https://example.com/image.jpg';
        var product = {
            getImages: function (imageType) {
                if (imageType === 'onmodelImage') {
                    var myList = [];
                    myList.push(
                        {
                            httpsURL: {
                                toString: function () {
                                    return mockImageURL;
                                }
                            }
                        }
                    );

                    return myList;
                }
                return {};
            }
        };

        var result = productHelper.getOnModelImage(product);

        expect(result).to.equal(encodeURI(mockImageURL).replace(/,/g, '%2C'));
    });
});

describe('getDefaultColor function', function () {
    var productHelper = require('../../../../../../cartridges/int_constructor_custom_legacy/cartridge/scripts/custom/productHelper');

    it('should return an empty string if the product is a master', function () {
        var product = {
            master: true
        };

        var result = productHelper.getDefaultColor(product);

        expect(result).to.equal('');
    });

    it('should return the default color display value for a variant', function () {
        var mockColorAttr = {
            ID: 'color'
        };

        var mockVariant = {
            variationModel: {
                getVariationValue: function (variant, colorAttr) {
                    if (variant.ID === 'defaultVariant' && colorAttr.ID === 'color') {
                        return {
                            displayValue: 'Red'
                        };
                    }
                    return '';
                },
                getDefaultVariant: function () {
                    return {
                        ID: 'defaultVariant'
                    };
                }
            },
            master: false,
            custom: {
                color: 'Red'
            }
        };

        var result = productHelper.getDefaultColor(mockVariant, mockColorAttr);

        expect(result).to.equal('Red');
    });

    it('should return an empty string if the default variant or color attribute is empty', function () {
        var product = {
            variationModel: {
                getDefaultVariant: function () {
                    return '';
                },
                getVariationValue: function () {
                    return '';
                }
            },
            master: false,
            custom: {
                color: 'Red'
            }
        };

        var result = productHelper.getDefaultColor(product);

        expect(result).to.equal('');
    });
});

describe('getFitCare function', function () {
    var productHelper = require('../../../../../../cartridges/int_constructor_custom_legacy/cartridge/scripts/custom/productHelper');

    it('should return empty string if fitCare is not defined', function () {
        var product = {
            custom: {}
        };

        var result = productHelper.getFitCare(product);

        expect(result).to.equal('');
    });

    it('should return care instructions as a string separated by "|"', function () {
        var product = {
            custom: {
                fitCare: ['Machine wash cold', 'Tumble dry low']
            }
        };

        var result = productHelper.getFitCare(product);

        expect(result).to.equal('Machine wash cold|Tumble dry low');
    });

    it('should return empty string if fitCare is null or undefined', function () {
        var product = {
            custom: {
                fitCare: null
            }
        };

        var result = productHelper.getFitCare(product);

        expect(result).to.equal('');

        product.custom.fitCare = undefined;
        result = productHelper.getFitCare(product);

        expect(result).to.equal('');
    });
});

describe('getCategoryID function', function () {
    var productHelper = require('../../../../../../cartridges/int_constructor_custom_legacy/cartridge/scripts/custom/productHelper');

    it('should return an empty string if product has no primary category', function () {
        var product = {
            getPrimaryCategory: function () {
                return null;
            }
        };

        var result = productHelper.getCategoryID(product);

        expect(result).to.equal('');
    });

    it('should return the category ID when product has a primary category', function () {
        var primaryCategory = {
            ID: '12345'
        };

        var product = {
            getPrimaryCategory: function () {
                return primaryCategory;
            }
        };

        var result = productHelper.getCategoryID(product);

        expect(result).to.equal('12345');
    });
});

describe('getVideoMaterials function', function () {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return an empty string if product is a master', function () {
        var product = {
            master: true
        };

        var result = productHelper.getVideoMaterials(product);

        expect(result).to.equal('');
    });

    it('should return an empty string when product is not a master and has video materials and division is not Footwear', function () {
        var product = {
            custom: {
                style: 'product style',
                videoMaterials: '100|Underarmour/auto_dim7_3026532-100-768x432-1200k|Underarmour/auto_dim7_3026532-100-0x480-300k,101|Underarmour/auto_dim7_3026532-101-768x432-1200k|Underarmour/auto_dim7_3026532-101-0x360-800k,400|Underarmour/auto_dim7_3026532-400-768x432-1200k|Underarmour/auto_dim7_3026532-400-0x480-1400k,401|Underarmour/auto_dim7_3026532-401-768x432-1200k|Underarmour/auto_dim7_3026532-401-0x720-2600k,500|Underarmour/auto_dim7_3026532-500-768x432-1200k|Underarmour/auto_dim7_3026532-500-1280x720-2000k,502|Underarmour/auto_dim7_3026532-502-768x432-1200k|Underarmour/auto_dim7_3026532-502-0x480-1400k,600|Underarmour/auto_dim7_3026532-600-768x432-1200k|Underarmour/auto_dim7_3026532-600-0x360-800k,{video_url_mp4:"https://example.com/video.mp4"}',
                division: 'Apparel'
            },
            master: false,
            isVariant: function() {
                return true;
            },
            variationModel: {
                getProductVariationAttribute: function(name) {
                    return true;
                },
                getSelectedValue: function(attribute) {
                    return 'Red';
                },
                getVariationValue: function(product, attribute) {
                    return null;
                },
                hasOrderableVariants: function(attributeName, attributeValue) {
                    return false;
                }
            },
            masterProduct: {
                variationModel: {
                    getProductVariationAttribute: function(name) {
                        return null;
                    },
                    getSelectedValue: function(attribute) {
                        return null;
                    },
                    getVariationValue: function(product, attribute) {
                        return null;
                    },
                    hasOrderableVariants: function(attributeName, attributeValue) {
                        return false;
                    }
                }
            }
        };

        var result = productHelper.getVideoMaterials(product);

        expect(result).to.equal('');
    });

    it('should return the video URL when product is not a master and has video materials and division is Footwear', function () {
        var product = {
            custom: {
                style: 'product style',
                videoMaterials: '100|Underarmour/auto_dim7_3026532-100-768x432-1200k|Underarmour/auto_dim7_3026532-100-0x480-300k,101|Underarmour/auto_dim7_3026532-101-768x432-1200k|Underarmour/auto_dim7_3026532-101-0x360-800k,400|Underarmour/auto_dim7_3026532-400-768x432-1200k|Underarmour/auto_dim7_3026532-400-0x480-1400k,401|Underarmour/auto_dim7_3026532-401-768x432-1200k|Underarmour/auto_dim7_3026532-401-0x720-2600k,500|Underarmour/auto_dim7_3026532-500-768x432-1200k|Underarmour/auto_dim7_3026532-500-1280x720-2000k,502|Underarmour/auto_dim7_3026532-502-768x432-1200k|Underarmour/auto_dim7_3026532-502-0x480-1400k,600|Underarmour/auto_dim7_3026532-600-768x432-1200k|Underarmour/auto_dim7_3026532-600-0x360-800k,{video_url_mp4:"https://example.com/video.mp4"}',
                division: 'Footwear'
            },
            master: false,
            isVariant: function() {
                return true;
            },
            variationModel: {
                getProductVariationAttribute: function(name) {
                    return true;
                },
                getSelectedValue: function(attribute) {
                    return 'Red';
                },
                getVariationValue: function(product, attribute) {
                    return null;
                },
                hasOrderableVariants: function(attributeName, attributeValue) {
                    return false;
                }
            },
            masterProduct: {
                variationModel: {
                    getProductVariationAttribute: function(name) {
                        return null;
                    },
                    getSelectedValue: function(attribute) {
                        return null;
                    },
                    getVariationValue: function(product, attribute) {
                        return null;
                    },
                    hasOrderableVariants: function(attributeName, attributeValue) {
                        return false;
                    }
                }
            }
        };

        var result = productHelper.getVideoMaterials(product);

        expect(result).to.equal('');
    });
});

describe('getGridTileHoverImage function', function () {
    var productHelper = require('../../../../../../cartridges/int_constructor_custom_legacy/cartridge/scripts/custom/productHelper');

    it('should return the image URL from sizeModelImages', function () {
        var product = {};
        var sizeModelImages = [
            { URL: 'http://example.com/image1.jpg' },
            { URL: 'http://example.com/image2.jpg' }
        ];

        var result = productHelper.getGridTileHoverImage(product, sizeModelImages);

        expect(result).to.equal('https://example.com/image2.jpg');
    });

    it('should return the gridTileDesktop image URL if sizeModelImages is empty', function () {
        var product = {
            getImages: function (imageType) {
                if (imageType === 'gridTileDesktop') {
                    return [
                        { getURL: function () { return { https: function () { return { toString: function () { return 'https://example.com/gridTileImage.jpg'; } }; } }; } },
                        { getURL: function () { return { https: function () { return { toString: function () { return 'https://example.com/gridTileHoverImage.jpg'; } }; } }; } }
                    ];
                }
                return [];
            }
        };
        var sizeModelImages = [];

        var result = productHelper.getGridTileHoverImage(product, sizeModelImages);

        expect(result).to.equal('https://example.com/gridTileHoverImage.jpg');
    });

    it('should return an empty string if no suitable image is found', function () {
        var product = {
            getImages: function (imageType) {
                if (imageType === 'gridTileDesktop') {
                    return [
                        { getURL: function () { return { https: function () { return { toString: function () { return 'https://example.com/gridTileImage.jpg'; } }; } }; } }
                    ];
                }
                return [];
            }
        };
        var sizeModelImages = [];

        var result = productHelper.getGridTileHoverImage(product, sizeModelImages);

        expect(result).to.equal('');
    });
});

describe('getPromotions function', function () {
    const promo1 = {
        ID: 'my promo',
        basedOnCoupons: false,
        getPromotionalPrice: () => ({
            value: 50,
            isAvailable: () => true
        }),
        getCustomerGroups: function() {
            var groups = new Collection();
            groups.add({ ID: 'group3' });
            groups.add({ ID: 'group4' });
            return groups;
        },
        calloutMsg: {
            source: 'this is the callout message.'
        },
        details: {
            source: 'this is the detail message.'
        },
        startDate: '2023-11-01',
        endDate: '2024-01-08',
        rank: 10
    };

    var productHelper = proxyquire('../../../../../../cartridges/int_constructor_custom_legacy/cartridge/scripts/custom/productHelper', {
        'dw/campaign/PromotionMgr': {
            getActivePromotions: function () {
                return {
                    getProductPromotions: function(product) {
                        if (product.ID === '5678') {
                            return null;
                        }

                        var productPromotions = new Collection();
                        productPromotions.add(promo1);

                        return productPromotions;
                    }
                };
            }
        }
    });

    it('should return JSON list of promotions for the product', function () {
        var mockProduct = {
            ID: '1234'
        };

        var result = productHelper.getPromotions(mockProduct);

        var expectedResult = [
            {
                id: 'my promo',
                customerGroups: [
                    'group3',
                    'group4'
                ],
                callOut: 'this is the callout message.',
                toolTipText: 'this is the detail message.',
                startDate: '2023-11-01',
                endDate: '2024-01-08',
                rank: 10
            }
        ];

        var parsedResult = JSON.parse(result);
        expect(parsedResult).to.be.an('array');
        expect(parsedResult).to.deep.equal(expectedResult);
    });

    it('should return an empty string if no promotions are available for the product', function () {
        var mockProduct = {
            ID: '5678'
        };

        var result = productHelper.getPromotions(mockProduct);

        expect(result).to.equal(null);
    });
});

describe('getSwatchCount', () => {
    var productHelper = proxyquire('../../../../../../cartridges/int_constructor_custom_legacy/cartridge/scripts/custom/productHelper', {
        '*/cartridge/scripts/factories/product': {
            get: function (params) {
                if (!empty(params) && 'pid' in params && params.pid && 'swatches' in params && params.swatches) {
                    return {
                        id: params.pid,
                        swatches: {
                            count: 6
                        }
                    };
                }

                return '';
            }
        }
    });

    it('should return the count of color chips for a valid product id', () => {
        const result = productHelper.getSwatchCount(1370951);
        expect(result).to.equal(6);
    });

    it('should return 0 for an invalid or empty product id', () => {
        const resultEmptyId = productHelper.getSwatchCount('');
        const resultInvalidId = productHelper.getSwatchCount(null);

        expect(resultEmptyId).to.equal(0);
        expect(resultInvalidId).to.equal(0);
    });
});

describe('getImage function', function () {
    var productHelper = require('../../../../../../cartridges/int_constructor_custom_legacy/cartridge/scripts/custom/productHelper');

    it('should return image data for the specified product', function () {
        var mockProduct = {
            getImage: function (viewType, index) {
                if (viewType === 'gridTileDesktop') {
                    return {
                        getURL: function () {
                            return {
                                toString: function () {
                                    return 'https://example.com/image.jpg?rp=recipe123|param';
                                }
                            };
                        },
                        getTitle: function () {
                            return 'ProductImage';
                        }
                    };
                }
                
                return null;
            }
        };

        var result = productHelper.getImage(mockProduct);

        expect(result).to.be.an('object');
        expect(result.fileName).to.equal('image.jpg');
        expect(result.viewType).to.equal('gridTileDesktop');
        expect(result.title).to.equal('ProductImage');
        expect(result.recipe).to.equal('recipe123');
    });

    it('should return null if no image is available for the product', function () {
        var mockProduct = {
            getImage: function (viewType, index) {
                return null;
            }
        };

        var result = productHelper.getImage(mockProduct);

        expect(result).to.equal(null);
    });
});

describe('getSecondaryHexColor function', function () {
    var productHelper = require('../../../../../../cartridges/int_constructor_custom_legacy/cartridge/scripts/custom/productHelper');

    it('should return secondary hex color for the specified product if available', function () {
        var product = {
            custom: {
                secondaryhexcolor: '#FF0000'
            }
        };

        var result = productHelper.getSecondaryHexColor(product);

        expect(result).to.equal('"FF0000"');
    });

    it('should return an empty string if secondary hex color is not available for the product', function () {
        var product = {
            custom: {}
        };

        var result = productHelper.getSecondaryHexColor(product);

        expect(result).to.equal('');
    });
});

describe('getHexColor function', function () {
    var productHelper = require('../../../../../../cartridges/int_constructor_custom_legacy/cartridge/scripts/custom/productHelper');

    it('should return primary hex color for the specified product if available', function () {
        var mockProductWithHexColor = {
            custom: {
                hexcolor: '#00FF00'
            }
        };

        var result = productHelper.getHexColor(mockProductWithHexColor);

        expect(result).to.equal('"00FF00"');
    });

    it('should return an empty string if primary hex color is not available for the product', function () {
        var mockProductWithoutHexColor = {
            custom: {}
        };

        var result = productHelper.getHexColor(mockProductWithoutHexColor);

        expect(result).to.equal('');
    });
});

describe('hideColorWay', function() {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return true if product out of stock', function() {
        const result = productHelper.hideColorWay(false);
        expect(result).to.be.true;
    });

    it('should return false if product is in stock', function() {
        const result = productHelper.hideColorWay(true);
        expect(result).to.be.false;
    });

    it('should return null if inStock is not boolean', function() {
        const result = productHelper.hideColorWay('garbage');
        expect(result).to.be.null;
    });

    it('should return null if inStock is null', function() {
        const result = productHelper.hideColorWay(null);
        expect(result).to.be.null;
    });
});

describe('getProductUrl', () => {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return correct URL for a non-variant product', () => {
        const product = {
            isVariant: () => false,
            ID: 1378676
        };
        const result = productHelper.getProductUrl(product);
        expect(result).to.equal('/p/1378676.html');
    });

    it('should return correct URL for a variant product', () => {
        const variantProduct = {
            isVariant: () => true,
            getMasterProduct: () => ({ ID: 196040206172 })
        };
        const result = productHelper.getProductUrl(variantProduct);
        expect(result).to.equal('/p/196040206172.html');
    });
});

describe('getProductId', () => {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return product ID if not a variant', () => {
        const product = {
            isVariant: () => false,
            ID: 1378676
        };
        const result = productHelper.getProductId(product);
        expect(result).to.equal(1378676);
    });

    it('should return product custom SKU if it exists and it is a variant', () => {
        const product = {
            isVariant: () => true,
            custom: { sku: '1378676-001-OSFA' },
            ID: 1378676
        };
        const result = productHelper.getProductId(product);
        expect(result).to.equal('1378676-001-OSFA');
    });

    it('should return product ID if it is a variant but custom SKU is empty', () => {
        const product = {
            isVariant: () => true,
            custom: { sku: '' },
            ID: 'productID'
        };
        const result = productHelper.getProductId(product);
        expect(result).to.equal('productID');
    });

    it('should return product ID if it is a variant but SKU is not present', () => {
        const product = {
            isVariant: () => true,
            ID: 'productID',
            custom: {}
        };
        const result = productHelper.getProductId(product);
        expect(result).to.equal('productID');
    });
});

describe('getExclusiveType function', function () {
    var productHelper = require('../../../../../../cartridges/int_constructor_custom_legacy/cartridge/scripts/custom/productHelper');

    it('should return exclusivity type in snake case if available for the specified product', function () {
        var mockProductWithExclusiveType = {
            custom: {
                exclusive: {
                    value: 'Exclusive-Product'
                }
            }
        };

        var result = productHelper.getExclusiveType(mockProductWithExclusiveType);

        expect(result).to.equal('Exclusive_Product');
    });

    it('should return an empty string if exclusivity type is not available for the product', function () {
        var mockProductWithoutExclusiveType = {
            custom: {}
        };

        var result = productHelper.getExclusiveType(mockProductWithoutExclusiveType);

        expect(result).to.equal('');
    });
});

describe('getTileUpperLeftFlameIconBadge function', function () {
    var productHelper = require('../../../../../../cartridges/int_constructor_custom_legacy/cartridge/scripts/custom/productHelper');

    it('should return the flame icon badge if available for the specified product', function () {
        var product = {
            custom: {
                productTileUpperLeftFlameIconBadge: 'flame_icon'
            }
        };

        var result = productHelper.getTileUpperLeftFlameIconBadge(product);

        expect(result).to.equal('flame_icon');
    });

    it('should return an empty string if flame icon badge is not available for the product', function () {
        var product = {
            custom: {}
        };

        var result = productHelper.getTileUpperLeftFlameIconBadge(product);

        expect(result).to.equal('');
    });
});

describe('getPreorderMessages', function() {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return pre-order messages if both pdpMessage and tileMessage are present', function() {
        const productWithPreOrderMessages = {
            custom: {
                preOrderPDPMessage: 'Pre-order message for PDP',
                preOrderProductTileMessage: 'Pre-order message for Product Tile'
            }
        };
        const result = productHelper.getPreorderMessages(productWithPreOrderMessages);
        const expected = JSON.stringify({
            pdpMessage: 'Pre-order message for PDP',
            tileMessage: 'Pre-order message for Product Tile'
        });
        expect(result).to.equal(expected);
    });

    it('should return only pdpMessage if tileMessage is not present', function() {
        const productWithOnlyPdpMessage = {
            custom: {
                preOrderPDPMessage: 'Pre-order message for PDP'
            }
        };
        const result = productHelper.getPreorderMessages(productWithOnlyPdpMessage);
        const expected = JSON.stringify({
            pdpMessage: 'Pre-order message for PDP'
        });
        expect(result).to.equal(expected);
    });

    it('should return only tileMessage if pdpMessage is not present', function() {
        const productWithOnlyTileMessage = {
            custom: {
                preOrderProductTileMessage: 'Pre-order message for Product Tile'
            }
        };
        const result = productHelper.getPreorderMessages(productWithOnlyTileMessage);
        const expected = JSON.stringify({
            tileMessage: 'Pre-order message for Product Tile'
        });
        expect(result).to.equal(expected);
    });

    it('should return an empty string if both pdpMessage and tileMessage are not present', function() {
        const productWithoutPreOrderMessages = {
            custom: {}
        };
        const result = productHelper.getPreorderMessages(productWithoutPreOrderMessages);
        expect(result).to.equal('');
    });
});

describe('getColorWayId function', function () {
    var productHelper = require('../../../../../../cartridges/int_constructor_custom_legacy/cartridge/scripts/custom/productHelper');

    it('should return the color way ID if available for the specified product', function () {
        var mockProductWithColor = {
            custom: {
                color: '123'
            }
        };

        var result = productHelper.getColorWayId(mockProductWithColor);

        expect(result).to.equal(JSON.stringify({ color: '123' }));
    });

    it('should return an empty string if color way ID is not available for the product', function () {
        var mockProductWithoutColor = {
            custom: {}
        };

        var result = productHelper.getColorWayId(mockProductWithoutColor);

        expect(result).to.equal('');
    });
});

describe('getDefaultColorwayId', function() {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return default colorway ID if present in product custom data', function() {
        const productWithDefaultColorway = {
            custom: {
                defaultColorway: 'abc123' // Assuming this is a valid ID
            }
        };
        const result = productHelper.getDefaultColorwayId(productWithDefaultColorway);
        expect(result).to.equal('abc123');
    });

    it('should return null if default colorway ID is not present', function() {
        const productWithoutDefaultColorway = {
            custom: {}
        };
        const result = productHelper.getDefaultColorwayId(productWithoutDefaultColorway);
        expect(result).to.equal(null);
    });

    it('should return null if default colorway is empty', function() {
        const productWithEmptyDefaultColorway = {
            custom: {
                defaultColorway: ''
            }
        };
        const result = productHelper.getDefaultColorwayId(productWithEmptyDefaultColorway);
        expect(result).to.equal(null);
    });
});

describe('getSizeModelImages', function() {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return an empty array if fit models are disabled', function() {
        const product = {
            custom: {
                hasSizeModel: false
            },
            isMaster: function() {
                return false;
            }
        };
        const result = productHelper.getSizeModelImages(product, 3);
        expect(result).to.be.an('array').that.is.empty;
    });

    it('should return an empty array if product has no size model', function() {
        const product = {
            custom: {
                hasSizeModel: false
            },
            isMaster: function() {
                return false;
            }
        };
        // Simulating fit models being enabled but the product has no size model
        const result = productHelper.getSizeModelImages(product, 3);
        expect(result).to.be.an('array').that.is.empty;
    });

    it('should return an empty array if product size is empty', function() {
        const product = {
            custom: {
                size: ''
            },
            isMaster: function() {
                return true;
            },
            variationModel: {
                master: {
                    custom: {
                        hasSizeModel: true
                    }
                }
            }
        };
        // Simulating fit models being enabled but the product size is empty
        const result = productHelper.getSizeModelImages(product, 3);
        expect(result).to.be.an('array').that.is.empty;
    });
});

describe('getLastTokenInURLPath function', function () {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return the last part of the URL path', function () {
        var url = 'https://example.com/path/to/resource';
        var result = productHelper.getLastTokenInURLPath(url);
        expect(result).to.equal('resource');
    });

    it('should handle URLs with query parameters', function () {
        var url = 'https://example.com/path/to/resource?param1=value1&param2=value2';
        var result = productHelper.getLastTokenInURLPath(url);
        expect(result).to.equal('resource');
    });

    it('should handle URLs with trailing slashes', function () {
        var url = 'https://example.com/path/to/resource/';
        var result = productHelper.getLastTokenInURLPath(url);
        expect(result).to.equal('');
    });

    it('should return an empty string for an empty URL', function () {
        var url = '';
        var result = productHelper.getLastTokenInURLPath(url);
        expect(result).to.equal('');
    });

    it('should handle URLs with file extensions', function () {
        var url = 'https://example.com/path/to/resource.html';
        var result = productHelper.getLastTokenInURLPath(url);
        expect(result).to.equal('resource.html');
    });
});

describe('isSizeModelImageFrontFacing', function () {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return true if size model image is front facing', function () {
        var url = 'https://example.com/path/to/image_FC.jpg';
        var result = productHelper.isSizeModelImageFrontFacing(url);
        expect(result).to.equal(true);
    });

    it('should return false if size model image is not front facing', function () {
        var url = 'https://example.com/path/to/image_BC.jpg';
        var result = productHelper.isSizeModelImageFrontFacing(url);
        expect(result).to.equal(false);
    });
});

describe('isSizeModelImageRearFacing', function () {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return true if size model image is rear facing', function () {
        var url = 'https://example.com/path/to/image_BC.jpg';
        var result = productHelper.isSizeModelImageRearFacing(url);
        expect(result).to.equal(true);
    });

    it('should return false if size model image is not rear facing', function () {
        var url = 'https://example.com/path/to/image_FC.jpg';
        var result = productHelper.isSizeModelImageRearFacing(url);
        expect(result).to.equal(false);
    });
});

describe('isImageFrontFacing', function () {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return true if image is front facing', function () {
        var url = 'https://example.com/path/to/image_LDF.jpg';
        var result = productHelper.isImageFrontFacing(url);
        expect(result).to.equal(true);
    });

    it('should return false if image is not front facing', function () {
        var url = 'https://example.com/path/to/image_LDB.jpg';
        var result = productHelper.isImageFrontFacing(url);
        expect(result).to.equal(false);
    });
});

describe('isImageRearFacing', function () {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return true if image is rear facing', function () {
        var url = 'https://example.com/path/to/image_LDB.jpg';
        var result = productHelper.isImageRearFacing(url);
        expect(result).to.equal(true);
    });

    it('should return false if image is not rear facing', function () {
        var url = 'https://example.com/path/to/image_LDF.jpg';
        var result = productHelper.isImageRearFacing(url);
        expect(result).to.equal(false);
    });
});

describe('getSizeModelImageURLs', function () {
    var productHelper = require('../../../../../../cartridges/int_constructor_custom_legacy/cartridge/scripts/custom/productHelper');

    it('should return size model image URLs when provided with valid data', function () {
        var data = {
            sizeModelImages: [
                { URL: 'https://example.com/front_FC.jpg?rp=123' },
                { URL: 'https://example.com/back_BC.jpg?rp=456' },
                { URL: 'https://example.com/front_LDF.jpg?rp=789' },
                { URL: 'https://example.com/back_LDB.jpg?rp=730' },
                { URL: 'https://example.com/front_LDF2.jpg?rp=931' }
            ]
        };
        
        var result = productHelper.getSizeModelImageURLs(data);
        var expected = JSON.stringify({ frontImage: 'front_FC.jpg', backImage: 'back_BC.jpg' });
        expect(result).to.equal(expected);
    });

    it('should return empty string when no size model images are provided', function () {
        var data = {
            sizeModelImages: []
        };
        
        var result = productHelper.getSizeModelImageURLs(data);
        expect(result).to.equal('');
    });

    it('should return empty string when invalid data is provided', function () {
        var data = {};
        
        var result = productHelper.getSizeModelImageURLs(data);
        expect(result).to.equal('');
    });
});

describe('countOccurrences', function () {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    // Test case for counting occurrences of a character in a string
    it('should correctly count the occurrences of a character in a string', function () {
        const inputString = 'programming.is.fun';
        const targetCharacter = '.';

        const result = productHelper.countOccurrences(inputString, targetCharacter);

        assert.strictEqual(result, 2);
    });

    // Test case for an empty string
    it('should return 0 when counting occurrences in an empty string', function () {
        const inputString = '';
        const targetCharacter = 'a'; // The character to count doesn't exist in an empty string

        const result = productHelper.countOccurrences(inputString, targetCharacter);

        assert.strictEqual(result, 0);
    });

    // Test case for a character not present in the string
    it('should return 0 when the target character is not in the input string', function () {
        const inputString = 'hello world';
        const targetCharacter = 'z'; // The character 'z' is not present in the string

        const result = productHelper.countOccurrences(inputString, targetCharacter);

        assert.strictEqual(result, 0);
    });

    // Test case for counting occurrences in a string with no target character
    it('should return 0 when the target character is empty', function () {
        const inputString = 'testing';
        const targetCharacter = '';

        const result = productHelper.countOccurrences(inputString, targetCharacter);

        assert.strictEqual(result, 0);
    });

    // Test case for a character that appears only once
    it('should return 1 when the target character appears only once in the input string', function () {
        const inputString = 'abcdefg';
        const targetCharacter = 'd';

        const result = productHelper.countOccurrences(inputString, targetCharacter);

        assert.strictEqual(result, 1);
    });

    // Add more test cases as needed to cover different scenarios
});

describe('getAttributeValuesFromName', function () {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    // Test case for standard attribute
    it('should return the correct attribute value for a standard attribute', function () {
        const product = {
            ID: '1370030',
            width: 10
        };

        const result = productHelper.getAttributeValuesFromName(product, 'width');

        assert.strictEqual(result, 10);
    });

    // Test case for nested attributes
    it('should return the correct attribute value for nested attributes', function () {
        const product = {
            ID: '1370030',
            custom: {
                isMFOItem: true
            }
        };

        const result = productHelper.getAttributeValuesFromName(product, 'custom.isMFOItem');

        assert.strictEqual(result, true);
    });

    // Test case for non-existent attributes
    it('should return an empty string for non-existent attributes', function () {
        const product = {
            ID: '1370030',
            custom: {
                isMFOItem: true
            }
        };

        const result = productHelper.getAttributeValuesFromName(product, 'idontexist');

        assert.strictEqual(result, '');
    });

    // Test case for empty attribute values
    it('should return undefined for empty attribute values', function () {
        const product = {
            ID: '1370030',
            custom: {
                productTileUpperLeftBadge: {
                    displayValue: ''
                }
            }
        };

        const result = productHelper.getAttributeValuesFromName(product, 'custom.productTileUpperLeftBadge.displayValue');

        assert.strictEqual(result, undefined);
    });
});

describe('inGiftsCategory', function () {
    var productHelper = require('../../../../../../cartridges/int_constructor_custom_legacy/cartridge/scripts/custom/productHelper');
    var cats = new Collection();
    cats.add({ ID: 'root' });
    cats.add({ ID: 'top-gifts' });

    it('should return true if product is assigned to a gifts category', function () {
        var product = {
            isVariant: function() {
                return true;
            },
            getMasterProduct: function() {
                return {
                    onlineCategories: cats
                };
            }
        };
        var giftsCategories = ['GiftsCategory1', 'top-gifts'];
        
        var result = productHelper.inGiftsCategory(product, giftsCategories);
        expect(result).to.equal(true);
    });

    it('should return false if product is not assigned to any gifts category', function () {
        cats.remove({ ID: 'top-gifts' });
        var product = {
            isVariant: function() {
                return false;
            },
            onlineCategories: cats
        };

        var giftsCategories = ['GiftsCategory1', 'top-gifts'];
        
        var result = productHelper.inGiftsCategory(product, giftsCategories);
        expect(result).to.equal(false);
    });
});

describe('getColorwayPrimary', function () {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return the first color when it contains a slash', function () {
        const colorway = 'Brown / Blue / Green';
        const result = productHelper.getColorwayPrimary(colorway);
        expect(result).to.equal('Brown');
    });

    it('should return the color as is when it does not contain a slash', function () {
        const colorway = 'Red';
        const result = productHelper.getColorwayPrimary(colorway);
        expect(result).to.equal('Red');
    });

    it('should handle empty input', function () {
        const colorway = '';
        const result = productHelper.getColorwayPrimary(colorway);
        expect(result).to.equal('');
    });

    it('should handle null input', function () {
        const colorway = null;
        const result = productHelper.getColorwayPrimary(colorway);
        expect(result).to.equal(null);
    });

    it('should handle undefined input', function () {
        const colorway = undefined;
        const result = productHelper.getColorwayPrimary(colorway);
        expect(result).to.equal(undefined);
    });
});

describe('getIcons function', () => {
    var productHelper = require('../../../../../../cartridges/int_constructor_custom_legacy/cartridge/scripts/custom/productHelper');

    it('should return null if product icons are empty', () => {
        const product = { custom: { icons: [] } };
        const icons = productHelper.getIcons(product);
        expect(icons).to.be.null;
    });
  
    it('should return null if product icons are not provided', () => {
        const product = { custom: {} };
        const icons = productHelper.getIcons(product);
        expect(icons).to.be.null;
    });
  
    it('should return an array of product icons', () => {
        const product = {
            custom: {
                icons: [
                    { displayValue: 'Icon 1' },
                    { displayValue: 'Icon 2' },
                    { displayValue: 'Icon 3' }
                ]
            }
        };
        const icons = productHelper.getIcons(product);
        expect(icons).to.be.an('array').that.includes('Icon 1', 'Icon 2', 'Icon 3');
    });
  
    it('should return an array of product icons even with a single icon', () => {
        const product = { custom: { icons: [{ displayValue: 'Single Icon' }] } };
        const icons = productHelper.getIcons(product);
        expect(icons).to.be.an('array').that.includes('Single Icon');
    });
  
    it('should return null if product icons are not present in the product object', () => {
        const product = {};
        const icons = productHelper.getIcons(product);
        expect(icons).to.be.null;
    });
  
    it('should return null if product object is empty', () => {
        const product = null;
        const icons = productHelper.getIcons(product);
        expect(icons).to.be.null;
    });
});

describe('isDefaultColorwayId', function () {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return true for a variant with a matching colorway id', function () {
        var masterProductMock = {
            custom: {
                defaultColorway: '400'
            }
        };

        var variantProductMock = {
            isVariant: function() {
                return true;
            },
            masterProduct: masterProductMock,
            custom: {
                color: '400'
            }
        };

        var result = productHelper.isDefaultColorwayId(variantProductMock);
        expect(result).to.be.true;
    });

    it('should return false for a variant with a different colorway id', function () {
        var masterProductMock = {
            custom: {
                defaultColorway: '300'
            }
        };

        var variantProductMock = {
            isVariant: function() {
                return true;
            },
            masterProduct: masterProductMock,
            custom: {
                color: '400'
            }
        };

        var result = productHelper.isDefaultColorwayId(variantProductMock);
        expect(result).to.be.false;
    });

    it('should return false for a non-variant product', function () {
        var productMock = {
            isVariant: function() {
                return false;
            },
        };

        var result = productHelper.isDefaultColorwayId(productMock);
        expect(result).to.be.false;
    });

    it('should return false for an empty product', function () {
        var result = productHelper.isDefaultColorwayId(null);
        expect(result).to.be.false;
    });
});

describe('getReleaseDate', function () {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return null for empty product', function () {
        var product = null;
        var result = productHelper.getReleaseDate(product);
        assert.isNull(result);
    });

    it('should return null for product with empty releaseDate', function () {
        var product = { custom: { releaseDate: null } };
        var result = productHelper.getReleaseDate(product);
        assert.isNull(result);
    });

    it('should return releaseDate converted to the server timezone and rounded up to the next hour', function () {
        // Replace this with your UTC releaseDate value
        var utcReleaseDate = new Date('2023-11-15T12:30:00Z');

        var product = { custom: { releaseDate: utcReleaseDate } };
        var result = productHelper.getReleaseDate(product);

        // Expect result to be a string
        expect(result).to.be.a('String');

        // convert UTC date/time to local server date/time
        var releaseDate = new Date();
        var offset = -((releaseDate.getTimezoneOffset() * 60) * 1000);
        releaseDate.setTime(product.custom.releaseDate.valueOf() + offset);

        // set minutes and seconds to zero
        releaseDate.setMinutes(0, 0, 0);

        // add one hour to round up to the next hour
        releaseDate.setHours(releaseDate.getHours() + 1);

        // Get the individual pieces
        var year = parseInt(result.substring(0, 4));
        var month = parseInt(result.substring(5, 7));
        var day = parseInt(result.substring(8, 10));
        var hour = parseInt(result.substring(11, 13));
        var minutes = parseInt(result.substring(15, 17));
        var seconds = parseInt(result.substring(18, 20));

        // Validate the rounded up time
        expect(year).to.equal(releaseDate.getFullYear());
        expect(month).to.equal(releaseDate.getMonth() + 1);
        expect(day).to.equal(releaseDate.getDate());
        expect(hour).to.equal(releaseDate.getHours());
        expect(minutes).to.equal(0);
        expect(seconds).to.equal(0);
    });
});

describe('isSearchableIfUnavailable Mock Usage', function () {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should correctly identify a product as searchable when unavailable', function () {
        // Create a mock product object with searchableIfUnavailableFlag set to true
        const mockProduct = { searchableIfUnavailableFlag: true };

        // Use the mock function to test the behavior
        const result = productHelper.isSearchableIfUnavailable(mockProduct);

        // Expect the result to be true
        expect(result).to.equal(true);
    });

    it('should correctly identify a product as not searchable when unavailable', function () {
        // Create a mock product object with searchableIfUnavailableFlag set to false
        const mockProduct = { searchableIfUnavailableFlag: false };

        // Use the mock function to test the behavior
        const result = productHelper.isSearchableIfUnavailable(mockProduct);

        // Expect the result to be false
        expect(result).to.equal(false);
    });

    it('should handle null or undefined products', function () {
        // Test with null product
        expect(productHelper.isSearchableIfUnavailable(null)).to.equal(false);

        // Test with undefined product
        expect(productHelper.isSearchableIfUnavailable(undefined)).to.equal(false);
    });
});

describe('hasValidPrice function', function () {
    var productHelper = require('../../../../../mocks/constructor/custom/productHelper');

    it('should return true if product has valid list and sale prices greater than 0', function () {
        var product = {
            priceModel: {
                getPriceBookPrice: function (priceBookID) {
                    if (priceBookID === 'listPriceBookID') {
                        return { value: 20 };
                    } else if (priceBookID === 'salePriceBookID') {
                        return { value: 15 };
                    }

                    return null;
                }
            }
        };

        var isValidPrice = productHelper.hasValidPrice(product, 'listPriceBookID', 'salePriceBookID');
        expect(isValidPrice).to.equal(true);
    });

    it('should return false if either list price or sale price is not greater than 0', function () {
        var product = {
            priceModel: {
                getPriceBookPrice: function (priceBookID) {
                    if (priceBookID === 'listPriceBookID') {
                        return { value: 0 }; // List price is not greater than 0
                    } else if (priceBookID === 'salePriceBookID') {
                        return { value: 15 }; // Sale price is valid
                    }

                    return null;
                }
            }
        };

        var isValidPrice = productHelper.hasValidPrice(product, 'listPriceBookID', 'salePriceBookID');
        expect(isValidPrice).to.equal(false);
    });

    it('should return true if product is an e-gift card with a predefined minimum amount greater than 0', function () {
        var product = {
            custom: {
                giftCard: {
                    value: 'EGIFT_CARD'
                }
            }
        };

        var isValidPrice = productHelper.hasValidPrice(product, 'listPriceBookID', 'salePriceBookID');
        expect(isValidPrice).to.equal(true);
    });

    // Additional test to reflect the specific logic of your function
    it('should return false if product has no valid list or sale prices defined', function () {
        var product = {
            priceModel: {
                getPriceBookPrice: function () {
                    // Simulating that no valid prices are defined for both price books
                    return { value: 0 };
                }
            }
        };

        var isValidPrice = productHelper.hasValidPrice(product, 'listPriceBookID', 'salePriceBookID');
        expect(isValidPrice).to.equal(false);
    });
});
