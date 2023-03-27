
/* eslint-disable */
'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;
var sinon = require('sinon');

// stubs
var getAdyenMerchantAccountStub = sinon.stub();
var msgStub = sinon.stub();
var callStub = sinon.stub();
var getResponseStub = sinon.stub();
var getServiceStub = sinon.stub();
var getCustomPreferenceValueStub = sinon.stub();

global.empty = (data) => {
    return !data;
};

var serviceMock = {
    getConfiguration() {
        return {
            getCredential() {
                return {
                    getURL() {
                        return 'https://test-service.com';
                    },
                    getUser() {
                        return 'testUser';
                    },
                    getPassword() {
                        return '@#$%^&*123GHJ';
                    }
                };
            }
        };
    },
    call: callStub,
    getResponse: getResponseStub
};

var orderMock = {
    custom: {
    },
    getCurrencyCode() {
        return 'EUR';
    }
};

getAdyenMerchantAccountStub.returns('testMerchantAccount');
msgStub.returns(0);

describe('app_ua_mx/cartridge/scripts/hooks/AdyenMgr', () => {
    var result;
    var AdyenMgr = proxyquire('../../../../../cartridges/app_ua_mx/cartridge/scripts/hooks/AdyenMgr.js', {
        '*/cartridge/scripts/orders/ReturnsUtils': function () {
            this.SetRefundsCountInfo = () => {
                return true;
            };
        },
        'dw/web/Resource': { msg: msgStub },
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        '*/cartridge/adyenConstants/constants': {
            SERVICE: { ADYENREFUND: 'ADYENREFUND' }
        },
        '*/cartridge/scripts/util/adyenHelper': {
            getAdyenMerchantAccount: getAdyenMerchantAccountStub,
            SERVICE: { ADYENREFUND: 'ADYENREFUND' },
            getService: getServiceStub
        },
        '*/cartridge/scripts/util/adyenConfigs': {
            getAdyenMerchantAccount: getAdyenMerchantAccountStub
        },
        'dw/svc/Result': {
            OK: 'OK'
        },
        'dw/system/Site': {
            getCurrent() {
                return {
                    getCustomPreferenceValue: getCustomPreferenceValueStub
                };
            }
        },
        'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
        'dw/net/Mail': function () {
            this.send = () => { return { status: 'OK' }; };
            this.setSubject = () => { };
            this.addTo = () => { };
            this.setFrom = () => { };
            this.setContent = () => { };
        },
        'dw/util/HashMap': require('../../.././../mocks/dw/dw_util_HashMap'),
        'dw/util/Template': function () {
            this.render = () => { return {}; };
        }

    });

    describe('Testing method: Refund ', () => {
        it('should return error message when Adyen Merchant account is not available', () => {
            getAdyenMerchantAccountStub.returns(null);
            result = AdyenMgr.Refund('testrefNo', 200, 'EUR', '3454REETKH', orderMock, 'Damage');
            assert.isDefined(result);
            assert.equal(result, 'Error: Merchant Account Not Set');
            getAdyenMerchantAccountStub.reset();
        });

        it('should return error message when Adyen service configuration is not available', () => {
            getAdyenMerchantAccountStub.returns('testMerchantAccount');
            getServiceStub.returns({
                getConfiguration() {
                    return null;
                }
            });
            result = AdyenMgr.Refund('testrefNo', 200, 'EUR', '3454REETKH', orderMock, 'Damage');
            assert.isDefined(result);
            assert.equal(result, 'Error: Missing configuration in Demandware');
            getServiceStub.reset();
        });

        it('should return service response with successful response call', () => {
            getServiceStub.returns(serviceMock);
            callStub.returns({ status: 'OK' });
            getResponseStub.returns({
                statusCode: 200,
                data: {
                    refund: 'processed'
                }
            });
            result = AdyenMgr.Refund('testrefNo', 200, 'EUR', '', orderMock, 'Damage');
            assert.isDefined(result);
        });

        it('should return service response with successful response call', () => {
            getServiceStub.returns(serviceMock);
            callStub.returns({ status: 'OK' });
            getResponseStub.returns({
                statusCode: 200,
                data: {
                    refund: 'processed'
                }
            });
            result = AdyenMgr.Refund('testrefNo', 200, 'EUR', '', orderMock, 'Damage');
            assert.isDefined(result);
        });

        it('should log the error message when unknown exception occured', () => {
            msgStub.returns(1);
            getResponseStub.throwsException(new Error('unknown error'));
            result = AdyenMgr.Refund('testrefNo', 200, 'EUR', '', orderMock, 'Damage');
            assert.isDefined(result);
            getResponseStub.resetBehavior();
        });

        it('should log the error message when service status is not OK', () => {
            getResponseStub.returns({ statusCode: 401 });
            callStub.returns({
                status: 'Error',
                msg: 'authentication error'
            });
            result = AdyenMgr.Refund('testrefNo', 200, 'EUR', '', orderMock, 'Damage');
            assert.isDefined(result);
        });
    });

    describe('Testing method: sendRefundNotifyMail', () => {
        it('should return error status when AdyenNotifyEmail preference is empty', () => {
            getCustomPreferenceValueStub.withArgs('AdyenNotifyEmail').returns('');
            result = AdyenMgr.SendRefundNotifyMail({}, '', 'refund', {});
            assert.isDefined(result);
            getCustomPreferenceValueStub.withArgs('AdyenNotifyEmail').resetBehavior();
        });

        it('should return the sent mail status when AdyenNotifyEmail preference not empty ', () => {
            getCustomPreferenceValueStub.withArgs('AdyenNotifyEmail').returns({});
            result = AdyenMgr.SendRefundNotifyMail({}, '', 'refund', {});
            assert.isDefined(result);
        });
    });
});
