'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const Spy = require('../../../helpers/unit/Spy');
let spy = new Spy();

class EmailProvider {
    constructor() {
        this.emailObj = {};
    }

    get(type, emailObj) {
        this.emailObj = emailObj;
        return this;
    }

    send() {
        spy.use(this.emailObj);
    }

    addressType() {
        return;
    }
}

class Calander {
    constructor(date) {
        this.date = date;
        return {
            toTimeString: function () {
                return date.toDateString();
            }
        };
    }
}

function proxyModel() {
    var checkoutHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/checkout/checkoutHelpers', {
        'dw/util/ArrayList': require('../../dw/dw_util_ArrayList'),
        'dw/value/Money': require('../../dw/dw_value_Money'),
        'dw/order/OrderMgr': require('../../dw/dw_order_OrderMgr'),
        'dw/order/Order': require('../../dw/dw_order_Order'),
        'dw/system/Status': require('../../dw/dw_system_Status'),
        'dw/system/Transaction': require('../../dw/dw_system_Transaction'),
        'dw/system/Logger': require('../../dw/dw_system_Logger'),
        'dw/web/Resource': require('../../dw/dw_web_Resource'),
        'dw/system/Site': require('../../dw/dw_system_Site'),
        'dw/order/BasketMgr': require('../../dw/dw_order_BasketMgr'),
        'dw/order/PaymentMgr': require('../../dw/dw_order_PaymentMgr'),
        'dw/system/HookMgr': require('../../dw/dw_system_HookMgr'),
        '*/cartridge/scripts/giftcard/giftcardHelper': require('../giftcard/giftcardHelper').giftCardHelper,
        '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
            basketHasInStorePickUpShipment: function () {
            }
        },
        'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {},
        '*/cartridge/scripts/basketHelper': {},
        '*/cartridge/scripts/checkout/shippingHelpers': {
            selectShippingMethod: function () {}
        },
        '*/cartridge/modules/providers': new EmailProvider(),
        '*/cartridge/scripts/helpers/emailHelpers': {
            emailTypes: {
                registration: 1,
                passwordReset: 2,
                passwordChanged: 3,
                orderConfirmation: 4,
                accountLocked: 5,
                accountEdited: 6,
                possibleFraudNotification: 7,
                invoiceConfirmation: 8,
                eGiftCard: 9,
                returnLabel: 10
            }
        },
        'plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers': {},
        '*/cartridge/scripts/firstDataHelper': require('../helpers/firstDataHelper'),
        'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
        '*/cartridge/scripts/util/collections': require('../util/collections'),
        'dw/util/Calendar': Calander,
        '*/cartridge/scripts/cart/cartHelpers': {
            getExistingProductLineItemInCart: function () {
                return true;
            },
            hasPreOrderItems: function () {
                return false;
            }
        },
        'dw/catalog/ProductMgr': require('../../dw/dw_catalog_ProductMgr'),
        '*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
        'dw/order/PaymentInstrument': require('../../dw/dw_order_PaymentInstrument'),
        '*/cartridge/scripts/MaoPreferences': require('../MaoPreferences'),
        '*/cartridge/scripts/utils/checkCrossSiteScript': {
            crossSiteScriptPatterns: function () {
                return '';
            }
        },
        'int_klarna_payments_custom/cartridge/scripts/checkout/checkoutHelpers': {findKlarnaPaymentTransaction: function (order) {
            return {custom : {
                 kpFraudStatus: 'PENDING'
            }};
        }},
        '*/cartridge/scripts/util/klarnaPaymentsConstants.js': { FRAUD_STATUS : 'ACCEPTED'},
        '*/cartridge/scripts/basketHelper': {
            updateAddressType: function () {
                return;
            }
        },
        '*/cartridge/scripts/helpers/sitePreferencesHelper': {
            isAurusEnabled: function () {
                 return false;
            }
        }
    });
    checkoutHelpers.getSpy = function () {
        return spy;
    };
    return checkoutHelpers;
}

module.exports = proxyModel();
