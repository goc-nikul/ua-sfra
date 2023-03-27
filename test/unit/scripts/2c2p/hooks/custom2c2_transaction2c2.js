'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var sinon = require('sinon');

var getTransactionInquiryStub = sinon.stub();
var writelogSpy = sinon.spy();

describe('int_2c2p/cartridge/scripts/hooks/custom2c2.js and /transaction2c2.js test', () => {
    var custom2c2 = proxyquire('../../../../../cartridges/int_2c2p/cartridge/scripts/hooks/custom2c2', {
        '*/cartridge/scripts/helpers/hooks': (param1, param2, param3, callback) => {
            callback();
            return true;
        },
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
    });

    var transaction2c2 = proxyquire('../../../../../cartridges/int_2c2p/cartridge/scripts/hooks/transaction2c2', {
        '*/cartridge/scripts/logs/2c2p': { writelog: writelogSpy, LOG_TYPE: { ERROR: 'ERROR' } },
        '*/cartridge/scripts/helpers/serviceHelper': { getTransactionInquiry: getTransactionInquiryStub }
    });
    var result;
    it('Testing method: validatePayment => will return error false', () => {
        result = custom2c2.validatePayment();
        assert.isDefined(result);
        assert.isFalse(result.error);
    });

    it('Testing method: handlePayments => should call hooksHelper', () => {
        result = custom2c2.handlePayments({});
        assert.isDefined(result);
    });

    it('Testing method: offlineRefund => should return true', () => {
        result = custom2c2.offlineRefund({});
        assert.isDefined(result);
        assert.isTrue(result);
    });

    it('Testing method: updateorder => should update the offlineRefund as true for order object', () => {
        let order = {
            custom: {
                offlineRefund: false
            }
        };
        custom2c2.updateorder(order);
        assert.isTrue(order.custom.offlineRefund);
    });

    it('Testing method: verifyTransaction => should log the error when TransactionInquiry is false', () => {
        getTransactionInquiryStub.returns(false);
        transaction2c2.verifyTransaction('ord123');
        assert.isTrue(writelogSpy.calledOnce);
        writelogSpy.reset();
    });

    it('Testing method: verifyTransaction => shouldn\'t trow the erro when  TransactionInquiry is true', () => {
        getTransactionInquiryStub.returns(true);
        transaction2c2.verifyTransaction('ord123');
        assert.isTrue(writelogSpy.notCalled);
        writelogSpy.reset();
    });
});
