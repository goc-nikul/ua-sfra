'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var mockSuperModule = require('../../../../../../mockModuleSuperModule');
const LineItemCtnr = require('../../../../../../mocks/dw/dw_order_LineItemCtnr');
let basket = new LineItemCtnr();

var baseDefaultModelMock = proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/requestBuilder/session.js', {
    'dw/system/Site': require('../../../../../../mocks/dw/dw_system_Site'),
    'dw/system/Logger': require('../../../../../../mocks/dw/dw_system_Logger'),
    '*/cartridge/scripts/payments/builder': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/builder.js', {}),
    '*/cartridge/scripts/payments/model/request/session': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/model/request/session.js', {}),
    '*/cartridge/scripts/util/klarnaHelper': {
        getDiscountsTaxation: function () {
            return 'price';
        },
        isOMSEnabled: function () {
            return false;
        },
        isEnabledPreassessmentForCountry: function () {
            return true;
        },
        isTaxationPolicyNet: function () {
            return true;
        }
    },
    '*/cartridge/scripts/payments/requestBuilder/address': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/requestBuilder/address.js', {
        '*/cartridge/scripts/payments/builder': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/builder.js', {}),
        '*/cartridge/scripts/payments/model/request/session': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/model/request/session.js', {}),
        '*/cartridge/scripts/util/klarnaHelper': {
            strval: function (obj) {
                if (obj === null) {
                    return '';
                }

                return obj;
            }
        }
    }),
    '*/cartridge/scripts/payments/requestBuilder/orderLineItem': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/requestBuilder/orderLineItem.js', {
        'dw/web/URLUtils': require('../../../../../../mocks/dw/dw_web_URLUtils'),
        'dw/system/Site': require('../../../../../../mocks/dw/dw_system_Site'),
        'dw/util/ArrayList': require('../../../../../../mocks/dw/dw_util_ArrayList'),
        'dw/system/Transaction': require('../../../../../../mocks/dw/dw_system_Transaction'),
        '*/cartridge/scripts/payments/builder': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/builder.js', {}),
        '*/cartridge/scripts/payments/model/request/session': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/model/request/session.js', {}),
        '*/cartridge/scripts/util/klarnaHelper': {
            getDiscountsTaxation: function () {
                return 'price';
            },
            isOMSEnabled: function () {
                return false;
            }
        },
        '*/cartridge/scripts/util/klarnaPaymentsConstants': {}
    }),
    '*/cartridge/scripts/payments/requestBuilder/giftCertificateLineItem': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/requestBuilder/giftCertificateLineItem.js', {
        '*/cartridge/scripts/payments/builder': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/builder.js', {}),
        '*/cartridge/scripts/payments/model/request/session': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/model/request/session.js', {}),
        '*/cartridge/scripts/util/klarnaHelper': {
            getDiscountsTaxation: function () {
                return 'price';
            }
        },
        '*/cartridge/scripts/util/klarnaPaymentsConstants': {}
    }),
    '*/cartridge/scripts/payments/requestBuilder/giftCertificatePayment': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/requestBuilder/giftCertificatePayment.js', {
        '*/cartridge/scripts/payments/builder': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/builder.js', {}),
        '*/cartridge/scripts/payments/model/request/session': proxyquire('../../../../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/payments/model/request/session.js', {}),
        '*/cartridge/scripts/util/klarnaPaymentsConstants': {}
    }),
    '*/cartridge/scripts/payments/requestBuilder/shipmentItem': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/requestBuilder/shipmentItem.js', {
        'dw/system/Transaction': require('../../../../../../mocks/dw/dw_system_Transaction'),
        'dw/order/TaxMgr': {},
        'dw/order/ShippingLocation': {},
        '*/cartridge/scripts/payments/builder': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/builder.js', {}),
        '*/cartridge/scripts/payments/model/request/session': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/model/request/session.js', {}),
        '*/cartridge/scripts/util/klarnaHelper': {
            getDiscountsTaxation: function () {
                return 'price';
            },
            isOMSEnabled: function () {
                return false;
            },
            isTaxationPolicyNet: function () {
                return true;
            },
            strval: function (obj) {
                if (obj === null) {
                    return '';
                }

                return obj;
            }
        },
        '*/cartridge/scripts/util/klarnaPaymentsConstants': proxyquire('../../../../../../../cartridges/int_klarna_payments_sfra/cartridge/scripts/util/klarnaPaymentsConstants.js', {}),
        '*/cartridge/scripts/payments/requestBuilder/address': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/requestBuilder/address.js', {
            '*/cartridge/scripts/payments/builder': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/builder.js', {}),
            '*/cartridge/scripts/payments/model/request/session': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/model/request/session.js', {}),
            '*/cartridge/scripts/util/klarnaHelper': {
                strval: function (obj) {
                    if (obj === null) {
                        return '';
                    }

                    return obj;
                }
            }
        })
    }),
    '*/cartridge/scripts/payments/requestBuilder/priceAdjustment': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/requestBuilder/priceAdjustment.js', {
        '*/cartridge/scripts/payments/builder': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/builder.js', {}),
        '*/cartridge/scripts/payments/model/request/session': proxyquire('../../../../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/payments/model/request/session.js', {}),
        '*/cartridge/scripts/util/klarnaHelper': {},
        '*/cartridge/scripts/util/klarnaPaymentsConstants': {}
    }),
    '*/cartridge/scripts/payments/requestBuilder/salesTax': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/requestBuilder/salesTax.js', {
        '*/cartridge/scripts/payments/builder': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/builder.js', {}),
        '*/cartridge/scripts/payments/model/request/session': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/model/request/session.js', {}),
        '*/cartridge/scripts/util/klarnaPaymentsConstants': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/util/klarnaPaymentsConstants', {})
    }),
    '*/cartridge/scripts/payments/requestBuilder/additionalCustomerInfo': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/requestBuilder/additionalCustomerInfo.js', {
        '*/cartridge/scripts/payments/builder': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/builder.js', {}),
        '*/cartridge/scripts/util/klarnaHelper': {},
        '*/cartridge/scripts/util/klarnaPaymentsConstants': {}
    }),
    '*/cartridge/scripts/payments/requestBuilder/options': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/requestBuilder/options.js', {
        '*/cartridge/scripts/payments/builder': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/builder.js', {}),
    }),
    '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
        basketHasOnlyBOPISProducts: function () {
            return false;
        }
    }
});

mockSuperModule.create(baseDefaultModelMock);

let klarnaSession = proxyquire('../../../../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/payments/requestBuilder/session.js', {
    'dw/system/Site': require('../../../../../../mocks/dw/dw_system_Site'),
    '*/cartridge/scripts/util/klarnaHelper': {
        isEnabledPreassessmentForCountry: function () {
            return true;
        },
        isTaxationPolicyNet: function () {
            return true;
        },
        isOMSEnabled: function () {
            return false;
        },
        getDiscountsTaxation: function () {
            return 'price';
        },
        getShippment: function () {
            return basket.defaultShipment;
        }
    },
    '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
        basketHasOnlyBOPISProducts: function () {
            return false;
        }
    },
    '*/cartridge/scripts/payments/requestBuilder/address': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/requestBuilder/address.js', {
        '*/cartridge/scripts/payments/builder': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/builder.js', {}),
        '*/cartridge/scripts/payments/model/request/session': proxyquire('../../../../../../../cartridges/int_klarna_payments/cartridge/scripts/payments/model/request/session.js', {}),
        '*/cartridge/scripts/util/klarnaHelper': {
            strval: function (obj) {
                if (obj === null) {
                    return '';
                }

                return obj;
            }
        }
    })
});

module.exports = klarnaSession;
