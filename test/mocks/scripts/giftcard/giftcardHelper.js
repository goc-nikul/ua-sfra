'use strict';
// eslint-disable-next-line no-unused-vars

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');
var ArrayList = require('../../../mocks/scripts/util/dw.util.Collection');
var TimezoneHelper = function () {};
TimezoneHelper.prototype = {
    // get current site time
    getCurrentSiteTime: function () {
        return new Date();
    }
};

class OrderModel {
        constructor() {}
    }
    
class AccountModel {
    constructor() {
        this.profile = {};
    }
}

var templateStub = sinon.stub();
templateStub.returns({
    render: function () {
        return { text: 'rendered html' };
    }
});
var renderTemplateHelper = proxyquire('../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/renderTemplateHelper.js', {
    'dw/util/Template': templateStub,
    'dw/util/HashMap': function () {
        return {
            result: {},
            put: function (key, context) {
                this.result[key] = context;
            }
        };
    },
    'dw/order/Order': require('../../../mocks/dw/dw_order_Order')
});

var Forms = function () {
        var formData = {
            shipping: {
                shippingAddress:{
                    addressFields:{
                        states: {
                            stateCode:{
                                options: [{
                                    value : 'test1',
                                    label: 'test1',
                                    id:'test1'
                                }]
                            }
                        },
                        state: {
                            value:'state'
                        }
                    }
                }
            },
            billing: {
                    addressFields:{
						firstName: {
                    		value: 'test'
                		},
                		lastName: {
                    		value: 'test'
                		},
                		address1: {
                    		value: 'test'
                		},
                		address2: {
                    		value: 'test'
                		},
                		city: {
                    		value: 'test'
                		},
                		postalCode: {
                    		value: 'test'
                		},
                		country: {
                    		value: 'test'
                		},
                        states: {
                            stateCode:{
                                options: [{
                                    value : 'test1',
                                    label: 'test1',
                                    id:'test1'
                                }]
                            }
                        },
                        state: {
                            value:'state'
                        }
                    },
                    creditCardFields:{
						email: {
                    		value: 'test'
                		}
                    }
            }
        };

        this.getForm = function (id) {
            return formData[id];
        };
    };
    var server = {
        forms: new Forms()
    };

function giftCardHelperProxyModel() {
    var giftCardHelper = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/giftcard/giftcardHelper', {
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
        '*/cartridge/scripts/firstDataHelper': require('../helpers/firstDataHelper'),
        '*/cartridge/scripts/firstDataPreferences': {},
        'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
        'dw/system/HookMgr': require('../../../mocks/dw/dw_system_HookMgr'),
        'dw/util/Locale': {
            getLocale: function () {
                return {
                    country: 'ID'
                };
            }
        },
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
        '*/cartridge/models/order': OrderModel,
        '*/cartridge/models/account': AccountModel,
        'server': server,
        'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
        'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
        'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
        'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
        '*/cartridge/scripts/util/collections': require('../../../../cartridges/lib_productlist/test/mocks/util/collections'),
        '*/cartridge/scripts/checkout/shippingHelpers': {
            getShippingMethodByID: (shippingMethodId) => {
                return {
                    ID: shippingMethodId
                };
            }
        },
        'dw/util/ArrayList': ArrayList,
        'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
        '*/cartridge/scripts/util/TimezoneHelper': TimezoneHelper,
        '*/cartridge/scripts/renderTemplateHelper': renderTemplateHelper,
        'dw/order/PaymentMgr': require('../../../mocks/dw/dw_order_PaymentMgr'),
        'dw/util/HashMap': require('../../../mocks/dw/dw_util_HashMap'),
        'dw/order/Order': require('../../../mocks/dw/dw_order_Order')
    });
    return giftCardHelper;
}

function giftCardHooksProxyModel() {
    var giftCardHooks = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/giftcard/hooks/giftcardsHooks', {
        'int_first_data/cartridge/scripts/firstDataHelper': require('../helpers/firstDataHelper'),
        'dw/order/PaymentMgr': {
            getPaymentMethod: function (paymentInstrument) {
                return {
                    getPaymentProcessor: function () {
                        return paymentInstrument.paymentMethod;
                    }
                };
            }
        },
        'dw/order/OrderMgr': {
            getOrder: function () {
                var BasketMgr = require('../../../mocks/dw/dw_order_BasketMgr');
                var order = BasketMgr.getCurrentBasket();
                return order;
            }
        },
        'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
        '*/cartridge/scripts/giftcard/giftcardHelper': giftCardHelperProxyModel()
    });
    return giftCardHooks;
}


module.exports.giftCardHelper = giftCardHelperProxyModel();
module.exports.giftCardHooks = giftCardHooksProxyModel();
