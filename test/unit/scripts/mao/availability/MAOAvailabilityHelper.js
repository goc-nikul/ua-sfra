'use strict';

/* eslint-disable */
const assert = require('chai').assert;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

global.request = {
    httpRemoteAddress: 'Home-Show'
};

describe('int_mao/cartridge/scripts/MAOAvailability', function () {
    before (() => {
        global.session = {
            custom: {
                customerCountry: 'US'
            },
            sessionID: {
                toString: function () {
                    return '10000011101110';
                }
            }
        };
    })
    var stubMaoPreferences = sinon.stub();
    var MAOAvailabilityHelper = proxyquire('../../../../../cartridges/int_mao/cartridge/scripts/availability/MAOAvailabilityHelper.js', {
        '~/cartridge/scripts/MaoPreferences': {
            MaoBOPISViewDefinition: JSON.stringify({ Items: [], Locations: [], OrderAttributes: {} })
        },
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        '*/cartridge/scripts/util/collections': require('../../../../mocks/scripts/util/collections.js')
    });

    var items = [{
        ItemId: '001',
        LocationId: 'TESTLOCATION_1',
        Status: 'Online',
        Quantity: 100
    },
    {
        ItemId: '002',
        LocationId: 'TESTLOCATION_2',
        Status: 'Online',
        Quantity: 200
    },
    {
        ItemId: '003',
        Status: 'Online',
        TotalQuantity: 500
    }];

    var locations = {
        data: items
    };

    it('parseResponse: should return availability data as null, when response is empty or null', () => {
        var response = MAOAvailabilityHelper.parseResponse(null);
        assert.isNotNull(response);
        assert.isObject(response);

        response = MAOAvailabilityHelper.parseResponse('');
        assert.isNotNull(response);
        assert.isObject(response);
    });

    it('parseResponse: should throw an error when response is success, but text is not a valid JSON format', () => {
        assert.throws(() => { return MAOAvailabilityHelper.parseResponse({ statusCode: 200, text: 'TEST' }); }, Error, new Error('SyntaxError: Unexpected token T in JSON at position 0'));
    });

    it('parseResponse: should return empty object, when response is success and valid JSON format', () => {
        var response = MAOAvailabilityHelper.parseResponse({ statusCode: 200, text: '{}' });
        assert.isNotNull(response);
        assert.isObject(response);

        response = MAOAvailabilityHelper.parseResponse({ statusCode: 200, text: JSON.stringify(locations) });
        assert.isNotNull(response);
        assert.isObject(response);
        assert.equal(response['001'], '{"Status":"Online","Quantity":100,"LocationId":"TESTLOCATION_1","quantity":[100],"storeId":["TESTLOCATION_1"]}');
        assert.equal(response['002'], '{"Status":"Online","Quantity":200,"LocationId":"TESTLOCATION_2","quantity":[100,200],"storeId":["TESTLOCATION_1","TESTLOCATION_2"]}');
    });

    it('isCheckPointEnabled: should return false when checkpoint param as false', () => {
        var response = MAOAvailabilityHelper.isCheckPointEnabled(false);
        assert.isFalse(response);
    });

    it('getAvailabilityRequest: should return availability request when locations are passed in', () => {
        var response = MAOAvailabilityHelper.getAvailabilityRequest(items, locations);
        assert.isNotNull(response);
        assert.isNotNull(response.Items);
        assert.equal(response.Items.length, 3);
    });

    it('getInstorePickUpSKUS: should return empty collection when basket param is null or empty', () => {
        var response = MAOAvailabilityHelper.getInstorePickUpSKUS(null);
        assert.isNotNull(response);
        assert.isObject(response);
        assert.deepEqual(response, { items: [], locations: [] });

        response = MAOAvailabilityHelper.getInstorePickUpSKUS();
        assert.isNotNull(response);
        assert.isObject(response);
        assert.deepEqual(response, { items: [], locations: [] });
    });

    it('getInstorePickUpSKUS: should return response when basket line items are present/empty', () => {
        var response = MAOAvailabilityHelper.getInstorePickUpSKUS({
            getAllProductLineItems: () => {
                return [];
            }
        });
        assert.isNotNull(response);
        assert.isObject(response);
        assert.deepEqual(response, { items: [], locations: [] });

        response = MAOAvailabilityHelper.getInstorePickUpSKUS({
            getAllProductLineItems: () => {
                return [{
                    custom: {
                        fromStoreId: 'STORE01',
                        sku: 'SKU001',
                        productID: 'SKU001'
                    }
                },
                {
                    custom: {
                        fromStoreId: 'STORE02',
                        productID: 'SKU002'
                    }
                }];
            }
        });

        assert.isNotNull(response);
        assert.isObject(response);
        assert.equal(response.items.length, 1);
    });

    it('getSKUS: should return empty collection when basket param is null or empty', () => {
        var response = MAOAvailabilityHelper.getInstorePickUpSKUS(null);
        assert.isNotNull(response);
        assert.isObject(response);
        assert.deepEqual(response, { items: [], locations: [] });

        response = MAOAvailabilityHelper.getInstorePickUpSKUS();
        assert.isNotNull(response);
        assert.isObject(response);
        assert.deepEqual(response, { items: [], locations: [] });
    });

    it('getSKUS: should return response when basket line items are present/empty', () => {
        var response = MAOAvailabilityHelper.getSKUS({
            getAllProductLineItems: () => {
                return [];
            }
        });
        assert.isNotNull(response);
        assert.isArray(response);

        response = MAOAvailabilityHelper.getSKUS({
            getAllProductLineItems: () => {
                return [{
                    product: {
                        custom: {
                            giftCard: {
                                value: 'TEST'
                            }
                        }
                    },
                    productID: 'SKU001',
                    custom: {
                        sku: 'SKU001'
                    },
                    shipment: {
                        custom: {
                            fromStoreId: false,
                            sku: 'SKU001'
                        }
                    }
                },
                {
                    product: {
                        custom: {
                            giftCard: {
                                value: 'EGIFT_CARD'
                            }
                        }
                    },
                    productID: 'SKU002',
                    custom: {
                        sku: 'SKU002'
                    },
                    shipment: {
                        custom: {
                            fromStoreId: true,
                            sku: 'SKU002'
                        }
                    }
                },
                {
                    product: {
                        custom: {
                            giftCard: {
                                value: 'TEST'
                            }
                        }
                    },
                    productID: 'SKU003',
                    custom: {
                        sku: null
                    },
                    shipment: {
                        custom: {
                            fromStoreId: false,
                            sku: 'SKU003'
                        }
                    }
                }];
            }
        });

        assert.isNotNull(response);
        assert.isArray(response);
        assert.equal(response[0], 'SKU001');
    });
    it('getGiftBoxSKUS() - should return an empty array when productSearchHits is null', function() {
        const productSearchHits = null;
        const result = MAOAvailabilityHelper.getGiftBoxSKUS(productSearchHits);
        assert.isArray(result);
        assert.deepEqual(Array.isArray(result) && result.length, 0);
    });
    it('getGiftBoxSKUS() - should return an empty array when productSearchHits is an empty array', function() {
        const productSearchHits = [];
        const result = MAOAvailabilityHelper.getGiftBoxSKUS(productSearchHits);
        assert.isArray(result);
        assert.deepEqual(Array.isArray(result) && result.length, 0);
    });
    it('getGiftBoxSKUS() - should return an array of SKU values', function() {
        const productSearchHits = [
            {
                getProduct: () => ({
                    isMaster: () => true,
                    getVariationModel: () => ({ getDefaultVariant: () => ({ custom: { sku: 'SKU1' } }) })
                })
            },
            {
                getProduct: () => ({
                    isMaster: () => false,
                    custom: { sku: 'SKU2' }
                })
            },
            {
                getProduct: () => ({
                    isMaster: () => true,
                    getVariationModel: () => ({ getDefaultVariant: () => ({ custom: { sku: 'SKU3' } }) })
                })
            }
        ];
        const result = MAOAvailabilityHelper.getGiftBoxSKUS(productSearchHits);
        assert.isArray(result);
        assert.deepEqual(result, ['SKU1', 'SKU2', 'SKU3']);
    });
});