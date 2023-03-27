'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;
var sinon = require('sinon');

var getCustomPreferenceValueStub = sinon.stub();
var getCustomObjectStub = sinon.stub();
var sendMock = sinon.stub();

var customObjectName = 'test_object_name';

var paramObj = {
    emailTypeID: 'test_id',
    emailID: 'test_mail@gmail.com',
    orderID: 'ORD4356',
    serviceStatus: 'Error'
};

var orderMock = {
    customerEmail: 'test_mail@gmail.com',
    orderNo: 'ORD4356',
    getOrderNo: () => 'ORD4356'
};

global.empty = (data) => {
    return !data;
};

describe('app_ua_emea/cartridge/scripts/helpers/SFMCEmailHelper.js', () => {
    var result;
    var SFMCEmailHelper = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/helpers/SFMCEmailHelper.js', {
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        'dw/object/CustomObjectMgr': {
            getCustomObject: getCustomObjectStub,
            createCustomObject: () => { return { custom: {} }; },
            getAllCustomObjects: () => { return { count: 10 }; }
        },
        'dw/system/Site': {
            current: {
                preferences: {
                    custom: {
                        EnableMCFailedEmailQueue: true,
                        MarketingCloudCOLimit: true
                    }
                },
                getCustomPreferenceValue: getCustomPreferenceValueStub
            }
        },
        '*/cartridge/scripts/helpers/emailHelpers': {
            emailTypes: {
                passwordChanged: 'password Changed',
                returnOrderCreated: 'return Order Created',
                refundConfirmation: 'refund Confirmation',
                shipmentConfirmation: 'shipment Confirmation'
            }
        },
        '*/cartridge/modules/providers': { get() { return { send: sendMock }; } }
    });

    describe('Testing method: createCustomObjectFailedEamilTriggers', () => {
        it('should create new custom object if no custom object available for given name and key', () => {
            getCustomObjectStub.returns(null);
            result = SFMCEmailHelper.createCustomObjectFailedEamilTriggers(customObjectName, paramObj);
            assert.isUndefined(result);
            getCustomObjectStub.reset();
        });

        it('should update the if custom object available for given name and key', () => {
            getCustomObjectStub.returns({ custom: { RetryCount: 1 } });
            result = SFMCEmailHelper.createCustomObjectFailedEamilTriggers(customObjectName, paramObj);
            assert.isUndefined(result);
            getCustomObjectStub.returns({ custom: { RetryCount: 0 } });
            result = SFMCEmailHelper.createCustomObjectFailedEamilTriggers(customObjectName, paramObj);
        });

        it('should not update the custom object when service status is OK', () => {
            paramObj.serviceStatus = 'OK';
            result = SFMCEmailHelper.createCustomObjectFailedEamilTriggers(customObjectName, paramObj);
            assert.isUndefined(result);
        });
    });

    describe('Testing method :sendShipmentConfirmationEmail', () => {
        it('checking the behaviour when mail sent response is Ok or not', () => {
            sendMock.returns({ status: 'OK', data: {} });
            result = SFMCEmailHelper.sendShipmentConfirmationEmail(orderMock, paramObj);
            assert.isDefined(result);
            sendMock.reset();
            sendMock.returns({ status: 'Error', data: {} });
            result = SFMCEmailHelper.sendShipmentConfirmationEmail(orderMock, paramObj);
            assert.isDefined(result);
        });

        it('checking the behaviour when EnableMCFailedEmailQueue preference value is true', () => {
            getCustomPreferenceValueStub.withArgs('EnableMCFailedEmailQueue').returns(true);
            result = SFMCEmailHelper.sendShipmentConfirmationEmail(orderMock, paramObj);
            assert.isDefined(result);
        });

        it('should log the error message when customObjIterator.count is more than marketingCloudCOLimit ', () => {
            getCustomPreferenceValueStub.withArgs('MarketingCloudCOLimit').returns(9);
            result = SFMCEmailHelper.sendShipmentConfirmationEmail(orderMock, paramObj);
            assert.isDefined(result);
        });
    });

    it('Testing Method : sendRefundConfirmationEmail', () => {
        sendMock.returns({ status: 'OK' });
        result = SFMCEmailHelper.sendRefundConfirmationEmail(orderMock, paramObj);
        assert.isDefined(result);
    });

    it('Testing Method : sendReturnConfirmationEmail', () => {
        result = SFMCEmailHelper.sendReturnConfirmationEmail(orderMock, paramObj);
        assert.isDefined(result);
    });

    it('Testing Method : sendPasswordResetConfirmationEmail', () => {
        result = SFMCEmailHelper.sendPasswordResetConfirmationEmail({ profile: { email: 'test@gmail.com' } });
        assert.isDefined(result);
    });
});
