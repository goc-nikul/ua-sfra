'use strict';

require('dw-api-mock/demandware-globals');
var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

let Site = new (require('dw/system/Site'))();
let checkoutHelpers;
let defaultStubs;

describe('app_ua_mx/cartridge/scripts/checkout/checkoutHelpers.js', () => {
    beforeEach(() => {
        delete this.currentBasket;
        Site.current = Site;
        defaultStubs = {
            'dw/system/Site': Site,
            'app_ua_core/cartridge/scripts/checkout/checkoutHelpers': {},
            'app_storefront_base/cartridge/scripts/checkout/checkoutHelpers': {
                copyCustomerAddressToBilling: () => {},
                copyCustomerAddressToShipment: () => {},
                copyBillingAddressToBasket: () => {},
                copyShippingAddressToShipment: () => {}
            }
        };
        checkoutHelpers = proxyquire('../../../../../cartridges/app_ua_mx/cartridge/scripts/checkout/checkoutHelpers.js', defaultStubs);
    });

    it('Testing method: isHideRfcValues', () => {
        var address = {
            rfc: 'XAXX010101000'
        };
        // RFC_DEFAULT is undefined
        assert.isFalse(checkoutHelpers.isHideRfcValues(address));

        // RFC_DEFAULT is defined / address.rfc === RFC_DEFAULT
        Site.current.setCustomPreferenceValue('rfcDefaultValuesJson', '{ "RFC_DEFAULT": "XAXX010101000"} ');
        defaultStubs['dw/system/Site'] = Site;
        checkoutHelpers = proxyquire('../../../../../cartridges/app_ua_mx/cartridge/scripts/checkout/checkoutHelpers.js', defaultStubs);
        assert.isTrue(checkoutHelpers.isHideRfcValues(address));
    });

    it('Testing method: copyCustomerAddressToBasket', () => {
        var Customer = require('dw/customer');
        var currentCustomer = new Customer.Customer();
        var currentBasket = new (require('dw/order/Basket'))();
        var BasketMgr = new (require('dw/order/BasketMgr'))()
        var addressMx = new Customer.CustomerAddress();
        var Locale = new (require('dw/util/Locale'))();
        var shipment = new (require('dw/order/Shipment'))();
        var updatedBasket;
        shipment.shippingAddress = {
            custom: {}
        };
        currentBasket.shipments = [
            shipment
        ];
        BasketMgr.getCurrentBasket = () => {
            if (!this.currentBasket) {
                var basket = new (require('dw/order/Basket'))();
                basket.billingAddress = {
                    custom: {}
                };
                this.currentBasket = basket;
            }
            return this.currentBasket;
        };
        addressMx.countryCode = {
            value: 'MX'
        };
        addressMx.custom = {
            additionalInformation: 'additionalInformation',
            colony: 'colony',
            dependentLocality: 'dependentLocality',
            exteriorNumber: 'exteriorNumber',
            interiorNumber: 'interiorNumber',
        };
        currentCustomer.addressBook = new Customer.AddressBook();
        currentCustomer.addressBook.addresses = [
            addressMx
        ];
        Locale.getLocale = () => {
            return {
                country: 'MX'
            }
        };
        Site.current.preferences = {
            custom: {
                isInternationalBillingAddressEnabled: false
            }
        };
        Site.setCustomPreferenceValue('isInternationalBillingAddressEnabled', false);
        defaultStubs['dw/system/Site'] = Site;
        defaultStubs['dw/order/BasketMgr'] = BasketMgr;
        defaultStubs['dw/util/Locale'] = Locale;
        defaultStubs['*/cartridge/scripts/util/collections'] = require('../../../../mocks/scripts/util/collections');
        checkoutHelpers = proxyquire('../../../../../cartridges/app_ua_mx/cartridge/scripts/checkout/checkoutHelpers.js', defaultStubs);
        
        // Customer's preferred address is not provided
        checkoutHelpers.copyCustomerAddressToBasket(currentBasket, currentCustomer);
        updatedBasket = BasketMgr.getCurrentBasket();
        assert.deepEqual(updatedBasket.billingAddress.custom, addressMx.custom);

        // Customer's preferred address is provided
        currentCustomer.addressBook.preferredAddress = {
            countryCode: 'MX',
            custom: {
                additionalInformation: 'pref_additionalInformation',
                colony: 'pref_colony',
                dependentLocality: 'pref_dependentLocality',
                exteriorNumber: 'pref_exteriorNumber',
                interiorNumber: 'pref_interiorNumber',
            }
        };
        Site.current.preferences.custom.isInternationalBillingAddressEnabled = true;
        Site.setCustomPreferenceValue('isInternationalBillingAddressEnabled', true);
        checkoutHelpers.copyCustomerAddressToBasket(currentBasket, currentCustomer);
        updatedBasket = BasketMgr.getCurrentBasket();
        assert.deepEqual(updatedBasket.billingAddress.custom, currentCustomer.addressBook.preferredAddress.custom);
    });

    it('Testing method: sendConfirmationEmail', () => {
        defaultStubs['*/cartridge/scripts/helpers/emailHelpers'] = {
            emailTypes: {
                orderConfirmation: 'orderConfirmation'
            }
        };
        defaultStubs['*/cartridge/modules/providers'] = {
            get: () => {
                return {
                    send: () => {}
                }
            }
        };
        checkoutHelpers = proxyquire('../../../../../cartridges/app_ua_mx/cartridge/scripts/checkout/checkoutHelpers.js', defaultStubs);

        // order.custom.confirmationEmailSent is undefined
        var order = new (require('dw/order/Order'))();
        assert.isUndefined(order.custom.confirmationEmailSent);
        checkoutHelpers.sendConfirmationEmail(order);
        assert.isTrue(order.custom.confirmationEmailSent);
    });

    it('Testing method: copyCustomerAddressToShipment', () => {
        var shipment = new (require('dw/order/Shipment'))();
        shipment.shippingAddress = {
            custom: {}
        };
        var address = new (require('dw/customer/Customer'))();
        address.custom = {
            additionalInformation: 'additionalInformation',
            colony: 'colony',
            dependentLocality: 'dependentLocality',
            exteriorNumber: 'exteriorNumber',
            interiorNumber: 'interiorNumber',
        };
        assert.notDeepEqual(address.custom, shipment.shippingAddress.custom);
        checkoutHelpers.copyCustomerAddressToShipment(address, shipment);
        assert.deepEqual(address.custom, shipment.shippingAddress.custom);

        // Shipment is null
        var BasketMgr = new (require('dw/order/BasketMgr'))()
        BasketMgr.getCurrentBasket = () => {
            if (!this.currentBasket) {
                var basket = new (require('dw/order/Basket'))();
                basket.defaultShipment = {
                    shippingAddress: {
                        custom: {}
                    }
                };
                this.currentBasket = basket;
            }
            return this.currentBasket;
        };
        defaultStubs['dw/order/BasketMgr'] = BasketMgr;
        checkoutHelpers = proxyquire('../../../../../cartridges/app_ua_mx/cartridge/scripts/checkout/checkoutHelpers.js', defaultStubs);
        checkoutHelpers.copyCustomerAddressToShipment(address, null);
        var updatedBasket = BasketMgr.getCurrentBasket();
        assert.deepEqual(address.custom, updatedBasket.defaultShipment.shippingAddress.custom);
    });

    it('Testing method: copyBillingAddressToBasket', () => {
        var currentBasket = new (require('dw/order/Basket'))();
        currentBasket.billingAddress = {
            custom: {}
        };
        var address = new (require('dw/customer/Customer'))();
        address.custom = {
            additionalInformation: 'additionalInformation',
            colony: 'colony',
            dependentLocality: 'dependentLocality',
            exteriorNumber: 'exteriorNumber',
            interiorNumber: 'interiorNumber',
        };
        assert.notDeepEqual(address.custom, currentBasket.billingAddress.custom);
        checkoutHelpers.copyBillingAddressToBasket(address, currentBasket);
        assert.deepEqual(address.custom, currentBasket.billingAddress.custom);
    });

    it('Testing method: copyShippingAddressToShipment', () => {
        var type = 'type';
        var shippingData = {};
        var shipment = new (require('dw/order/Shipment'))();
        shipment.shippingAddress = {
            custom: {}
        };
        // City doesn't contain comma
        var expectedCity = 'city';
        var expectedAddress = {
            additionalInformation: 'additionalInformation',
            colony: 'colony',
            dependentLocality: 'dependentLocality',
            exteriorNumber: 'exteriorNumber',
            interiorNumber: 'interiorNumber'
        };

        defaultStubs['server'] = {
            forms: {
                getForm: () => {
                    return {
                        shippingAddress: {
                            addressFields: {
                                additionalInformation: {
                                    value: 'additionalInformation'
                                },
                                colony: {
                                    value: 'colony'
                                },
                                dependentLocality: {
                                    value: 'dependentLocality'
                                },
                                exteriorNumber: {
                                    value: 'exteriorNumber'
                                },
                                interiorNumber: {
                                    value: 'interiorNumber'
                                },
                                city: {
                                    // City contain comma
                                    value: ',city'
                                }
                            }
                        }
                    }
                }
            }
        };
        checkoutHelpers = proxyquire('../../../../../cartridges/app_ua_mx/cartridge/scripts/checkout/checkoutHelpers.js', defaultStubs);

        assert.notDeepEqual(expectedAddress, shipment.shippingAddress.custom);
        checkoutHelpers.copyShippingAddressToShipment(shippingData, shipment, type);
        assert.deepEqual(expectedAddress, shipment.shippingAddress.custom);
        assert.equal(shipment.shippingAddress.city, expectedCity);

        // Shipment is null
        var BasketMgr = new (require('dw/order/BasketMgr'))()
        BasketMgr.getCurrentBasket = () => {
            if (!this.currentBasket) {
                var basket = new (require('dw/order/Basket'))();
                basket.defaultShipment = {
                    shippingAddress: {
                        custom: {}
                    }
                };
                this.currentBasket = basket;
            }
            return this.currentBasket;
        };
        defaultStubs['dw/order/BasketMgr'] = BasketMgr;
        checkoutHelpers = proxyquire('../../../../../cartridges/app_ua_mx/cartridge/scripts/checkout/checkoutHelpers.js', defaultStubs);
        checkoutHelpers.copyShippingAddressToShipment(shippingData, null, type);
        var updatedBasket = BasketMgr.getCurrentBasket();
        assert.deepEqual(expectedAddress, updatedBasket.defaultShipment.shippingAddress.custom);
        assert.equal(updatedBasket.defaultShipment.shippingAddress.city, expectedCity);
    });

    it('Testing method: saveOxxoDetails', () => {
        var order = new (require('dw/order/Order'))();
        var oxxoDetailsResponse = {};

        // No oxxoDetailsResponse data
        assert.doesNotThrow(() => checkoutHelpers.saveOxxoDetails(order, oxxoDetailsResponse));
    });

    it('Testing method: getMxTaxMap', () => {
        // No custom prefs
        assert.doesNotThrow(() => checkoutHelpers.getMxTaxMap());
    });
});
