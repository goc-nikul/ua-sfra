'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

function ReturnsUtils() {
    this.processReturnToBeRefunded = function () {}
}

let zip = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/hooks/zip.js', {
    '*/cartridge/scripts/zip/helpers/orderProcess': {},
    '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
    'dw/value/Money': require('../../../../mocks/dw/dw_value_Money')
});

describe('app_ua_apac/cartridge/scripts/hooks/zip', () => {

    it('validating refund method if required args are null', () => {
        assert.doesNotThrow(() => {
            zip.Refund();
        });

        assert.doesNotThrow(() => {
            zip.Refund(null, null);
        });

        assert.doesNotThrow(() => {
            zip.Refund(null, null, null);
        });

        assert.doesNotThrow(() => {
            zip.Refund(null, null, null, null);
        });

        assert.doesNotThrow(() => {
            zip.Refund(null, null, null, {
                orderNo: null
            });
        });

        assert.doesNotThrow(() => {
            zip.Refund(null, null, null, null, null);
        });

        assert.doesNotThrow(() => {
            zip.Refund(null, null, null, null, null, null);
        });

        assert.notEqual(zip.Refund().statusCode, 200);
        assert.equal(zip.Refund().statusCode, 500);
    });

    it('validating refund method on refundStatus is false', () => {
        let zip = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/hooks/zip.js', {
            '*/cartridge/scripts/zip/helpers/orderProcess': {
                Refund: function () {
                    return {
                        success: false
                    };
                }
            },
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            'dw/value/Money': require('../../../../mocks/dw/dw_value_Money')
        });
        var order = {
            orderNo: 'ORDER1'
        };
        assert.equal(zip.Refund('ORDER1', 100, 'AUD', null, order, 'TESTING', {}).statusCode, 500);
    });

    it('validating refund method on refundStatus is true', () => {
        let zip = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/hooks/zip.js', {
            '*/cartridge/scripts/zip/helpers/orderProcess': {
                Refund: function () {
                    return {
                        success: true
                    };
                }
            },
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            'dw/value/Money': require('../../../../mocks/dw/dw_value_Money')
        });
        var order = {
            orderNo: 'ORDER1'
        };
        assert.equal(zip.Refund('ORDER1', 100, 'AUD', null, order, 'TESTING', {}).statusCode, 200);
    });

    it('Testing getCustomerPaymentInstruments if payment instrument is null', () => {
        assert.throws(() => {
            zip.getCustomerPaymentInstruments();
        });
    });

    it('Testing getCustomerPaymentInstruments if payment instrument exists and ZipToken not exits', () => {
        var paymentInstrument = {
            UUID: '1234',
            raw: {
                custom: {},
                paymentMethod: 'Adyen'
            }
        };
        assert.doesNotThrow(() => {
            zip.getCustomerPaymentInstruments(paymentInstrument);
        });
        assert.isFalse(zip.getCustomerPaymentInstruments(paymentInstrument).hasZipToken);
        assert.equal(zip.getCustomerPaymentInstruments(paymentInstrument).paymentMethod, 'Adyen');
        assert.equal(zip.getCustomerPaymentInstruments(paymentInstrument).UUID, '1234');
    });

    it('Testing getCustomerPaymentInstruments if payment instrument exists and ZipToken exits', () => {
        var paymentInstrument = {
            UUID: '1234',
            raw: {
                custom: {
                    ZipToken: 'ZipToken'
                },
                paymentMethod: 'Adyen'
            }
        };
        assert.doesNotThrow(() => {
            zip.getCustomerPaymentInstruments(paymentInstrument);
        });
        assert.isTrue(zip.getCustomerPaymentInstruments(paymentInstrument).hasZipToken);
        assert.equal(zip.getCustomerPaymentInstruments(paymentInstrument).paymentMethod, 'Adyen');
        assert.equal(zip.getCustomerPaymentInstruments(paymentInstrument).UUID, '1234');
    });

});
