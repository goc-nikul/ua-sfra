'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

// Path to scripts
var pathToCartridges = '../../../../../cartridges/';
var pathToLinkScripts = pathToCartridges + 'int_paymetric/cartridge/scripts/';

// Path to test scripts
var pathToCoreMock = '../../../../mocks/';
var pathToLinkMock = '../../mock/';

describe('Paymetric: util/PaymetricHelper test', () => {
    global.empty = (data) => {
        return !data;
    };

    global.session = {
        custom: {}
    };

    global.customer = {};

    var PaymetricHelper = proxyquire(pathToLinkScripts + 'util/PaymetricHelper', {
        'dw/web/Resource': require(pathToCoreMock + 'dw/dw_web_Resource'),
        'dw/util/UUIDUtils': require(pathToCoreMock + 'dw/dw_util_UUIDUtils'),
        'dw/order/Order': require(pathToCoreMock + 'dw/dw_order_Order'),
        'dw/crypto/Signature': require(pathToCoreMock + 'dw/dw_crypto_Signature'),
        'dw/crypto/KeyRef': require(pathToCoreMock + 'dw/dw_crypto_KeyRef'),
        'dw/util/StringUtils': require(pathToCoreMock + 'dw/dw_util_StringUtils'),
        'dw/system/Logger': require(pathToCoreMock + 'dw/dw_system_Logger'),
        'dw/system/Transaction': require(pathToCoreMock + 'dw/dw_system_Transaction'),
        'dw/system/Site': require(pathToCoreMock + 'dw/dw_system_Site'),
        'dw/order/PaymentInstrument': require(pathToCoreMock + 'dw/dw_order_PaymentInstrument'),
        'app_ua_core/cartridge/scripts/checkout/checkoutHelpers': require(pathToCoreMock + 'scripts/checkout/checkoutHelpers'),
        'int_paymetric/cartridge/scripts/services/PaymetricService': require(pathToLinkMock + 'scripts/PaymetricService')
    });

    it('Testing method: createPaymentInstrument', () => {
        // Prepare basket
        var Basket = require(pathToCoreMock + 'dw/dw_order_Basket');
        var basket = new Basket();
        basket.totalGrossPrice = 10;

        // Create new payment
        PaymetricHelper.createPaymentInstrument(basket, 'Paymetric', 'test');
        var paymentInstruments = basket.getPaymentInstruments();
        var paymentInstrument = paymentInstruments[0];

        // Check if basket have previously set values
        assert.equal(1, paymentInstruments.length);
        assert.equal(10, paymentInstrument.amount);
        assert.equal('Paymetric', paymentInstrument.paymentMethod);
    });

    it('Testing method: updatePaymentTransaction', () => {
        // Prepare payment instrument
        var PaymentInstrument = require(pathToCoreMock + 'dw/dw_order_PaymentInstrument');
        var paymentInstrument = new PaymentInstrument();

        // Update payment data
        PaymetricHelper.updatePaymentTransaction(paymentInstrument, '0001', 'Paymetric');

        // Check if payment instrument have set values
        assert.equal('0001', paymentInstrument.paymentTransaction.transactionID);
        assert.equal('Paymetric', paymentInstrument.paymentTransaction.paymentProcessor);
    });

    it('Testing method: getAuthResult', () => {
        var result = PaymetricHelper.getAuthResult('test');
        assert.equal('authorized', result.authorization.status);
    });

    it('Testing method: isInternalToken', () => {
        var result = PaymetricHelper.isInternalToken('INT-TOKEN');
        assert.equal(true, result);
    });

    it('Testing method: getPaymentFormURLs', () => {
        var result = PaymetricHelper.getPaymentFormURLs();

        assert.equal('test', result.domain);
        assert.equal('test', result.script);
    });

    it('Testing method: updatePaymentInfo', () => {
        // Prepare order
        var Order = require(pathToCoreMock + 'dw/dw_order_Order');
        var order = new Order();
        order.createPaymentInstrument('Paymetric', 10);
        var authResult = PaymetricHelper.getAuthResult('test');

        // Update order payment with Paymetric info
        PaymetricHelper.updatePaymentInfo(order, authResult);

        // Check if changes applies
        var paymentInstrument = order.getPaymentInstruments('Paymetric').iterator().next();
        assert.equal('Jane Doe', paymentInstrument.creditCardHolder);
    });

    it('Testing method: getJwtToken', () => {
        var result = PaymetricHelper.getJwtToken();
        assert.equal(true, result.length > 0);
    });

    it('Testing method: saveCustomerCreditCard', () => {
        // Prepare profile
        var Order = require(pathToCoreMock + 'dw/dw_order_Order');
        var wallet = new Order();

        customer.registered = true;
        customer.authenticated = true;
        customer.profile = {
            getWallet: function () {
                return wallet;
            }
        };

        // Get request data
        var authResult = PaymetricHelper.getAuthResult('test');

        // Check if changes applies
        PaymetricHelper.saveCustomerCreditCard(authResult);
        var updatedWalletData = customer.profile.getWallet().getPaymentInstruments().items;
        assert.equal(1, updatedWalletData.length);
        assert.equal('Jane Doe', updatedWalletData[0].creditCardHolder);
    });

    it('Testing method: exchangeInternalToken', () => {
        var result = PaymetricHelper.exchangeInternalToken('internal');
        assert.equal(result, 'external');
    });

    it('Testing method: updateOrderToken', () => {
        // Prepare order
        var Order = require(pathToCoreMock + 'dw/dw_order_Order');
        var order = new Order();
        order.createPaymentInstrument('Paymetric', 10);

        // Update order
        var extToken = 'external';
        PaymetricHelper.updateOrderToken(order, extToken);

        // Check if data saved
        var paymentInstrument = order.getPaymentInstruments().items[0];
        assert.equal(paymentInstrument.creditCardToken, 'external');
        assert.equal(order.custom.onHold, false);
    });

    it('Testing method: updateCustomerToken', () => {
        // Prepare profile
        var Order = require(pathToCoreMock + 'dw/dw_order_Order');
        var wallet = new Order();
        var profile = {
            getWallet: function () {
                return wallet;
            }
        };
        var paymentInstrument = profile.getWallet().createPaymentInstrument('Paymetric', 10);
        paymentInstrument.custom.internalToken = 'internal';

        // Update customer card data
        PaymetricHelper.updateCustomerToken(profile, 'external', 'internal');

        // Check if data saved
        assert.equal(paymentInstrument.creditCardToken, 'external');
        assert.equal(paymentInstrument.custom.internalToken, null);
    });
});
