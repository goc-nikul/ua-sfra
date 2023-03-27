'use strict';

const {
    assert
} = require('chai');

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_mao/cartridge/scripts/MaoConstants.js', () => {
    var MaoConstants = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/MaoConstants.js', {
    });

    it('MessageHeader Constant is defined', () => {
        assert.isNotNull(MaoConstants.MessageHeader);
        assert.isNotNull(MaoConstants.MessageHeader.MSG_TYPE);
        assert.isDefined(MaoConstants.MessageHeader.MSG_TYPE, 'MSG_TYPE is Defined');
    });

    it('DocType Constant is defined', () => {
        assert.isNotNull(MaoConstants.DocType);
        assert.isNotNull(MaoConstants.DocType.DocTypeId);
        assert.isDefined(MaoConstants.DocType.DocTypeId, 'DocTypeId is Defined');
    });

    it('OrderActions Constant is defined', () => {
        assert.isNotNull(MaoConstants.OrderActions);
        assert.isNotNull(MaoConstants.OrderActions.IsAlreadyPriced);
        assert.isDefined(MaoConstants.OrderActions.IsAlreadyPriced, 'IsAlreadyPriced is Defined');
    });

    it('OrderLine Constant is defined', () => {
        assert.isNotNull(MaoConstants.OrderLine);
        assert.isNotNull(MaoConstants.OrderLine.UOM);
        assert.isDefined(MaoConstants.OrderLine.UOM, 'UOM is Defined');
    });

    it('PaymentTransaction Constant is defined', () => {
        assert.isNotNull(MaoConstants.PaymentTransaction);
        assert.isNotNull(MaoConstants.PaymentTransaction.PaymentResponseStatus);
        assert.isDefined(MaoConstants.PaymentTransaction.PaymentResponseStatus, 'PaymentResponseStatus is Defined');
    });

    it('PaymentType Constant is defined', () => {
        assert.isNotNull(MaoConstants.PaymentType);
        assert.isNotNull(MaoConstants.PaymentType.PaymentTypeId.creditcardPaymentTypeId);
        assert.isDefined(MaoConstants.PaymentType.PaymentTypeId.creditcardPaymentTypeId, 'creditcardPaymentTypeId is Defined');
    });

    it('Extended Constant is defined', () => {
        assert.isNotNull(MaoConstants.Extended);
        assert.isNotNull(MaoConstants.Extended.authcode.applepay);
        assert.isDefined(MaoConstants.Extended.authcode.applepay, 'applepay auth code is Defined');
    });

    it('Payment Constant is defined', () => {
        assert.isNotNull(MaoConstants.Payment);
        assert.isNotNull(MaoConstants.Payment.gcPaymentMethodId);
        assert.isDefined(MaoConstants.Payment.gcPaymentMethodId, 'gcPaymentMethodId is Defined');
    });

    it('OrderHold Constant is defined', () => {
        assert.isNotNull(MaoConstants.OrderHold);
        assert.isNotNull(MaoConstants.OrderHold.HoldTypeId);
        assert.isDefined(MaoConstants.OrderHold.HoldTypeId, 'HoldTypeId is Defined');
    });

    it('OrderNote Constant is defined', () => {
        assert.isNotNull(MaoConstants.OrderNote);
        assert.isNotNull(MaoConstants.OrderNote.NoteCategory);
        assert.isDefined(MaoConstants.OrderNote.NoteCategory, 'NoteCategory is Defined');
    });
});
