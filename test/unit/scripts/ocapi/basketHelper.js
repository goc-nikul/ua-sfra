'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var Collections = require('../../../mocks/dw/dw_util_Collection');
var HashMap = require('../../../mocks/dw/dw_util_HashMap');
var Money = require('../../../mocks/dw/dw_value_Money');

describe('int_ocapi/cartridge/scripts/basketHelper.js', () => {
    var basketHelper = proxyquire('../../../../cartridges/int_ocapi/cartridge/scripts/basketHelper.js', {
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getCustomPreferenceValue: function () {
                        return {};
                    }
                };
            },
            current: {
                getCustomPreferenceValue: function () {
                    return {};
                }
            }
        },
        '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
        '*/cartridge/scripts/errorLogHelper': {
            handleOcapiHookErrorStatus: function () {
                return 'error';
            }
        },
        'int_mao/cartridge/scripts/availability/MAOAvailability': {
            getMaoAvailability: function () {
                return {};
            }
        },
        'int_mao/cartridge/scripts/availability/MAOAvailabilityHelper': {
            getSKUS: function () {
                return {};
            }
        },
        'dw/order/ShippingMgr': {
            getAllShippingMethods: function () {
                return new Collections({
                    ID: 'test1'
                },
                );
            }
        },
        'dw/util/StringUtils': {
            formatCalendar: function () {
                return 'formatted';
            },
            trim: function (param) {
                return param;
            }
        },
        '*/cartridge/scripts/util/DeliveryHelper': {
            getShippingDeliveryDates: function () {
                return {};
            }
        },
        '*/cartridge/scripts/util/TimezoneHelper': function () {
            return {
                getCurrentSiteTime: function () {
                    return {
                        setFullYear: function () {
                            return {};
                        },
                        setMonth: function () {
                            return {};
                        }
                    };
                }
            };
        },
        'dw/catalog/ProductMgr': {
            getProduct: function () {
                return {
                    custom: {}
                };
            }
        },
        '*/cartridge/modules/providers': {
            get: function () {
                return {
                    addressType: function () {
                        return {};
                    }
                };
            }
        },
        'dw/system/Status': function () {},
        '*/cartridge/scripts/checkout/shippingHelpers': {
            getShippingMethodByID: function () {
                return {};
            }
        },
        'app_ua_core/cartridge/scripts/util/DeliveryHelper': {
            getShippingDeliveryDates: function () {
                return {};
            }
        },
        '*/cartridge/scripts/helpers/basketValidationHelpers': {
            getLineItemInventory: function () {
                return 2;
            }
        },
        'dw/web/Resource': {
            msg: function () {
                return 'msg';
            },
            msgf: function () {
                return 'msgf';
            }
        },
        'dw/util/Calendar': function () {
            return {
                after: function () {
                    return {};
                },
                add: function () {
                    return {};
                },
                getTime: function () {
                    return {};
                }
            };
        },
        'dw/order/BasketMgr': {
            getCurrentBasket: function () {
                return {
                    getPriceAdjustmentByPromotionID: function () {
                        return {
                            proratedPrices: {
                                length: 1,
                                get: function () {
                                    return {};
                                }
                            }
                        };
                    }
                };
            }
        },
        '*/cartridge/scripts/checkout/checkoutHelpers': {
            getProductLineItem: function () {
                return {
                    getPriceAdjustmentByPromotionID: function () {
                        return {
                            basedOnCoupon: true,
                            couponLineItem: {
                                couponCode: 'couponCode'
                            }
                        };
                    },
                    proratedPriceAdjustmentPrices: new HashMap([[{
                        basedOnCoupon: true,
                        couponLineItem: {
                            couponCode: 'couponCode'
                        }
                    }, new Money(1)]])
                };
            }
        },
        'dw/system/Logger': {
            getLogger: function () {
                return {
                    error: function () {
                        return 'error';
                    }
                };
            }
        },
        '*/cartridge/scripts/common/klarnaSessionManager': function () {
            return {
                createOrUpdateSessionOCAPI: function () {
                    return {};
                }
            };
        },
        'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
        '~/cartridge/scripts/constants': require('../../../../cartridges/int_ocapi/cartridge/scripts/constants.js')
    });

    it('Testing getRealTimeInventory', () => {
        var basket = {
            getProductLineItems: function () {
                return {};
            }
        };
        var result = basketHelper.getRealTimeInventory(basket);
        assert.isNotNull(result);
    });

    it('Testing setInventoryRecord', () => {
        var basket = {
            getProductLineItems: function () {
                return new Collections({
                    product: {
                        custom: {
                            sku: 'sku'
                        },
                        availabilityModel: {
                            inventoryRecord: {
                                getAllocation: function () {
                                    return {
                                        getValue: function () {
                                            return 1;
                                        }
                                    };
                                },
                                setAllocation: function () {
                                    return {};
                                }
                            }
                        }
                    }
                },
                );
            }
        };
        var maoAvailability = { sku: '{ "TotalQuantity": "TotalQuantity" }' };
        var result = basketHelper.setInventoryRecord(basket, maoAvailability);
        assert.isNotNull(result);
    });

    it('Testing updateShippingAddressToGiftCardShipment', () => {
        var basket = {
            getShipment: function () {
                return {
                    shippingAddress: null,
                    createShippingAddress: function () {
                        return {
                            setFirstName: function () {
                                return {};
                            },
                            setLastName: function () {
                                return {};
                            },
                            setAddress1: function () {
                                return {};
                            },
                            setAddress2: function () {
                                return {};
                            },
                            setCity: function () {
                                return {};
                            },
                            setPostalCode: function () {
                                return {};
                            },
                            setStateCode: function () {
                                return {};
                            },
                            setCountryCode: function () {
                                return {};
                            },
                            setPhone: function () {
                                return {};
                            }
                        };
                    }
                };
            }
        };
        var shippingAddressEntered = {};
        var result = basketHelper.updateShippingAddressToGiftCardShipment(basket, shippingAddressEntered);
        assert.isNotNull(result);
    });

    it('Testing updateShippingEstimatedDeliveryDate', () => {
        var shippingMethodResult = {
            applicable_shipping_methods: [{ id: 'test1' }]
        };
        var result = basketHelper.updateShippingEstimatedDeliveryDate(shippingMethodResult);
        assert.isNotNull(result);
    });

    it('Testing replaceDummyGiftLineItem', () => {
        var basket = {
            getShipment: function () {
                return {};
            },
            createProductLineItem: function () {
                return {
                    replaceProduct: function () {
                        return {};
                    },
                    setQuantityValue: function () {
                        return {};
                    },
                    setPriceValue: function () {
                        return {};
                    },
                    custom: {}
                };
            }
        };
        var eGiftItems = [{
            c_gcDeliveryDate_s: 'c_gcDeliveryDate_s'
        }];
        var result = basketHelper.replaceDummyGiftLineItem(basket, eGiftItems);
        assert.isNotNull(result);
    });

    it('Testing updateAddressType', () => {
        basketHelper.updateAddressType({});
    });

    it('Testing isShippingAddressValid', () => {
        var officeAddress = {};
        global.customer.profile = {
            custom: {
                isEmployee: 'isEmployee'
            }
        };
        basketHelper.isShippingAddressValid(officeAddress, 'sapCarrierCode');
    });

    it('Testing isShippingAddressValid --> not Employee customer', () => {
        var officeAddress = {};
        global.customer.profile = {
            custom: {
                isEmployee: null
            }
        };
        basketHelper.isShippingAddressValid(officeAddress, 'sapCarrierCode');
    });

    it('Testing updateResponse', () => {
        var basketResponse = {
            addFlash: function () {
                return 'added';
            },
            product_items: [
                {
                    quantity: 3,
                    productId: 'productId',
                    price_adjustments: [
                        {
                            creation_date: '1/1/2022',
                            custom: {},
                            price: 1,
                            price_adjustment_id: 'price_adjustment_id',
                            promotion_id: 'promotion_id'
                        }
                    ]
                }
            ],
            c_lineItemPriceAdjustments: ['priceadjust1=1,product_id=productId'],
            productSubTotal: 2.00,
            payment_instruments: [
                {
                    payment_method_id: 'PayPal'
                }
            ],
            shipments: [
                {
                    shippingMethod: {
                        id: 'ID'
                    }
                }
            ],
            shippingItems: [
                {
                    shippingMethod: {
                        price: 10.00
                    }
                }
            ],
            order_price_adjustments: [
                {
                    shippingMethod: {
                        price: 10.00
                    }
                }
            ]
        };
        global.customer.profile = {
            customerNo: 'customerNo'
        };
        global.customer.authenticated = true;
        basketHelper.updateResponse(basketResponse);

        assert.isArray(basketResponse.order_price_adjustments[0].c_customerGroups);
        assert.isArray(basketResponse.product_items[0].price_adjustments[0].c_customerGroups);
        assert.isArray(basketResponse.product_items[0].c_proratedPriceAdjustments);
        assert.equal(basketResponse.product_items[0].c_proratedPriceAdjustments[0].price, 1);
    });

    it('Testing updateResponse --> custom Exception', () => {
        var basketResponse = {
            addFlash: function () {
                return 'added';
            },
            product_items:
            {
                quantity: 3,
                productId: 'productId',
                price_adjustments: [
                    {
                        creation_date: '1/1/2022',
                        custom: {},
                        price: 1,
                        price_adjustment_id: 'price_adjustment_id',
                        promotion_id: 'promotion_id'
                    }
                ]
            },
            c_lineItemPriceAdjustments: ['priceadjust1=1,product_id=productId'],
            productSubTotal: 2.00,
            payment_instruments: [
                {
                    payment_method_id: 'PayPal'
                }
            ],
            shipments: [
                {
                    shippingMethod: {
                        id: 'ID'
                    }
                }
            ],
            shippingItems: [
                {
                    shippingMethod: {
                        price: 10.00
                    }
                }
            ],
            order_price_adjustments: [
                {
                    shippingMethod: {
                        price: 10.00
                    }
                }
            ]
        };
        global.customer.profile = {
            customerNo: 'customerNo'
        };
        global.customer.authenticated = true;
        basketHelper.updateResponse(basketResponse);
    });

    it('Testing updateResponse --> Test Custom Exception', () => {
        var basketResponse = {
            addFlash: function () {
                return 'added';
            },
            product_items: [
                {
                    quantity: 3,
                    productId: 'productId',
                    price_adjustments: [
                        {
                            creation_date: '1/1/2022',
                            custom: {},
                            price: 1,
                            price_adjustment_id: 'price_adjustment_id',
                            promotion_id: 'promotion_id'
                        }
                    ]
                }
            ],
            c_lineItemPriceAdjustments: ['priceadjust1=1,product_id=productId'],
            productSubTotal: 2.00,
            payment_instruments: [
                {
                    payment_method_id: 'PayPal'
                }
            ],
            shipments: [
                {
                    shippingMethod: {
                        id: 'ID'
                    }
                }
            ],
            shippingItems: [
                {
                    shippingMethod: {
                        price: 10.00
                    }
                }
            ],
            order_price_adjustments:
            {
                shippingMethod: {
                    price: 10.00
                }
            }

        };
        global.customer.profile = {
            customerNo: 'customerNo'
        };
        global.customer.authenticated = true;
        basketHelper.updateResponse(basketResponse);
    });

    it('Testing updatePaypalTokenExpirationTime', () => {
        var basket = {
            getPaymentInstruments: function () {
                return [
                    { custom: {} }
                ];
            }
        };
        basketHelper.updatePaypalTokenExpirationTime(basket);
    });

    it('Testing manageKlarnaSession', () => {
        var basket = {
            getPaymentInstruments: function () {
                return [
                    { custom: {} }
                ];
            }
        };
        basketHelper.manageKlarnaSession(basket);
    });

    it('Testing removeApplePayPI --> it should remove apple pay PI from basket', () => {
        var basket = {
            paymentInstruments: [
                {
                    paymentMethod: 'DW_APPLE_PAY'
                }
            ],
            removePaymentInstrument: function (pi) {
                const index = this.paymentInstruments.indexOf(pi);
                if (index > -1) {
                    this.paymentInstruments.splice(index, 1);
                }
            },
            getPaymentInstruments: function () {
                return this.paymentInstruments;
            }
        };
        basketHelper.removeApplePayPI(basket);
        assert.equal(basket.getPaymentInstruments().length, 0);
    });

    it('Testing removeApplePayPI --> it should only remove apple pay PI from basket', () => {
        var basket = {
            paymentInstruments: [
                {
                    paymentMethod: 'DW_APPLE_PAY'
                },
                {
                    paymentMethod: 'AURUS_CREDIT_CARD'
                }
            ],
            removePaymentInstrument: function (pi) {
                const index = this.paymentInstruments.indexOf(pi);
                if (index > -1) {
                    this.paymentInstruments.splice(index, 1);
                }
            },
            getPaymentInstruments: function () {
                return this.paymentInstruments;
            }
        };
        basketHelper.removeApplePayPI(basket);
        for (let item of basket.getPaymentInstruments()) {
            assert.equal(item.paymentMethod, 'AURUS_CREDIT_CARD');
        }
    });
});
