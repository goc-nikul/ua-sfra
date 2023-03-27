'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

class OrderModel {
    constructor() {
        this.resources = {
            cardType: '',
            cardEnding: ''
        };
        this.billing = {
            payment: {
                selectedPaymentInstruments: [{
                    type: ''
                }, {
                    maskedCreditCardNumber: ''
                }, {
                    expirationMonth: ''
                }, {
                    expirationYear: ''
                }]
            }
        };
    }
}

class AccountModel {
    constructor() {
        this.profile = {};
    }
}

function proxyModel() {
    var paypalHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/paypalHelpers', {
        'dw/util/Locale': require('../../dw/dw_util_Locale'),
        'dw/system/Transaction': require('../../dw/dw_system_Transaction'),
        'dw/web/Resource': require('../../dw/dw_web_Resource'),
        '*/cartridge/scripts/checkout/checkoutHelpers': {
            validateBillingForm: function () {
                return {};
            },
            validateCreditCard: function () {
                return {};
            },
            getRenderedPaymentInstruments: function () {
                return {};
            }
        },
        '*/cartridge/models/account': AccountModel,
        'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
        'dw/value/Money': require('../../dw/dw_value_Money'),
        'server': {
            forms: {
                getForm: function () {
                    return {
                        paymentMethod: {
                            value: 'TestID'
                        },
                        addressFields: {
                            firstName: {
                                value: 'John'
                            },
                            lastName: {
                                value: 'John'
                            },
                            address1: {
                                value: '1 microsoft way'
                            },
                            address2: {
                                value: ''
                            },
                            city: {
                                value: 'Redmond'
                            },
                            postalCode: {
                                value: '98052'
                            },
                            country: {
                                value: 'US'
                            },
                            states: {
                                stateCode: {
                                    value: 'WA'
                                }
                            }
                        },
                        creditCardFields: {
                            email: {
                                value: 'test@test.com'
                            }
                        }
                    };
                }
            }
        },
        '*/cartridge/models/order': OrderModel,
        'dw/order/BasketMgr': require('../../dw/dw_order_BasketMgr'),
        'dw/order/PaymentMgr': require('../../dw/dw_order_PaymentMgr'),
        'dw/system/HookMgr': require('../../dw/dw_system_HookMgr'),
        'dw/system/Site': require('../../dw/dw_system_Site')
    });

    return paypalHelpers;
}

module.exports = proxyModel();
