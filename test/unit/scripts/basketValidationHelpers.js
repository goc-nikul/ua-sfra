'use strict';

var assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const sinon = require('sinon');
var Basket = require('../../mocks/dw/dw_order_Basket');
var basketMock = new Basket();

// stubs
var isCheckPointEnabledStub = sinon.stub();
var getCustomPreferenceValueStub = sinon.stub();
var getCustomerGroupLineItemQtyLimitStub = sinon.stub();
var getStoreStub = sinon.stub();
var getInventoryListStub = sinon.stub();
var setAllocationStub = sinon.stub();
var setPreorderableStub = sinon.stub();
var getBopisDataStub = sinon.stub();
var getSKUSStub = sinon.stub();

var basketValidationHelpers;

var product = {
    ID: 'pid12345',
    masterProduct: {
        ID: 'mpid12345'
    },
    custom: {
        isPreOrder: true,
        qtyLimitType: 0,
        sku: 'itemsku',
        employeeLineItemQtyLimit: 0,
        customerLineItemQtyLimit: 1
    },
    isMaster: () => false
};

var date = new Date();
var inStockDate = new Date((date).getTime() + (10 * 86400000));

var Site = {
    current: {
        preferences: {
            custom: {
                'isBOPISEnabled': true,
                'MAOEnabled': true
            }
        },
        getCustomPreferenceValue: getCustomPreferenceValueStub
    }
};

Site.getCurrent = () => {
    return Site.current;
};


var MAOData = {
    id: 'PID1234',
    availablity: true,
    TotalQuantity: 10,
    OnHandQuantity: 10,
    Quantity: 8,
    FutureQuantity: 15,
    NextAvailabilityDate: new Date().getTime()
};
var maoAvailability = {
    itemsku: JSON.stringify(MAOData)
};

global.empty = (data) => {
    return !data;
};

var inventoryRecord = {
    getATS: () => {
        return {
            getValue() {
                return 12;
            }
        };
    },
    setAllocation: setAllocationStub,
    getInStockDate: () => {
        return inStockDate;
    },
    setInStockDate: () => true,
    setPreorderBackorderAllocation: () => true,
    ATS: {
        value: 12,
        available: true
    },
    setPreorderable: setPreorderableStub
};

var inventoryList = {
    getRecord: () => {
        return inventoryRecord;
    }
};

var productLineItemsMock = [{
    UUID: 'uuid1234',
    productID: 'pid1',
    custom: { fromStoreId: 'store1' },
    quantityValue: 1001,
    product: {
        custom: {
            sku: 'testsku'
        },
        isMaster: () => true,
        online: true,
        ID: 'pid1234'
    },
    shipment: {
        custom: {
            fromStoreId: 'store1'
        }
    }
},
{
    UUID: 'uuid1234',
    productID: 'pid2',
    custom: { fromStoreId: 'store1' },
    quantityValue: 12,
    product: {
        custom: {
            sku: 'testsku'
        },
        isMaster: () => false,
        online: true,
        ID: 'pid1234'
    },
    shipment: {
        custom: {
            fromStoreId: 'store1'
        }
    }
}, {
    productID: 'pid3',
    product: {
        online: false,
        isMaster: () => true,
        custom: {
            sku: 'testsku'
        }

    },
    quantityValue: 10,
    custom: {},
    shipment: {
        custom: {
            fromStoreId: 'store1'
        }
    }
}, {
    productID: 'pid4',
    product: {
        online: true,
        isMaster: () => true,
        custom: {
            sku: 'testsku'
        }

    },
    quantityValue: 10,
    custom: { fromStoreId: 'store1' },
    shipment: {
        custom: {
            fromStoreId: 'store1'
        }
    }
},
{
    product: {
        ID: 'pid5',
        online: true,
        isMaster: () => true,
        custom: {
            exclusive: {
                value: 'out-of-stock'
            }
        },
        availabilityModel: {
            getAvailabilityLevels() {
                return { notAvailable: { value: 0 } };
            }
        }
    },
    custom: {

    },
    quantityValue: 10

},
{
    product: {
        ID: 'pid6',
        online: true,
        isMaster: () => true,
        custom: {
            exclusive: {
                value: 'in-stock'
            }
        },
        availabilityModel: {
            getAvailabilityLevels() {
                return { notAvailable: { value: 0 } };
            }
        }
    },
    custom: {

    },
    quantityValue: 1001

}, {
    product: {
        online: true,
        isMaster: () => true,
        custom: {
            exclusive: {
                value: 'in-stock'
            }
        },
        availabilityModel: {
            getAvailabilityLevels() {
                return { notAvailable: { value: 0 } };
            }
        }
    },
    custom: {
        fromStoreId: null
    },
    quantityValue: 1001

}];

var Logger = {
    error: () => {
    }
};

let errorSpy = sinon.spy(Logger, 'error');

// stub return values
getStoreStub.withArgs('store1').returns({
    inventoryListID: 'inventory1',
    custom: {
        inventoryListId: 'inventory1'
    }
});
getInventoryListStub.withArgs('inventory1').returns(inventoryList);
getCustomerGroupLineItemQtyLimitStub.returns(10);
getCustomPreferenceValueStub.withArgs('employeeLineItemQtyLimit').returns(JSON.stringify({
    US: 10
}));
getCustomPreferenceValueStub.withArgs('preOrderStyles').returns(['mpid12345']);
setAllocationStub.returns(true);

getCustomPreferenceValueStub.withArgs('MAOEnabled').returns(true);

describe('app_ua_core/cartridge/scripts/helpers/basketValidationHelpers.js', () => {
    before(() => {
        basketValidationHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/basketValidationHelpers', {
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            'dw/catalog/ProductInventoryMgr': {
                getInventoryList: getInventoryListStub
            },
            'dw/catalog/StoreMgr': {
                getStore: getStoreStub
            },
            'int_mao/cartridge/scripts/availability/MAOAvailability': {
                getMaoAvailability: () => {
                    return maoAvailability;
                }
            },
            'dw/web/Resource': {
                msg: (text, bundle, value) => {
                    return value + '';
                }
            },
            'dw/system/Site': Site,
            'int_mao/cartridge/scripts/availability/MAOAvailabilityHelper': {
                isCheckPointEnabled: isCheckPointEnabledStub,
                getSKUS: getSKUSStub
            },
            'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': Logger,
            'app_storefront_base/cartridge/scripts/helpers/basketValidationHelpers': {},
            '*/cartridge/scripts/util/CustomerUtils': function () {
                this.getCustomerGroupLineItemQtyLimit = getCustomerGroupLineItemQtyLimitStub;
            },
            '*/cartridge/scripts/helpers/storeHelpers': {
                getBopisData: getBopisDataStub
            }
        });
        global.customer = {
            profile: {
                custom: {
                    isEmployee: true
                }
            },
            isAuthenticated: () => {
                return true;
            },
            getProfile: () => {
                return {
                    getEmail: function () {
                        return 'test@test.com';
                    }
                };
            }
        };
        global.request = {
            getLocale: () => {
                return {
                    slice: () => {
                        return {
                            toUpperCase: () => {
                                return 'US';
                            }
                        };
                    }
                };
            }
        };
    });

    describe('Testing method => getLineItemInventory', () => {
        var lineItemQtyLimit;
        it('Checking the behavior of the function when null are empty value passed', () => {
            lineItemQtyLimit = basketValidationHelpers.getLineItemInventory(null, null, null, null);
            assert.isDefined(lineItemQtyLimit);
            assert.isNumber(lineItemQtyLimit);
            assert.equal(lineItemQtyLimit, 1000);

            lineItemQtyLimit = basketValidationHelpers.getLineItemInventory('', '', '', '');
            assert.isNumber(lineItemQtyLimit);
            assert.equal(lineItemQtyLimit, 1000);
        });

        it('should return maoAvailability TotalQuantity when it contains product sku data', () => {
            lineItemQtyLimit = basketValidationHelpers.getLineItemInventory(product, true, maoAvailability, 'store1');
            assert.isDefined(lineItemQtyLimit);
            assert.equal(lineItemQtyLimit, 10);
        });

        it('checking the behavior when custom preference not contains set of PreOrder Products  ', () => {
            setPreorderableStub.reset();
            // MAOData.LocationId = 'store1';
            MAOData.NextAvailabilityDate = inStockDate.getTime();
            inventoryRecord.getInStockDate = () => {
                return date;
            };
            getInventoryListStub.withArgs('inventory1').returns(inventoryList);
            maoAvailability.itemsku = JSON.stringify(MAOData);
            getCustomPreferenceValueStub.withArgs('preOrderStyles').returns([]);

            lineItemQtyLimit = basketValidationHelpers.getLineItemInventory(product, true, maoAvailability, 'store1');
            assert.isDefined(lineItemQtyLimit);
            assert.isFalse(setPreorderableStub.called);

            MAOData.NextAvailabilityDate = 'invalid date';
            maoAvailability.itemsku = JSON.stringify(MAOData);
            lineItemQtyLimit = basketValidationHelpers.getLineItemInventory(product, true, maoAvailability, 'store1');
        });

        it('should call error function when unkown exeption occured', () => {
            getCustomerGroupLineItemQtyLimitStub.returns(0);
            setAllocationStub.throws(new Error('custom error thrown'));

            lineItemQtyLimit = basketValidationHelpers.getLineItemInventory(product, true, maoAvailability, 'store1');
            assert.isDefined(lineItemQtyLimit);
            assert.isTrue(errorSpy.called);
            errorSpy.reset();
            setAllocationStub.resetBehavior();

            getCustomPreferenceValueStub.withArgs('employeeLineItemQtyLimit').returns('error parse string');

            lineItemQtyLimit = basketValidationHelpers.getLineItemInventory(product, true, maoAvailability, 'store1');
            assert.isDefined(lineItemQtyLimit);
            assert.isTrue(errorSpy.called);

            getCustomPreferenceValueStub.withArgs('employeeLineItemQtyLimit').returns(JSON.stringify({ US: 'NAN' }));
            errorSpy.reset();
        });
        it('checking behavior of function when store and maoAvailability is empty', () => {
            getInventoryListStub.withArgs('inventory1').returns(inventoryList);
            lineItemQtyLimit = basketValidationHelpers.getLineItemInventory(product, true, '', 'store1');
            assert.isDefined(lineItemQtyLimit);

            delete MAOData.OnHandQuantity;
            getCustomPreferenceValueStub.withArgs('employeeLineItemQtyLimit').returns(JSON.stringify({ CA: 2 }));
            maoAvailability.itemsku = JSON.stringify(MAOData);
            lineItemQtyLimit = basketValidationHelpers.getLineItemInventory(product, true, maoAvailability, '');
            assert.isDefined(lineItemQtyLimit);
            getCustomPreferenceValueStub.withArgs('employeeLineItemQtyLimit').resetBehavior();
        });

        it('should not call setPreorderable when NextAvailabilityDate is not present in MAOData', () => {
            setPreorderableStub.reset();
            delete MAOData.NextAvailabilityDate;
            maoAvailability.itemsku = JSON.stringify(MAOData);

            lineItemQtyLimit = basketValidationHelpers.getLineItemInventory(product, true, maoAvailability, 'store1');
            assert.isDefined(lineItemQtyLimit);
            assert.isNotNaN(lineItemQtyLimit);
            assert.isFalse(setPreorderableStub.called);
        });
        it('should not call setPreorderable when NextAvailabilityDate and FutureQuantity is not present in MAOData', () => {
            setPreorderableStub.reset();
            delete MAOData.NextAvailabilityDate;
            maoAvailability.itemsku = JSON.stringify(MAOData);

            lineItemQtyLimit = basketValidationHelpers.getLineItemInventory(product, true, maoAvailability, 'store2');
            assert.isDefined(lineItemQtyLimit);
            assert.isNotNaN(lineItemQtyLimit);
            assert.isFalse(setPreorderableStub.called);
            setPreorderableStub.reset();

            delete MAOData.FutureQuantity;
            maoAvailability.itemsku = JSON.stringify(MAOData);
            lineItemQtyLimit = basketValidationHelpers.getLineItemInventory(product, true, maoAvailability, 'store1');
            assert.isDefined(lineItemQtyLimit);
            assert.isNotNaN(lineItemQtyLimit);
            assert.isFalse(setPreorderableStub.called);
        });

        it('checking behavior of function when invenotryRecord is null', () => {
            inventoryList.getRecord = () => null;
            getInventoryListStub.withArgs('inventory1').returns(inventoryList);

            lineItemQtyLimit = basketValidationHelpers.getLineItemInventory(product, true, maoAvailability, 'store1');
            assert.isDefined(lineItemQtyLimit);
            assert.equal(lineItemQtyLimit, 10);
            getInventoryListStub.reset();
        });

        it('should return MAOData Quantity when LocationId present in MAOData', () => {
            MAOData.LocationId = 'store1';
            delete MAOData.OnHandQuantity;
            maoAvailability.itemsku = JSON.stringify(MAOData);

            lineItemQtyLimit = basketValidationHelpers.getLineItemInventory(product, true, maoAvailability, 'store1');
            assert.isDefined(lineItemQtyLimit);
            getInventoryListStub.reset();
        });

        it('should not check the lineitem inventory when checkInventoryInStockLevel flag is falase', () => {
            lineItemQtyLimit = basketValidationHelpers.getLineItemInventory(product, false, maoAvailability, 'store1');
            assert.isDefined(lineItemQtyLimit);
        });
    });

    describe('Testing method => validateBOPISProductsInventory', () => {
        before(() => {
            getCustomPreferenceValueStub.withArgs('realTimeInventoryCallEnabled').returns(true);
            isCheckPointEnabledStub.returns(true);
            getBopisDataStub.returns({
                items: [{}],
                locations: []
            });
            inventoryList.getRecord = () => { return inventoryRecord; };
            getInventoryListStub.returns(inventoryList);
            errorSpy.reset();
        });

        var result;
        it('Testing function when basket is null', () => {
            result = basketValidationHelpers.validateBOPISProductsInventory(null, true);
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isFalse(result.error);
            assert.deepEqual(result.lineItemQtyList, {});
        });
        it('Testing for isBOPISEnabled prefrence toggle', () => {
            getCustomPreferenceValueStub.withArgs('isBOPISEnabled').returns(false);

            result = basketValidationHelpers.validateBOPISProductsInventory(basketMock, true);
            assert.isDefined(result);
            assert.isFalse(getBopisDataStub.withArgs(basketMock).called);

            getCustomPreferenceValueStub.withArgs('isBOPISEnabled').returns(true);

            result = basketValidationHelpers.validateBOPISProductsInventory(basketMock, true);
            assert.isTrue(getBopisDataStub.withArgs(basketMock).called);
        });

        it('should validate the inventory of BOPISProducts in the Basket', () => {
            getBopisDataStub.withArgs(basketMock).returns({});
            basketMock.productLineItems = productLineItemsMock;

            result = basketValidationHelpers.validateBOPISProductsInventory(basketMock, true);
            assert.isDefined(result);
        });

        it('should log the error message when unknown exeption occured', () => {
            getBopisDataStub.withArgs(basketMock).throws(new Error('unknown custm error'));

            result = basketValidationHelpers.validateBOPISProductsInventory(basketMock, true);
            assert.isDefined(result);
            assert.isTrue(errorSpy.called);
            getBopisDataStub.reset();
        });
    });

    describe('Testing method => validateProductsInventory', () => {
        before(() => {
            getSKUSStub.withArgs(basketMock).returns([]);
            isCheckPointEnabledStub.returns(true);
            basketMock.productLineItems = [productLineItemsMock[4]];
        });
        var result;
        it('Testing function when basket is null', () => {
            result = basketValidationHelpers.validateProductsInventory(null, '');
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isFalse(result.error);
            assert.deepEqual(result.lineItemQtyList, {});
        });
        it('Testing for realTimeInventoryCallEnabled prefrence toggle', () => {
            getCustomPreferenceValueStub.withArgs('realTimeInventoryCallEnabled').returns(false);
            result = basketValidationHelpers.validateProductsInventory(basketMock, true);
            assert.isDefined(result);

            getCustomPreferenceValueStub.withArgs('realTimeInventoryCallEnabled').returns(true);

            result = basketValidationHelpers.validateProductsInventory(basketMock, true);
            assert.isDefined(result);
            getSKUSStub.reset();
        });

        it('should validate the inventory of productLineItems in the Basket', () => {
            getSKUSStub.withArgs(basketMock).returns(null);
            getBopisDataStub.withArgs(basketMock).returns({});
            basketMock.productLineItems = productLineItemsMock;
            result = basketValidationHelpers.validateProductsInventory(basketMock, true);
            assert.isDefined(result);
        });
    });

    describe('Testing method => validateProducts', () => {
        before(() => {
            getStoreStub.withArgs(null).returns({
                custom: {
                    inventoryListId: 'inventory1'
                }
            });
            getSKUSStub.withArgs(basketMock).returns([]);
            isCheckPointEnabledStub.returns(true);
            basketMock.productLineItems = [productLineItemsMock[4]];
        });
        var result;
        it('should not validate the products when basket is null', () => {
            result = basketValidationHelpers.validateProducts(null, '');
            assert.isDefined(result);
            assert.isNotNull(result);
        });

        it('should validate the products in the Basket', () => {
            getSKUSStub.withArgs(basketMock).returns(null);
            getBopisDataStub.withArgs(basketMock).returns({});
            basketMock.productLineItems = productLineItemsMock;

            result = basketValidationHelpers.validateProducts(basketMock, true);
            assert.isDefined(result);
            assert.isNotNull(result);
        });
    });
});
