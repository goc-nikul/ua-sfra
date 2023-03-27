'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var ArrayList = require('../../../../mocks/scripts/util/dw.util.Collection');

var lineItemMock = {
    priceAdjustments: new ArrayList([]),
    getPrice: function () {},
    adjustedPrice: {
        add: function () {}
    },
    optionProductLineItems: new ArrayList([{
        adjustedPrice: {}
    }]),
    quantityValue: 1
};

class Money {
    constructor(value = 0, currencyCode = 'USD') {
        this.currencyCode = currencyCode;
        this.value = value;
        this.available = true;
        this.valueOrNull = value;
    }

    add(money) {
        this.value += money.value;
        return this;
    }

    subtract(money) {
        this.value -= money.value;
        return this;
    }

    multiply(money) {
        this.value = this.value * money.value;
        return this;
    }

    getAmount() {
        return this;
    }
    toFormattedString() {
        return '$' + this.value;
    }
    require() {
        return 'USD'
    }
};

describe('product line item price total decorator', () => {
    // var test = require('../../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/util/collections')
    var collections = proxyquire('../../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/util/collections', {
        'dw/util/ArrayList': ArrayList
    });

    var priceTotal = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/productLineItem/decorators/priceTotal', {
        '*/cartridge/scripts/util/collections': collections,
        '*/cartridge/scripts/renderTemplateHelper': {
            getRenderedHtml: () => { return 'rendered HTML'; }
        },
        'dw/util/StringUtils': {
            formatMoney: () => { return 'formatted Money'; }
        },
        'dw/value/Money': new Money
    });

    it('should create priceTotal property for passed in object', () => {
        var object = {
            price: {
                list: 100,
                sales: {
                    decimalPrice: 80.00,
                    currency: 'USA'
                },
                priceBookSalesPrice: {
                    decimalPrice: 80.00,
                    currency: 'USA'
                }
            }
        };
        priceTotal(object, lineItemMock);

        assert.equal(object.priceTotal.price, 'formatted Money');
        assert.equal(object.priceTotal.renderedPrice, 'rendered HTML');
        assert.equal(object.price.list, 100);
        assert.equal(object.priceTotal.strikeThroughPrice, '');
    });

    it('should handel price adjustments', () => {
        var object = {};
        lineItemMock.priceAdjustments = new ArrayList([{}]);
        priceTotal(object, lineItemMock);

        assert.equal(object.priceTotal.nonAdjustedPrice, 'formatted Money');
        assert.equal(object.priceTotal.strikeThroughPrice, 'formatted Money');
    });
});
