'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

function getCurrentBasket() {
    return {
        defaultShipment: {
            shippingAddress: {
                firstName: 'Amanda',
                lastName: 'Jones',
                address1: '65 May Lane',
                address2: '',
                city: 'Allston',
                postalCode: '02135',
                countryCode: { value: 'us' },
                phone: '617-555-1234',
                stateCode: 'MA',
                custom: {
                    suburb: 'suburb',
                    district: 'district',
                    businessName: 'businessName'
                },

                setFirstName: function (firstNameInput) { this.firstName = firstNameInput; },
                setLastName: function (lastNameInput) { this.lastName = lastNameInput; },
                setAddress1: function (address1Input) { this.address1 = address1Input; },
                setAddress2: function (address2Input) { this.address2 = address2Input; },
                setCity: function (cityInput) { this.city = cityInput; },
                setPostalCode: function (postalCodeInput) { this.postalCode = postalCodeInput; },
                setStateCode: function (stateCodeInput) { this.stateCode = stateCodeInput; },
                setCountryCode: function (countryCodeInput) { this.countryCode.value = countryCodeInput; },
                setPhone: function (phoneInput) { this.phone = phoneInput; }
            }
        },
        totalGrossPrice: {
            value: 250.00
        },
        billingAddress: {
            firstName: 'Amanda',
            lastName: 'Jones',
            address1: '65 May Lane',
            address2: '',
            city: 'Allston',
            postalCode: '02135',
            countryCode: { value: 'us' },
            phone: '617-555-1234',
            stateCode: 'MA',
            custom: {
                suburb: 'suburb',
                district: 'district',
                businessName: 'businessName'
            }
        },
        productLineItems: [
            {
                UUID: 'testUUID',
                id: 'testProductID',
                quantity: {
                    value: 3
                },
                product: {
                    masterProduct: {
                        custom: {
                            division: 'footwear'
                        }
                    },
                    custom: {
                        availableForLocale: {
                            value: 'No'
                        }
                    }
                }
            },
            {
                UUID: 'testUUID1',
                id: 'testProductID1',
                quantity: {
                    value: 3
                },
                product: {
                    custom: {
                        availableForLocale: {
                            value: 'No'
                        }
                    }
                }
            }
        ],
        couponLineItems: [
            {
              couponCode : 'Test',
              priceAdjustments: [
					{
						promotion : [{coupons: '1355109', length: 1 }, {coupons: '1355109', length: 1}]
					}
				]
            }
        ]
    };
}


describe('app_ua_core/cartridge/scripts/util/promotionHelper', function() {

    it('Testing method getBasketPromotionsByCouponCode: execute', () => {
        let promotionHelper = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/util/promotionHelper', {
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/core/collections'),
            'dw/order/BasketMgr': require('../../../mocks/core/dw/order/BasketMgr')
            });
		var couponCode = 'Test';
        var result = promotionHelper.getBasketPromotionsByCouponCode(couponCode);
        assert.isDefined(result);
    });

    it('Testing method getBasketPromotionsByCouponCode: execute', () => {
        let promotionHelper = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/util/promotionHelper', {
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/core/collections'),
            'dw/order/BasketMgr': {
                getCurrentBasket() {
                    return null;
                } 
            }
            });
		var couponCode = 'Test';
        var result = promotionHelper.getBasketPromotionsByCouponCode(couponCode);
        assert.isDefined(result);
    });

    it('Testing method getBasketPromotionsByCouponCode: execute', () => {
        let promotionHelper = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/util/promotionHelper', {
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/core/collections'),
            'dw/order/BasketMgr': {
                getCurrentBasket: () => {
                    return {
                        couponLineItems: [
                            {
                            couponCode : 'Test',
                            priceAdjustments: [{}]
                        }
                    ]
                } 
            }
            }
        });

		var couponCode = 'Test';
        var result = promotionHelper.getBasketPromotionsByCouponCode(couponCode);
        assert.equal(result[0], null);
    });

    it('Testing method getBasketPromotionsByCouponCode: execute', () => {
        let promotionHelper = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/util/promotionHelper', {
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/core/collections'),
            'dw/order/BasketMgr': {
                getCurrentBasket: () => {
                    return {
                        couponLineItems: [
                            {
                            couponCode : 'Test',
                            priceAdjustments: [
                                {
                                    promotion : {coupons: [{
                                        ID: '1355109'
                                    }], length: 1 , sourceCodeGroups: [{
                                        ID: '1355109'
                                    }], customerGroups:  [{ID: '1355109'}]}
                                }
                            ]
                        }
                    ]
                } 
            }
            }
        });

		var couponCode = 'Test';
        var result = promotionHelper.getBasketPromotionsByCouponCode(couponCode);
        assert.isDefined(result[0]);
    });
});
