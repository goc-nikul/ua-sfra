'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var ArrayList = require('../../../../mocks/scripts/util/dw.util.Collection');


describe('product line item applied promotions decorator', function () {
    var collections = proxyquire('../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections', {
        'dw/util/ArrayList': ArrayList
    });
    var appliedPromotions = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/productLineItem/decorators/appliedPromotions', {
        '*/cartridge/scripts/util/collections': collections,
        'dw/web/Resource': { msg: function () { return 'test discount'; } }
    });

    it('should create a property on the passed in object called appliedPromotions', function () {
        var object = {};

        var promotionMock = {
            promotion: {
                calloutMsg: {
                    markup: 'someCallOutMsg'
                },
                name: 'somePromotionName',
                details: {
                    markup: 'someDetails'
                },
                campaign: {
                    ID: 'CAMP123',
                    UUID: 'CAMPUUID123',
                    description: 'Promo description',
                    applicableInStore: false,
                    applicableOnline: true
                }
            }
        };

        var lineItemMock = { priceAdjustments: new ArrayList([promotionMock]) };
        appliedPromotions(object, lineItemMock);

        assert.equal(object.appliedPromotions.length, 1);
        assert.equal(object.appliedPromotions[0].callOutMsg, 'someCallOutMsg');
        assert.equal(object.appliedPromotions[0].name, 'somePromotionName');
        assert.equal(object.appliedPromotions[0].details, 'someDetails');
        assert.equal(object.appliedPromotions[0].campaign.id, 'CAMP123');
        assert.equal(object.appliedPromotions[0].campaign.UUID, 'CAMPUUID123');
        assert.equal(object.appliedPromotions[0].campaign.description, 'Promo description');
        assert.isTrue(object.appliedPromotions[0].campaign.applicableOnline);
        assert.isFalse(object.appliedPromotions[0].campaign.applicableInStore);
    });

    it('should handle no applied promotions', function () {
        var object = {};

        var lineItemMock = { priceAdjustments: new ArrayList([]) };
        appliedPromotions(object, lineItemMock);

        assert.equal(object.appliedPromotions, undefined);
    });

    it('should handle no callout message', function () {
        var object = {};

        var promotionMock = {
            promotion: {
                name: 'somePromotionName',
                details: {
                    markup: 'someDetails'
                },
                campaign: {
                    ID: 'CAMP123',
                    UUID: 'CAMPUUID123',
                    description: 'Promo description',
                    applicableInStore: false,
                    applicableOnline: true
                }
            }
        };

        var lineItemMock = { priceAdjustments: new ArrayList([promotionMock]) };
        appliedPromotions(object, lineItemMock);

        assert.equal(object.appliedPromotions.length, 1);
        assert.equal(object.appliedPromotions[0].callOutMsg, '');
        assert.equal(object.appliedPromotions[0].name, 'somePromotionName');
        assert.equal(object.appliedPromotions[0].details, 'someDetails');
    });

    it('should handle no details', function () {
        var object = {};

        var promotionMock = {
            promotion: {
                calloutMsg: {
                    markup: 'someCallOutMsg'
                },
                name: 'somePromotionName',
                campaign: {
                    ID: 'CAMP123',
                    UUID: 'CAMPUUID123',
                    description: 'Promo description',
                    applicableInStore: false,
                    applicableOnline: true
                }
            }
        };

        var lineItemMock = { priceAdjustments: new ArrayList([promotionMock]) };
        appliedPromotions(object, lineItemMock);

        assert.equal(object.appliedPromotions.length, 1);
        assert.equal(object.appliedPromotions[0].callOutMsg, 'someCallOutMsg');
        assert.equal(object.appliedPromotions[0].name, 'somePromotionName');
        assert.equal(object.appliedPromotions[0].details, '');
    });

    it('should use default message if no promotion is available', function () {
        var object = {};

        var lineItemMock = { priceAdjustments: new ArrayList([{}]) };
        appliedPromotions(object, lineItemMock);

        assert.equal(object.appliedPromotions.length, 1);
        assert.equal(object.appliedPromotions[0].callOutMsg, 'test discount');
    });

    it('should handle no details', function () {
        var object = {};

        var promotionMock = {
            promotion: {
                calloutMsg: {
                    markup: 'someCallOutMsg'
                },
                name: 'somePromotionName',
                campaign: {
                    ID: '',
                    UUID: '',
                    description: '',
                    applicableInStore: true,
                    applicableOnline: false
                }
            }
        };

        var lineItemMock = { priceAdjustments: new ArrayList([promotionMock]) };
        appliedPromotions(object, lineItemMock);

        assert.equal(object.appliedPromotions[0].campaign.id, '');
        assert.equal(object.appliedPromotions[0].campaign.UUID, '');
        assert.equal(object.appliedPromotions[0].campaign.description, '');
        assert.isFalse(object.appliedPromotions[0].campaign.applicableOnline);
        assert.isTrue(object.appliedPromotions[0].campaign.applicableInStore);
    });
});