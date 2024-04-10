'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;
const { expect } = require('chai');
const sinon = require('sinon');

const mockStatus = class Status {
    constructor(status, code, message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }
};
mockStatus.ERROR = 1;
mockStatus.OK = 2;

class File {
    constructor(filePath) {
        this.filePath = filePath;
    }

    createNewFile() {
        return 'New File';
    }

    mkdirs() {
        return true;
    }
}

class XMLStreamWriter {
    constructor(filePath) {
        this.filePath = filePath;
    }

    writeStartDocument() {
        return 'New File';
    }

    writeStartElement() {
        return 'New File';
    }

    writeAttribute() {
        return 'New File';
    }

    writeCharacters() {
        return 'New File';
    }

    writeEndElement() {
        return 'New File';
    }

    writeEndDocument() {
        return 'End Of Document';
    }

    flush() {
        return 'flushed';
    }

    close() {
        return '';
    }
}

class FileWriter {
    constructor(filePath) {
        this.filePath = filePath;
    }
}

let Collection = require('../../../../mocks/dw/dw_util_Collection');
class Product {
    constructor(productID) {
        this.master = true;
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
            },
            isLoyaltyExclusive: true
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
        this.getID = function () {
            return this.ID;
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
    getMasterProduct() {
        return this;
    }
}
class ProductEmptyExclusive {
    constructor(productID) {
        this.master = true;
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
        this.getID = function () {
            return this.ID;
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
    getMasterProduct() {
        return this;
    }
}

var jobParams = {
    CatalogsList: 'LoyaltyTest'
};

describe('int_loyalty/cartridge/scripts/jobs/AssignLoyaltyExclusiveFlag.js test', () => {
    const assignLoyaltyExclusiveFlagJobStep = proxyquire('../../../../../cartridges/int_loyalty/cartridge/scripts/jobs/AssignLoyaltyExclusiveFlag', {
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/system/Status': mockStatus,
        'dw/io/File': File,
        'dw/io/FileWriter': FileWriter,
        'dw/io/XMLStreamWriter': XMLStreamWriter,
        'dw/catalog': {
            CatalogMgr: {
                getCatalog: (catalogList) => {
                    return {
                        description: 'loyaltyJobTest',
                        displayName: 'Loyalty Job Test',
                        ID: catalogList,
                        root: {}
                    };
                }
            },
            ProductMgr: {
                queryProductsInCatalog: function (catalog) {
                    // Returns SeekableIterator.
                    var SeekableIterator = {
                        array: [new Product('loyaltyTest1'), new ProductEmptyExclusive('loyaltyTest2')],
                        index: 0,
                        hasNext: function () {
                            return this.array && this.index < this.array.length;
                        },
                        next: function () {
                            var result;
                            if (this.array && this.index < this.array.length) {
                                result = this.array[this.index];
                                this.index = this.index + 1;
                                return result;
                            }
                            throw new Error('SeekableIterator has no more elements');
                        },
                        getCount: function () {
                            return this.array.length;
                        },
                        close: function () {
                            return true;
                        }
                    };
                    return SeekableIterator;
                }
            }
        },
        'dw/catalog/Product': Product,
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
    });

    it('executes without arguments (no params)', () => {
        try {
            assignLoyaltyExclusiveFlagJobStep.execute();
        } catch (error) {
            expect(error.message).to.equal('Cannot read properties of undefined (reading \'CatalogsList\')');
        }
    });

    it('executes without arguments (with params)', () => {
        try {
            var result = assignLoyaltyExclusiveFlagJobStep.execute(jobParams);
            // eslint-disable-next-line new-cap
            var success = new mockStatus(mockStatus.OK, undefined, undefined);
            assert.deepEqual(result, success);
        } catch (error) {
            expect(error.message).to.equal("Cannot read properties of undefined (reading 'CatalogsList')");
        }
    });
});

