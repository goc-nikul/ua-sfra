'use strict';

/* eslint-disable no-extend-native */
/* eslint-disable eqeqeq */

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

// Path to scripts
var pathToCartridges = '../../../../../cartridges/';
var pathToLinkScripts = pathToCartridges + 'int_accertify/cartridge/scripts/';

// Path to test scripts
var pathToCoreMock = '../../../../mocks/';
var pathToLinkMock = '../../mock/';

describe('Accertify: util/AccertifyHelper test', () => {
    global.empty = (data) => {
        return !data;
    };

    global.session = {
        custom: {}
    };

    global.customer = {};

    global.XML = require(pathToCoreMock + 'dw/XML');

    Object.prototype.equals = function (val) {
        return this == val;
    };

    var Order = require(pathToCoreMock + 'dw/dw_order_Order');
    var Shipment = require(pathToCoreMock + 'dw/dw_order_Shipment');
    var order = new Order();
    order.createShipment(new Shipment());
    order.createPaymentInstrument('Paymetric', 10);

    var AccertifyHelper = proxyquire(pathToLinkScripts + 'util/AccertifyHelper', {
        'dw/system/Logger': require(pathToCoreMock + 'dw/dw_system_Logger'),
        'dw/order/PaymentInstrument': require(pathToCoreMock + 'dw/dw_order_PaymentInstrument')
    });

    it('Testing method: createAccertifyProcessRequest', () => {
        // Note: we do not have XML to JSON logic. To be added if necessary
        var result = new AccertifyHelper().createAccertifyProcessRequest(order);
        assert.equal('<transactionRequest></transactionRequest>', result);
    });

    it('Testing method: parseAccertifyResponse', () => {
        // Note: we do not have XML to JSON logic. To be added if necessary
        var reqData = require(pathToLinkMock + 'scripts/AccertifyService').call();
        var result = new AccertifyHelper().parseAccertifyResponse('svc', reqData);
        assert.deepEqual(result, {
            accertifyTransactionID: 'transaction-id',
            accertifyRules: 'rules-tripped',
            accertifyScore: 'total-score',
            accertifyRecCode: 'recommendation-code',
            remarks: 'remarks',
            accertifyActionType: 'action-type'
        });
    });

    it('Testing method: getMockedAccertifyResponse', () => {
        // Note: we do not have XML to JSON logic. To be added if necessary
        var svc = {
            getConfiguration: function () {
                return {
                    getProfile: function () {
                        return {};
                    }
                };
            }
        };
        var result = new AccertifyHelper().getMockedAccertifyResponse(svc);

        assert.deepEqual(result, {
            statusCode: 200,
            statusMessage: 'Success',
            text: '<transaction-results><transaction-id>00000804</transaction-id><recommendation-code>ACCEPT</recommendation-code></transaction-results>'
        });
    });

    it('Testing method: getServiceConfig', () => {
        var profile = {
            custom: {
                data: '{"test": "test"}'
            }
        };
        var result = new AccertifyHelper().getServiceConfig(profile);

        assert.deepEqual(result, {
            test: 'test'
        });
    });

    it('Testing method: getShipment', () => {
        var result = new AccertifyHelper().getShipment(order);

        assert.deepEqual(result, {
            shippingAddress: {
                firstName: 'test',
                fullName: 'test_test',
                address1: 'test',
                address2: 'test',
                city: 'test',
                stateCode: 'US',
                postalCode: 'test',
                countryCode: 'test',
                phone: 'test'
            },
            shippingMethodID: 'test',
            giftMessage: ''
        });
    });

    it('Testing method: getAddress', () => {
        // Note: we do not have XML to JSON logic. To be added if necessary
        var address = order.getBillingAddress();
        var result = new AccertifyHelper().getAddress('test', address);

        assert.equal(result, '<test></test>');
    });

    it('Testing method: getCustomerInfo', () => {
        // Note: we do not have XML to JSON logic. To be added if necessary
        var result = new AccertifyHelper().getCustomerInfo(order);

        assert.equal(result, '<customerInformation></customerInformation>');
    });

    it('Testing method: getOrderInformation', () => {
        // Note: we do not have XML to JSON logic. To be added if necessary
        var result = new AccertifyHelper().getOrderInformation(order);

        assert.equal(result, '<orderInformation></orderInformation>');
    });

    it('Testing method: getDeliveryDetailInformation', () => {
        // Note: we do not have XML to JSON logic. To be added if necessary
        var result = new AccertifyHelper().getDeliveryDetailInformation(order);

        assert.equal(result, '<deliveryDetailInformation></deliveryDetailInformation>');
    });

    it('Testing method: getPaymentDetailInformation', () => {
        // Note: we do not have XML to JSON logic. To be added if necessary
        var result = new AccertifyHelper().getPaymentDetailInformation(order);

        assert.equal(result, '<paymentDetailInformation></paymentDetailInformation>');
    });

    it('Testing method: getOrderDetailInformation', () => {
        // Note: we do not have XML to JSON logic. To be added if necessary
        var result = new AccertifyHelper().getOrderDetailInformation(order);

        assert.equal(result, '<orderDetailInformation></orderDetailInformation>');
    });

    it('Testing method: getCreditCardHolderForApplePay', () => {
        var paymentInstrument = {
            creditCardHolder: 'test'
        };
        var result = new AccertifyHelper().getCreditCardHolderForApplePay(paymentInstrument);

        assert.equal(result, 'test');
    });

    it('Testing method: getOrderType', () => {
        var result = new AccertifyHelper().getOrderType(order);

        assert.equal(result, 'web');
    });
});
