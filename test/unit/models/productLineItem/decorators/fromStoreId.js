'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

const formStoreId = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/productLineItem/decorators/fromStoreId.js',{});

var lineItemMock = {
    shipment: {
        custom: {
            fromStoreId: 'fromStoreId'
        },
        ID: 'ShipmentID_123'
    }
}

describe('app_ua_core/cartridge/models/productLineItem/decorators/formStoreid', () => {

    it('Testing formStoreid model with storeid values', () => {
        var object = {};
        new formStoreId(object, lineItemMock);
        assert.equal(object.fromStoreId, 'fromStoreId');
        assert.equal(object.shipmentID, 'ShipmentID_123');
    });

    it('Testing formStoreid model with empty values', () => {
        var object = {};
        var lineItemMock = {
            shipment: {
                custom: {
                    fromStoreId: ''
                },
                ID: ''
            }
        }

        new formStoreId(object, lineItemMock);
        assert.equal(object.fromStoreId, '');
        assert.equal(object.shipmentID, '');
    });
}); 