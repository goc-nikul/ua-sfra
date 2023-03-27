'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

const customAttribute = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/productLineItem/decorators/customAttributes.js',{});

var lineitem = {
    custom: {
        gcRecipientName: 'gcName',
        gcFrom: 'gcFrom',
        gcDeliveryDate: '12/12/2022',
        fromStoreId: 'fromStoreId',
        primaryContactBOPIS: 'primaryContactBOPIS',
        secondaryContactBOPIS: 'secondaryContactBOPIS',
        sku: 'Sku-123-GC',
        instoreAvailability: 'instoreAvailability',
        storeAvailabilityMsg: 'storeAvailabilityMsg',
        storeInventory: 'storeInventory'
    },
    product: {
        custom: { 
            availableForInStorePickup: true
        }
    },
    shipment: {
        custom: { 
            fromStoreId: 'store123'
        }
    }
};


describe('app_ua_core/cartridge/models/productLineItem/decorators/customAttribute', () => {

    it('Testing customAttribute model without price adjustment', () => {
        var obj = {};
        new customAttribute(obj, lineitem);
        assert.equal(obj.gcRecipientName, 'gcName');
        assert.equal(obj.gcFrom, 'gcFrom');
        assert.equal(obj.gcDeliveryDate, '12/12/2022');
        assert.equal(obj.fromStoreId, 'store123');
        assert.equal(obj.primaryContactBOPIS, 'primaryContactBOPIS');
        assert.equal(obj.secondaryContactBOPIS, 'secondaryContactBOPIS');
        assert.equal(obj.sku, 'Sku-123-GC');
        assert.equal(obj.instoreAvailability, 'instoreAvailability');
        assert.equal(obj.storeAvailabilityMsg, 'storeAvailabilityMsg');
        assert.equal(obj.storeInventory, 'storeInventory');
        assert.isTrue(obj.availableForInStorePickup)
    });

    it('Testing customAttribute decorator Model with empty values', () => {
        var obj = {};
        var lineitem = {
            custom: {
                gcRecipientName: '',
                gcFrom: '',
                gcDeliveryDate: '',
                fromStoreId: 'fromStoreId',
                primaryContactBOPIS: '',
                secondaryContactBOPIS: '',
                sku: '',
                instoreAvailability: '',
                storeAvailabilityMsg: '',
                storeInventory: ''
            },
            product: {
                custom: { 
                    availableForInStorePickup: false
                }
            },
            shipment:{
                custom: {
                    fromStoreId: false
                }
            }
        };
        new customAttribute(obj, lineitem);
        assert.equal(obj.gcRecipientName, '');
        assert.equal(obj.gcFrom, '');
        assert.equal(obj.gcDeliveryDate, '');
        assert.equal(obj.fromStoreId, 'fromStoreId');
        assert.equal(obj.primaryContactBOPIS, '');
        assert.equal(obj.secondaryContactBOPIS, '');
        assert.equal(obj.sku, '');
        assert.equal(obj.instoreAvailability, '');
        assert.equal(obj.storeAvailabilityMsg, '');
        assert.equal(obj.storeInventory, '');
        assert.isFalse(obj.availableForInStorePickup)
    });

});