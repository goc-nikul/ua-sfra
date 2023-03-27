
let Collection = require('../dw/dw_util_Collection');
class Product {
    constructor(productID, master) {
        this.master = master || false;
        this.variant = !master;
        this.ID = productID || '883814258849';
        this.name = 'test';
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
            colorway: 'Mineral Blue / Midnight Navy',
            customerLineItemQtyLimit: 5
        };

        if (this.variant) {
            this.custom.color = '003';
            this.custom.style = '122332';
        }

        this.optionModel = {};
        this.availabilityModel = {
            inventoryRecord: {
                perpetual: true,
                allocation: 10,
                ATS: {
                    value: 10
                },
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
                }
            }
        };
        this.isMaster = function () {
            return this.master;
        };
        this.isVariant = function () {
            return this.variant;
        };
        this.getVariants = function () {
            var variants = {
                onlineFlag: true,
                availabilityModel: {
                    orderable: true
                },
                custom: {
                    color: '003',
                    style: '122332'
                },
                masterProduct: {
                    ID: productID || '883814258849'
                },
                getImages: function () {
                    return {
                        'pdpMainDesktop': {
                            httpsURL: 'testUrll'
                        },
                        getLength: function () {
                            return;
                        }
                    };
                }
            };
            return new Collection(variants);
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
                        getDisplayValue: function () {
                            return 'male';
                        }
                    };
                },
                getMaster: function () {
                    return new Product();
                }
            };
        };
        this.variationModel = {
            onlineFlag: true,
            availabilityModel: {
                orderable: true
            },
            custom: {
                color: '003',
                colorway: 'Mineral Blue / Midnight Navy'
            },
            masterProduct: {
                ID: productID || '883814258849'
            }
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
}

module.exports = Product;
