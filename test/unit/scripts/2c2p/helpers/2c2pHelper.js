'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var sinon = require('sinon');
var Order = require('../../../../mocks/dw/dw_order_Order');

// stubs
var getOrderStub = sinon.stub();
var getTransactionInquiryStub = sinon.stub();
var isTransactionSuccessStub = sinon.stub();
var getCustomPreferenceValueStub = sinon.stub();
var failOrderSpy = sinon.spy();

describe('int_2c2p/cartridge/scripts/helpers/2c2pHelper.js', () => {
    var order;
    var helper2c2p = proxyquire('../../../../../cartridges/int_2c2p/cartridge/scripts/helpers/2c2pHelper.js', {

        'dw/crypto/Encoding': {
            toBase64() {
                return 'encoded=true';
            }
        },
        'dw/util/StringUtils': {
            encodeBase64(str) {
                return str;
            },
            decodeBase64(str) {
                return str;
            },
            formatCalendar(calander) {
                return calander;
            }
        },
        '*/cartridge/scripts/logs/2c2p': {
            writelog(str) {
                return str;
            },
            LOG_TYPE: {
                DEBUG: 'DEBUG',
                ERROR: 'ERROR'
            }
        },
        'dw/crypto/Mac': function () {
            this.digest = () => {
                return 'test string';
            };
        },
        '*/cartridge/scripts/config/2c2Prefs': {
            secret: 'secret key',
            configuration2C2P: '{}'
        },
        'dw/util/Calendar': function () {
            this.parseByFormat = () => { };
        },
        'dw/order/OrderMgr': {
            getOrder: getOrderStub,
            failOrder: failOrderSpy
        },
        'dw/order/Order': Order,
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        '*/cartridge/scripts/helpers/serviceHelper': {
            getTransactionInquiry: getTransactionInquiryStub,
            isTransactionSuccess: isTransactionSuccessStub
        },
        'dw/order/PaymentMgr': {
            getPaymentMethod() {
                return {
                    getPaymentProcessor() {

                    }
                };
            }
        },
        '*/cartridge/scripts/checkout/checkoutHelpers': {
            placeOrder() {

            },
            sendConfirmationEmail() {

            }
        },
        'dw/system/Site': {
            getCurrent() {
                return { getCustomPreferenceValue: getCustomPreferenceValueStub };
            }
        },
        'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
        '*/cartridge/scripts/config/ordermapping': {
            default: {
                paymentChannel: 'test channel',
                paymentType: 'test type'
            }
        },
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/web/Resource': {
            msg: function () {
                return 'someString';
            },
            msgf: function () {
                return 'someString';
            }
        }
    });

    var result;
    it('Testing method: encrypt :should return encrypted data for given payload', () => {
        result = helper2c2p.encrypt('{"data":"HS256","status":"ok"}');
        assert.isDefined(result);
    });

    it('Testing method: decrypt :should return null when empty data passed to the function', () => {
        result = helper2c2p.decrypt('');
        assert.isDefined(result);
        assert.isNull(result);
    });

    it('Testing method: decrypt :should return decrypted data from the encrypted data', () => {
        result = helper2c2p.decrypt('testdata=kjdsdf.status=ok.encoded=true');
        assert.isDefined(result);
    });

    describe('Testing method: updateOrderDetails', () => {
        order = new Order();
        var responseObj = {
            invoiceNo: 'ord123',
            transactionDateTime: new Date()
        };
        it('should return false when order is not available for invoiceNo', () => {
            getOrderStub.withArgs('ord123').returns(null);
            result = helper2c2p.updateOrderDetails(responseObj);
            assert.isDefined(result);
            assert.isFalse(result);
            getOrderStub.reset();
        });

        it('should return false when order status is open', () => {
            getOrderStub.withArgs('ord123').returns({
                status: {
                    value: Order.ORDER_STATUS_OPEN
                }
            });
            result = helper2c2p.updateOrderDetails(responseObj);
            assert.isDefined(result);
            assert.isFalse(result);
        });

        it('should return true and fail the order when Transaction is failed', () => {
            isTransactionSuccessStub.returns(false);
            getOrderStub.withArgs('ord123').returns({
                status: {
                    value: Order.EXPORT_STATUS_READY
                }
            });
            result = helper2c2p.updateOrderDetails(responseObj);
            assert.isDefined(result);
            assert.isTrue(result);
            assert.isTrue(failOrderSpy.calledOnce);
            failOrderSpy.reset();
            getOrderStub.reset();
        });

        it('should return update the order object when transaction is sucsess', () => {
            isTransactionSuccessStub.returns(true);
            order.getPaymentInstruments = () => {
                return [{
                    paymentTransaction: { setTransactionID() { }, setPaymentProcessor() { } }
                }];
            };
            order.status.value = Order.ORDER_STATUS_CREATED;
            getOrderStub.withArgs('ord123').returns(order);
            result = helper2c2p.updateOrderDetails(responseObj);
            assert.isDefined(result);
            assert.isTrue(result);
            getOrderStub.reset();
        });

        it('should change the order Confirmation email status when it\'s sent through job ', () => {
            getCustomPreferenceValueStub.withArgs('isSetOrderConfirmationEmailStatusForJob').returns(true);
            order.custom.orderConfirmationEmailStatus = { value: 'NEW' };
            getOrderStub.withArgs('ord123').returns(order);
            result = helper2c2p.updateOrderDetails(responseObj);
            assert.isDefined(result);
            assert.isTrue(result);
            getOrderStub.reset();
        });

        it('should return false when order status is exported ', () => {
            order.status.value = Order.EXPORT_STATUS_EXPORTED;
            order.exportStatus.value = Order.EXPORT_STATUS_EXPORTED;
            getOrderStub.withArgs('ord123').returns(order);
            result = helper2c2p.updateOrderDetails(responseObj);
            assert.isDefined(result);
            assert.isFalse(result);
            getOrderStub.reset();
        });

        it('should log the error when parse occured inside the function', () => {
            let helpers2c2p = proxyquire('../../../../../cartridges/int_2c2p/cartridge/scripts/helpers/2c2pHelper.js', {

                'dw/crypto/Encoding': {
                    toBase64() {
                        return 'encoded=true';
                    }
                },
                'dw/util/StringUtils': {
                    encodeBase64(str) {
                        return str;
                    },
                    decodeBase64(str) {
                        return str;
                    },
                    formatCalendar(calander) {
                        return calander;
                    }
                },
                '*/cartridge/scripts/logs/2c2p': {
                    writelog(str) {
                        return str;
                    },
                    LOG_TYPE: {
                        DEBUG: 'DEBUG',
                        ERROR: 'ERROR'
                    }
                },
                'dw/crypto/Mac': function () {
                    this.digest = () => {
                        return 'test string';
                    };
                },
                '*/cartridge/scripts/config/2c2Prefs': {
                    secret: 'secret key',
                    configuration2C2P: 'error string'
                },
                'dw/util/Calendar': function () {
                    this.parseByFormat = () => { };
                },
                'dw/order/OrderMgr': {
                    getOrder: getOrderStub,
                    failOrder: failOrderSpy
                },
                'dw/order/Order': Order,
                'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
                '*/cartridge/scripts/helpers/serviceHelper': {
                    getTransactionInquiry: getTransactionInquiryStub,
                    isTransactionSuccess: isTransactionSuccessStub
                },
                'dw/order/PaymentMgr': {
                    getPaymentMethod() {
                        return {
                            getPaymentProcessor() {

                            }
                        };
                    }
                },
                '*/cartridge/scripts/checkout/checkoutHelpers': {
                    placeOrder() {

                    },
                    sendConfirmationEmail() {

                    }
                },
                'dw/system/Site': {
                    getCurrent() {
                        return { getCustomPreferenceValue: getCustomPreferenceValueStub };
                    }
                },
                'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
                '*/cartridge/scripts/config/ordermapping': {
                    default: {
                        paymentChannel: 'test channel',
                        paymentType: 'test type'
                    }
                },
                'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
                'dw/web/Resource': {
                    msg: function () {
                        return 'someString';
                    },
                    msgf: function () {
                        return 'someString';
                    }
                }
            });
            order.exportStatus.value = Order.ORDER_STATUS_NEW;
            order.custom.orderConfirmationEmailStatus = '';
            getOrderStub.withArgs('ord123').returns(order);
            result = helpers2c2p.updateOrderDetails(responseObj);
            assert.isDefined(result);
            assert.isTrue(result);
            getOrderStub.reset();
        });
    });

    describe('Testing method: getRedirectURL', () => {
        it('cheking the behaviour of the function when order status is created', () => {
            order.status.value = Order.ORDER_STATUS_CREATED;
            getTransactionInquiryStub.returns({ invoiceNo: 'ord234' });
            result = helper2c2p.getRedirectURL(order);
            assert.isDefined(result);
            isTransactionSuccessStub.returns(false);
            result = helper2c2p.getRedirectURL(order);
            assert.isDefined(result);
            isTransactionSuccessStub.throws(new Error('unknown error'));
            result = helper2c2p.getRedirectURL(order);
            assert.isDefined(result);
        });

        it('should return the Checkout-Begin redirect url when order status is failed', () => {
            order.status.value = Order.ORDER_STATUS_FAILED;
            result = helper2c2p.getRedirectURL(order);
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isTrue(result.indexOf('Checkout-Begin') > -1);
        });
    });

    it('should return redirect url l when order status is new', () => {
        order.status.value = Order.ORDER_STATUS_NEW;
        result = helper2c2p.getRedirectURL(order);
        assert.isDefined(result);
        assert.isNotNull(result);
    });

    it('should return the Order-Confirm redirect url when order status in open', () => {
        order.status.value = Order.ORDER_STATUS_OPEN;
        result = helper2c2p.getRedirectURL(order);
        assert.isDefined(result);
        assert.isNotNull(result);
        assert.isTrue(result.indexOf('Order-Confirm') > -1);
    });

    it('should return null when order status is empty', () => {
        order.status.value = '';
        result = helper2c2p.getRedirectURL(order);
        assert.isDefined(result);
        assert.isNull(result);
    });
});
