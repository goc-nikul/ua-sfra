'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_klarna_payments_custom/cartridge/scripts/payments/model/categories.js file test cases', () => {
    var categories = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/payments/model/categories.js', {});
    var KlarnaPaymentsCategories = new categories();
    KlarnaPaymentsCategories.categories = [{"asset_urls":{"descriptive":"https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg","standard":"https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg"},"identifier":"pay_over_time","name":"4 interest-free payments"}];

    it('Test findCategoryById method by passing valid klarna category Id', function () {
        var result = KlarnaPaymentsCategories.findCategoryById('pay_over_time');
        assert.ok(result);
        assert.equal('pay_over_time', result.identifier);
    });

    it('Test findCategoryById method by passing invalid klarna category Id', function () {
        var result = KlarnaPaymentsCategories.findCategoryById('test');
        assert.equal(null, result);
    });
});
