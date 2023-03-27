'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var Logger = require('../../mocks/dw/dw_system_Logger');
var ArrayList = require('../../../cartridges/storefront-reference-architecture/test/mocks/dw.util.Collection');
var pathToCoreMock = '../../mocks/';
var Money = require('../../mocks/dw/dw_value_Money');

var session = {
    custom: {
        applepaysession: 'yes'
    },
    privacy: {
        activeOrder: 'yes',
        applepayerror_emoji: true
    },
    currency: {
        currencyCode: 'USD',
        defaultFractionDigits: 10,
        name: 'US Dollars',
        symbol: '$'
    }
};
var createApiBasket = function () {
    var basket = {
        allProductLineItems: new ArrayList([{
            bonusProductLineItem: false,
            gift: false,
            UUID: 'some UUID',
            adjustedPrice: {
                value: 'some value',
                currencyCode: 'US'
            },
            quantity: {
                value: 1
            },
            getAdjustedPrice: function () {
                return this.adjustedPrice;
            }
        }]),
        totalGrossPrice: new Money(0, session.currency.currencyCode),
        totalTax: new Money(0, session.currency.currencyCode),
        shippingTotalPrice: new Money(0, session.currency.currencyCode)
    };

    basket.shipments = [{
        shippingMethod: {
            ID: '005'
        },
        shippingAddress: {
            address1: '1 Drury Lane',
            address2: null,
            countryCode: {
                displayValue: 'United States',
                value: 'US'
            },
            firstName: 'The Muffin',
            lastName: 'Man',
            city: 'Far Far Away',
            phone: '333-333-3333',
            postalCode: '04330',
            stateCode: 'ME',
            setPhone: function (phoneNumber) { },
            setCountryCode: function (countryCode) { }
        },
        getShippingAddress() {
            return this.shippingAddress;
        }
    }];

    basket.defaultShipment = basket.shipments[0];

    basket.getDefaultShipment = function () {
        return basket.shipments[0];
    };
    basket.getShipments = function () {
        return basket.shipments;
    };
    basket.getAllProductLineItems = function () {
        return basket.allProductLineItems;
    };
    basket.getAdjustedMerchandizeTotalPrice = function () {
        return new Money(0, session.currency.currencyCode);
    };
    basket.getAdjustedShippingTotalPrice = function () {
        return new Money(0, session.currency.currencyCode);
    };
    return basket;
};

describe('app_ua_core/cartridge/scripts/helpers/applePayHelper test', () => {
    let emojiRegex;
    let Resource = {
        msg: function () {
            return emojiRegex;
        }
    };
    global.empty = (data) => {
        return !data;
    };
    global.session = session;
    let applePayHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/applePayHelper', {
        '*/cartridge/scripts/util/collections': require('../../../cartridges/lib_productlist/test/mocks/util/collections'),
        'dw/web/Resource': Resource,
        'dw/system/Logger': Logger,
        'ApplePayLogger': Logger.getLogger(),
        'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
        'dw/order/ShippingMgr': require(pathToCoreMock + 'dw/dw_order_ShippingMgr'),
        'dw/value/Money': require('../../mocks/dw/dw_value_Money')
    });

    it('Testing method: removeEmojis', () => {
        emojiRegex = "(?:[\\u2700-\\u27bf]|(?:\\ud83c[\\udde6-\\uddff]){2}|[\\ud800-\\udbff][\\udc00-\\udfff]|[\\u0023-\\u0039]\\ufe0f?\\u20e3|\\u3299|\\u3297|\\u303d|\\u3030|\\u24c2|\\ud83c[\\udd70-\\udd71]|\\ud83c[\\udd7e-\\udd7f]|\\ud83c\\udd8e|\\ud83c[\\udd91-\\udd9a]|\\ud83c[\\udde6-\\uddff]|[\\ud83c[\\ude01-\\ude02]|\\ud83c\\ude1a|\\ud83c\\ude2f|[\\ud83c[\\ude32-\\ude3a]|[\\ud83c[\\ude50-\\ude51]|\\u203c|\\u2049|[\\u25aa-\\u25ab]|\\u25b6|\\u25c0|[\\u25fb-\\u25fe]|\\u00a9|\\u00ae|\\u2122|\\u2139|\\ud83c\\udc04|[\\u2600-\\u26FF]|\\u2b05|\\u2b06|\\u2b07|\\u2b1b|\\u2b1c|\\u2b50|\\u2b55|\\u231a|\\u231b|\\u2328|\\u23cf|[\\u23e9-\\u23f3]|[\\u23f8-\\u23fa]|\\ud83c\\udccf|\\u2934|\\u2935|[\\u2190-\\u21ff])";
        var originalObject = {
            address1: '1 Microsoft way \u27BFhello',
            city: 'Redmond\u27BF'
        };
        var isTrimmed = applePayHelper.removeEmojis(originalObject, ['address1', 'city']);
        assert.deepEqual(originalObject, { address1: '1 Microsoft way hello', city: 'Redmond' });
        assert.equal(isTrimmed, true);
    });

    it('Testing method: formatPhoneNumber', () => {
        var isFormatted = applePayHelper.formatPhoneNumber('998-095-6868');
        assert.equal(isFormatted, '9980956868');
    });

    it('Testing method: isEmptyFieldPassed', () => {
        var fieldsToCheck = ['address1', 'city', 'state'];
        var object = {
            'address1': '',
            'city': 'Redmond',
            'state': 'CA'
        }
        var isEmpty = applePayHelper.isEmptyFieldPassed(object, fieldsToCheck);
        assert.equal(isEmpty, true);
    });

    it('Testing method: validatePostal', () => {
        emojiRegex = '^[0-9]{5}(?:-[0-9]{4})?$';
        var postalCode = '98052';
        var isValidPostalCode = !applePayHelper.validatePostal(postalCode);
        assert.equal(isValidPostalCode, true);
    });

    it('Testing method: getShippingMethodCost', () => {
        var ShippingMgr = require(pathToCoreMock + 'dw/dw_order_ShippingMgr');
        var BasketMgr = require('../../../cartridges/storefront-reference-architecture/test/mocks/dw/order/BasketMgr');
        var shippingMethod = ShippingMgr.getDefaultShippingMethod();

        //var basket = BasketMgr.getCurrentBasket();
        var shipment = require(pathToCoreMock + 'dw/dw_order_Shipment');
        var basket = require(pathToCoreMock + 'dw/dw_order_Basket');
        basket.shipments = [];
        basket.createShipment = function (shipment) {
            this.shipments.push(shipment);
            return shipment;
        }
        basket.defaultShipment = BasketMgr.getCurrentBasket().defaultShipment;
        basket.createShipment(new shipment());
        basket.allProductLineItems = basket.shipments[0].getProductLineItems();
        var shippingPrice = applePayHelper.getShippingMethodCost(basket, shippingMethod);
        assert.equal(shippingPrice, 7.99);
    });

    it('Testing method: getResponseObject', () => {
        //var basket = new Cart(createApiBasket());
        var basket = createApiBasket();
        global.session.currency = { currencyCode: 'USD' }
        var expectedStr = '{"orderTotal":{"available":true,"currencyCode":"USD","value":0, "valueOrNull":0},"lineItems":[{"type":"final","label":"Subtotal","amount":0},{"type":"final","amount":0},{"type":"final","label":"Estimated Tax","amount":0}],"total":{"label":"Under Armour","amount":0}}';
        var expected = JSON.parse(expectedStr);
        var responseObject = applePayHelper.getResponseObject(basket);
        responseObject = JSON.stringify(responseObject);
        assert.deepEqual(JSON.parse(responseObject), expected);
    });

    it('Testing method: getShippingMethodCost --> basket with product line items', () => {
        var ShippingMgr = require(pathToCoreMock + 'dw/dw_order_ShippingMgr');
        var BasketMgr = require('../../../cartridges/storefront-reference-architecture/test/mocks/dw/order/BasketMgr');
        var shippingMethod = ShippingMgr.getDefaultShippingMethod();
        var shipment = require(pathToCoreMock + 'dw/dw_order_Shipment');
        var basket = require(pathToCoreMock + 'dw/dw_order_Basket');
        basket.shipments = [];
        basket.createShipment = function (shipment) {
            this.shipments.push(shipment);
            return shipment;
        }
        basket.defaultShipment = BasketMgr.getCurrentBasket().defaultShipment;
        basket.createShipment(new shipment());
        var product = {
            product: {
            },
            quantity: {
                value: 1
            }
        };
        ShippingMgr.getProductShippingModel = function () {
            return {
                getShippingCost: function () {
                    return {
                        getAmount: function () {
                            return  {
                                value: 1
                            };
                        },
                        isSurcharge: function () {
                            return true;
                        }
                    };
                }
            }
        };
        basket.allProductLineItems =  new ArrayList([product])
        var shippingPrice = applePayHelper.getShippingMethodCost(basket, shippingMethod);
        assert.equal(shippingPrice, 7.99);
    });

    it('Testing method: getResponseObject --> getAdjustedPrice not null', () => {
        var basket = createApiBasket();
        basket.getAllProductLineItems = function () {
          return new ArrayList(
            [{
                bonusProductLineItem: false,
                gift: false,
                UUID: 'some UUID',
                adjustedPrice: {
                    value: 'some value',
                    currencyCode: 'US'
                },
                quantity: {
                    value: 1
                },
                getAdjustedPrice: function () {
                    return {
                        valueOrNull: 4
                    };
                }
            }]
          )
        };
        basket.getAdjustedMerchandizeTotalPrice = function () {
            return {
                subtract: function () {
                    return 3;
                }
            };
        };
        basket.shippingTotalPrice = {
            available:true,
            currencyCode:'USD',
            value:0,
            valueOrNull:0,
            subtract: function () {
                return {
                    add: function () {
                        return {
                            value: 3
                        };
                    }
                }
            }
        }
        global.session.currency = { currencyCode: 'USD' }
        var expectedStr = '{"orderTotal":{"available":true,"currencyCode":"USD","value":0, "valueOrNull":0},"lineItems":[{"type":"final","label":"Subtotal","amount":0},{"type":"final","amount":0},{"type":"final","label":"Estimated Tax","amount":0}],"total":{"label":"Under Armour","amount":0}}';
        var expected = JSON.parse(expectedStr);
        var responseObject = applePayHelper.getResponseObject(basket);
        responseObject = JSON.stringify(responseObject);
        assert.isNotNull(responseObject);
    });

    it('Testing method: getApplicableShippingMethods', () => {
        var PLIS = new ArrayList(
            [{
                bonusProductLineItem: false,
                gift: false,
                UUID: 'some UUID',
                adjustedPrice: {
                    value: 'some value',
                    currencyCode: 'US'
                },
                quantity: {
                    value: 1
                },
                getAdjustedPrice: function () {
                    return {
                        valueOrNull: 4
                    };
                },
                product: {
                    custom: {
                        isPreOrder: true
                    }
                }
            }]
          )
        applePayHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/applePayHelper', {
            '*/cartridge/scripts/util/collections': require('../../../cartridges/lib_productlist/test/mocks/util/collections'),
            'dw/web/Resource': Resource,
            'dw/system/Logger': Logger,
            'ApplePayLogger': Logger.getLogger(),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/order/ShippingMgr': require(pathToCoreMock + 'dw/dw_order_ShippingMgr'),
            'dw/value/Money': require('../../mocks/dw/dw_value_Money'),
            'dw/order/Shipment': {},
            'dw/order/BasketMgr': {
                getCurrentBasket: function () {
                    return {
                        custom: {
                            isCommercialPickup: false
                        },
                        defaultShipment: {
                            shippingAddress: {
                                countryCode: {}
                            }
                        },
                        productLineItems: PLIS
                    };
                }
            },
            'dw/util/ArrayList': require('../../mocks/scripts/util/dw.util.Collection'),
        });
        var ShippingMgr = {};
        ShippingMgr.getShipmentShippingModel = function () {
            return {
                getApplicableShippingMethods: function () {
                    return new ArrayList (
                        [
                            {
                                ID: 'standard-pre-order-AK-HI',
                                custom: {
                                    storePickupEnabled: false,
                                    isHALshippingMethod: false
                                }
                            }
                        ]
                    )
                },
                getShippingCost: function () {
                    return {
                        getAmount: function () {
                            return {}
                        }
                    }
                }
            }
        }
        var basket = createApiBasket();
        basket.productLineItems = PLIS
        basket.defaultShipment.shippingMethod.ID = 'standard-pre-order-AK-HI';
        var result = applePayHelper.getApplicableShippingMethods(basket);
        assert.equal(result.shippingMethods.length, 3)
    });

    it('Testing method: getApplicableShippingMethods --> isPreOrder custom attribute is false', () => {
        var PLIS = new ArrayList(
            [{
                bonusProductLineItem: false,
                gift: false,
                UUID: 'some UUID',
                adjustedPrice: {
                    value: 'some value',
                    currencyCode: 'US'
                },
                quantity: {
                    value: 1
                },
                getAdjustedPrice: function () {
                    return {
                        valueOrNull: 4
                    };
                },
                product: {
                    custom: {
                        isPreOrder: true
                    }
                }
            }]
          )
        applePayHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/applePayHelper', {
            '*/cartridge/scripts/util/collections': require('../../../cartridges/lib_productlist/test/mocks/util/collections'),
            'dw/web/Resource': Resource,
            'dw/system/Logger': Logger,
            'ApplePayLogger': Logger.getLogger(),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/order/ShippingMgr': require(pathToCoreMock + 'dw/dw_order_ShippingMgr'),
            'dw/value/Money': require('../../mocks/dw/dw_value_Money'),
            'dw/order/Shipment': {},
            'dw/order/BasketMgr': {
                getCurrentBasket: function () {
                    return {
                        custom: {
                            isCommercialPickup: true
                        },
                        defaultShipment: {
                            shippingAddress: {
                                countryCode: {}
                            }
                        },
                        productLineItems: PLIS
                    };
                }
            },
            'dw/util/ArrayList': require('../../mocks/scripts/util/dw.util.Collection'),
        });
        var ShippingMgr = {};
        ShippingMgr.getShipmentShippingModel = function () {
            return {
                getApplicableShippingMethods: function () {
                    return new ArrayList (
                        [
                            {
                                ID: 'standard-pre-order-AK-HI',
                                custom: {
                                    storePickupEnabled: true,
                                    isHALshippingMethod: false
                                }
                            }
                        ]
                    )
                },
                getShippingCost: function () {
                    return {
                        getAmount: function () {
                            return {}
                        }
                    }
                }
            }
        }
        var basket = createApiBasket();
        basket.productLineItems = PLIS
        basket.defaultShipment.shippingMethod.ID = 'standard-pre-order-AK-HI';
        var result = applePayHelper.getApplicableShippingMethods(basket);
        assert.equal(result.shippingMethods.length, 3)
    });

    it('Testing method: getApplicableShippingMethods --> isPreOrder attribute is true', () => {
        var PLIS = new ArrayList(
            [{
                bonusProductLineItem: false,
                gift: false,
                UUID: 'some UUID',
                adjustedPrice: {
                    value: 'some value',
                    currencyCode: 'US'
                },
                quantity: {
                    value: 1
                },
                getAdjustedPrice: function () {
                    return {
                        valueOrNull: 4
                    };
                },
                product: {
                    custom: {
                        isPreOrder: true
                    }
                }
            }]
          )
        applePayHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/applePayHelper', {
            '*/cartridge/scripts/util/collections': require('../../../cartridges/lib_productlist/test/mocks/util/collections'),
            'dw/web/Resource': Resource,
            'dw/system/Logger': Logger,
            'ApplePayLogger': Logger.getLogger(),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/order/ShippingMgr': require(pathToCoreMock + 'dw/dw_order_ShippingMgr'),
            'dw/value/Money': require('../../mocks/dw/dw_value_Money'),
            'dw/order/Shipment': {},
            'dw/order/BasketMgr': {
                getCurrentBasket: function () {
                    return {
                        custom: {
                            isCommercialPickup: true
                        },
                        defaultShipment: {
                            shippingAddress: {
                                countryCode: {}
                            }
                        },
                        productLineItems: PLIS
                    };
                }
            },
            'dw/util/ArrayList': require('../../mocks/scripts/util/dw.util.Collection'),
        });
        var ShippingMgr = {};
        ShippingMgr.getShipmentShippingModel = function () {
            return {
                getApplicableShippingMethods: function () {
                    return new ArrayList (
                        [
                            {
                                ID: 'standard-pre-order-AK-HI',
                                custom: {
                                    storePickupEnabled: true,
                                    isHALshippingMethod: false
                                }
                            }
                        ]
                    )
                },
                getShippingCost: function () {
                    return {
                        getAmount: function () {
                            return {}
                        }
                    }
                }
            }
        }
        var basket = createApiBasket();
        basket.productLineItems = PLIS
        basket.defaultShipment.shippingMethod.ID = 'standard-pre-order-AK-HI';
        var result = applePayHelper.getApplicableShippingMethods(basket);
        assert.equal(result.shippingMethods.length, 3)
    });

    it('Testing method: getApplicableShippingMethods --> hasPreOrderProductsInBasket', () => {
        var PLIS = new ArrayList(
            [{
                bonusProductLineItem: false,
                gift: false,
                UUID: 'some UUID',
                adjustedPrice: {
                    value: 'some value',
                    currencyCode: 'US'
                },
                quantity: {
                    value: 1
                },
                getAdjustedPrice: function () {
                    return {
                        valueOrNull: 4
                    };
                },
                product: {
                    custom: {
                        isPreOrder: true
                    }
                }
            }]
          )
        applePayHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/applePayHelper', {
            '*/cartridge/scripts/util/collections': require('../../../cartridges/lib_productlist/test/mocks/util/collections'),
            'dw/web/Resource': Resource,
            'dw/system/Logger': Logger,
            'ApplePayLogger': Logger.getLogger(),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/order/ShippingMgr': require(pathToCoreMock + 'dw/dw_order_ShippingMgr'),
            'dw/value/Money': require('../../mocks/dw/dw_value_Money'),
            'dw/order/Shipment': {},
            'dw/order/BasketMgr': {
                getCurrentBasket: function () {
                    return {
                        custom: {
                            isCommercialPickup: true
                        },
                        defaultShipment: {
                            shippingAddress: {
                                countryCode: {}
                            }
                        },
                        productLineItems: PLIS
                    };
                }
            },
            'dw/util/ArrayList': require('../../mocks/scripts/util/dw.util.Collection'),
        });
        var ShippingMgr = {};
        ShippingMgr.getShipmentShippingModel = function () {
            return {
                getApplicableShippingMethods: function () {
                    return new ArrayList (
                        [
                            {
                                ID: 'standard-pre-order-AK-HI',
                                custom: {
                                    storePickupEnabled: true,
                                    isHALshippingMethod: false
                                }
                            }
                        ]
                    )
                },
                getShippingCost: function () {
                    return {
                        getAmount: function () {
                            return {}
                        }
                    }
                }
            }
        }
        var basket = createApiBasket();
        basket.productLineItems = PLIS;
        basket.defaultShipment.shippingMethod.ID = '001';
        var result = applePayHelper.getApplicableShippingMethods(basket);
        assert.equal(result.shippingMethods.length, 3)
    });

    it('Testing method: getApplicableShippingMethods --> shipping address is equal to null', () => {
        var PLIS = new ArrayList(
            [{
                bonusProductLineItem: false,
                gift: false,
                UUID: 'some UUID',
                adjustedPrice: {
                    value: 'some value',
                    currencyCode: 'US'
                },
                quantity: {
                    value: 1
                },
                getAdjustedPrice: function () {
                    return {
                        valueOrNull: 4
                    };
                },
                product: {
                    custom: {
                        isPreOrder: true
                    }
                }
            }]
          )
        applePayHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/applePayHelper', {
            '*/cartridge/scripts/util/collections': require('../../../cartridges/lib_productlist/test/mocks/util/collections'),
            'dw/web/Resource': Resource,
            'dw/system/Logger': Logger,
            'ApplePayLogger': Logger.getLogger(),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/order/ShippingMgr': require(pathToCoreMock + 'dw/dw_order_ShippingMgr'),
            'dw/value/Money': require('../../mocks/dw/dw_value_Money'),
            'dw/order/Shipment': {},
            'dw/order/BasketMgr': {
                getCurrentBasket: function () {
                    return {
                        custom: {
                            isCommercialPickup: true
                        },
                        defaultShipment: {
                            shippingAddress: null
                        },
                        productLineItems: PLIS
                    };
                }
            },
            'dw/util/ArrayList': require('../../mocks/scripts/util/dw.util.Collection'),
        });
        var ShippingMgr = {};
        ShippingMgr.getShipmentShippingModel = function () {
            return {
                getApplicableShippingMethods: function () {
                    return new ArrayList (
                        [
                            {
                                ID: 'standard-pre-order-AK-HI',
                                custom: {
                                    storePickupEnabled: true,
                                    isHALshippingMethod: false
                                }
                            }
                        ]
                    )
                },
                getShippingCost: function () {
                    return {
                        getAmount: function () {
                            return {}
                        }
                    }
                }
            }
        }
        var basket = createApiBasket();
        basket.productLineItems = PLIS;
        basket.defaultShipment.shippingMethod.ID = '001';
        basket.defaultShipment.shippingAddress = null;
        var result = applePayHelper.getApplicableShippingMethods(basket);
        assert.isUndefined(result.length, 'result is not defined');
    });

    it('Testing method: removeEmojis --> empty updatedValue', () => {
        emojiRegex = "(?:[\\u2700-\\u27bf]|(?:\\ud83c[\\udde6-\\uddff]){2}|[\\ud800-\\udbff][\\udc00-\\udfff]|[\\u0023-\\u0039]\\ufe0f?\\u20e3|\\u3299|\\u3297|\\u303d|\\u3030|\\u24c2|\\ud83c[\\udd70-\\udd71]|\\ud83c[\\udd7e-\\udd7f]|\\ud83c\\udd8e|\\ud83c[\\udd91-\\udd9a]|\\ud83c[\\udde6-\\uddff]|[\\ud83c[\\ude01-\\ude02]|\\ud83c\\ude1a|\\ud83c\\ude2f|[\\ud83c[\\ude32-\\ude3a]|[\\ud83c[\\ude50-\\ude51]|\\u203c|\\u2049|[\\u25aa-\\u25ab]|\\u25b6|\\u25c0|[\\u25fb-\\u25fe]|\\u00a9|\\u00ae|\\u2122|\\u2139|\\ud83c\\udc04|[\\u2600-\\u26FF]|\\u2b05|\\u2b06|\\u2b07|\\u2b1b|\\u2b1c|\\u2b50|\\u2b55|\\u231a|\\u231b|\\u2328|\\u23cf|[\\u23e9-\\u23f3]|[\\u23f8-\\u23fa]|\\ud83c\\udccf|\\u2934|\\u2935|[\\u2190-\\u21ff])";
        var originalObject = {
            address1: '1 Microsoft way \u27BFhello',
            city: '  '
        };
        var isTrimmed = applePayHelper.removeEmojis(originalObject, ['address1', 'city']);
        assert.equal(isTrimmed, false);
    });

    it('Testing method: formatPhoneNumber --> pass empty string', () => {
        var isFormatted = applePayHelper.formatPhoneNumber('');
        assert.equal(false, isFormatted);
    });

    it('Testing method: isEmptyFieldPassed --> add suburb field', () => {
        var fieldsToCheck = ['suburb', 'address1', 'city', 'state'];
        var object = {
            custom: {
                'suburb': 'suburb',
            },
            'address1': '',
            'city': 'Redmond',
            'state': 'CA',
        }
        var isEmpty = applePayHelper.isEmptyFieldPassed(object, fieldsToCheck);
        assert.equal(isEmpty, true);
    });

    it('Testing method: validatePostal --> pass CA as a country', () => {
        emojiRegex = '^[0-9]{5}(?:-[0-9]{4})?$';
        var postalCode = '98052';
        var isValidPostalCode = !applePayHelper.validatePostal(postalCode, 'CA');
        assert.equal(isValidPostalCode, true);
    });

    it('Testing method: authorize', () => {

        var applyPayServiceHandler = {
            data: {},
            configObj: {},
            client: {
                text: '{"success":true,"message":"success"}'
            },
            mock: false,
            request: {},
            URL: ''
        };

        var service = {
            configuration: {
                credential: {
                    URL: 'URL',
                    user: '111',
                    password: '222'
                }
            },
            URL: null,
            headers: [],
            method: 'GET',
            addHeader: function (key, value) {
                this.headers[key] = value;
            },
            setRequestMethod: function (method) {
                this.method = method;
            },
            setURL: function (url) {
                this.URL = url;
            },
            setAuthentication: function (auth) {
                this.auth = auth;
            },
            client:{
                setTimeout: function(time) {
                    this.time = time;
                },
                open: function(client,url) {
                    this.client = client;
                },
                sendAndReceiveToFile: function(client) {
                    this.client = client;
                }
            }
        };

        applePayHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/applePayHelper', {
            '*/cartridge/scripts/util/collections': require('../../../cartridges/lib_productlist/test/mocks/util/collections'),
            'dw/web/Resource': Resource,
            'dw/system/Logger': Logger,
            'ApplePayLogger': Logger.getLogger(),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/order/ShippingMgr': require(pathToCoreMock + 'dw/dw_order_ShippingMgr'),
            'dw/value/Money': require('../../mocks/dw/dw_value_Money'),
            'dw/svc/LocalServiceRegistry': {
                createService: function (serviceId, configObj) {
                    return {
                        call: function (data) {
                            applyPayServiceHandler.configObj = configObj;
                            applyPayServiceHandler.data = data;
                            var isOk = true;
                            var statusCheck = true;
                            return {
                                ok: isOk,
                                object: {
                                    status: isOk && statusCheck ? 'SUCCESS' : 'ERROR'
                                },
                                error: isOk ? 200 : 400,
                                getRequestData: function () {
                                    applyPayServiceHandler.request = applyPayServiceHandler.configObj.createRequest(service);
                                    return applyPayServiceHandler.request;
                                },
                                getResponse: function () {
                                    return applyPayServiceHandler.mock
                                        ? applyPayServiceHandler.configObj.mockCall(svc)
                                        : applyPayServiceHandler.configObj.parseResponse(service, applyPayServiceHandler.client);
                                },
                            };
                        },
                        getRequestData: function () {
                            applyPayServiceHandler.request = applyPayServiceHandler.configObj.createRequest(service);
                            return applyPayServiceHandler.request;
                        },
                        getResponse: function () {
                            return applyPayServiceHandler.mock
                                ? applyPayServiceHandler.configObj.mockCall(svc)
                                : applyPayServiceHandler.configObj.parseResponse(service, applyPayServiceHandler.client);
                        },
                        getCredentialID: function () {
                            return serviceId;
                        },
                        getMessage: function (response) {
                            return {
                                requestData: applyPayServiceHandler.configObj.getRequestLogMessage(applyPayServiceHandler.request),
                                logResponse: applyPayServiceHandler.configObj.getResponseLogMessage(response)
                            };
                        },
                        getErrorMessage: function (response) {
                            var obj = {};
                            obj.a = { b: obj };
                            return {
                                requestData: applyPayServiceHandler.configObj.getRequestLogMessage(obj),
                                logResponse: applyPayServiceHandler.configObj.getResponseLogMessage(response)
                            };
                        }
                    };
                }
            },
            'dw/util/StringUtils': {
                encodeBase64: function () {
                    return {};
                }
            }
        });
        var order  = {
            getPaymentInstruments: function () {
                return {
                    get: function () {
                        return {
                            paymentTransaction: {
                                amount: {
                                    value: 1
                                }
                            },
                            custom: {
                                paymentData: ''
                            }
                        }
                    }
                }
            },
            billingAddress: {}
        }
        var result = applePayHelper.authorize(order);
        result.getRequestData();
        var responseData = result.getResponse();
        assert.isNotNull(responseData);
    });

    it('Testing method: authorize --> mock call -> empty billingAddressFirstName', () => {

        var applyPayServiceHandler = {
            data: {},
            configObj: {},
            client: {
                text: '{"success":true,"message":"success"}'
            },
            mock: true,
            request: {},
            URL: ''
        };

        var service = {
            configuration: {
                credential: {
                    URL: 'URL',
                    user: '111',
                    password: '222'
                }
            },
            URL: null,
            headers: [],
            method: 'GET',
            addHeader: function (key, value) {
                this.headers[key] = value;
            },
            setRequestMethod: function (method) {
                this.method = method;
            },
            setURL: function (url) {
                this.URL = url;
            },
            setAuthentication: function (auth) {
                this.auth = auth;
            },
            client:{
                setTimeout: function(time) {
                    this.time = time;
                },
                open: function(client,url) {
                    this.client = client;
                },
                sendAndReceiveToFile: function(client) {
                    this.client = client;
                }
            }
        };

        applePayHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/applePayHelper', {
            '*/cartridge/scripts/util/collections': require('../../../cartridges/lib_productlist/test/mocks/util/collections'),
            'dw/web/Resource': Resource,
            'dw/system/Logger': Logger,
            'ApplePayLogger': Logger.getLogger(),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/order/ShippingMgr': require(pathToCoreMock + 'dw/dw_order_ShippingMgr'),
            'dw/value/Money': require('../../mocks/dw/dw_value_Money'),
            'dw/svc/LocalServiceRegistry': {
                createService: function (serviceId, configObj) {
                    return {
                        call: function (data) {
                            applyPayServiceHandler.configObj = configObj;
                            applyPayServiceHandler.data = data;
                            var isOk = true;
                            var statusCheck = true;
                            return {
                                ok: isOk,
                                object: {
                                    status: isOk && statusCheck ? 'SUCCESS' : 'ERROR'
                                },
                                error: isOk ? 200 : 400,
                                getRequestData: function () {
                                    applyPayServiceHandler.request = applyPayServiceHandler.configObj.createRequest(service);
                                    return applyPayServiceHandler.request;
                                },
                                getResponse: function () {
                                    return applyPayServiceHandler.mock
                                        ? applyPayServiceHandler.configObj.mockCall(service)
                                        : applyPayServiceHandler.configObj.parseResponse(service, applyPayServiceHandler.client);
                                },
                            };
                        },
                        getRequestData: function () {
                            applyPayServiceHandler.request = applyPayServiceHandler.configObj.createRequest(service);
                            return applyPayServiceHandler.request;
                        },
                        getResponse: function () {
                            return applyPayServiceHandler.mock
                                ? applyPayServiceHandler.configObj.mockCall(svc)
                                : applyPayServiceHandler.configObj.parseResponse(service, applyPayServiceHandler.client);
                        },
                        getCredentialID: function () {
                            return serviceId;
                        },
                        getMessage: function (response) {
                            return {
                                requestData: applyPayServiceHandler.configObj.getRequestLogMessage(applyPayServiceHandler.request),
                                logResponse: applyPayServiceHandler.configObj.getResponseLogMessage(response)
                            };
                        },
                        getErrorMessage: function (response) {
                            var obj = {};
                            obj.a = { b: obj };
                            return {
                                requestData: applyPayServiceHandler.configObj.getRequestLogMessage(obj),
                                logResponse: applyPayServiceHandler.configObj.getResponseLogMessage(response)
                            };
                        }
                    };
                }
            },
            'dw/util/StringUtils': {
                encodeBase64: function () {
                    return {};
                }
            }
        });
        var order  = {
            getPaymentInstruments: function () {
                return {
                    get: function () {
                        return {
                            paymentTransaction: {
                                amount: {
                                    value: 1
                                }
                            },
                            custom: {
                                paymentData: ''
                            }
                        }
                    }
                }
            },
            billingAddress: {}
        }
        var result = applePayHelper.authorize(order);
        result.getRequestData();
        var responseData = result.getResponse();
        assert.isNotNull(responseData);
    });

    it('Testing method: authorize --> mock call -> billingAddressFirstName === Accept', () => {

        var applyPayServiceHandler = {
            data: {},
            configObj: {},
            client: {
                text: '{"success":true,"message":"success"}'
            },
            mock: true,
            request: {},
            URL: ''
        };

        var service = {
            configuration: {
                credential: {
                    URL: 'URL',
                    user: '111',
                    password: '222'
                }
            },
            URL: null,
            headers: [],
            method: 'GET',
            addHeader: function (key, value) {
                this.headers[key] = value;
            },
            setRequestMethod: function (method) {
                this.method = method;
            },
            setURL: function (url) {
                this.URL = url;
            },
            setAuthentication: function (auth) {
                this.auth = auth;
            },
            client:{
                setTimeout: function(time) {
                    this.time = time;
                },
                open: function(client,url) {
                    this.client = client;
                },
                sendAndReceiveToFile: function(client) {
                    this.client = client;
                }
            }
        };

        applePayHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/applePayHelper', {
            '*/cartridge/scripts/util/collections': require('../../../cartridges/lib_productlist/test/mocks/util/collections'),
            'dw/web/Resource': Resource,
            'dw/system/Logger': Logger,
            'ApplePayLogger': Logger.getLogger(),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/order/ShippingMgr': require(pathToCoreMock + 'dw/dw_order_ShippingMgr'),
            'dw/value/Money': require('../../mocks/dw/dw_value_Money'),
            'dw/svc/LocalServiceRegistry': {
                createService: function (serviceId, configObj) {
                    return {
                        call: function (data) {
                            applyPayServiceHandler.configObj = configObj;
                            applyPayServiceHandler.data = data;
                            var isOk = true;
                            var statusCheck = true;
                            return {
                                ok: isOk,
                                object: {
                                    status: isOk && statusCheck ? 'SUCCESS' : 'ERROR'
                                },
                                error: isOk ? 200 : 400,
                                getRequestData: function () {
                                    applyPayServiceHandler.request = applyPayServiceHandler.configObj.createRequest(service);
                                    return applyPayServiceHandler.request;
                                },
                                getResponse: function () {
                                    return applyPayServiceHandler.mock
                                        ? applyPayServiceHandler.configObj.mockCall(service)
                                        : applyPayServiceHandler.configObj.parseResponse(service, applyPayServiceHandler.client);
                                },
                            };
                        },
                        getRequestData: function () {
                            applyPayServiceHandler.request = applyPayServiceHandler.configObj.createRequest(service);
                            return applyPayServiceHandler.request;
                        },
                        getResponse: function () {
                            return applyPayServiceHandler.mock
                                ? applyPayServiceHandler.configObj.mockCall(svc)
                                : applyPayServiceHandler.configObj.parseResponse(service, applyPayServiceHandler.client);
                        },
                        getCredentialID: function () {
                            return serviceId;
                        },
                        getMessage: function (response) {
                            return {
                                requestData: applyPayServiceHandler.configObj.getRequestLogMessage(applyPayServiceHandler.request),
                                logResponse: applyPayServiceHandler.configObj.getResponseLogMessage(response)
                            };
                        },
                        getErrorMessage: function (response) {
                            var obj = {};
                            obj.a = { b: obj };
                            return {
                                requestData: applyPayServiceHandler.configObj.getRequestLogMessage(obj),
                                logResponse: applyPayServiceHandler.configObj.getResponseLogMessage(response)
                            };
                        }
                    };
                }
            },
            'dw/util/StringUtils': {
                encodeBase64: function () {
                    return {};
                }
            }
        });
        var order  = {
            getPaymentInstruments: function () {
                return {
                    get: function () {
                        return {
                            paymentTransaction: {
                                amount: {
                                    value: 1
                                }
                            },
                            custom: {
                                paymentData: ''
                            }
                        }
                    }
                }
            },
            billingAddress: {
                firstName: 'Accept'
            }
        }
        var result = applePayHelper.authorize(order);
        result.getRequestData();
        var responseData = result.getResponse();
        assert.isNotNull(responseData);
    });

    it('Testing method: authorize --> Test Custom Exception', () => {

        applePayHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/applePayHelper', {
            '*/cartridge/scripts/util/collections': require('../../../cartridges/lib_productlist/test/mocks/util/collections'),
            'dw/web/Resource': Resource,
            'dw/system/Logger': Logger,
            'ApplePayLogger': Logger.getLogger(),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/order/ShippingMgr': require(pathToCoreMock + 'dw/dw_order_ShippingMgr'),
            'dw/value/Money': require('../../mocks/dw/dw_value_Money'),
            'dw/svc/LocalServiceRegistry': {
                createService: function (serviceId, configObj) {
                    return {};
                }
            },
            'dw/util/StringUtils': {}
        });
        var order  = {
            getPaymentInstruments: function () {
                return {
                    get: function () {
                        return {
                            paymentTransaction: {
                                amount: {
                                    value: 1
                                }
                            },
                            custom: {
                                paymentData: ''
                            }
                        }
                    }
                }
            },
            billingAddress: {
                firstName: 'Accept'
            }
        }
        var result = applePayHelper.authorize(order);
        assert.isNotNull(result);
    });

    it('Testing method: authorize --> in case of applePayPaymentInstrument not exist', () => {

        applePayHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/applePayHelper', {
            '*/cartridge/scripts/util/collections': require('../../../cartridges/lib_productlist/test/mocks/util/collections'),
            'dw/web/Resource': Resource,
            'dw/system/Logger': Logger,
            'ApplePayLogger': Logger.getLogger(),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/order/ShippingMgr': require(pathToCoreMock + 'dw/dw_order_ShippingMgr'),
            'dw/value/Money': require('../../mocks/dw/dw_value_Money'),
            'dw/svc/LocalServiceRegistry': {
                createService: function (serviceId, configObj) {
                    return {};
                }
            },
            'dw/util/StringUtils': {}
        });
        var order  = {
            getPaymentInstruments: function () {
                return {
                    get: function () {
                        return null
                    }
                }
            },
            billingAddress: {
                firstName: 'Accept'
            }
        }
        var result = applePayHelper.authorize(order);
        assert.isNotNull(result);
    });
});
