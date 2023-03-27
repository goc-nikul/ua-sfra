var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

function proxyModel() {
    var cartHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/cart/cartHelpers', {
        'app_storefront_base/cartridge/scripts/cart/cartHelpers': {
            getExistingProductLineItemInCart() {
                return null;
            },
            checkBundledProductCanBeAdded() {
                return true;
            },
            getExistingProductLineItemsInCart() {
                return [{
                    custom: {
                        fromStoreId: '0520'
                    },
                    shipment: {
                        custom: {
                            fromStoreId: '0520'
                        }
                    }
                }];
            }
        },
        '*/cartridge/scripts/util/array': require('../util/collections'),
        '*/cartridge/scripts/util/collections': require('../util/collections'),
        '*/cartridge/scripts/helpers/productHelpers': {
            getCurrentOptionModel: function () {
                return {};
            }
        },
        'dw/util/UUIDUtils': require('../../dw/dw_util_UUIDUtils'),
        '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
            getStoreInventory: () => 1,
            basketHasInStorePickUpShipment: () => true,
            getBopisShipment: () => {
                return {
                    getShippingMethod: () => {
                        return {
                            ID: 'in-store'
                        };
                    }
                };
            }
        },
        'dw/order/ShippingMgr': require('../../dw/dw_order_ShippingMgr'),
        'dw/catalog/StoreMgr': {
            getStore: function () {
                return {
                    name: 'store1',
                    address1: 'storeAdd1',
                    address2: 'storeAdd2',
                    city: 'storeCity',
                    stateCode: 'storestateCode',
                    postalCode: 'storePostalCode',
                    phone: 'storePhone',
                    countryCode: {
                        value: 'US'
                    }
                };
            }
        },
        'dw/system/Transaction': require('../../dw/dw_system_Transaction'),
        'dw/system/Logger': require('../../dw/dw_system_Logger'),
        'dw/catalog/ProductMgr': require('../../dw/dw_catalog_ProductMgr'),
        'dw/web/Resource': require('../../dw/dw_web_Resource'),
        'dw/system/Site': require('../../dw/dw_system_Site'),
        'int_mao/cartridge/scripts/availability/MAOAvailability': require('../mao/MAOAvailability'),
        'int_mao/cartridge/scripts/availability/MAOAvailabilityHelper': require('../mao/MAOAvailabilityHelper'),
        '*/cartridge/scripts/helpers/basketValidationHelpers': require('../helpers/basketValidationHelpers'),
        '*/cartridge/scripts/checkout/checkoutHelpers': {
            ensureNoEmptyShipments: function () {
                return true;
            },
            giftCardCharactersValidations: function () {
                return {
                    error: false
                };
            },
            updateShipToAsDefaultShipment: function () {
                return;
            },
            copyShippingAddressToShipment: () => true
        },
        '*/cartridge/scripts/helpers/storeHelpers': {
            getPreSelectedStoreCookie: () => {
                return {
                    ID: null
                };
            },
            findStoreById: () => {
                return {
                    productInStoreInventory: true
                };
            },
            getProductAvailabilityOnStoreHours: () => {
                return {
                    stores: [{
                        availabilityMessage: 'availabilityMessage'
                    }]
                };
            }
        },
        '*/cartridge/scripts/utils/PreferencesUtil': require('../../../mocks/scripts/PreferencesUtil.js'),
        '*/cartridge/scripts/LoyaltyConstants': { LOYALTY_PREFIX: 'LYLD' }
    });
    return cartHelpers;
}

module.exports = proxyModel();
