'use strict';

/* eslint-disable */

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

var stubGift = sinon.stub();
var stubBonusProductLineItem = sinon.stub();
var stubAppliedPromotions = sinon.stub();
var stubRenderedPromotions = sinon.stub();
var stubUuid = sinon.stub();
var stubOrderable = sinon.stub();
var stubShipment = sinon.stub();
var stubPriceTotal = sinon.stub();
var stubQuantityOptions = sinon.stub();
var stubOptions = sinon.stub();
var stubQuantity = sinon.stub();
var stubBundledProductLineItems = sinon.stub();
var stubBonusProductLineItemUUID = sinon.stub();
var stubDiscountBonusLineItems = sinon.stub();
var stubBonusUnitPrice = sinon.stub();
var stubPreOrderUUID = sinon.stub();
var stubPriceItem = sinon.stub();
var stubCustomAttributes = sinon.stub();
var stubIsOnline = sinon.stub();

describe('app_ua_core/cartridge/models/productLineItem/decorators/index', () => {
    var index = proxyquire('../../../cartridges/app_ua_core/cartridge/models/productLineItem/decorators/index', {
        '*/cartridge/models/productLineItem/decorators/gift': stubGift,
        '*/cartridge/models/productLineItem/decorators/bonusProductLineItem': stubBonusProductLineItem,
        '*/cartridge/models/productLineItem/decorators/appliedPromotions': stubAppliedPromotions,
        '*/cartridge/models/productLineItem/decorators/renderedPromotions': stubRenderedPromotions,
        '*/cartridge/models/productLineItem/decorators/uuid': stubUuid,
        '*/cartridge/models/productLineItem/decorators/orderable': stubOrderable,
        '*/cartridge/models/productLineItem/decorators/shipment': stubShipment,
        '*/cartridge/models/productLineItem/decorators/priceTotal': stubPriceTotal,
        '*/cartridge/models/productLineItem/decorators/quantityOptions': stubQuantityOptions,
        '*/cartridge/models/productLineItem/decorators/options': stubOptions,
        '*/cartridge/models/productLineItem/decorators/quantity': stubQuantity,
        '*/cartridge/models/productLineItem/decorators/bundledProductLineItems': stubBundledProductLineItems,
        '*/cartridge/models/productLineItem/decorators/bonusProductLineItemUUID': stubBonusProductLineItemUUID,
        '*/cartridge/models/productLineItem/decorators/discountBonusLineItems': stubDiscountBonusLineItems,
        '*/cartridge/models/productLineItem/decorators/bonusUnitPrice': stubBonusUnitPrice,
        '*/cartridge/models/productLineItem/decorators/preOrderUUID': stubPreOrderUUID,
        '*/cartridge/models/productLineItem/decorators/priceItem': stubPriceItem,
        '*/cartridge/models/productLineItem/decorators/customAttributes': stubCustomAttributes,
        '*/cartridge/models/productLineItem/decorators/isOnline': stubIsOnline
    });

    it('Testing decorators properties', () => {
        var keys = Object.keys(index);
        var expectedKeys = ['gift',
            'bonusProductLineItem',
            'appliedPromotions',
            'renderedPromotions',
            'uuid',
            'orderable',
            'shipment',
            'priceTotal',
            'quantityOptions',
            'options',
            'quantity',
            'bundledProductLineItems',
            'bonusProductLineItemUUID',
            'preOrderUUID',
            'discountBonusLineItems',
            'priceItem',
            'bonusUnitPrice',
            'customAttributes',
            'isOnline'
        ];

        assert.equal(keys.toString(), expectedKeys.toString());
    });
});
