'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var ArrayList = require('../../../../mocks/scripts/util/dw.util.Collection');

var productLineItems1 = new ArrayList([{
    product: {
        online: true,
        availabilityModel: {
            getAvailabilityLevels: function () {
                return {
                    notAvailable: {
                        value: 0
                    }
                };
            }
        }
    },
    custom: {},
    productID: 'someID',
    quantityValue: 2
}]);

var lineItemContainer = {
    totalTax: {
        available: false
    },
    custom: {
        isCommercialPickup: false
    },
    merchandizeTotalPrice: {
        available: true
    },
    productLineItems: productLineItems1,
    couponLineItems: new ArrayList([{
        valid: true
    }]),
    shippingMethod: {
        custom: {
            storePickupEnabled : false
        }
    },
    getBillingAddress() {
        return {
            getCountryCode() {
                return { value: 'US' };
            }
        };
    },
    getDefaultShipment() {
        return {
            shippingMethodID: 'eGift_Card',
            getShippingAddress() {
                return {
                    getCountryCode() {
                        return { value: 'US' };
                    }
                };
            }
        };
    }
};

global.request = {
    geolocation: {
        countryCode: 'US'
    }
};

global.customer = {};

describe('validate order', function () {
    var validateOrderHooks = proxyquire('../../../../../cartridges/int_ocapi/cartridge/hooks/shop/order/create_order', {
        'dw/web/Resource': {
            msg: function (param) {
                return param;
            },
            msgf: function (parmas) {
                return parmas;
            }
        },
        'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
        '*/cartridge/scripts/helpers/hooks': function () {
            return { error: false, message: 'some message' };
        },
        '*/cartridge/scripts/helpers/basketCalculationHelpers': { calculateTotals: function () {} },
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        '*/cartridge/scripts/checkout/checkoutHelpers': {
            isPickUpInStore: function () {
                return false;
            },
            ensureValidShipments: function () {
                return true;
            },
            ensureValidAddressType: (basket) => {
                return true;
            },
            validatePaymentCards: (basket, US) => {
                return {
                    error: false
                };
            },
            isPaymentAmountMatches: () => {
                return true;
            },
            updateStateCode: () => {
                return 'AK';
            },
            updatePostalCode: () => {
                return '600601';
            },
            autoCorrectPhonenumber: () => {
                return '931-230-98031';
            },
            validateInputFields: () => {
                return {
                    error: false
                };
            },
            isHALEnabledForShopApp: () => {
                return false;
            },
            calculatePaymentTransaction: () => {
                return { error: false };
            }
        },
        '*/cartridge/scripts/errorLogHelper': {
            handleOcapiHookErrorStatus: function (e) {
                return e;
            }
        },
        '*/cartridge/scripts/util/collections': require('../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
        '*/cartridge/scripts/helpers/basketValidationHelpers': {
            validateProductsInventory: function () {
                return {
                    availabilityError: false
                };
            }
        },
        '*/cartridge/scripts/hooks/validateOrder': {
            validateOrder: {}
        },
        '~/cartridge/scripts/basketHelper': {
            manageKlarnaSession: () => {
                return;
            }
        },
        'int_shoprunner/cartridge/scripts/DeleteShopRunnerCookie': {
            deleteCookie: () => {
                return;
            }
        },
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
    });

    it('should validate a valid basket', function () {
        global.request = {
            geolocation: {
                countryCode: 'US'
            }
        };
        lineItemContainer.shipments = false; // new ArrayList([{ shippingAddress: { address1: 'some street' } }]);
        var result = validateOrderHooks.beforePOST(lineItemContainer, false);
        assert.isDefined(result);
    });

    it('should return the error country code if Billing address doesn\'t have country code', function () {
        // lineItemContainer.custom.isCommercialPickup = true;
        lineItemContainer.getBillingAddress = function () {
            return {
                getCountryCode() {
                    return { value: null };
                }
            };
        };
        var result = validateOrderHooks.beforePOST(lineItemContainer, false);
        assert.equal(result.message, 'empty.country.code');
    });

    it('should return the error country code if Billing address doesn\'t have country code', function () {
        lineItemContainer.getDefaultShipment = function () {
            return {
                shippingMethodID: 'Standard',
                getShippingAddress() {
                    return {
                        getCountryCode() {
                            return { value: false };
                        }
                    };
                }


            };
        };
        lineItemContainer.getBillingAddress = function() {
            return {
                getCountryCode() {
                    return { value: 'US' };
                }
            };
        };
        var result = validateOrderHooks.beforePOST(lineItemContainer, false);
        assert.equal(result.message, 'empty.country.code');
    });

    it('should invalidate for validateProductsInventory return true', function () {
        global.request = {
            geolocation: {
                countryCode: 'US'
            }
        };
        var validateOrderHook = proxyquire('../../../../../cartridges/int_ocapi/cartridge/hooks/shop/order/create_order', {
            'dw/web/Resource': {
                msg: function (param) {
                    return param;
                }
            },
            'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
            '*/cartridge/scripts/helpers/hooks': function () {
                return { error: false, message: 'some message' };
            },
            '*/cartridge/scripts/helpers/basketCalculationHelpers': { calculateTotals: function () {} },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                isPickUpInStore: function () {
                    return true;
                },
                ensureValidShipments: function () {
                    return true;
                },
                ensureValidAddressType: (basket) => {
                    return true;
                },
                validatePaymentCards: (basket, US) => {
                    return {
                        error: false
                    };
                },
                isPaymentAmountMatches: () => {
                    return true;
                },
                updateStateCode: () => {
                    return 'AK';
                },
                updatePostalCode: () => {
                    return '600601';
                },
                autoCorrectPhonenumber: () => {
                    return '931-230-98031';
                },
                validateInputFields: () => {
                    return {
                        error: false
                    };
                },
                isHALEnabledForShopApp: () => {
                    return false;
                },
                calculatePaymentTransaction: () => {
                    return { error: false };
                }
            },
            '*/cartridge/scripts/errorLogHelper': {
                handleOcapiHookErrorStatus: function () {
                    return 'QtyLimitExceededException';
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/scripts/helpers/basketValidationHelpers': {
                validateProductsInventory: function () {
                    return {
                        availabilityError: true
                    };
                }
            },
            '*/cartridge/scripts/hooks/validateOrder': {
                validateOrder: {}
            },
            '~/cartridge/scripts/basketHelper': {
                manageKlarnaSession: () => {
                    return;
                }
            }
        });
        var result = validateOrderHook.beforePOST(lineItemContainer);
        assert.equal(result, 'QtyLimitExceededException');
    });

    it('should invalidate for ensureValidAddressType return false', function () {
        global.request = {
            geolocation: {
                countryCode: 'US'
            }
        };
        var validateOrderHook = proxyquire('../../../../../cartridges/int_ocapi/cartridge/hooks/shop/order/create_order', {
            'dw/web/Resource': {
                msg: function (param) {
                    return param;
                }
            },
            'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
            '*/cartridge/scripts/helpers/hooks': function () {
                return { error: false, message: 'some message' };
            },
            '*/cartridge/scripts/helpers/basketCalculationHelpers': { calculateTotals: function () {} },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                isPickUpInStore: function () {
                    return false;
                },
                ensureValidShipments: function () {
                    return true;
                },
                ensureValidAddressType: (basket) => {
                    return false;
                },
                validatePaymentCards: (basket, US) => {
                    return {
                        error: false
                    };
                },
                isPaymentAmountMatches: () => {
                    return true;
                },
                updateStateCode: () => {
                    return 'AK';
                },
                updatePostalCode: () => {
                    return '600601';
                },
                autoCorrectPhonenumber: () => {
                    return '931-230-98031';
                },
                validateInputFields: () => {
                    return {
                        error: false
                    };
                },
                isHALEnabledForShopApp: () => {
                    return false;
                },
                calculatePaymentTransaction: () => {
                    return { error: false };
                }
            },
            '*/cartridge/scripts/errorLogHelper': {
                handleOcapiHookErrorStatus: function (e) {
                    return e;
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/scripts/helpers/basketValidationHelpers': {
                validateProductsInventory: function () {
                    return {
                        availabilityError: false
                    };
                }
            },
            '*/cartridge/scripts/hooks/validateOrder': {
                validateOrder: {}
            },
            '~/cartridge/scripts/basketHelper': {
                manageKlarnaSession: () => {
                    return;
                }
            }
        });
        var result = validateOrderHook.beforePOST(lineItemContainer);
        assert.equal(result.message, 'address.invalid.type');
    });

    it('should invalidate when hooks.error return true', function () {
        global.request = {
            geolocation: {
                countryCode: 'US'
            }
        };
        var validateOrderHook = proxyquire('../../../../../cartridges/int_ocapi/cartridge/hooks/shop/order/create_order', {
            'dw/web/Resource': {
                msg: function (param) {
                    return param;
                }
            },
            'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
            '*/cartridge/scripts/helpers/hooks': function () {
                return { error: true, message: 'some message' };
            },
            '*/cartridge/scripts/helpers/basketCalculationHelpers': { calculateTotals: function () {} },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                isPickUpInStore: function () {
                    return false;
                },
                ensureValidShipments: function () {
                    return true;
                },
                ensureValidAddressType: (basket) => {
                    return true;
                },
                validatePaymentCards: (basket, US) => {
                    return {
                        error: false
                    };
                },
                isPaymentAmountMatches: () => {
                    return true;
                },
                updateStateCode: () => {
                    return 'AK';
                },
                updatePostalCode: () => {
                    return '600601';
                },
                autoCorrectPhonenumber: () => {
                    return '931-230-98031';
                },
                validateInputFields: () => {
                    return {
                        error: false
                    };
                },
                isHALEnabledForShopApp: () => {
                    return false;
                },
                calculatePaymentTransaction: () => {
                    return { error: false };
                }
            },
            '*/cartridge/scripts/errorLogHelper': {
                handleOcapiHookErrorStatus: function (e) {
                    return e;
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/scripts/helpers/basketValidationHelpers': {
                validateProductsInventory: function () {
                    return {
                        availabilityError: false
                    };
                }
            },
            '*/cartridge/scripts/hooks/validateOrder': {
                validateOrder: {}
            },
            '~/cartridge/scripts/basketHelper': {
                manageKlarnaSession: () => {
                    return;
                }
            }
        });
        var result = validateOrderHook.beforePOST(lineItemContainer);
        assert.equal(result.message, 'some message');
    });

    it('should invalidate when validatePaymentCards.error return true ', function () {
        global.request = {
            geolocation: {
                countryCode: 'US'
            }
        };
        var validateOrderHook = proxyquire('../../../../../cartridges/int_ocapi/cartridge/hooks/shop/order/create_order', {
            'dw/web/Resource': {
                msg: function (param) {
                    return param;
                }
            },
            'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
            '*/cartridge/scripts/helpers/hooks': function () {
                return { error: false, message: 'some message' };
            },
            '*/cartridge/scripts/helpers/basketCalculationHelpers': { calculateTotals: function () {} },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                isPickUpInStore: function () {
                    return false;
                },
                ensureValidShipments: function () {
                    return true;
                },
                ensureValidAddressType: (basket) => {
                    return true;
                },
                validatePaymentCards: (basket, US) => {
                    return {
                        error: true
                    };
                },
                isPaymentAmountMatches: () => {
                    return true;
                },
                updateStateCode: () => {
                    return 'AK';
                },
                updatePostalCode: () => {
                    return '600601';
                },
                autoCorrectPhonenumber: () => {
                    return '931-230-98031';
                },
                validateInputFields: () => {
                    return {
                        error: false
                    };
                },
                isHALEnabledForShopApp: () => {
                    return false;
                },
                calculatePaymentTransaction: () => {
                    return { error: false };
                }
            },
            '*/cartridge/scripts/errorLogHelper': {
                handleOcapiHookErrorStatus: function (e) {
                    return e;
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/scripts/helpers/basketValidationHelpers': {
                validateProductsInventory: function () {
                    return {
                        availabilityError: false
                    };
                }
            },
            '*/cartridge/scripts/hooks/validateOrder': {
                validateOrder: {}
            },
            '~/cartridge/scripts/basketHelper': {
                manageKlarnaSession: () => {
                    return;
                }
            }
        });
        var result = validateOrderHook.beforePOST(lineItemContainer, false);
        assert.equal(result.message, 'error.payment.not.valid');
    });

    it('should invalidate when calculatePaymentTransaction.error return true ', function () {
        global.request = {
            geolocation: {
                countryCode: 'US'
            }
        };
        var validateOrderHook = proxyquire('../../../../../cartridges/int_ocapi/cartridge/hooks/shop/order/create_order', {
            'dw/web/Resource': {
                msg: function (param) {
                    return param;
                }
            },
            'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
            '*/cartridge/scripts/helpers/hooks': function () {
                return { error: false, message: 'some message' };
            },
            '*/cartridge/scripts/helpers/basketCalculationHelpers': { calculateTotals: function () {} },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                isPickUpInStore: function () {
                    return false;
                },
                ensureValidShipments: function () {
                    return true;
                },
                ensureValidAddressType: (basket) => {
                    return true;
                },
                validatePaymentCards: (basket, US) => {
                    return {
                        error: false
                    };
                },
                isPaymentAmountMatches: () => {
                    return true;
                },
                updateStateCode: () => {
                    return 'AK';
                },
                updatePostalCode: () => {
                    return '600601';
                },
                autoCorrectPhonenumber: () => {
                    return '931-230-98031';
                },
                validateInputFields: () => {
                    return {
                        error: false
                    };
                },
                isHALEnabledForShopApp: () => {
                    return false;
                },
                calculatePaymentTransaction: () => {
                    return { error: true };
                }
            },
            '*/cartridge/scripts/errorLogHelper': {
                handleOcapiHookErrorStatus: function (e) {
                    return e;
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/scripts/helpers/basketValidationHelpers': {
                validateProductsInventory: function () {
                    return {
                        availabilityError: false
                    };
                }
            },
            '*/cartridge/scripts/hooks/validateOrder': {
                validateOrder: {}
            },
            '~/cartridge/scripts/basketHelper': {
                manageKlarnaSession: () => {
                    return;
                }
            }
        });
        var result = validateOrderHook.beforePOST(lineItemContainer, false);
        assert.equal(result.message, 'error.payment.not.valid');
    });

    it('should invalidate when isPaymentAmountMatches.error return true', function () {
        global.request = {
            geolocation: {
                countryCode: 'US'
            }
        };
        var validateOrderHook = proxyquire('../../../../../cartridges/int_ocapi/cartridge/hooks/shop/order/create_order', {
            'dw/web/Resource': {
                msg: function (param) {
                    return param;
                }
            },
            'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
            '*/cartridge/scripts/helpers/hooks': function () {
                return { error: false, message: 'some message' };
            },
            '*/cartridge/scripts/helpers/basketCalculationHelpers': { calculateTotals: function () {} },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                isPickUpInStore: function () {
                    return false;
                },
                ensureValidShipments: function () {
                    return true;
                },
                ensureValidAddressType: (basket) => {
                    return true;
                },
                validatePaymentCards: (basket, US) => {
                    return {
                        error: false
                    };
                },
                isPaymentAmountMatches: () => {
                    return false;
                },
                updateStateCode: () => {
                    return 'AK';
                },
                updatePostalCode: () => {
                    return '600601';
                },
                autoCorrectPhonenumber: () => {
                    return '931-230-98031';
                },
                validateInputFields: () => {
                    return {
                        error: false
                    };
                },
                isHALEnabledForShopApp: () => {
                    return false;
                },
                calculatePaymentTransaction: () => {
                    return { error: false };
                }
            },
            '*/cartridge/scripts/errorLogHelper': {
                handleOcapiHookErrorStatus: function (e) {
                    return e;
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/scripts/helpers/basketValidationHelpers': {
                validateProductsInventory: function () {
                    return {
                        availabilityError: false
                    };
                }
            },
            '*/cartridge/scripts/hooks/validateOrder': {
                validateOrder: {}
            },
            '~/cartridge/scripts/basketHelper': {
                manageKlarnaSession: () => {
                    return;
                }
            }
        });
        var result = validateOrderHook.beforePOST(null, false);
        assert.equal(result.message, 'error.card.invalid.amount');
    });

    it('should invalidate when validateInputFields.error return true', function () {
        global.request = {
            geolocation: {
                countryCode: 'US'
            }
        };
        lineItemContainer.getDefaultShipment = function () {
            return {
                shippingMethodID: 'Standard',
                getShippingAddress() {
                    return {
                        getCountryCode() {
                            return { value: 'US' };
                        }
                    };
                }
            };
        };
        lineItemContainer.getBillingAddress = function() {
            return {
                getCountryCode() {
                    return { value: 'US' };
                }
            };
        };
        var validateOrderHook = proxyquire('../../../../../cartridges/int_ocapi/cartridge/hooks/shop/order/create_order', {
            'dw/web/Resource': {
                msg: function (param) {
                    return param;
                },
                msgf: function (param) {
                    return param;
                }
            },
            'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
            '*/cartridge/scripts/helpers/hooks': function () {
                return { error: false, message: 'some message' };
            },
            '*/cartridge/scripts/helpers/basketCalculationHelpers': { calculateTotals: function () {} },
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                isPickUpInStore: function () {
                    return true;
                },
                ensureValidShipments: function () {
                    return true;
                },
                ensureValidAddressType: (basket) => {
                    return true;
                },
                validatePaymentCards: (basket, US) => {
                    return {
                        error: false
                    };
                },
                isPaymentAmountMatches: () => {
                    return true;
                },
                updateStateCode: () => {
                    return 'AK';
                },
                updatePostalCode: () => {
                    return '600601';
                },
                autoCorrectPhonenumber: () => {
                    return '931-230-98031';
                },
                validateInputFields: () => {
                    return {
                        error: true,
                        genericErrorMessage: 'Invalid input entry'
                    };
                },
                isHALEnabledForShopApp: () => {
                    return false;
                },
                calculatePaymentTransaction: () => {
                    return { error: false };
                }
            },
            '*/cartridge/scripts/errorLogHelper': {
                handleOcapiHookErrorStatus: function (e) {
                    return e;
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/scripts/helpers/basketValidationHelpers': {
                validateProductsInventory: function () {
                    return {
                        availabilityError: false
                    };
                }
            },
            '*/cartridge/scripts/hooks/validateOrder': {
                validateOrder: {}
            },
            '~/cartridge/scripts/basketHelper': {
                manageKlarnaSession: () => {
                    return;
                }
            }
        });
        var result = validateOrderHook.beforePOST(lineItemContainer);
        assert.equal(result.message, 'Invalid input entry');
    });

    it('should invalidate isCommercialPickup enable and isHALEnabledForShopApp disable', function () {
        global.request = {
            geolocation: {
                countryCode: 'US'
            }
        };
        lineItemContainer.custom.isCommercialPickup = true; // new ArrayList([{ shippingAddress: { address1: 'some street' } }]);
        var result = validateOrderHooks.beforePOST(lineItemContainer, false);
        assert.isDefined(result);
    });
});
