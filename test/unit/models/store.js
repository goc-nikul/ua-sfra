'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../mockModuleSuperModule');
var baseStoreModelMock = function Store () {};
var StoreModel;
var store;

var storeObject = {
    image: 'store/urlink/product/image',
    inventoryListID: 'ASDF12',
    custom: {
        storeOpenUntil: '10 PM',
        storePickupDetails: 'First Block',
        storeTimeZone: 'GMT',
        storeHoursJson: '32',
        enableStore: 'GFGH',
        storeType: {
            displayValue: '345',
        }
    }
};

describe('app_ua_core/cartridge/models/store', () => {

    before(function () {
        mockSuperModule.create(baseStoreModelMock);
        StoreModel = proxyquire('../../../cartridges/app_ua_core/cartridge/models/store.js', {
            '*/cartridge/scripts/helpers/storeHelpers': {
                getStoreOpenHours: function () {
                    return {
                        storeHoursJson: '12'
                    };
                },
                getStoreGoogleMapLink: function () {
                    return {
                        enableStore: 'test'
                    };
                }
            }
        });
    });

    it('Testing for store model defined', () => {
        store = new StoreModel(storeObject);
        assert.isDefined(store, 'Model Object is not defined');
        assert.isDefined(store.storeOpenUntil, 'storeOpenUntil is not defined');
        assert.isDefined(store.storePickupDetails, 'storePickupDetails is not defined');
        assert.isDefined(store.storeTimeZone, 'storeTimeZone is not defined');
        assert.isDefined(store.storeHoursJson, 'storeHoursJson is not defined');
        assert.isDefined(store.enableStore, 'enableStore is not defined');
        assert.isDefined(store.storeType, 'displayValue is not defined');
    });

    it('Testing for store model not null', () => {
        store = new StoreModel(storeObject);
        assert.isNotNull(store, 'Model Object is null');
        assert.isNotNull(store.storeOpenUntil, 'storeOpenUntil is null');
        assert.isNotNull(store.storePickupDetails, 'storePickupDetails is null');
        assert.isNotNull(store.storeTimeZone, 'storeTimeZone is null');
        assert.isNotNull(store.storeHoursJson, 'storeHoursJson is null');
        assert.isNotNull(store.enableStore, 'enableStore is null');
        assert.isNotNull(store.storeType, 'displayValue is null');
    });

    it('Testing storeOpenUntil not exists for store model', () => {
        storeObject.custom.storeOpenUntil = '';
        store = new StoreModel(storeObject);
        assert.isUndefined(store.storeOpenUntil, 'storeOpenUntil should be defined');
    });

    it('Testing storePickupDetails not exists for store model', () => {
        storeObject.custom.storePickupDetails = '';
        store = new StoreModel(storeObject);
        assert.isUndefined(store.storePickupDetails, 'storePickupDetails should be defined');
    });

    it('Testing storeTimeZone not exists for store model', () => {
        delete storeObject.custom.storeTimeZone;
        store = new StoreModel(storeObject);
        assert.isUndefined(store.storeTimeZone, 'storeTimeZone should be defined');
    });

    it('Testing storeHoursJson not exists for store model', () => {
        delete storeObject.custom.storeHoursJson;
        store = new StoreModel(storeObject);
        assert.isUndefined(store.storeHoursJson, 'storeHoursJson should be defined');
    });

    it('Testing enableStore not exists for store model', () => {
        delete storeObject.custom.enableStore;
        store = new StoreModel(storeObject);
        assert.isUndefined(store.enableStore, 'enableStore should be defined');
    });

    it('Testing storeType not exists for store model', () => {
        delete storeObject.custom.storeType.displayValue;
        store = new StoreModel(storeObject);
        assert.isUndefined(store.storeType, 'storeType should be defined');
    });

    it('Testing image not exists for store model', () => {
        delete storeObject.image;
        store = new StoreModel(storeObject);
        assert.isUndefined(store.image, 'image should be defined');
    });

    it('Testing inventoryListID not exists for store model', () => {
        delete storeObject.inventoryListID;
        store = new StoreModel(storeObject);
        assert.isUndefined(store.inventoryListID, 'inventoryListID should be defined');
    });

    it('Testing storeObject not exists for store model', () => {
        store = new StoreModel(null);
        assert.deepEqual(store, {}, 'storeObject should be not equal');
    });
});
