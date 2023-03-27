'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();


describe('DefaultPrice model', function () {
    var formattedMoney = '₪moolah';
    var DefaultPrice = proxyquire('../../../../cartridges/app_ua_core/cartridge/models/price/default.js', {
        'dw/value/Money': function () {},
        'dw/util/StringUtils': {
            formatMoney: function () { return formattedMoney; }
        }
    });
    var salesPrice;
    var listPrice;
    var actualListPrice;
    var priceBookSalesPrice;
    var decimalValue = 'decimalValue';
    var currencyCode = 'ABC';
    var defaultPrice;
    function getDecimalValue() {
        return {
            get: function () {
                return decimalValue;
            }
        };
    }
    function getCurrencyCode() {
        return currencyCode;
    }

    beforeEach(function () {
        salesPrice = {
            available: true,
            getDecimalValue: getDecimalValue,
            getCurrencyCode: getCurrencyCode
        };

        listPrice = {
            available: true,
            getDecimalValue: getDecimalValue,
            getCurrencyCode: getCurrencyCode
        };

        priceBookSalesPrice = {
            available: true,
            getDecimalValue: getDecimalValue,
            getCurrencyCode: getCurrencyCode
        };

        actualListPrice = {
            available: true,
            getDecimalValue: getDecimalValue,
            getCurrencyCode: getCurrencyCode
        };
    });

    it('should have a sales price', function () {
        defaultPrice = new DefaultPrice(salesPrice);
        assert.deepEqual(defaultPrice, {
            actualListPrice: null,
            list: null,
            priceBookSalesPrice: {},
            sales: {
                currency: currencyCode,
                formatted: formattedMoney,
                value: decimalValue,
                decimalPrice: '[object Object]'
            }
        });
    });

    it('should set property values to null if price is not available', function () {
        salesPrice.available = false;
        defaultPrice = new DefaultPrice(salesPrice);
        assert.deepEqual(defaultPrice, {
            actualListPrice: null,
            list: null,
            priceBookSalesPrice: {},
            sales: {
                currency: null,
                formatted: null,
                value: null,
                decimalPrice: undefined
            }
        });
    });

    it('should set list price when provided', function () {
        defaultPrice = new DefaultPrice(salesPrice, listPrice);
        assert.deepEqual(defaultPrice, {
            actualListPrice: null,
            list: {
                currency: currencyCode,
                formatted: formattedMoney,
                value: decimalValue,
                decimalPrice: '[object Object]'
            },
            priceBookSalesPrice: {},
            sales: {
                currency: currencyCode,
                formatted: formattedMoney,
                value: decimalValue,
                decimalPrice: '[object Object]'
            }
        });
    });

    it('should return  priceBookSales price when sale and list prices are empty', function () {
        defaultPrice = new DefaultPrice(salesPrice, listPrice, priceBookSalesPrice, actualListPrice);
        assert.deepEqual(defaultPrice, {
            actualListPrice: {
                currency: currencyCode,
                formatted: formattedMoney,
                value: decimalValue,
                decimalPrice: '[object Object]'
            },
            list: {
                currency: currencyCode,
                formatted: formattedMoney,
                value: decimalValue,
                decimalPrice: '[object Object]'
            },
            priceBookSalesPrice: {
                currency: currencyCode,
                formatted: formattedMoney,
                value: decimalValue,
                decimalPrice: '[object Object]'
            },
            sales: {
                currency: currencyCode,
                formatted: formattedMoney,
                value: decimalValue,
                decimalPrice: '[object Object]'
            }
        });
    });
    it('should set priceBookSales, actualList Price when sales. list price are not provided', function () {
        listPrice.available = false;
        salesPrice.available = false;
        defaultPrice = new DefaultPrice(priceBookSalesPrice, actualListPrice);
        assert.isDefined(defaultPrice, {
            actualListPrice: {
                currency: currencyCode,
                formatted: formattedMoney,
                value: decimalValue,
                decimalPrice: '[object Object]'
            },
            list: null,
            priceBookSalesPrice: {},
            sales: {
                currency: null,
                formatted: null,
                value: null,
                decimalPrice: undefined
            }
        });
    });
});