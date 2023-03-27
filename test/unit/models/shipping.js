'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../mockModuleSuperModule');
var ArrayList = require('../../mocks/scripts/util/dw.util.Collection');

var sinon = require('sinon');
var storestub = sinon.stub();
var sitestub = sinon.stub();
var getLocaleStub = sinon.stub();
var ShippingModel;
var shipping;

function baseTotalsModelMock() {};

var customer = {
    addressBook: {
        addresses: [{
            add: 'ind',
            isEquivalentAddress: () => {
                return true;
            }
        }]
    }
};

var anAddress = customer;

var address = {
    countryCode: {
        value: 'ind'
    }
};

var containerView;

var Site = {
    current: {
        preferences: {
            custom: {
                isBOPISEnabled: true
            }
        },
        getCustomPreferenceValue: sitestub
    }
};

var items = new ArrayList ([{
    productID: 'AC34',
    product: {
        ID: 'HSF34'
    },
    quantity: {
        value: 3
    }
}]);

var shipment = {
    productLineItems: items,
    shippingAddress: address,
    custom: {
        fromStoreId: {
            ID: 'AS425'
        }
    }
};

global.request = function (params) {
    return !params;
}

describe('app_ua_core/cartridge/models/totals.js', () => {

    before(() => {
        mockSuperModule.create(baseTotalsModelMock);

        ShippingModel = proxyquire('../../../cartridges/app_ua_core/cartridge/models/shipping.js', {
            'dw/web/URLUtils': {
                url: () => {
                    return 'test/test1.com'
                }
            },
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections.js'),
            '*/cartridge/scripts/helpers/productHelpers': {
                showGiftBoxes: () => {
                    return 'gift';
                }
            },
            'dw/system/Site': Site,
            'dw/catalog/StoreMgr': {
                getStore: storestub
            },
            'dw/util/Locale': {
                getLocale: getLocaleStub
            }
        });
    });

    it('Testing for getLocaleStub country is ind', () => {
        getLocaleStub.returns({
            country: 'ind'
        });
        shipping = new ShippingModel(shipment, address, customer, containerView);

        assert.isDefined(shipping, 'shipping should not exists');
        assert.isNotNull(shipping, 'shipping should null');
        getLocaleStub.reset();
    });

    it('Testing for getLocaleStub country is USA', () => {
        getLocaleStub.returns({
            country: 'USA'
        });
        shipping = new ShippingModel(shipment, customer, anAddress);

        assert.isDefined(shipping, 'online should not exists');
        assert.isNotNull(shipping, 'online should null');
        getLocaleStub.reset();
    });

    it('Testing storestub is enabled', () => {
        storestub.returns(true);
        storestub.reset();
        shipping = new ShippingModel(shipment);

        assert.isDefined(shipping, 'shipping should not exists');
        assert.isNotNull(shipping, 'shipping should null');
    });

    it('Testing sitestub is disabled', () => {
        sitestub.returns(true);
        sitestub.reset();
        shipping = new ShippingModel(shipment);

        assert.isDefined(shipping, 'shipping should not exists');
        assert.isNotNull(shipping, 'shipping should null');
    });

    it('Testing for shipment custom is null', () => {
        shipment.custom = null;
        customer.addressBook.addresses = null;
        shipping = new ShippingModel(shipment, customer, containerView);

        assert.isDefined(shipping, 'shipping should not exists');
        assert.isNotNull(shipping, 'shipping should null');
    });

    it('Testing storestub is disabled', () => {
        storestub.returns(false);
        storestub.reset();
        shipping = new ShippingModel(shipment);

        assert.isDefined(shipping, 'shipping should not exists');
        assert.isNotNull(shipping, 'shipping should null');
    });

    it('Testing for product is null', () => {
        var items = new ArrayList([{
            productID: 'AC34',
            product: null,
            quantity: {
                value: 3
            }
        }]);
        var shipment = {
            productLineItems: items,
            shippingAddress: address,
            custom: {
                fromStoreId: {
                    ID: 'AS425'
                }
            }
        };
        shipment.productLineItems = items;
        shipping = new ShippingModel(shipment);

        assert.isDefined(shipping, 'shipping should not exists');
        assert.isNotNull(shipping, 'shipping should null');
    });

    it('Testing sitestub is disabled', () => {
        sitestub.returns(false);
        sitestub.reset();
        shipping = new ShippingModel(shipment);

        assert.isDefined(shipping, 'shipping should not exists');
        assert.isNotNull(shipping, 'shipping should null');
    });

    it('Testing for shipment shippingAddress is null', () => {
        shipment.shippingAddress = null;
        shipping = new ShippingModel(shipment, address);

        assert.isDefined(shipping, 'shipping should not exists');
        assert.isNotNull(shipping, 'shipping should null');
    });
});
