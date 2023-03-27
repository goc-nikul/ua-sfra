'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../mockModuleSuperModule');
var StoresModel;

function baseStoresModelMock () {};

var Site = {
    current : {
        preferences : {
            custom : {
                inStorePickUpRadiusOptions : JSON.stringify ({ name: "TEST" })
            }
        },
        getCustomPreferenceValue: () => {
            return JSON.stringify ({ name: "TEST" });
        }
    }
};

global.empty = function (params) { return !params; }

describe('app_ua_core/cartridge/models/stores.js', () => {

    before(() => {
        mockSuperModule.create(baseStoresModelMock);
    });

    it('Testing for stores model not defined', () => {
        StoresModel = proxyquire('../../../cartridges/app_ua_core/cartridge/models/stores.js', {
            'dw/system/Site' : Site
        });
        var result = new StoresModel();
        assert.isDefined(result, 'result is not defined');
    });

    it('Testing getCustomPreferenceValue not exists for store model', () => {
        Site.current.getCustomPreferenceValue = () => {
            return null;
        };
        var stores = new StoresModel();
        assert.deepEqual(stores, {}, 'getCustomPreferenceValue should be not equal');
    });
});
