'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const { rest } = require('lodash');
var mockSuperModule = require('../../../test/mockModuleSuperModule');

function Base() {}
var storeHelpers;
Base.getStores = function(param){
    return {

        stores: [    {
            productInStoreInventory: 'productInStoreInventory',
            storeTimeZone: {},
            storeHoursJson: '{"0":{"sunopen":"12:00AM","sunclose":"6:00PM"},"1":{"monopen":"9:00AM","monclose":"6:00PM"},"2":{"tueopen":"9:00AM","tueclose":"6:00PM"},"3":{"wedopen":"6:00PM"},"4":{"thuropen":"9:00AM","thurclose":"6:00PM"},"5":{"friopen":"9:00AM","friclose":"6:00PM"},"6":{"satopen":"9:00AM","satclose":"6:00PM"}}',
            storeTimeZone: {
                value: {}
            },
            inventoryListId: []
        }]

    };
 }


describe('app_ua_core/cartridge/scripts/helpers/storeHelpers.js', () => {

    before(function () {
        mockSuperModule.create(Base);
    });

    before(function () {
        storeHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/storeHelpers', {
            'dw/system/Logger': {
                getLogger: function () {
                    return {
                        info: function () {
                            return {};
                        }
                    };
                },
                error: function () {
                    return 'error';
                }
            },
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (param) {
                            if (param === 'pickupAvailableDuration')
                            return '19'
                            if (param === 'inStorePickUpRadiusOptions')
                            return '{}'
                            return {};
                        }
                    }
                },
                current: {
                    preferences: {
                        custom: {
                            inStorePickUpRadiusOptions: 'inStorePickUpRadiusOptions'
                        }
                    },
                    getCustomPreferenceValue: function (param) {
                        if (param === 'pickupAvailableDuration')
                            return '19'
                            if (param === 'inStorePickUpRadiusOptions')
                            return '{}'
                            return {};
                    }
                }
            },
            'dw/web/Resource': {
                msg: function (){
                    return 'msg';
                },
                msgf: function () {
                    return 'msgf';
                }
            },
            'dw/util/Locale': {
                getLocale: function () {
                    return {};
                }
            },
            'dw/catalog/StoreMgr': {
                searchStoresByPostalCode:function () {
                    return {
                        get: function () {
                            return {
                                toFixed: function () {
                                    return 2;
                                }
                            };
                        },
                    };
                },
                searchStoresByCoordinates: function () {
                    return {
                        get: function () {
                            return {
                                toFixed: function () {
                                    return 2;
                                }
                            };
                        }
                    };
                },
                getStore: function () {
                    return {}
                }
            },
            'dw/util/StringUtils': {
                formatCalendar: function () {
                    return '1'
                }
            },
            'dw/util/Calendar': function () { return {
                setTimeZone: function () {
                    return {
                        get: function () {
                            return 11;
                        }
                    };
                },
                get: function () {
                    return 14;
                },
                DAY_OF_WEEK: 1
            }; },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {
                        custom: {
                            sku: 'sku'
                        }
                    };
                }
            },
            'int_mao/cartridge/scripts/availability/MAOAvailability': {
                getMaoAvailability: function () {
                    return {
                       sku: '{"storeId":[{"enableStore": true}]}'
                    };
                }
            },
            'int_mao/cartridge/scripts/availability/MAOAvailabilityHelper': {
                isCheckPointEnabled: function () {
                    return {};
                }
            },
            'dw/catalog/ProductInventoryMgr': {
                getInventoryList: function () {
                    return {
                        getRecord: function () {
                            return {
                                ATS: {
                                    value: 1
                                }
                            }
                        }
                    };
                }
            },
            '*/cartridge/models/store': function (){},
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return '{}';
                },
                deleteCookie: function () {
                    return {};
                },
                create: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
        });
    });

    it('Testing method: getStores', () => {
        var products = [
            {
                id: 'id'
            }
        ];
        var geoLocation = {};
        let result = storeHelpers.getStores(11, 11111, 1, 1, geoLocation, true, 'www.under12.com', products);
        assert.isNotNull(result);
    });

    it('Testing method: getStores --> postalCode is empty', () => {
        var products = [
            {
                id: 'id'
            }
        ];
        var geoLocation = {};
        let result = storeHelpers.getStores(11, null, 1, 1, geoLocation, true, 'www.under12.com', products);
        assert.isNotNull(result);
    });

    it('Testing method: preSelectStoreByLocation', () => {
        let result = storeHelpers.preSelectStoreByLocation(1, 1, 11111);
        assert.isNotNull(result);
    });

    it('Testing method: getPreSelectedStoreCookie', () => {
        let result = storeHelpers.getPreSelectedStoreCookie();
        assert.isNotNull(result);
    });

    it('Testing method: getDefaultRadius --> default radius', () => {
        let result = storeHelpers.getDefaultRadius(0);
        assert.isNotNull(result);
    });

    it('Testing method: updateSelectedStoreCookie', () => {
        var store = {};
        let result = storeHelpers.updateSelectedStoreCookie(store, 'availabilityMessage', 'bopisSelected', 'bopisStock');
        assert.isUndefined(result);
    });

    it('Testing method: updateSelectedStoreCookie', () => {
        let result = storeHelpers.updateSelectedStoreCookie(null, 'availabilityMessage', 'bopisSelected', 'bopisStock');
        assert.isUndefined(result);
    });

    it('Testing method: getStoreOpenHours', () => {
        var storeHoursJson = '[{"sunopen":"12:00AM","sunclose":"6:00PM","monopen":"9:00AM","monclose":"6:00PM","tueopen":"9:00AM","tueclose":"6:00PM","wedopen":"6:00PM","thuropen":"9:00AM","thurclose":"6:00PM","friopen":"9:00AM","friclose":"6:00PM","satopen":"9:00AM","satclose":"6:00PM"}]';
        let result = storeHelpers.getStoreOpenHours(storeHoursJson);
        assert.isNotNull(result);
    });

    it('Testing method: getStoreOpenHours --> start day is thur', () => {
        var storeHoursJson = '[{"sunopen":"9:00AM","sunclose":"6:00PM","monopen":"12:00AM","monclose":"6:00PM","tueopen":"9:00AM","tueclose":"6:00PM","wedopen":"6:00PM","thuropen":"9:00AM","thurclose":"6:00PM","friopen":"9:00AM","friclose":"6:00PM","satopen":"9:00AM","satclose":"6:00PM"}]';
        let result = storeHelpers.getStoreOpenHours(storeHoursJson);
        assert.isNotNull(result);
    });

    it('Testing method: getStoreHoursforSFMC', () => {
        var storeHoursJson = '[{"sunopen":"9:00AM","sunclose":"6:00PM","monopen":"12:00AM","monclose":"6:00PM","tueopen":"9:00AM","tueclose":"6:00PM","wedopen":"6:00PM","thuropen":"9:00AM","thurclose":"6:00PM","friopen":"9:00AM","friclose":"6:00PM","satopen":"9:00AM","satclose":"6:00PM"}]';
        let result = storeHelpers.getStoreHoursforSFMC(storeHoursJson);
        assert.isNotNull(result);
    });

    it('Testing method: getStoreHoursforSFMC --> Test Custom Ecxeption', () => {
        var storeHoursJson = {};
        let result = storeHelpers.getStoreHoursforSFMC(storeHoursJson);
        assert.isNotNull(result);
    });

    it('Testing method: getBopisData', () => {
        var basket = {
            shipments: [
                {
                    custom: {
                        fromStoreId: 'fromStoreId'
                    }
                }
            ],
            productLineItems: [
                {
                    shipment: {
                        custom: {
                            fromStoreId: 'fromStoreId',
                        }
                    },
                    product: {
                        custom: {
                            sku: 'sku'
                        }
                    }
                },
                {
                    shipment: {
                        custom: {
                            fromStoreId: 'fromStoreId'
                        }
                    },
                    product: {
                        custom: {}
                    }
                }
            ]
        }
        let result = storeHelpers.getBopisData(basket);
        assert.isNotNull(result);
        assert.equal(result.items.length, 1);
    });

    it('Testing method: findStoreById', () => {
        let result = storeHelpers.findStoreById('storeId');
        assert.isNotNull(result);
    });

    it('Testing method: findStoreById', () => {
        storeHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/storeHelpers', {
            'dw/system/Logger': {
                getLogger: function () {
                    return {
                        info: function () {
                            return {};
                        }
                    };
                }
            },
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (param) {
                            if (param === 'pickupAvailableDuration')
                            return '19'
                            return {};
                        }
                    }
                }
            },
            'dw/catalog/StoreMgr': {
                searchStoresByPostalCode:function () {
                    return {
                        get: function () {
                            return {
                                toFixed: function () {
                                    return 2;
                                }
                            };
                        },
                    };
                },
                searchStoresByCoordinates: function () {
                    return {
                        get: function () {
                            return {
                                toFixed: function () {
                                    return 2;
                                }
                            };
                        }
                    };
                },
                getStore: function () {
                    return null
                }
            },
            '*/cartridge/models/store': function (){}
        });
        let result = storeHelpers.findStoreById('storeId');
        assert.isNull(result);
    });

    it('Testing method: getDefaultRadius --> preferances radius', () => {

        storeHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/storeHelpers', {
            'dw/system/Logger': {
                getLogger: function () {
                    return {
                        info: function () {
                            return {};
                        }
                    };
                }
            },
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (param) {
                            if (param === 'pickupAvailableDuration')
                            return '19'
                            if (param === 'inStorePickUpRadiusOptions')
                            return '{}'
                            return {};
                        }
                    }
                },
                current: {
                    preferences: {
                        custom: {
                            inStorePickUpRadiusOptions: 'inStorePickUpRadiusOptions'
                        }
                    },
                    getCustomPreferenceValue: function (param) {
                        if (param === 'pickupAvailableDuration')
                            return '19'
                            if (param === 'inStorePickUpRadiusOptions')
                            return '[{}]'
                            return {};
                    }
                }
            },
        });
        let result = storeHelpers.getDefaultRadius(0);
        assert.isNotNull(result);
    });

    it('Testing method: getBopisData --> Test Custom Exception', () => {

        storeHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/storeHelpers', {
            'dw/system/Logger': {
                getLogger: function () {
                    return {

                    };
                },
                error: function () {
                    return 'error';
                }
            },
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (param) {
                            if (param === 'pickupAvailableDuration')
                            return '19'
                            if (param === 'inStorePickUpRadiusOptions')
                            return '{}'
                            return {};
                        }
                    }
                },
                current: {
                    preferences: {
                        custom: {
                            inStorePickUpRadiusOptions: 'inStorePickUpRadiusOptions'
                        }
                    },
                    getCustomPreferenceValue: function (param) {
                        if (param === 'pickupAvailableDuration')
                            return '19'
                            if (param === 'inStorePickUpRadiusOptions')
                            return '{}'
                            return {};
                    }
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
        });
        var basket = {
            shipments: [
                {
                    custom: {
                        fromStoreId: 'fromStoreId'
                    }
                }
            ],
            productLineItems: [
                {
                    shipment: {
                        custom: {
                            fromStoreId: 'fromStoreId',
                        }
                    },
                    product: {
                        custom: {
                            sku: 'sku'
                        }
                    }
                },
                {
                    shipment: {
                        custom: {
                            fromStoreId: 'fromStoreId'
                        }
                    },
                    product: {
                        custom: {}
                    }
                }
            ]
        }
        let result = storeHelpers.getBopisData(basket);
        assert.isNotNull(result);
    });

    it('Testing method: getStoreGoogleMapLink', () => {

        storeHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/storeHelpers', {
            'dw/system/Logger': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (param) {
                            if (param === 'pickupAvailableDuration')
                            return '1'
                            return {};
                        }
                    }
                }
            },
        });
        var store = {
            address1: 'address1',
            address2: 'address2'
        }
        let result = storeHelpers.getStoreGoogleMapLink(store);
        assert.isNotNull(result);
    });

    it('Testing method: getStoreGoogleMapLink --> Test Custom Exception', () => {

        storeHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/storeHelpers', {
            'dw/system/Logger': {
                error:function () {
                    return 'error';
                }
            },
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (param) {
                            if (param === 'pickupAvailableDuration')
                            return '1'
                            return {};
                        }
                    }
                }
            },
        });
        var store = {
            address1: 'address1',
            address2: 'address2'
        }
        let result = storeHelpers.getStoreGoogleMapLink(null);
        assert.isNotNull(result);
    });

    it('Testing method: getProductAvailabilityOnStoreHours', () => {
        storeHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/storeHelpers', {
            'dw/system/Logger': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (param) {
                            if (param === 'pickupAvailableDuration')
                            return '1'
                            return {};
                        }
                    }
                }
            },
            'dw/web/Resource': {
                msg: function (){
                    return 'msg';
                },
                msgf: function () {
                    return 'msgf';
                }
            },
            'dw/util/StringUtils': {
                formatCalendar: function () {
                    return '1'
                }
            },
            'dw/util/Calendar': function () { return {
                setTimeZone: function () {
                    return {
                        get: function () {
                            return 2;
                        }
                    };
                },
                get: function () {
                    return 2;
                },
                DAY_OF_WEEK: 1
            }; },
        });
        var storeModel = {
            stores: [    {
                productInStoreInventory: 'productInStoreInventory',
                storeHoursJson: '{"0":{"sunopen":"9:00AM","sunclose":"6:00PM"},"1":{"monopen":"9:00AM","monclose":"6:00PM"},"2":{"tueopen":"9:00AM","tueclose":"6:00PM"},"3":{"wedopen":"6:00PM"},"4":{"thuropen":"9:00AM","thurclose":"6:00PM"},"5":{"friopen":"9:00AM","friclose":"6:00PM"},"6":{"satopen":"9:00AM","satclose":"6:00PM"}}',
                storeTimeZone: {},
                storeTimeZone: {
                    value: {}
                }
            }]
        }
        let result = storeHelpers.getProductAvailabilityOnStoreHours(storeModel);
        assert.isNotNull(result);
    });

    ///////////////////////////////////////////////////
    it('Testing method: getProductAvailabilityOnStoreHours', () => {
        storeHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/storeHelpers', {
            'dw/system/Logger': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (param) {
                            if (param === 'pickupAvailableDuration')
                            return '19'
                            return {};
                        }
                    }
                }
            },
            'dw/web/Resource': {
                msg: function (){
                    return 'msg';
                },
                msgf: function () {
                    return 'msgf';
                }
            },
            'dw/util/StringUtils': {
                formatCalendar: function () {
                    return '1'
                }
            },
            'dw/util/Calendar': function () { return {
                setTimeZone: function () {
                    return {
                        get: function () {
                            return 2;
                        }
                    };
                },
                get: function () {
                    return 3;
                },
                DAY_OF_WEEK: 4
            }; },
        });

        var storeModel = {
            stores: [    {
                productInStoreInventory: 'productInStoreInventory',
                storeHoursJson: '{"0":{"sunopen":"9:00AM","sunclose":"6:00PM"},"1":{"monopen":"9:00AM","monclose":"6:00PM"},"2":{"tueopen":"9:00AM","tueclose":"6:00PM"},"3":{"wedopen":"6:00PM"},"4":{"thuropen":"9:00AM","thurclose":"6:00PM"},"5":{"friopen":"9:00AM","friclose":"6:00PM"},"6":{"satopen":"9:00AM","satclose":"6:00PM"}}',
                storeTimeZone: {},
                storeTimeZone: {
                    value: {}
                }
            }]
        }
        let result = storeHelpers.getProductAvailabilityOnStoreHours(storeModel);
        assert.isNotNull(result);
    });

    it('Testing method: getProductAvailabilityOnStoreHours --> empty storeHoursJson', () => {

        storeHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/storeHelpers', {
            'dw/system/Logger': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (param) {
                            if (param === 'pickupAvailableDuration')
                            return '19'
                            return {};
                        }
                    }
                }
            },
            'dw/web/Resource': {
                msg: function (){
                    return 'msg';
                },
                msgf: function () {
                    return 'msgf';
                }
            },
            'dw/util/StringUtils': {
                formatCalendar: function () {
                    return '1'
                }
            },
            'dw/util/Calendar': function () { return {
                setTimeZone: function () {
                    return {
                        get: function () {
                            return 2;
                        }
                    };
                },
                get: function () {
                    return 3;
                },
                DAY_OF_WEEK: 4
            }; },
        });

        var storeModel = {
            stores: [    {
                productInStoreInventory: null,
                storeTimeZone: {},
                storeTimeZone: {
                    value: {}
                }
            }]
        }
        let result = storeHelpers.getProductAvailabilityOnStoreHours(storeModel);
        assert.isNotNull(result);
    });

    it('Testing method: getProductAvailabilityOnStoreHours --> case 4 & case 5', () => {

        storeHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/storeHelpers', {
            'dw/system/Logger': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (param) {
                            if (param === 'pickupAvailableDuration')
                            return '19'
                            return {};
                        }
                    }
                }
            },
            'dw/web/Resource': {
                msg: function (){
                    return 'msg';
                },
                msgf: function () {
                    return 'msgf';
                }
            },
            'dw/util/StringUtils': {
                formatCalendar: function () {
                    return '1'
                }
            },
            'dw/util/Calendar': function () { return {
                setTimeZone: function () {
                    return {
                        get: function () {
                            return 5;
                        }
                    };
                },
                get: function () {
                    return 5;
                },
                DAY_OF_WEEK: 3
            }; },
        });

        var storeModel = {
            stores: [    {
                productInStoreInventory: 'productInStoreInventory',
                storeTimeZone: {},
                storeHoursJson: '{"0":{"sunopen":"9:00AM","sunclose":"6:00PM"},"1":{"monopen":"9:00AM","monclose":"6:00PM"},"2":{"tueopen":"9:00AM","tueclose":"6:00PM"},"3":{"wedopen":"6:00PM"},"4":{"thuropen":"9:00AM","thurclose":"6:00PM"},"5":{"friopen":"9:00AM","friclose":"6:00PM"},"6":{"satopen":"9:00AM","satclose":"6:00PM"}}',
                storeTimeZone: {
                    value: {}
                }
            }]
        }
        let result = storeHelpers.getProductAvailabilityOnStoreHours(storeModel);
        assert.isNotNull(result);
    });

    it('Testing method: getProductAvailabilityOnStoreHours --> case 5 & case 6', () => {

        storeHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/storeHelpers', {
            'dw/system/Logger': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (param) {
                            if (param === 'pickupAvailableDuration')
                            return '19'
                            return {};
                        }
                    }
                }
            },
            'dw/web/Resource': {
                msg: function (){
                    return 'msg';
                },
                msgf: function () {
                    return 'msgf';
                }
            },
            'dw/util/StringUtils': {
                formatCalendar: function () {
                    return '1'
                }
            },
            'dw/util/Calendar': function () { return {
                setTimeZone: function () {
                    return {
                        get: function () {
                            return 6;
                        }
                    };
                },
                get: function () {
                    return 6;
                },
                DAY_OF_WEEK: 4
            }; },
        });

        var storeModel = {
            stores: [    {
                productInStoreInventory: 'productInStoreInventory',
                storeTimeZone: {},
                storeHoursJson: '{"0":{"sunopen":"9:00AM","sunclose":"6:00PM"},"1":{"monopen":"9:00AM","monclose":"6:00PM"},"2":{"tueopen":"9:00AM","tueclose":"6:00PM"},"3":{"wedopen":"6:00PM"},"4":{"thuropen":"9:00AM","thurclose":"6:00PM"},"5":{"friopen":"9:00AM","friclose":"6:00PM"},"6":{"satopen":"9:00AM","satclose":"6:00PM"}}',
                storeTimeZone: {
                    value: {}
                }
            }]
        }
        let result = storeHelpers.getProductAvailabilityOnStoreHours(storeModel);
        assert.isNotNull(result);
    });

    it('Testing method: getProductAvailabilityOnStoreHours --> case 6 & case 0', () => {

        storeHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/storeHelpers', {
            'dw/system/Logger': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (param) {
                            if (param === 'pickupAvailableDuration')
                            return '19'
                            return {};
                        }
                    }
                }
            },
            'dw/web/Resource': {
                msg: function (){
                    return 'msg';
                },
                msgf: function () {
                    return 'msgf';
                }
            },
            'dw/util/StringUtils': {
                formatCalendar: function () {
                    return '1'
                }
            },
            'dw/util/Calendar': function () { return {
                setTimeZone: function () {
                    return {
                        get: function () {
                            return 6;
                        }
                    };
                },
                get: function () {
                    return 7;
                },
                DAY_OF_WEEK: 4
            }; },
        });

        var storeModel = {
            stores: [    {
                productInStoreInventory: 'productInStoreInventory',
                storeTimeZone: {},
                storeHoursJson: '{"0":{"sunopen":"12:00AM","sunclose":"6:00PM"},"1":{"monopen":"9:00AM","monclose":"6:00PM"},"2":{"tueopen":"9:00AM","tueclose":"6:00PM"},"3":{"wedopen":"6:00PM"},"4":{"thuropen":"9:00AM","thurclose":"6:00PM"},"5":{"friopen":"9:00AM","friclose":"6:00PM"},"6":{"satopen":"9:00AM","satclose":"6:00PM"}}',
                storeTimeZone: {
                    value: {}
                }
            }]
        }
        let result = storeHelpers.getProductAvailabilityOnStoreHours(storeModel);
        assert.isNotNull(result);
    });

    it('Testing method: getProductAvailabilityOnStoreHours --> getNextWorkingDay return false', () => {

        storeHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/storeHelpers', {
            'dw/system/Logger': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (param) {
                            if (param === 'pickupAvailableDuration')
                            return '19'
                            return {};
                        }
                    }
                }
            },
            'dw/web/Resource': {
                msg: function (){
                    return 'msg';
                },
                msgf: function () {
                    return 'msgf';
                }
            },
            'dw/util/StringUtils': {
                formatCalendar: function () {
                    return '1'
                }
            },
            'dw/util/Calendar': function () { return {
                setTimeZone: function () {
                    return {
                        get: function () {
                            return 11;
                        }
                    };
                },
                get: function () {
                    return 14;
                },
                DAY_OF_WEEK: 1
            }; },
        });

        var storeModel = {
            stores: [    {
                productInStoreInventory: 'productInStoreInventory',
                storeTimeZone: {},
                storeHoursJson: '{"0":{"sunopen":"12:00AM","sunclose":"6:00PM"},"1":{"monopen":"9:00AM","monclose":"6:00PM"},"2":{"tueopen":"9:00AM","tueclose":"6:00PM"},"3":{"wedopen":"6:00PM"},"4":{"thuropen":"9:00AM","thurclose":"6:00PM"},"5":{"friopen":"9:00AM","friclose":"6:00PM"},"6":{"satopen":"9:00AM","satclose":"6:00PM"}}',
                storeTimeZone: {
                    value: {}
                }
            }]
        }
        let result = storeHelpers.getProductAvailabilityOnStoreHours(storeModel);
        assert.isNotNull(result);
    });

    it('Testing method: getProductAvailabilityOnStoreHours --> Test Custom Exception', () => {

        storeHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/storeHelpers', {
            'dw/system/Logger': {
                error: function () {
                    return 'error';
                }
            },
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (param) {
                            if (param === 'pickupAvailableDuration')
                            return '19'
                            return {};
                        }
                    }
                }
            },
            'dw/web/Resource': {
                msg: function (){
                    return 'msg';
                },
                msgf: function () {
                    return 'msgf';
                }
            },
            'dw/util/StringUtils': {},
            'dw/util/Calendar': function () { return {
                setTimeZone: function () {
                    return {
                        get: function () {
                            return 11;
                        }
                    };
                },
                get: function () {
                    return 14;
                },
                DAY_OF_WEEK: 1
            }; },
        });

        var storeModel = {
            stores: [    {
                productInStoreInventory: 'productInStoreInventory',
                storeTimeZone: {},
                storeHoursJson: '{"0":{"sunopen":"12:00AM","sunclose":"6:00PM"},"1":{"monopen":"9:00AM","monclose":"6:00PM"},"2":{"tueopen":"9:00AM","tueclose":"6:00PM"},"3":{"wedopen":"6:00PM"},"4":{"thuropen":"9:00AM","thurclose":"6:00PM"},"5":{"friopen":"9:00AM","friclose":"6:00PM"},"6":{"satopen":"9:00AM","satclose":"6:00PM"}}',
                storeTimeZone: {
                    value: {}
                }
            }]
        }
        let result = storeHelpers.getProductAvailabilityOnStoreHours(storeModel);
        assert.isNotNull(result);
    });

    it('Testing method: getStoreAvailability --> Item exist SFCC Store Inventory', () => {
        storeHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/storeHelpers', {
            'dw/system/Logger': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (param) {
                            if (param === 'pickupAvailableDuration')
                            return '19'
                            return {};
                        }
                    }
                }
            },
            'dw/web/Resource': {
                msg: function (){
                    return 'msg';
                },
                msgf: function () {
                    return 'msgf';
                }
            },
            'dw/util/StringUtils': {
                formatCalendar: function () {
                    return '1'
                }
            },
            'dw/util/Calendar': function () { return {
                setTimeZone: function () {
                    return {
                        get: function () {
                            return 11;
                        }
                    };
                },
                get: function () {
                    return 14;
                },
                DAY_OF_WEEK: 1
            }; },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {
                        custom: {
                            sku: 'sku'
                        }
                    };
                }
            },
            'int_mao/cartridge/scripts/availability/MAOAvailability': {
                getMaoAvailability: function () {
                    return {
                       sku: '{"storeId":[{"enableStore": true}]}'
                    };
                }
            },
            'int_mao/cartridge/scripts/availability/MAOAvailabilityHelper': {
                isCheckPointEnabled: function () {
                    return {};
                }
            },
            'dw/catalog/ProductInventoryMgr': {
                getInventoryList: function () {
                    return {
                        getRecord: function () {
                            return {
                                ATS: {
                                    value: 1
                                }
                            }
                        }
                    };
                }
            }
        });

        var storeModel = {
            stores: [    {
                productInStoreInventory: 'productInStoreInventory',
                storeTimeZone: {},
                storeHoursJson: '{"0":{"sunopen":"12:00AM","sunclose":"6:00PM"},"1":{"monopen":"9:00AM","monclose":"6:00PM"},"2":{"tueopen":"9:00AM","tueclose":"6:00PM"},"3":{"wedopen":"6:00PM"},"4":{"thuropen":"9:00AM","thurclose":"6:00PM"},"5":{"friopen":"9:00AM","friclose":"6:00PM"},"6":{"satopen":"9:00AM","satclose":"6:00PM"}}',
                storeTimeZone: {
                    value: {}
                },
                inventoryListId: []
            }]
        };
        var products = [
            {
                id: 'id'
            }
        ];
        let result = storeHelpers.getStoreAvailability(storeModel, products);
        assert.isNotNull(result);
        assert.isTrue(result.stores[0].productInStoreInventory)
    });

    it('Testing method: getStoreAvailability --> the response from MAO doesnt have data for a specific store then defaults to SFCC store inventory', () => {
        storeHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/storeHelpers', {
            'dw/system/Logger': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (param) {
                            if (param === 'pickupAvailableDuration')
                            return '19'
                            return {};
                        }
                    }
                }
            },
            'dw/web/Resource': {
                msg: function (){
                    return 'msg';
                },
                msgf: function () {
                    return 'msgf';
                }
            },
            'dw/util/StringUtils': {
                formatCalendar: function () {
                    return '1'
                }
            },
            'dw/util/Calendar': function () { return {
                setTimeZone: function () {
                    return {
                        get: function () {
                            return 11;
                        }
                    };
                },
                get: function () {
                    return 14;
                },
                DAY_OF_WEEK: 1
            }; },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {
                        custom: {
                            sku: 'sku'
                        }
                    };
                }
            },
            'int_mao/cartridge/scripts/availability/MAOAvailability': {
                getMaoAvailability: function () {
                    return {
                       sku: '{"storeId":["ID1",1], "quantity":[1]}'
                    };
                }
            },
            'int_mao/cartridge/scripts/availability/MAOAvailabilityHelper': {
                isCheckPointEnabled: function () {
                    return {};
                }
            },
            'dw/catalog/ProductInventoryMgr': {
                getInventoryList: function () {
                    return {
                        getRecord: function () {
                            return {
                                ATS: {
                                    value: 1
                                }
                            }
                        }
                    };
                }
            }
        });

        var storeModel = {
            stores: [    {
                productInStoreInventory: 'productInStoreInventory',
                storeTimeZone: {},
                storeHoursJson: '{"0":{"sunopen":"12:00AM","sunclose":"6:00PM"},"1":{"monopen":"9:00AM","monclose":"6:00PM"},"2":{"tueopen":"9:00AM","tueclose":"6:00PM"},"3":{"wedopen":"6:00PM"},"4":{"thuropen":"9:00AM","thurclose":"6:00PM"},"5":{"friopen":"9:00AM","friclose":"6:00PM"},"6":{"satopen":"9:00AM","satclose":"6:00PM"}}',
                storeTimeZone: {
                    value: {}
                },
                inventoryListId: [],
                enableStore: true,
                ID: 'ID1'
            }]
        };
        var products = [
            {
                id: 'id'
            }
        ];
        let result = storeHelpers.getStoreAvailability(storeModel, products);
        assert.isNotNull(result);
        assert.isTrue(result.stores[0].productInStoreInventory)
    });

    it('Testing method: getStoreAvailability --> Product {0} has empty sku', () => {
        storeHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/storeHelpers', {
            'dw/system/Logger': {
                getLogger: function () {
                    return {
                        info: function () {
                            return {};
                        }
                    };
                }
            },
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (param) {
                            if (param === 'pickupAvailableDuration')
                            return '19'
                            return {};
                        }
                    }
                }
            },
            'dw/web/Resource': {
                msg: function (){
                    return 'msg';
                },
                msgf: function () {
                    return 'msgf';
                }
            },
            'dw/util/StringUtils': {
                formatCalendar: function () {
                    return '1'
                }
            },
            'dw/util/Calendar': function () { return {
                setTimeZone: function () {
                    return {
                        get: function () {
                            return 11;
                        }
                    };
                },
                get: function () {
                    return 14;
                },
                DAY_OF_WEEK: 1
            }; },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {
                        custom: {
                            sku: null
                        }
                    };
                }
            },
            'int_mao/cartridge/scripts/availability/MAOAvailability': {
                getMaoAvailability: function () {
                    return {
                       sku: '{"storeId":[{"enableStore": true}]}'
                    };
                }
            },
            'int_mao/cartridge/scripts/availability/MAOAvailabilityHelper': {
                isCheckPointEnabled: function () {
                    return {};
                }
            },
            'dw/catalog/ProductInventoryMgr': {
                getInventoryList: function () {
                    return {
                        getRecord: function () {
                            return {
                                ATS: {
                                    value: 1
                                }
                            }
                        }
                    };
                }
            }
        });

        var storeModel = {
            stores: [    {
                productInStoreInventory: 'productInStoreInventory',
                storeTimeZone: {},
                storeHoursJson: '{"0":{"sunopen":"12:00AM","sunclose":"6:00PM"},"1":{"monopen":"9:00AM","monclose":"6:00PM"},"2":{"tueopen":"9:00AM","tueclose":"6:00PM"},"3":{"wedopen":"6:00PM"},"4":{"thuropen":"9:00AM","thurclose":"6:00PM"},"5":{"friopen":"9:00AM","friclose":"6:00PM"},"6":{"satopen":"9:00AM","satclose":"6:00PM"}}',
                storeTimeZone: {
                    value: {}
                },
                inventoryListId: []
            }]
        };
        var products = [
            {
                id: 'id'
            }
        ];
        let result = storeHelpers.getStoreAvailability(storeModel, products);
        assert.isNotNull(result);
        assert.isTrue(result.stores[0].productInStoreInventory)
    });

    it('Testing method: getStoreAvailability --> isItemInSFCCStoreInventory Test Custom Exception', () => {
        storeHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/storeHelpers', {
            'dw/system/Logger': {
                getLogger: function () {
                    return {
                        info: function () {
                            return {};
                        }
                    };
                },
                error: function () {
                    return 'error';
                }
            },
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function (param) {
                            if (param === 'pickupAvailableDuration')
                            return '19'
                            return {};
                        }
                    }
                }
            },
            'dw/web/Resource': {
                msg: function (){
                    return 'msg';
                },
                msgf: function () {
                    return 'msgf';
                }
            },
            'dw/util/StringUtils': {
                formatCalendar: function () {
                    return '1'
                }
            },
            'dw/util/Calendar': function () { return {
                setTimeZone: function () {
                    return {
                        get: function () {
                            return 11;
                        }
                    };
                },
                get: function () {
                    return 14;
                },
                DAY_OF_WEEK: 1
            }; },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {
                        custom: {
                            sku: null
                        }
                    };
                }
            },
            'int_mao/cartridge/scripts/availability/MAOAvailability': {
                getMaoAvailability: function () {
                    return {
                       sku: '{"storeId":[{"enableStore": true}]}'
                    };
                }
            },
            'int_mao/cartridge/scripts/availability/MAOAvailabilityHelper': {
                isCheckPointEnabled: function () {
                    return {};
                }
            },
            'dw/catalog/ProductInventoryMgr': {
                getInventoryList: function () {
                    return {};
                }
            }
        });

        var storeModel = {
            stores: [    {
                productInStoreInventory: 'productInStoreInventory',
                storeTimeZone: {},
                storeHoursJson: '{"0":{"sunopen":"12:00AM","sunclose":"6:00PM"},"1":{"monopen":"9:00AM","monclose":"6:00PM"},"2":{"tueopen":"9:00AM","tueclose":"6:00PM"},"3":{"wedopen":"6:00PM"},"4":{"thuropen":"9:00AM","thurclose":"6:00PM"},"5":{"friopen":"9:00AM","friclose":"6:00PM"},"6":{"satopen":"9:00AM","satclose":"6:00PM"}}',
                storeTimeZone: {
                    value: {}
                },
                inventoryListId: []
            }]
        };
        var products = [
            {
                id: 'id'
            }
        ];
        let result = storeHelpers.getStoreAvailability(storeModel, products);
        assert.isNotNull(result);
    });
});
