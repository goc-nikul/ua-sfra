'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../mockModuleSuperModule');
var baseAccountModelMock = require('./baseModel');

var currentCustomer = {
    addressBook: {
        addresses: {}
    },
    customer: {},
    profile: {
        firstName: 'John',
        lastName: 'Snow',
        email: 'jsnow@starks.com'
    },
    wallet: {
        paymentInstruments: [{
            raw: {
                creditCardExpirationMonth: '3',
                creditCardExpirationYear: '2019',
                maskedCreditCardNumber: '***********4215',
                creditCardType: 'Visa',
                paymentMethod: 'CREDIT_CARD'
            }
        },
        {
            raw: {
                creditCardExpirationMonth: '4',
                creditCardExpirationYear: '2019',
                maskedCreditCardNumber: '***********4215',
                creditCardType: 'Amex',
                paymentMethod: 'CREDIT_CARD'
            }
        },
        {
            raw: {
                creditCardExpirationMonth: '6',
                creditCardExpirationYear: '2019',
                maskedCreditCardNumber: '***********4215',
                creditCardType: 'Master Card',
                paymentMethod: 'CREDIT_CARD'
            }
        },
        {
            raw: {
                creditCardExpirationMonth: '5',
                creditCardExpirationYear: '2019',
                maskedCreditCardNumber: '***********4215',
                creditCardType: 'Discover',
                paymentMethod: 'CREDIT_CARD'
            }
        }
        ]
    },
    raw: {
        authenticated: true,
        registered: true,
        creditCardToken: 'SomeToken123',
        profile: {
            custom: {
                profilePictureUri: 'profilePictureUri'
            }
        },
        getCustom: () => {
            return {
                internalToken: 'someInternalToken',
                creditCardBinRange: '2',
                defaultPaymentCard: false
            };
        }
    },
    UUID: 'Some UUID'
};


describe('account', () => {
    global.empty = (data) => {
        return !data;
    };
    var HookMgr = require('../../mocks/dw/dw_system_HookMgr');
    mockSuperModule.create(baseAccountModelMock);
    var AddressModel = require('../../../cartridges/storefront-reference-architecture/test/mocks/models/address');
    var AccountModel = proxyquire('../../../cartridges/app_ua_core/cartridge/models/account', {
        '*/cartridge/models/address': AddressModel,
        'dw/web/URLUtils': { staticURL: () => { return 'some URL'; } },
        'dw/order/PaymentMgr': {
            getApplicablePaymentMethods: function getApplicablePaymentMethods() {
                return [{
                    ID: 'GIFT_CERTIFICATE',
                    name: 'Gift Certificate'
                }, {
                    ID: 'CREDIT_CARD',
                    name: 'Credit Card'
                }];
            },
            getPaymentMethod: function getPaymentMethod() {
                return {
                    getApplicablePaymentCards: function getApplicablePaymentCards() {
                        return [{
                            cardType: 'Visa',
                            name: 'Visa',
                            UUID: 'some UUID'
                        }, {
                            cardType: 'Amex',
                            name: 'American Express',
                            UUID: 'some UUID'
                        }, {
                            cardType: 'Master Card',
                            name: 'MasterCard'
                        }, {
                            cardType: 'Discover',
                            name: 'Discover'
                        }];
                    }
                };
            },
            getApplicablePaymentCards: function getApplicablePaymentCards() {
                return ['Visa'];
            },
            getPaymentCard: function getPaymentCard() {
                return {
                    isActive: () => {
                        return false;
                    }
                };
            }
        },
        '*/cartridge/scripts/helpers/accountHelpers': {
            getCardType: () => {
                return {
                    creditCardType: 'Visa',
                    creditCardExpirationMonth: 3,
                    creditCardExpirationYear: 2030,
                    maskedCreditCardNumber: '***********4215'
                };
            }
        },
        '*/cartridge/scripts/utils/PreferencesUtil': {
            getJsonValue: () => {
                return {
                    'Visa': 'Visa',
                    'Amex': 'Amex',
                    'MasterCard': 'Master Card',
                    'Discover': 'Discover'
                };
            }
        },
        'dw/system/HookMgr': HookMgr
    });

    it('should receive customer profile', () => {
        var result = new AccountModel(currentCustomer);
        assert.equal(result.profile.firstName, 'John');
        assert.equal(result.profile.lastName, 'Snow');
        assert.equal(result.profile.email, 'jsnow@starks.com');
        assert.equal(result.profile.profilePictureUri, 'profilePictureUri');
    });

    it('Verify customerPaymentInstruments.length ', () => {
        var result = new AccountModel(currentCustomer);
        assert.equal(result.customerPaymentInstruments.length, 4);
        assert.isTrue(result.customerAllCreditCardsDisable);
        assert.isUndefined(result.profile.phone);
    });

    it('should receive customer payment information from custom profile', () => {
        class HookMgrs {
            constructor() {
                this.hooks = [];
                this.isCalled = false;
            }
            hasHook() {
                return false;
            }
            callHook() {
                this.isCalled = false;
                return this;
            }
            reinit() {
                this.isCalled = false;
                return this;
            }
        }
        currentCustomer.wallet.paymentInstruments = [{
            raw: {
                paymentMethod: 'CREDIT_CARD',
                getCustom: () => {
                    return {
                        internalToken: 'someInternalToken',
                        creditCardBinRange: '2'
                    };
                },
                custom: {
                    defaultPaymentCard: true
                }
            },
            creditCardHolder: 'visaName',
            creditCardExpirationMonth: '3',
            creditCardExpirationYear: '2019',
            maskedCreditCardNumber: '***********4215',
            creditCardType: 'Visa',
            UUID: 'Visa_UUID'
        },
        {
            raw: {
                paymentMethod: 'CREDIT_CARD',
                getCustom: () => {
                    return {
                        internalToken: 'someInternalToken',
                        creditCardBinRange: '2'
                    };
                },
                custom: {
                    defaultPaymentCard: false
                }
            },
            creditCardHolder: 'Amexname',
            creditCardExpirationMonth: '4',
            creditCardExpirationYear: '2019',
            maskedCreditCardNumber: '***********4215',
            creditCardType: 'Amex',
            UUID: 'Amex_UUID'
        },
        {
            raw: {
                paymentMethod: 'CREDIT_CARD',
                getCustom: () => {
                    return {
                        internalToken: 'someInternalToken',
                        creditCardBinRange: '2'
                    };
                },
                custom: {
                    defaultPaymentCard: false
                }
            },
            creditCardHolder: 'MCname',
            creditCardExpirationMonth: '6',
            creditCardExpirationYear: '2019',
            maskedCreditCardNumber: '***********4215',
            creditCardType: 'Master Card',
            UUID: 'MC_UUID'
        },
        {
            raw: {
                paymentMethod: 'CREDIT_CARD',
                getCustom: () => {
                    return {
                        internalToken: 'someInternalToken',
                        creditCardBinRange: '2'
                    };
                },
                custom: {
                    defaultPaymentCard: false
                }
            },
            creditCardHolder: 'DiscoverName',
            creditCardType: 'Discover',
            creditCardExpirationMonth: '5',
            creditCardExpirationYear: '2019',
            maskedCreditCardNumber: '***********4215',
            UUID: 'Discover_UUID'
        }
        ];
        AccountModel = proxyquire('../../../cartridges/app_ua_core/cartridge/models/account', {
            '*/cartridge/models/address': AddressModel,
            'dw/web/URLUtils': { staticURL: () => { return 'some URL'; } },
            'dw/order/PaymentMgr': {
                getApplicablePaymentMethods: function getApplicablePaymentMethods() {
                    return [{
                        ID: 'GIFT_CERTIFICATE',
                        name: 'Gift Certificate'
                    }, {
                        ID: 'CREDIT_CARD',
                        name: 'Credit Card'
                    }];
                },
                getPaymentMethod: function getPaymentMethod() {
                    return {
                        getApplicablePaymentCards: function getApplicablePaymentCards() {
                            return [{
                                cardType: 'Visa',
                                name: 'Visa',
                                UUID: 'some UUID'
                            }, {
                                cardType: 'Amex',
                                name: 'American Express',
                                UUID: 'some UUID'
                            }, {
                                cardType: 'Master Card',
                                name: 'MasterCard'
                            }, {
                                cardType: 'Discover',
                                name: 'Discover'
                            }];
                        }
                    };
                },
                getApplicablePaymentCards: function getApplicablePaymentCards() {
                    return ['Visa'];
                },
                getPaymentCard: function getPaymentCard() {
                    return {
                        isActive: () => {
                            return false;
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/accountHelpers': {
                getCardType: () => {
                    return {
                        creditCardType: 'Visa',
                        creditCardExpirationMonth: 3,
                        creditCardExpirationYear: 2030,
                        maskedCreditCardNumber: '***********4215'
                    };
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getJsonValue: () => {
                    return {
                        'Visa': 'Visa',
                        'Amex': 'Amex',
                        'MasterCard': 'Master Card',
                        'Discover': 'Discover'
                    };
                }
            },
            'dw/system/HookMgr': new HookMgrs()
        });
        var result = new AccountModel(currentCustomer).customerPaymentInstruments[0];
        assert.equal(result.cardTypeImage.src, 'some URL');
        assert.equal(result.cardTypeImage.alt, 'Visa');
        assert.equal(result.creditCardType.creditCardExpirationMonth, '3');
        assert.equal(result.creditCardType.creditCardExpirationYear, '2030');
        assert.equal(result.creditCardType.creditCardType, 'Visa');
        assert.equal(result.creditCardBinRange, '2');
        assert.equal(result.creditCardHolder, 'visaName');
        assert.equal(result.creditCardLastFour, '4215');
        assert.isTrue(result.defaultPaymentCard);
        assert.equal(result.UUID, 'Visa_UUID');
    });

    it('should receive an profile object null ', () => {
        currentCustomer.profile = null;
        currentCustomer.raw.profile = null;
        var result = new AccountModel(currentCustomer);
        assert.equal(result.profile, null);
    });
});
