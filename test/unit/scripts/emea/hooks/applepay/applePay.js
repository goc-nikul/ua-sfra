'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;
var sinon = require('sinon');
var ArrayList = require('../../../../../mocks/scripts/util/dw.util.Collection');
var OrderMock = require('../../../../../mocks/dw/dw_order_Order');

var order = new OrderMock();

order.getPaymentInstruments = () => {
    return new ArrayList([{
        getPaymentMethod() { return 'CREDIT_CARD'; },
        custom: {}
    }, {
        getPaymentMethod() { return 'APPLE_PAY'; },
        custom: {}
    }]);
};

order.setCustomerEmail = () => { };
order.shipments.addAll(new ArrayList([{
    id: 'std',
    gift: true,
    giftMessage: 'test message',
    getProductLineItems() {
        return [{}];
    }
}, {
    id: 'exp',
    gift: true,
    giftMessage: '',
    getProductLineItems() {
        return [{}];
    }
}]));

// stub
var getCustomPreferenceValueStub = sinon.stub();
var hasHookStub = sinon.stub();
var callHookstub = sinon.stub();
var validateInputFieldsStub = sinon.stub();

// applepayhelper stubs
var removeEmojisStub = sinon.stub();
var isEmptyFieldPassedStub = sinon.stub();
var validatePostalStub = sinon.stub();
var formatPhoneNumberStub = sinon.stub();
var getApplicableShippingMethodsStub = sinon.stub();
var getResponseObjectStub = sinon.stub();
var getSavedPaazlShippingOptionStub = sinon.stub();
var parseStub = sinon.stub();


// stub returns
hasHookStub.returns(true);
callHookstub.returns({ error: false });
formatPhoneNumberStub.returns(987646287265);
removeEmojisStub.returns(true);
isEmptyFieldPassedStub.returns(false);
validatePostalStub.returns(false);
validateInputFieldsStub.returns({ error: false });


var eventMock = {
    payment: {
        shippingContact: {
            phoneNumber: 987646287265,
            countryCode: 'eu'
        },
        billingContact: {
            administrativeArea: '',
            countryCode: 'eu',
            addressLines: ['address1', 'address2']
        }
    }
};

describe('app_ua_emea/cartridge/scripts/hooks/applePay/applePay.js', () => {
    global.request = {};

    var applePayHook = proxyquire('../../../../../../cartridges/app_ua_emea/cartridge/scripts/hooks/applePay/applePay.js', {
        'dw/system/Status': require('../../../../../mocks/dw/dw_system_Status'),
        'dw/system/Transaction': require('../../../../../mocks/dw/dw_system_Transaction'),
        'dw/util/StringUtils': require('../../../../../mocks/dw/dw_util_StringUtils'),
        'dw/extensions/applepay/ApplePayHookResult': function () { },
        'dw/system/Site': {
            current: {
                ID: 'UKIE',
                getCustomPreferenceValue: getCustomPreferenceValueStub
            }
        },
        '*/cartridge/scripts/helpers/applePayHelper': {
            removeEmojis: removeEmojisStub,
            isEmptyFieldPassed: isEmptyFieldPassedStub,
            validatePostal: validatePostalStub,
            formatPhoneNumber: formatPhoneNumberStub,
            getApplicableShippingMethods: getApplicableShippingMethodsStub,
            getResponseObject: getResponseObjectStub
        },
        'app_ua_core/cartridge/scripts/hooks/applePay/applePay': {},
        '*/cartridge/scripts/util/collections': require('../../../../../mocks/scripts/util/collections'),
        '*/cartridge/scripts/checkout/checkoutHelpers': { updateStateCode() { }, updatePostalCode() { }, autoCorrectPhonenumber() { }, validateInputFields: validateInputFieldsStub },
        'dw/system/HookMgr': {
            hasHook: hasHookStub,
            callHook: callHookstub
        },
        'dw/system/Logger': require('../../../../../mocks/dw/dw_system_Logger'),
        '*/cartridge/scripts/util/SetOrderStatus': { setCustomerName() { } },
        '*/cartridge/modules/providers': {
            get() {
                return {
                    addressType() {

                    }
                };
            }
        }
    });

    var result;
    describe('Testing method : authorizeOrderPayment', () => {
        it('should log the error message when order is null or empty', () => {
            result = applePayHook.authorizeOrderPayment(null, eventMock);
            assert.isDefined(result);
            result = applePayHook.authorizeOrderPayment('', eventMock);
            assert.isDefined(result);
        });

        it('should store the Payment Instrument\'s payment methods to order object custom attribute', () => {
            order.getPaymentInstruments = () => null;
            result = applePayHook.authorizeOrderPayment(order, eventMock);
            assert.isDefined(result);
            order.getPaymentInstruments = () => {
                return new ArrayList([{
                    getPaymentMethod() { return 'CREDIT_CARD'; },
                    custom: {}
                }, {
                    getPaymentMethod() { return 'APPLE_PAY'; },
                    custom: {}
                }]);
            };
            result = applePayHook.authorizeOrderPayment(order, eventMock);
            assert.isDefined(result);
        });

        it('should not call the hook if the hook is unavailable', () => {
            callHookstub.reset();
            hasHookStub.withArgs('dw.order.setDeliveryEstimateDate').returns(false);
            result = applePayHook.authorizeOrderPayment(order, eventMock);
            assert.isDefined(result);
            assert.isTrue(callHookstub.withArgs('dw.order.setDeliveryEstimateDate').notCalled);
        });

        it('should return the error message when emoji\'s are any special character text cannot be removed from shipping, billing address fields', () => {
            removeEmojisStub.withArgs(order).returns(false);
            result = applePayHook.authorizeOrderPayment(order, eventMock);
            assert.isDefined(result);
            removeEmojisStub.withArgs(order).returns(true);
        });

        it('should return the error message when firstName or lastName fields are empty in shipping, billing address fields', () => {
            isEmptyFieldPassedStub.withArgs(order.getBillingAddress(), ['firstName', 'lastName']).returns(true);
            result = applePayHook.authorizeOrderPayment(order, eventMock);
            assert.isDefined(result);
            isEmptyFieldPassedStub.reset();
            isEmptyFieldPassedStub.withArgs(order.getBillingAddress(), ['firstName', 'lastName']).returns(false);
        });

        it('should return the error message when city is empty in shipping, billing address fields', () => {
            isEmptyFieldPassedStub.withArgs(order.getBillingAddress(), ['city']).returns(true);
            result = applePayHook.authorizeOrderPayment(order, eventMock);
            assert.isDefined(result);
            isEmptyFieldPassedStub.reset();
            isEmptyFieldPassedStub.withArgs(order.getBillingAddress(), ['city']).returns(false);
        });

        it('should return the error message when postalCode is not valid in shipping, billing address fields', () => {
            eventMock.payment.billingContact.administrativeArea = 'test area';
            validatePostalStub.withArgs(order.billingAddress.postalCode).returns(true);
            result = applePayHook.authorizeOrderPayment(order, eventMock);
            assert.isDefined(result);
            validatePostalStub.withArgs(order.billingAddress.postalCode).returns(false);
        });

        it('should set the phone number  from event object when formatted PhoneNumber is not available', () => {
            formatPhoneNumberStub.returns('');
            result = applePayHook.authorizeOrderPayment(order, eventMock);
            assert.isDefined(result);
            formatPhoneNumberStub.reset();
        });

        it('should return error status when inputFieldsValidation error is present in in shipping, billing, giftMessage and contact info', () => {
            validateInputFieldsStub.returns({ error: true });
            result = applePayHook.authorizeOrderPayment(order, eventMock);
            assert.isDefined(result);
            validateInputFieldsStub.returns({ error: false });
        });

        it('should return error status when country code is not available in billing address', () => {
            order.getBillingAddress().getCountryCode = () => {
                return {};
            };
            result = applePayHook.authorizeOrderPayment(order, eventMock);
            assert.isDefined(result);
            order.getBillingAddress().getCountryCode = () => {
                return { displayValue: 'EU', value: 'EU' };
            };
        });

        it('should return error status when country code is not available in shipping address', () => {
            delete order.getDefaultShipment().getShippingAddress().getCountryCode().value;
            result = applePayHook.authorizeOrderPayment(order, eventMock);
            assert.isDefined(result);
            order.getDefaultShipment().getShippingAddress().getCountryCode().value = 'EU';
        });

        it('should return error status when error occures while calling the hook', () => {
            callHookstub.returns({ error: true });
            result = applePayHook.authorizeOrderPayment(order, eventMock);
            assert.isDefined(result);
            order.getPaymentInstruments = () => {
                return new ArrayList([]);
            };
            result = applePayHook.authorizeOrderPayment(order, eventMock);
            assert.isDefined(result);
        });

        it('should call authorizeOrderPayment from core if the site ID is not EU and UKIE', () => {
            applePayHook = proxyquire('../../../../../../cartridges/app_ua_emea/cartridge/scripts/hooks/applePay/applePay.js', {
                'dw/system/Status': require('../../../../../mocks/dw/dw_system_Status'),
                'dw/system/Transaction': require('../../../../../mocks/dw/dw_system_Transaction'),
                'dw/util/StringUtils': require('../../../../../mocks/dw/dw_util_StringUtils'),
                'dw/extensions/applepay/ApplePayHookResult': function () { },
                'dw/system/Site': {
                    current: {
                        ID: 'US'
                    }
                },
                'dw/system/Logger': require('../../../../../mocks/dw/dw_system_Logger'),
                '*/cartridge/scripts/helpers/applePayHelper': {},
                'app_ua_core/cartridge/scripts/hooks/applePay/applePay': {
                    authorizeOrderPayment: () => { return 'core auth'; },
                    getRequest: () => { return {}; }
                }
            });

            result = applePayHook.authorizeOrderPayment(order, eventMock);
            assert.isDefined(result);
            assert.equal(result, 'core auth');
        });
    });

    describe('Testing method: getRequest ', () => {
        global.session = {
            custom: {
            }
        };

        var pickupPointAddress = {
            lastName: 'Test name',
            address1: 'test address',
            address2: 'test',
            streetNumberSuffix: 'test',
            city: 'city',
            postalCode: '56467',
            state: 'CA',
            countryCode: 'EU'
        };

        var getPaazlShippingModelStub = sinon.stub();

        getPaazlShippingModelStub.returns({ shippingAddress: order.defaultShipment.shippingAddress });
        getApplicableShippingMethodsStub.returns({ applicableShippingMethodsObject: {} });


        it('should call getRequest when site id neither EU nor UKIE', () => {
            result = applePayHook.getRequest(order, {});
            assert.isDefined(result);
        });

        it('should log the error message when unknown exption occured', () => {
            applePayHook = proxyquire('../../../../../../cartridges/app_ua_emea/cartridge/scripts/hooks/applePay/applePay.js', {
                'dw/system/Status': require('../../../../../mocks/dw/dw_system_Status'),
                'dw/system/Transaction': require('../../../../../mocks/dw/dw_system_Transaction'),
                'dw/util/StringUtils': require('../../../../../mocks/dw/dw_util_StringUtils'),
                'dw/extensions/applepay/ApplePayHookResult': function () { },
                'dw/system/Site': {
                    current: {
                        ID: 'UKIE',
                        getCustomPreferenceValue: getCustomPreferenceValueStub
                    }
                },
                'dw/system/Logger': require('../../../../../mocks/dw/dw_system_Logger'),
                '*/cartridge/scripts/helpers/applePayHelper': {
                    getApplicableShippingMethods: getApplicableShippingMethodsStub,
                    getResponseObject: getResponseObjectStub
                },
                'app_ua_core/cartridge/scripts/hooks/applePay/applePay': {
                    authorizeOrderPayment: () => { return 'core auth'; },
                    getRequest: () => { return {}; }
                },
                '*/cartridge/scripts/helpers/paazlHelper': {
                    getSavedPaazlShippingOption: getSavedPaazlShippingOptionStub,
                    getPaazlShippingModel: getPaazlShippingModelStub
                },
                'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
                'dw/util/Locale': require('../../../../../mocks/dw/dw_util_Locale'),
                '*/cartridge/scripts/util/JSONUtils': { parse: parseStub }
            });
            getCustomPreferenceValueStub.withArgs('applePaySupportedNetworks').returns('test networks');
            parseStub.returns({ EU: 'EU' });

            order.defaultShipment.custom.paazlDeliveryInfo = 'test info';
            getSavedPaazlShippingOptionStub.throwsException(new Error('unknown error'));
            result = applePayHook.getRequest(order, {});
            assert.isDefined(result);
            getSavedPaazlShippingOptionStub.reset();
        });

        it('checking the behaviour of the function when delivery type is PICKUP_LOCATION', () => {
            order.customerEmail = '';
            getSavedPaazlShippingOptionStub.returns({ deliveryType: 'PICKUP_LOCATION' });
            result = applePayHook.getRequest(order, {});
            assert.isDefined(result);

            getPaazlShippingModelStub.returns({ shippingAddress: pickupPointAddress });
            result = applePayHook.getRequest(order, {});
            assert.isDefined(result);
            getSavedPaazlShippingOptionStub.resetBehavior();
        });

        it('checking the behaviour when shipping address  and it\'s values are null or empty', () => {
            order.customer.authenticated = true;
            order.defaultShipment.shippingAddress = {
                firstName: null,
                lastName: null,
                address2: null,
                phone: null,
                city: null,
                postalCode: null,
                stateCode: null,
                countryCode: {
                    value: '',
                    displayValue: ''
                },
                address1: ''
            };
            result = applePayHook.getRequest(order, {});
            assert.isDefined(result);
            order.defaultShipment.shippingAddress = null;
            result = applePayHook.getRequest(order, {});
            assert.isDefined(result);
        });

        it('should not call parse method when applePaySupportedNetworks preference is empty', () => {
            parseStub.reset();
            getCustomPreferenceValueStub.withArgs('applePaySupportedNetworks').returns('');
            result = applePayHook.getRequest(order, {});
            assert.isDefined(result);
            assert.isTrue(parseStub.notCalled);
        });

        it('should not set shippingMethods to request ApplicableShippingMethods are empty', () => {
            getApplicableShippingMethodsStub.reset();
            getApplicableShippingMethodsStub.returns('');
            result = applePayHook.getRequest(order, {});
            assert.isDefined(result);
            assert.isNotNull(result);
        });

        it('should set total and lineitems to request responseObject is not empty', () => {
            order.defaultShipment.custom.paazlDeliveryInfo = '';
            getResponseObjectStub.returns({
                lineItems: 'test items',
                total: 3
            });
            result = applePayHook.getRequest(order, {});
            assert.isDefined(result);
            assert.isNotNull(result);
            getResponseObjectStub.reset();
        });

        it('should return errro status when unknown exception occured', () => {
            getResponseObjectStub.throwsException(new Error('unknown error'));
            result = applePayHook.getRequest(order, {});
            assert.isDefined(result);
            assert.isNotNull(result);
            getResponseObjectStub.reset();
        });
    });
});
