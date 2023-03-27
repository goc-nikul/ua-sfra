'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var sinon = require('sinon');

// stubs
var decryptStub = sinon.stub();
var paymentInquiryStub = sinon.stub();
var paymentTokenStub = sinon.stub();
var paymentRefundStub = sinon.stub();


describe('int_2c2p/cartridge/scripts/helpers/serviceHelper.js', () => {
    var serviceHelper = proxyquire('../../../../../cartridges/int_2c2p/cartridge/scripts/helpers/serviceHelper', {
        '*/cartridge/scripts/helpers/2c2pHelper': {
            encrypt() { },
            decrypt: decryptStub
        },
        '*/cartridge/scripts/config/2c2Prefs': {},
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        '*/cartridge/models/request/paymentToken': function () {

        },
        '*/cartridge/scripts/service/paymentToken': paymentTokenStub,
        '*/cartridge/scripts/service/paymentInquiry': paymentInquiryStub,
        '*/cartridge/scripts/service/paymentRefund': paymentRefundStub,
        'dw/util/StringUtils': { decodeBase64(parma) { return parma; } }
    });

    describe('Testing Method: get2C2pRedirectUrl', () => {
        var result;
        it('should throw an error when response object is empty', () => {
            paymentTokenStub.returns({ ok: true, object: '' });
            try {
                serviceHelper.get2C2pRedirectUrl({});
            } catch (e) {
                assert.equal(e.message, 'Error service response');
            }
        });
        it('should throw an error when decrypt object is empty', () => {
            paymentTokenStub.returns({ ok: true, object: '{}' });
            decryptStub.returns('');
            try {
                serviceHelper.get2C2pRedirectUrl({});
            } catch (e) {
                assert.equal(e.message, 'Invalid response Signature');
            }
            decryptStub.reset();
        });

        it('should return redirect url from the response payload whrn respCode is 0000', () => {
            decryptStub.returns('{"respCode":"0000","webPaymentUrl":"https:/uatestpayment.com"}');
            result = serviceHelper.get2C2pRedirectUrl({});
            assert.isDefined(result);
            assert.equal(result, 'https:/uatestpayment.com');
        });

        it('should return null when respCode is  not 0000', () => {
            decryptStub.returns('{"respCode":"0010","webPaymentUrl":"https:/uatestpayment.com"}');
            result = serviceHelper.get2C2pRedirectUrl({});
            assert.isDefined(result);
            assert.isNull(result);
        });
    });

    describe('Testing method: isTransactionSuccess', () => {
        var result;
        it('should return true when respCode present in the returnresponsecodebe', () => {
            let serviceHelpers = proxyquire('../../../../../cartridges/int_2c2p/cartridge/scripts/helpers/serviceHelper', {
                '*/cartridge/scripts/config/2c2Prefs': { configuration2C2P: '{"returnresponsecodebe":["0000"]}' },
                'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
                '*/cartridge/scripts/helpers/2c2pHelper': {}

            });
            result = serviceHelpers.isTransactionSuccess('0000');
            assert.isTrue(result);
        });

        it('should return false ehrn respCode not present in the returnresponsecodebe', () => {
            let serviceHelpers = proxyquire('../../../../../cartridges/int_2c2p/cartridge/scripts/helpers/serviceHelper', {
                '*/cartridge/scripts/config/2c2Prefs': {},
                'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
                '*/cartridge/scripts/helpers/2c2pHelper': {}

            });
            result = serviceHelpers.isTransactionSuccess('0001');
            assert.isFalse(result);
        });
    });

    describe('Testing Method: getTransactionInquiry', () => {
        var result;
        it('should return null if paymentInquiryResponse object in empty', () => {
            paymentInquiryStub.returns({ ok: true, object: '' });
            result = serviceHelper.getTransactionInquiry('ord123');
            assert.isDefined(result);
            assert.isNull(result);
        });
        it('should return thow an error when decrypt response is empty', () => {
            paymentInquiryStub.returns({ ok: true, object: '{}' });
            decryptStub.returns('');
            try {
                result = serviceHelper.getTransactionInquiry('ord123');
            } catch (e) {
                assert.isNull(result);
                assert.equal(e.message, 'Invalid Signature from response');
            }
        });
        it('should return response decrypt response is not empty', () => {
            decryptStub.returns('{"data":"test data"}');
            result = serviceHelper.getTransactionInquiry('ord123');
            assert.isDefined(result);
            assert.isDefined(result.data);
        });
    });

    describe('Testing method: refund', () => {
        var result;
        it('should return null if object is empty in paymentRefundResponse', () => {
            paymentRefundStub.returns({ ok: true, objet: '' });
            result = serviceHelper.refund({});
            assert.isDefined(result);
            assert.isNull(result);
            paymentRefundStub.reset();
        });

        it('should return decoded data object is present in paymentRefundResponse', () => {
            paymentRefundStub.returns({ ok: true, object: { data: 'test data' } });
            result = serviceHelper.refund({});
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isDefined(result.data);
        });
    });
});

