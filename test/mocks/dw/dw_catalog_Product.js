
let Collection = require('../../mocks/dw/dw_util_Collection');
class Product {
    constructor(productID) {
        this.master = false;
        this.ID = productID || '883814258849';
        this.name = 'test';
        this.online = true;
        this.image = {
            'small': {
                URL: 'testUrlSmall'
            },
            'medium': {
                URL: 'testUrlMedium'
            },
            'large': {
                URL: 'testUrlLarge'
            }
        };
        this.custom = {
            sku: '1330767-408-8',
            giftCard: {
                value: 'NONE'
            },
            customerLineItemQtyLimit: 5,
            skipResetActivationDate: false,
            activationDate: '2023-09-01T04:00:00.000Z',
            outletColors: '003',
            defaultColorway: '003',
            division: 'Footwear',
            experienceType: {
                value: 'outlet'
            },
            productTileUpperLeftFlameIconBadge: {
                value: 'new'
            },
            productTileUpperLeftBadge: {
                value: 'new-colors-available'
            }
        };
        this.optionModel = {};
        this.availabilityModel = {
            inventoryRecord: {
                perpetual: true,
                allocation: 10,
                ATS: {
                    value: 10
                },
                inStockDate: new Date(),
                lastModified: new Date(),
                getATS() {
                    return {
                        value: 10,
                        getValue: function () {
                            return 10;
                        }
                    };
                },
                setAllocation: function (allocation) {
                    this.allocation = allocation;
                },
                getAllocation: function () {
                    return {
                        getValue: function () {
                            return 10;
                        }
                    };
                },
                getInStockDate: function () {
                    return this.inStockDate;
                }
            },
            getInventoryRecord: function () {
                return this.inventoryRecord;
            },
            isInStock: function () {
                return this.inventoryRecord.allocation > 0;
            }
        };
        this.isOnline = function () {
            return this.online;
        };
        this.isMaster = function () {
            return this.master;
        };
        this.isVariant = function () {
            return true;
        };
        this.getVariants = function () {
            var variants = {
                onlineFlag: true,
                availabilityModel: {
                    orderable: true
                },
                custom: {
                    color: '003'
                },
                masterProduct: {
                    ID: productID || '883814258849'
                }
            };
            return [variants];
        };
        this.getVariationModel = function () {
            var variants = {
                onlineFlag: true,
                availabilityModel: {
                    orderable: true
                },
                custom: {
                    color: '003'
                },
                masterProduct: {
                    ID: productID || '883814258849'
                },
                master: false
            };
            return {
                getDefaultVariant: function () {
                    return variants;
                },
                getProductVariationAttribute: function () {
                    return new Collection('');
                },
                getVariationValue: function () {
                    return {
                        ID: 'ID'
                    };
                }
            };
        };
        this.variationModel = {
            onlineFlag: true,
            availabilityModel: {
                orderable: true
            },
            custom: {
                color: '003'
            },
            masterProduct: {
                ID: productID || '883814258849'
            },
            master: false
        };
        this.raw = {
            custom: {
                outletColors: ''
            }
        };
    }

    getImage(size) {
        return this.image[size];
    }

    getAvailabilityModel() {
        return this.availabilityModel;
    }
    getMasterProduct(){
        return this;
    }
}

module.exports = Product;
