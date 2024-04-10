'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_klarna_payments_custom/cartridge/scripts/util/klarnaHelper.js file test cases', () => {
    let klarnaHelper = proxyquire('../../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/util/klarnaHelper.js', {
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getCustomPreferenceValue: function (param) {
                        if (param === 'kpRejectedMethodDisplay') {
                            return { value: 'no' };
                        }
                        if (param === 'kpPromoTaxation') {
                            return { value: 'price' };
                        }
                        return '';
                    }
                };
            }
        }
    });
    it('Test hideRejectedPayments method', function () {
        var result = klarnaHelper.hideRejectedPayments();
        assert.isNotNull(result);
    });
    it('Test getDiscountsTaxation method', function () {
        var result = klarnaHelper.getDiscountsTaxation();
        assert.isNotNull(result);
    });
    it('Test getExpressFormDetails method if express form has values', function () {
        var expressForm = {
            firstName: { value: 'John' },
            lastName: { value: 'Johnson' },
            address1: { value: '25 Quincy Rd' },
            address2: { value: '' },
            city: { value: 'Boston' },
            postalCode: { value: '01234' },
            countryCode: {
                value: 'us'
            },
            phone: { value: '6177771010' },
            stateCode: { value: 'MA' },
            email: { value: 'test@underarmour.com' }
        };
        var result = klarnaHelper.getExpressFormDetails(expressForm);
        assert.equal(result.firstName, expressForm.firstName.value);
        assert.equal(result.lastName, expressForm.lastName.value);
        assert.equal(result.address1, expressForm.address1.value);
        assert.equal(result.address2, expressForm.address2.value);
        assert.equal(result.city, expressForm.city.value);
        assert.equal(result.postalCode, expressForm.postalCode.value);
        assert.equal(result.countryCode.value, expressForm.countryCode.value);
        assert.equal(result.phone, expressForm.phone.value);
        assert.equal(result.stateCode, expressForm.stateCode.value);
        assert.equal(result.email, expressForm.email.value);
    });
    it('Test getExpressFormDetails method if express form does not has values', function () {
        var expressForm = {
            firstName: '',
            lastName: '',
            address1: '',
            address2: '',
            city: '',
            postalCode: '',
            countryCode: {},
            phone: '',
            stateCode: '',
            email: ''
        };
        var result = klarnaHelper.getExpressFormDetails(expressForm);
        assert.equal(result.firstName, expressForm.firstName);
        assert.equal(result.lastName, expressForm.lastName);
        assert.equal(result.address1, expressForm.address1);
        assert.equal(result.address2, expressForm.address2);
        assert.equal(result.city, expressForm.city);
        assert.equal(result.postalCode, expressForm.postalCode);
        assert.equal(result.countryCode.value, '');
        assert.equal(result.phone, expressForm.phone);
        assert.equal(result.stateCode, expressForm.stateCode);
        assert.equal(result.email, expressForm.email);
    });
    it('Test getSplitPaymentAmount method', function () {
        const LineItemCtnr = require('../../../../mocks/dw/dw_order_LineItemCtnr');
        const order = new LineItemCtnr();
        order.totalGrossPrice.value = 100;
        var splitAmount = order.totalGrossPrice.value / 4;
        let result = klarnaHelper.getSplitPaymentAmount(order.totalGrossPrice.value);
        assert.equal(result, splitAmount);
    });
});
