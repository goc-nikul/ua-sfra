'use strict';

var assert = require('chai').assert;
var mockSuperModule = require('../../mockModuleSuperModule');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const Customer = require('../../mocks/dw/dw_customer_Customer');
var Site = require('../../mocks/dw/dw_system_Site');
var baseCartModelMock = require('../../mocks/core/dw/model/baseCartModel');

class Calendar {
    constructor(date) {
        this.date = date;
        return {
            toTimeString: function () {
                return '01/01/2020';
            },
            setTimeZone: () => {
                return date;
            }
        };
    }
}

var Order;
before(() => {
    mockSuperModule.create(baseCartModelMock);

    Order = proxyquire('../../../cartridges/app_ua_core/cartridge/models/order', {
        'dw/web/URLUtils': {},
        'dw/order/PaymentMgr': {},
        'dw/util/StringUtils': require('../../mocks/dw/dw_util_StringUtils'),
        'dw/web/Resource': {
            msg: function () {
                return 'someString';
            },
            msgf: function () {
                return 'someString';
            }
        },
        '*/cartridge/scripts/giftcard/giftcardHelper': {
            basketHasGiftCardItems: function () {
                return {
                    eGiftCards: 'eGiftCards',
                    giftCards: 'giftCards',
                    onlyEGiftCards: false
                };
            },
            getRemainingBalance: () => {
                return '100';
            }
        },
        '*/cartridge/scripts/cart/cartHelpers': {
            hasPreOrderItems: function () {
                return false;
            }
        },
        'dw/system/Site': Site,
        '*/cartridge/scripts/vipDataHelpers': {
            isVIPOrder: () => {
                return false;
            },
            getVipRenderingTemplate: () => {
                return null;
            },
            getVipPoints:() => {
	                return {
			            availablePoints: '$67.43',
		                usedPoints: '$44.99',
		                remainingPoints: '$0.0',
		                pointsApplied: false,
		                partialsPointsApplied: true,
		                vipPromotionEnabled: false
	                };
                }
        },
        '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
        '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
            basketHasInStorePickUpShipment: () => {
                return false;
            },
            basketHasOnlyBOPISProducts: () => {
                return false;
            },
            getCountOfBopisItems: () => {
                return {
                    numberOfBopisItems: 2,
                    numberOfNonBopisItems: 5
                };
            }
        },
        'dw/util/Calendar': Calendar,
        'dw/system/System': {
            getInstanceTimeZone: () => {
                return {
                    add: () => null,
                    getTime: () => {
                        return {
                            getTime: () => 100000
                        };
                    }
                };
            }
        },
        'dw/value/Money': require('../../mocks/dw/dw_value_Money'),
        '*/cartridge/scripts/UACAPI/helpers/order/orderHelpers': {
            getCancelReasons: () => {
                return 'SIZE_ISSUE';
            }
        }
    });
});

var createApiBasket = function () {
    return {
        billingAddress: true,
        defaultShipment: {
            shippingAddress: {
                custom: {
                    isOfficeAddress: true
                }
            }
        },
        creationDate: 'some Date',
        customerEmail: 'some Email',
        discounts: [],
        adjustedShippingTotalPrice: {
            value: 20.00,
            available: true
        },
        shipments: [{
            id: 'me'
        }],
        safeOptions: {
            usingMultiShipping: true
        },
        getCurrencyCode: () => {
            return 'USA';
        },
        getPaymentInstruments: () => {
            return false;
        }
    };
};

var config = {
    numberOfLineItems: '*'
};


describe('Order', function () {

    it('should handle a basket object ', function () {
        var result = new Order(createApiBasket(), { config: config });
        assert.equal(result.formatedCreationDate, '01/01/2020');
        assert.equal(result.currencyCode, 'USA');
        assert.isFalse(result.hasBopisItems);
        assert.isFalse(result.isVIP);
    });

    it('should handle without basket object', function () {
        var result = new Order(null, { config: {
            numberOfLineItems: 'single'
        } });
        assert.equal(result.formatedCreationDate, null);
        assert.equal(result.currencyCode, null);
        assert.equal(result.vertexTaxCalculated, false);
        assert.equal(result.total, '');
    });

    // !!! NOT APPLICABLE
    //  ... every lineItemContainer (basket/order) has a defaultShipment
    it('should handle a basket that does not have a defaultShipment', function () {
        var result = new Order(createApiBasket(), { usingMultiShipping: true });
        assert.equal(result.usingMultiShipping, true);
    });

    it('should return employee office address enabled value', function () {
        global.customer = new Customer();
        global.customer.authenticated = true;
        global.customer.profile.custom.isEmployee = true;
        var result = new Order(createApiBasket(), { usingMultiShipping: true });
        assert.equal(result.isOfficeAddress, true);
    });

    it('should return formatedCreationDate value to be null', function () {
        var basket = createApiBasket();
        basket.creationDate = null;
        var result = new Order(basket, { usingMultiShipping: true });
        assert.equal(result.formatedCreationDate, null);
    });

    it('should return giftCard amount when it enabled', function () {
        mockSuperModule.create(baseCartModelMock);
        var createApiBaskets = function () {
            return {
                billingAddress: true,
                defaultShipment: {
                    shippingAddress: {
                        custom: {
                            isOfficeAddress: true
                        }
                    }
                },
                creationDate: 'some Date',
                customerEmail: 'some Email',
                discounts: [],
                adjustedShippingTotalPrice: {
                    value: 20.00,
                    available: true
                },
                shipments: [{
                    id: 'me'
                }],
                safeOptions: {
                    usingMultiShipping: true
                },
                getCurrencyCode: () => {
                    return 'USA';
                },
                getPaymentInstruments: () => {
                    return {
                        length: 1
                    };
                }
            };
        };
        Order = proxyquire('../../../cartridges/app_ua_core/cartridge/models/order', {
            'dw/web/URLUtils': {
            },
            'dw/order/PaymentMgr': {
            },
            'dw/util/StringUtils': require('../../mocks/dw/dw_util_StringUtils'),
            'dw/web/Resource': {
                msg: function () {
                    return 'someString';
                },
                msgf: function () {
                    return 'someString';
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                basketHasGiftCardItems: function () {
                    return {
                        eGiftCards: 'eGiftCards',
                        giftCards: 'giftCards',
                        onlyEGiftCards: false
                    };
                },
                getRemainingBalance: () => {
                    return '100';
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/system/Site': Site,
            '*/cartridge/scripts/vipDataHelpers': {
                isVIPOrder: () => {
                    return false;
                },
                getVipRenderingTemplate: () => {
                    return null;
                },
                getVipPoints:() => {
	                return {
			            availablePoints: '$67.43',
		                usedPoints: '$44.99',
		                remainingPoints: '$0.0',
		                pointsApplied: false,
		                partialsPointsApplied: true,
		                vipPromotionEnabled: false
	                };
                }
            },
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: () => {
                    return false;
                },
                basketHasOnlyBOPISProducts: () => {
                    return false;
                },
                getCountOfBopisItems: () => {
                    return {
                        numberOfBopisItems: 2,
                        numberOfNonBopisItems: 5
                    };;
                }
            },
            'dw/util/Calendar': Calendar,
            'dw/system/System': {
                getInstanceTimeZone: () => {
                    return {
                        add: () => null,
                        getTime: () => {
                            return {
                                getTime: () => 100000
                            };
                        }
                    };
                }
            },
            'dw/value/Money': require('../../mocks/dw/dw_value_Money'),
            '*/cartridge/scripts/UACAPI/helpers/order/orderHelpers': {
                getCancelReasons: () => {
                    return 'SIZE_ISSUE';
                }
            }
        });
        var result = new Order(createApiBaskets(), { usingMultiShipping: true });
        assert.equal(result.totals.grandTotal, '$100');
    });

    it('should return the BOPIS items when it is enabled', function () {
        mockSuperModule.create(baseCartModelMock);
        class Sites {
            constructor() {
                this.preferenceMap = {
                    isBOPISEnabled: true,
                    enableVIPCheckoutExperience: true
                };
                this.preferences = {
                    custom: this.preferenceMap
                };
            }
            getCustomPreferenceValue(key) {
                return this.preferenceMap[key];
            }
            getPreferences() {
                return {
                    getCustom: () => {
                        return this.preferenceMap;
                    },
                    custom: this.preferenceMap
                };
            }
            // dw.system.Site methods
            static getCurrent() {
                if (Sites.current) {
                    return Sites.current;
                }
                return new Sites();
            }
        }
        Sites.current = Sites.getCurrent();
        Order = proxyquire('../../../cartridges/app_ua_core/cartridge/models/order', {
            'dw/web/URLUtils': {
            },
            'dw/order/PaymentMgr': {
            },
            'dw/util/StringUtils': require('../../mocks/dw/dw_util_StringUtils'),
            'dw/web/Resource': {
                msg: function () {
                    return 'someString';
                },
                msgf: function () {
                    return 'someString';
                }
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                basketHasGiftCardItems: function () {
                    return {
                        eGiftCards: 'eGiftCards',
                        giftCards: 'giftCards',
                        onlyEGiftCards: false
                    };
                },
                getRemainingBalance: () => {
                    return '100';
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                hasPreOrderItems: function () {
                    return false;
                }
            },
            'dw/system/Site': Sites,
            '*/cartridge/scripts/vipDataHelpers': {
                isVIPOrder: () => {
                    return true;
                },
                getVipRenderingTemplate: () => {
                    return null;
                },
                getVipPoints:() => {
	                return {
			            availablePoints: '$67.43',
		                usedPoints: '$44.99',
		                remainingPoints: '$0.0',
		                pointsApplied: false,
		                partialsPointsApplied: true,
		                vipPromotionEnabled: false
	                };
                }
            },
            '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
                basketHasInStorePickUpShipment: () => {
                    return true;
                },
                basketHasOnlyBOPISProducts: () => {
                    return true;
                },
                getCountOfBopisItems: () => {
                    return {
                        numberOfBopisItems: 2,
                        numberOfNonBopisItems: 5
                    };
                }
            },
            'dw/util/Calendar': Calendar,
            'dw/system/System': {
                getInstanceTimeZone: () => {
                    return {
                        add: () => null,
                        getTime: () => {
                            return {
                                getTime: () => 100000
                            };
                        }
                    };
                }
            },
            'dw/value/Money': require('../../mocks/dw/dw_value_Money'),
            '*/cartridge/scripts/UACAPI/helpers/order/orderHelpers': {
                getCancelReasons: () => {
                    return 'SIZE_ISSUE';
                }
            }
        });
        var result = new Order(createApiBasket(), { config: config });
        assert.equal(result.hasBopisItems, true);
        assert.equal(result.hasOnlyBopisItems, true);
        assert.equal(result.numberOfBopisItems, '2');
        assert.equal(result.numberOfNonBopisItems, '5');
        assert.isTrue(result.isVIPOrder, true);
    });
});
