'uses strict';

const {
    assert
} = require('chai');

var proxyquire = require('proxyquire').noPreserveCache().noCallThru();

var orderItemsHelper = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/orderItemsHelper.js', {});

describe('int_OIS/cartridge/scripts/order/orderItemsHelper.js', () => {

    it('Testing method: mergeDuplicateReturnItems without returnItems', () => {
        var returnItems = orderItemsHelper.mergeDuplicateReturnItems();
        assert.isDefined(returnItems, 'returnItems is not defined');
        assert.isNotNull(returnItems, 'returnItems is null');
        assert.equal(returnItems.length, 0);
    });

    it('Testing method: mergeDuplicateReturnItems with single returnItems', () => {
        var returnItemsParams = [{
            orderItem: {
                productItem: {
                    product: {
                        upc: '0000'
                    },
                    quantity: 1
                },
                storeId: '1234'
            }
        }];
        var returnItems = orderItemsHelper.mergeDuplicateReturnItems(returnItemsParams);
        assert.isDefined(returnItems, 'returnItems is not defined');
        assert.isNotNull(returnItems, 'returnItems is null');
        assert.equal(returnItems.length, 1);
    });

    it('Testing method: mergeDuplicateReturnItems with single returnItems and no productLineItems', () => {
        var returnItemsParams = [{
            orderItem: {
                productItem: null,
                storeId: '1234'
            }
        }];
        var returnItems = orderItemsHelper.mergeDuplicateReturnItems(returnItemsParams);
        assert.isDefined(returnItems, 'returnItems is not defined');
        assert.isNotNull(returnItems, 'returnItems is null');
        assert.equal(returnItems.length, 0);
    });

    it('Testing method: mergeDuplicateReturnItems with same returnItems 2 times', () => {
        var returnItemsParams = [{
            orderItem: {
                productItem: {
                    product: {
                        upc: '0000'
                    },
                    quantity: 1
                },
                storeId: '1234'
            }
        }, {
            orderItem: {
                productItem: {
                    product: {
                        upc: '0000'
                    },
                    quantity: 1
                },
                storeId: '1234'
            }
        }];
        var returnItems = orderItemsHelper.mergeDuplicateReturnItems(returnItemsParams);
        assert.isDefined(returnItems, 'returnItems is not defined');
        assert.isNotNull(returnItems, 'returnItems is null');
        assert.equal(returnItems.length, 1);
    });

    it('Testing method: mergeDuplicateReturnItems with multiple returnItems with no product and store', () => {
        var returnItemsParams = [{
            orderItem: {
                productItem: {
                    product: null,
                    quantity: 1
                },
                storeId: '1234'
            }
        }, {
            orderItem: {
                productItem: {
                    product: {
                        upc: '0001'
                    },
                    quantity: 1
                },
                storeId: null
            }
        }];
        var returnItems = orderItemsHelper.mergeDuplicateReturnItems(returnItemsParams);
        assert.isDefined(returnItems, 'returnItems is not defined');
        assert.isNotNull(returnItems, 'returnItems is null');
        assert.equal(returnItems.length, 1);
    });

    it('Testing method: mergeDuplicateExchangeItems with empty exchangeItems', () => {
        var duplicateExchangeItems = orderItemsHelper.mergeDuplicateExchangeItems();
        assert.isDefined(duplicateExchangeItems, 'duplicateExchangeItems is not defined');
        assert.isNotNull(duplicateExchangeItems, 'duplicateExchangeItems is null');
        assert.equal(duplicateExchangeItems.length, 0);
    });

    it('Testing method: mergeDuplicateExchangeItems with single exchangeItems', () => {
        var exchangeItems = [{
            upc: '1234',
            quantity: 1
        }];
        var duplicateExchangeItems = orderItemsHelper.mergeDuplicateExchangeItems(exchangeItems);
        assert.isDefined(duplicateExchangeItems, 'duplicateExchangeItems is not defined');
        assert.isNotNull(duplicateExchangeItems, 'duplicateExchangeItems is null');
        assert.equal(duplicateExchangeItems.length, 1);
    });

    it('Testing method: mergeDuplicateExchangeItems with single exchangeItems without upc', () => {
        var exchangeItems = [{
            upc: null,
            quantity: 1
        }];
        var duplicateExchangeItems = orderItemsHelper.mergeDuplicateExchangeItems(exchangeItems);
        assert.isDefined(duplicateExchangeItems, 'duplicateExchangeItems is not defined');
        assert.isNotNull(duplicateExchangeItems, 'duplicateExchangeItems is null');
        assert.equal(duplicateExchangeItems.length, 0);
    });

    it('Testing method: mergeDuplicateExchangeItems with multiple exchangeItems of same product', () => {
        var exchangeItems = [{
            upc: '1234',
            quantity: 1
        }, {
            upc: '1234',
            quantity: 1
        }];
        var duplicateExchangeItems = orderItemsHelper.mergeDuplicateExchangeItems(exchangeItems);
        assert.isDefined(duplicateExchangeItems, 'duplicateExchangeItems is not defined');
        assert.isNotNull(duplicateExchangeItems, 'duplicateExchangeItems is null');
        assert.equal(duplicateExchangeItems.length, 1);
    });

    it('Testing method: mergeDuplicateExchangeItems with multiple exchangeItems of different product', () => {
        var exchangeItems = [{
            upc: '1234',
            quantity: 1
        }, {
            upc: '1235',
            quantity: 1
        }];
        var duplicateExchangeItems = orderItemsHelper.mergeDuplicateExchangeItems(exchangeItems);
        assert.isDefined(duplicateExchangeItems, 'duplicateExchangeItems is not defined');
        assert.isNotNull(duplicateExchangeItems, 'duplicateExchangeItems is null');
        assert.equal(duplicateExchangeItems.length, 2);
    });

});
