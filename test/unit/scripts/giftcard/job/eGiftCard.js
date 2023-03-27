/* eslint-disable new-cap */
'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');
var ArrayList = require('../../../../mocks/scripts/util/dw.util.Collection');
var Logger = require('../../../../mocks/dw/dw_system_Logger');

var getEGiftCardLineItemsStub = sinon.stub();
var queryOrdersStub = sinon.stub();
var generateGiftCardNumbersStub = sinon.stub();
var logSpy = sinon.spy(Logger, 'error');
var sendEGiftCardsEmailStub = sinon.stub();

var orders = new ArrayList([{
    orderId: '1234124AS',
    custom: {
        eGiftCardStatus: 'PENDING'
    }
}]);

var gcLineItems = [{
    product: {
        custom: {
            giftCard: {
                value: 'GIFT_CARD'
            }
        }
    }
}];

var eGiftCard;
describe('app_ua_core/cartridge/scripts/giftcard/job/eGiftCard.js', () => {
    eGiftCard = proxyquire('../../../../../cartridges/app_ua_core/cartridge/scripts/giftcard/job/eGiftCard.js', {
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        '*/cartridge/scripts/giftcard/giftcardHelper': {
            getEGiftCardLineItems: getEGiftCardLineItemsStub
        },
        'dw/order/Order': require('../../../../mocks/dw/dw_order_Order'),
        'dw/order/OrderMgr': {
            queryOrders: queryOrdersStub
        },
        '*/cartridge/scripts/checkout/checkoutHelpers': {
            generateGiftCardNumbers: generateGiftCardNumbersStub,
            sendEGiftCardsEmail: sendEGiftCardsEmailStub
        }
    });


    beforeEach(() => {
        getEGiftCardLineItemsStub.reset();
        queryOrdersStub.reset();
        sendEGiftCardsEmailStub.reset();
        logSpy.reset();
    });

    it('Process: Should Log the error when lineItems are empty or null', () => {
        queryOrdersStub.returns(orders.iterator());
        getEGiftCardLineItemsStub.returns(null);
        eGiftCard.Process();
        assert.isTrue(logSpy.called);
        assert.isFalse(generateGiftCardNumbersStub.called);
    });

    it('Process: Check the behavior of gift card LineItems if present or else ', () => {
        queryOrdersStub.returns(orders.iterator());
        getEGiftCardLineItemsStub.returns(gcLineItems);
        generateGiftCardNumbersStub.returns({
            error: false,
            eGiftCardsDetails: {
                ID: 'GIFT4567'
            }
        });
        eGiftCard.Process();
        assert.isFalse(logSpy.called);
        assert.isTrue(generateGiftCardNumbersStub.calledWith(orders.toArray()[0]));
        assert.isTrue(sendEGiftCardsEmailStub.called);

        queryOrdersStub.reset();
        sendEGiftCardsEmailStub.reset();
        generateGiftCardNumbersStub.reset();

        queryOrdersStub.returns(orders.iterator());
        getEGiftCardLineItemsStub.returns([]);
        eGiftCard.Process();

        assert.isFalse(generateGiftCardNumbersStub.called);
        assert.isFalse(sendEGiftCardsEmailStub.called);

        queryOrdersStub.reset();
    });

    it('Process: Check the behavior when error occured while generating the Gift Card ', () => {
        queryOrdersStub.returns(orders.iterator());
        getEGiftCardLineItemsStub.returns(gcLineItems);
        generateGiftCardNumbersStub.returns({
            error: true,
            eGiftCardsDetails: {}
        });

        eGiftCard.Process();
        assert.isTrue(generateGiftCardNumbersStub.calledWith(orders.toArray()[0]));
        assert.isFalse(sendEGiftCardsEmailStub.called);

        queryOrdersStub.reset();
    });
});
