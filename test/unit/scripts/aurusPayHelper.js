'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../mockModuleSuperModule');
var baseAccountModelMock = require('./baseModel');

// Path to scripts
var pathToCartridges = '../../../cartridges/';
var pathToLinkScripts = pathToCartridges + 'int_aurus_custom/cartridge/scripts/';

// Path to test scripts
var pathToCoreMock = '../../mocks/';

class Calendar {
    constructor(date) {
        this.date = date;
        this.DATE = 5;
        this.DAY_OF_WEEK = 7;
        this.SATURDAY = 7;
        this.SUNDAY = 1;
    }

    add(field, value) {
        if (field === this.DATE) {
            this.date.setDate(this.date.getDate() + value);
        }
    }

    before() {
        return false;
    }

    toTimeString() {
        return this.date ? this.date.toDateString() : '';
    }

    get() {
        return 2;
    }
}

mockSuperModule.create(baseAccountModelMock);

describe('Aurus: util/aurusPayHelper test', () => {

    var aurusPayHelper = proxyquire(pathToLinkScripts + 'util/aurusPayHelper', {
        'dw/system/Site': require(pathToCoreMock + 'dw/dw_system_Site'),
        'dw/web/URLUtils': require(pathToCoreMock + 'dw/dw_web_URLUtils'),
        'dw/system/Transaction': require(pathToCoreMock + 'dw/dw_system_Transaction'),
        'dw/system/Logger': require(pathToCoreMock + 'dw/dw_system_Logger'),
        'dw/order/Order': require(pathToCoreMock + 'dw/dw_order_Order'),
        'dw/util/StringUtils': require(pathToCoreMock + 'dw/dw_util_StringUtils'),
        'dw/util/Calendar': Calendar,
        '*/cartridge/scripts/util/collections': require(pathToCoreMock + 'util/collections'),
        'dw/order/PaymentMgr': require(pathToCoreMock + 'dw/dw_order_PaymentMgr'),
        'dw/system/HookMgr': require(pathToCoreMock + 'dw/dw_system_HookMgr'),
        '*/cartridge/scripts/services/aurusPayServices': {
            getSessionService: function() {
                return {
                    call : function() {
                        return {
                            ok: true,
                            object: {
                                text: require(pathToCoreMock + 'scripts/aurusPayHelper').getSessionService()
                            }
                        }
                    }
                }
            },
            getBillingToken: function() {
                return {
                    call : function() {
                        return {
                            ok: true,
                            object: {
                                text: require(pathToCoreMock + 'scripts/aurusPayHelper').getBillingToken()
                            }
                        }
                    }
                }
            },
        },
        'app_ua_core/cartridge/scripts/checkout/shippingHelpers': {
            getApplicableShippingMethods: function() {
                return {
                    length: 0
                }
            }
        },
        '*/cartridge/scripts/util/loggerHelper.js': {
            maskPIIAuruspayInfo: () => ''
        },
    });

    it('Testing method: createSessionReqBody', () => {
        // Prepare Request
        var Customer = require(pathToCoreMock + 'dw/dw_customer_Customer');
        var req = {
            currentCustomer : {
                raw: new Customer()
            }
        }
        global.session = {
            custom: {}
        };
        // Create new session request Body
        var sessionReqBody = aurusPayHelper.getSessionReqBody(req, '');
        var mockSessionReqBody = require(pathToCoreMock + 'scripts/aurusPayHelper').getSessionReqBody();

        // Check sessionReqBody
        assert.equal(sessionReqBody, JSON.stringify(mockSessionReqBody));
    });

    it('Testing method: getAltPaymentsConsumerObject', () => {
        // Prepare Request
        var req = {
            querystring: {
                sessionID: 'test'
            },
            locale: {
                id: 'en_US'
            }
        }
        // create a basket
        var Basket = require(pathToCoreMock + 'dw/dw_order_Basket');
        var basket = new Basket();
        // Create Alt Payments Consumer Object
        var consumerObject = aurusPayHelper.getAltPaymentsConsumerObject(req, basket);
        var mockConsumerObject = require(pathToCoreMock + 'scripts/aurusPayHelper').getMockConsumerObject();

        // Check sessionReqBody
        assert.equal(JSON.stringify(consumerObject), JSON.stringify(mockConsumerObject));
    });

    it('Testing method: returnFromPaypal', () => {
        // Prepare request
        var req = {
            querystring: {
                sessionTokenResponse: require(pathToCoreMock + 'scripts/aurusPayHelper').getMockSessionTokenResponseForPaypal(),
                isFromCart: false
            },
        }
        // create a basket
        var Basket = require(pathToCoreMock + 'dw/dw_order_Basket');
        var basket = new Basket();
        // create Paypal payment Instrument
        var Money = require(pathToCoreMock + 'dw/dw_value_Money');
        basket.createPaymentInstrument('PayPal', new Money(5));
        // Create Alt Payments Consumer Object
        var consumerObject = aurusPayHelper.returnFromPaypal(basket, req);
        var sessionTokenResponse = JSON.parse(req.querystring.sessionTokenResponse);

        assert.equal(sessionTokenResponse.GetSessionTokenResponse.ECOMMInfo.OneTimeToken, consumerObject.ott);
        assert.equal(sessionTokenResponse.GetSessionTokenResponse.Pay_Wallet, consumerObject.payWallet);
    });

    it('Testing method: getSessionService', () => {
        // Create Alt Payments Consumer Object
        // Prepare request
        var req = {
            currentCustomer: {
                raw: {
                    authenticated: true,
                    registered: true
                },
                wallet: {
                    paymentInstruments: [{
                        UUID: '123456',
                        creditCardExpirationYear: '22',
                        creditCardExpirationMonth: '08',
                        creditCardNumber: '41111111111111111',
                        creditCardType: 'VISA',
                        raw: {
                            creditCardToken: '12345'
                        }
                    }]
                }
            }
        }

        var sessionService = aurusPayHelper.getSessionService(req, '123456', false);

        assert.isNotNull(sessionService);
        assert.equal(sessionService.ok, true);
        assert.isNotNull(sessionService.object);
        assert.isNotNull(sessionService.object.text);
        var serviceResponse = JSON.parse(sessionService.object.text);

        assert.equal(serviceResponse.SessionResponse.AlternatePaymentMatrix, '00010010001001000000000000000000');
        assert.equal(serviceResponse.SessionResponse.SessionId, '200000000000000000000023948345');
    });

    it('Testing method: getBillingToken', () => {
        var billingToken = aurusPayHelper.getBillingToken({
            payment: 'paypal',
            shippingAddress: {
                address1: '15 South Point Drive',
                address2: null,
                city: 'Boston',
                countryCode: {
                    displayValue: 'United States',
                    value: 'US'
                },
                firstName: 'John',
                lastName: 'Snow',
                ID: 'Home',
                phone: '123-123-1234',
                postalCode: '02125',
                stateCode: 'MA'
            },
            currency: 'USD',
            amount: 500,
            sessionId: '2000000000000023948345'
        });

        assert.isNotNull(billingToken);
        assert.equal(billingToken.ok, true);
        assert.isNotNull(billingToken.object);
        assert.isNotNull(billingToken.object.text);

        var billingTokenResponse = JSON.parse(billingToken.object.text);

        assert.isNotNull(billingTokenResponse.GetBillerTokenResponse);
        assert.isNotNull(billingTokenResponse.GetBillerTokenResponse.WalletObject);
        assert.equal(billingTokenResponse.GetBillerTokenResponse.ProcessorReferenceNumber, '0ebdf66a-f35c-4898-87b4-1c7eddf7ac96');
        assert.equal(billingTokenResponse.GetBillerTokenResponse.ResponseText, 'APPROVAL');
    });

});