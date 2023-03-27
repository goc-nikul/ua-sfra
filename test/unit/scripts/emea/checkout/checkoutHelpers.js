'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

var crossSiteScriptPatternsStub = sinon.stub();
var basketHasOnlyEGiftCardsStub = sinon.stub();
var placeOrderStub = sinon.stub();
var paazlStatusStub = sinon.stub();
var createOrderStub = sinon.stub();
var localeAddressStub = sinon.stub();
var currentBasketStub = sinon.stub();

var checkoutHelpers = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/checkout/checkoutHelpers.js', {
    'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
    'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
    'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
    'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
    'dw/util/Locale': require('../../../../mocks/dw/dw_util_Locale'),
    'dw/order/BasketMgr': {
        getCurrentBasket: currentBasketStub
    },
    'app_ua_core/cartridge/scripts/checkout/checkoutHelpers': {
        getLocaleAddress: localeAddressStub
    },
    'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {
        copyCustomerAddressToShipment: () => true,
        copyCustomerAddressToBilling: () => true
    },
    '*/cartridge/scripts/helpers/emailHelpers': {
        emailTypes: {
            orderConfirmation: 'orderConfirmation'
        }
    },
    '*/cartridge/modules/providers': {
        get: () => {
            return {
                send: () => true
            }
        }
    },
    'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
    'dw/order/OrderMgr': {
        placeOrder: placeOrderStub,
        failOrder: () => true,
        createOrder: createOrderStub
    },
    '*/cartridge/scripts/util/collections': require('../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
    '*/cartridge/scripts/utils/checkCrossSiteScript': {
        crossSiteScriptPatterns: crossSiteScriptPatternsStub
    },
    '*/cartridge/scripts/giftcard/giftcardHelper': {
        basketHasOnlyEGiftCards: basketHasOnlyEGiftCardsStub
    },
    '*/cartridge/scripts/helpers/paazlHelper': {
        getPaazlStatus: paazlStatusStub,
        updateShipment: () => true
    }
});

describe('app_ua_emea/cartridge/scripts/checkout', function () {

    it('Testing method: sendConfirmationEmail', function () {
        var Order = require('../../../../mocks/dw/dw_order_Order');
        var order = new Order();
        order.custom.confirmationEmailSent = false;
        assert.doesNotThrow(() => checkoutHelpers.sendConfirmationEmail(order));
    });

    it('Testing method: validateInputFieldsForShippingMethod', function () {
        var addressObj = {};
        crossSiteScriptPatternsStub.returns({
            crossSiteScriptPatterns: () => ['error1', 'error2']
        });
        var result = checkoutHelpers.validateInputFieldsForShippingMethod(addressObj);
        assert.isTrue(result.error);
        assert.equal(result.genericErrorMessage, 'testMsg');
        crossSiteScriptPatternsStub.reset();
    });

    it('Testing method: checkEmptyEmojiNonLatinChars', function () {
        var object = {
                firstName: 'firstName',
                lastName: 'lastName',
                address1: 'address1',
                city: 'city',
                postalCode: 'postalCode',
                countryCode: {
                    value: 'US'
                }
            },
            addressFieldsToVerify = Object.keys(object),
            countryCode = 'US';
        global.session = {
            custom: {
                currentCountry: 'IE'
            }
        }
        global.empty = (item) => !item;
        assert.deepEqual(checkoutHelpers.checkEmptyEmojiNonLatinChars(object, addressFieldsToVerify, countryCode), {});
        object.countryCode.value = 'USA';
        assert.deepEqual(checkoutHelpers.checkEmptyEmojiNonLatinChars(object, addressFieldsToVerify, countryCode), {
            countryCode: 'testMsg'
        });

        object.countryCode.value = 'US';
        global.session.custom.currentCountry = 'US';
        object.postalCode = '';
        assert.deepEqual(checkoutHelpers.checkEmptyEmojiNonLatinChars(object, addressFieldsToVerify, countryCode), {
            postalCode: 'postalCode is empty'
        });
    });

    it('Testing method: validateInputFields', function () {
        var LineItemCtnr = require('../../../../mocks/dw/dw_order_LineItemCtnr');
        var lineItemCtnr = new LineItemCtnr();
        crossSiteScriptPatternsStub.returns({
            crossSiteScriptPatterns: () => ['error1', 'error2']
        });
        lineItemCtnr.defaultShipment.giftMessage = true;
        var result = checkoutHelpers.validateInputFields(lineItemCtnr);
        assert.isTrue(result.error);
        crossSiteScriptPatternsStub.reset();
    });

    it('Testing method: ensureValidShipments for only GC', function () {
        var LineItemCtnr = require('../../../../mocks/dw/dw_order_LineItemCtnr');
        var lineItemCtnr = new LineItemCtnr();
        basketHasOnlyEGiftCardsStub.returns(true);
        assert.isTrue(checkoutHelpers.ensureValidShipments(lineItemCtnr));
        basketHasOnlyEGiftCardsStub.resetBehavior();
    });

    it('Testing method: ensureValidShipments for non GC', function () {
        var LineItemCtnr = require('../../../../mocks/dw/dw_order_LineItemCtnr');
        var lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.createShipment().custom.paazlDeliveryInfo = '{"deliveryType" : "PICKUP_LOCATION"}';
        basketHasOnlyEGiftCardsStub.returns(false);
        assert.isTrue(checkoutHelpers.ensureValidShipments(lineItemCtnr));
        lineItemCtnr.createShipment().custom.paazlDeliveryInfo = '{"deliveryType" : PICKUP_LOCATION"}';
        assert.doesNotThrow(() => checkoutHelpers.ensureValidShipments(lineItemCtnr));
        basketHasOnlyEGiftCardsStub.resetBehavior();
    });

    it('Testing method: placeOrder for failed order', function () {
        var Order = require('../../../../mocks/dw/dw_order_LineItemCtnr');
        placeOrderStub.returns(1);
        var order = new Order();
        assert.doesNotThrow(() => checkoutHelpers.placeOrder(order));
        var result = checkoutHelpers.placeOrder(order);
        assert.isTrue(result.error);
        placeOrderStub.resetBehavior();
    });

    it('Testing method: placeOrder for success order', function () {
        var Order = require('../../../../mocks/dw/dw_order_LineItemCtnr');
        global.empty = (params) => !params;
        placeOrderStub.returns(2);
        var order = new Order();
        order.getCustomerName = () => null;
        order.setCustomerName = () => null;
        paazlStatusStub.returns({
            active: true
        });
        var result = checkoutHelpers.placeOrder(order);
        assert.isFalse(result.error);
        paazlStatusStub.throws(new Error('errorMsg'));
        assert.doesNotThrow(() => checkoutHelpers.placeOrder(order));
        placeOrderStub.resetBehavior();
        paazlStatusStub.resetBehavior();
    });

    it('Testing method: createOrder', function () {
        assert.doesNotThrow(() => checkoutHelpers.createOrder());
        checkoutHelpers.createOrder(null, '1234');
        createOrderStub.throws(new Error('Test Error'));
        assert.doesNotThrow(() => checkoutHelpers.createOrder(null, '1234'));
        createOrderStub.resetBehavior();
    });

    it('Testing method: replacePostalCode', function () {
        assert.equal(checkoutHelpers.replacePostalCode('12345', 'NL'), '12345');
        assert.equal(checkoutHelpers.replacePostalCode('12345', 'GB'), '12 345');
    });

    it('Testing method: updatePostalCode', function () {
        assert.doesNotThrow(() => checkoutHelpers.updatePostalCode());
        var LineItemCtnr = require('../../../../mocks/dw/dw_order_LineItemCtnr');
        var lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.createShipment();
        assert.doesNotThrow(() => checkoutHelpers.updatePostalCode(lineItemCtnr));
    });
});
