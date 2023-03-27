'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

var PriceTotalModel = proxyquire('../../../../../../cartridges/plugin_productpersonalize/cartridge/models/productLineItem/decorators/priceTotal.js', {
    'dw/util/StringUtils': {
        formatMoney: (price) => '$' + price.value
    },
    '*/cartridge/scripts/util/collections': require('../../../../../mocks/scripts/util/collections'),
    '*/cartridge/scripts/renderTemplateHelper': {
        getRenderedHtml: () => 'rendered HTML'
    },
    '*/cartridge/scripts/helpers/productPersonlizationHelpers': {
        isPersonalizationEligible: () => true
    },
    'dw/value/Money': require('../../../../../mocks/dw/dw_value_Money'),
    '*/cartridge/config/peronslizePreferences': {}
});

global.empty = (params) => !params;

describe('plugin_productpersonalize/cartridge/models/productLineItem/decorators/priceTotal.js', () => {

    it('Testing priceTotal Model when no args', () => {
        var product = {};
        var priceTotal = new PriceTotalModel(product);
        assert.isDefined(priceTotal, 'priceTotal is not defined');
        assert.isNotNull(priceTotal, 'priceTotal is null');
    });

    it('Testing priceTotal Model for product only has list price', () => {
        var product = {
            price: {
                list: {
                    currency: 'USD',
                    decimalPrice: 100
                },
                sales: {
                    currency: 'USD',
                    decimalPrice: 100
                },
                priceBookSalesPrice: {
                    currency: 'USD',
                    decimalPrice: 100
                }
            }
        };

        var lineItem = {
            quantityValue: 1,
            priceAdjustments: {
                getLength: () => 0,
                adjustedPrice: {
                    add: (value) => 100 + value,
                    subtract: (value) => value - 100,
                    value: 100
                }
            },
            adjustedPrice: {
                subtract: (value) => value - 100,
                value: 100
            }
        };

        var priceTotal = new PriceTotalModel(product, lineItem);
        assert.isDefined(priceTotal, 'priceTotal is not defined');
        assert.isNotNull(priceTotal, 'priceTotal is null');
        assert.equal(product.priceTotal.price, '$100');
        assert.equal(product.priceTotal.strikeThroughPrice, '$100');
    });

    it('Testing priceTotal Model for product has both list and sale price', () => {
        var product = {
            price: {
                list: {
                    currency: 'USD',
                    decimalPrice: 100
                },
                sales: {
                    currency: 'USD',
                    decimalPrice: 90
                },
                priceBookSalesPrice: {
                    currency: 'USD',
                    decimalPrice: 100
                }
            }
        };

        var lineItem = {
            quantityValue: 1,
            priceAdjustments: {
                getLength: () => 0,
                adjustedPrice: {
                    add: (value) => 100 + value,
                    subtract: (value) => value - 100
                }
            },
            adjustedPrice: {
                subtract: (value) => value - 100,
                value: 90
            }
        };

        var priceTotal = new PriceTotalModel(product, lineItem);
        assert.isDefined(priceTotal, 'priceTotal is not defined');
        assert.isNotNull(priceTotal, 'priceTotal is null');
        assert.equal(product.priceTotal.price, '$90');
        assert.equal(product.priceTotal.strikeThroughPrice, '$100');
    });

    it('Testing priceTotal Model for product has optional product', () => {
        var product = {
            price: {
                list: {
                    currency: 'USD',
                    decimalPrice: 100
                },
                sales: {
                    currency: 'USD',
                    decimalPrice: 90
                },
                priceBookSalesPrice: {
                    currency: 'USD',
                    decimalPrice: 100
                }
            }
        };

        var lineItem = {
            quantityValue: 1,
            priceAdjustments: {
                getLength: () => 0,
                adjustedPrice: {
                    add: (value) => 100 + value,
                    subtract: (value) => value - 100
                }
            },
            adjustedPrice: {
                add: (value) => {
                    return {
                        value: 100,
                        add: (value) => 100 + value,
                        subtract: (value) => {
                            var curVal = (typeof (value) === 'number') ? value - 10 : value.value - 10;
                            return {
                                value: curVal
                            };
                        }
                    };
                },
                subtract: (value) => {
                    var curVal = (typeof (value) === 'number') ? value - 100 : value.value - 100;
                    return {
                        value: curVal
                    };
                },
                value: 90
            },
            optionProductLineItems: [{
                add: (value) => 100 + value,
                subtract: (value) => value - 10,
                value: 10
            }]
        };

        var priceTotal = new PriceTotalModel(product, lineItem);
        assert.isDefined(priceTotal, 'priceTotal is not defined');
        assert.isNotNull(priceTotal, 'priceTotal is null');
        assert.equal(product.priceTotal.price, '$100');
        assert.equal(product.priceTotal.strikeThroughPrice, '$100');
        assert.equal(product.priceTotal.excludeOptionalPrice, '$90');
        assert.equal(product.priceTotal.optionalItemPrice, '$80');
    });

    it('Testing priceTotal Model for product having price adjustments', () => {
        var product = {
            price: {
                list: {
                    currency: 'USD',
                    decimalPrice: 100
                },
                sales: {
                    currency: 'USD',
                    decimalPrice: 100
                },
                priceBookSalesPrice: {
                    currency: 'USD',
                    decimalPrice: 100
                }
            }
        };

        var lineItem = {
            quantityValue: 1,
            priceAdjustments: {
                getLength: () => 1,
                adjustedPrice: {
                    add: (value) => 100 + value,
                    subtract: (value) => value - 100,
                    value: 100
                }
            },
            adjustedPrice: {
                subtract: (value) => value - 100,
                value: 100
            },
            getPrice: () => 100
        };

        var priceTotal = new PriceTotalModel(product, lineItem);
        assert.isDefined(priceTotal, 'priceTotal is not defined');
        assert.isNotNull(priceTotal, 'priceTotal is null');
        assert.equal(product.priceTotal.price, '$100');
        assert.equal(product.priceTotal.strikeThroughPrice, '$100');
        assert.equal(product.priceTotal.nonAdjustedPrice, '$100');
    });

    it('Testing priceTotal Model for product having price adjustments without currency', () => {
        var product = {
            price: {
                list: {
                    decimalPrice: 100
                },
                sales: {
                    currency: 'USD',
                    decimalPrice: 100
                },
                priceBookSalesPrice: {
                    currency: 'USD',
                    decimalPrice: 100
                }
            }
        };

        var lineItem = {
            quantityValue: 1,
            priceAdjustments: {
                getLength: () => 1,
                adjustedPrice: {
                    add: (value) => 100 + value,
                    subtract: (value) => value - 100,
                    value: 100
                }
            },
            adjustedPrice: {
                subtract: (value) => value - 100,
                value: 100
            },
            getPrice: () => 100
        };

        var priceTotal = new PriceTotalModel(product, lineItem);
        assert.isDefined(priceTotal, 'priceTotal is not defined');
        assert.isNotNull(priceTotal, 'priceTotal is null');
        assert.equal(product.priceTotal.price, '$100');
    });

    it('Testing priceTotal Model for product having price adjustments without strikeThroughPrice', () => {
        var product = {
            price: {
                list: null,
                sales: {
                    currency: 'USD',
                    decimalPrice: 100
                },
                priceBookSalesPrice: {
                    currency: 'USD',
                    decimalPrice: 100
                }
            }
        };

        var lineItem = {
            quantityValue: 1,
            priceAdjustments: {
                getLength: () => 1,
                adjustedPrice: {
                    add: (value) => 100 + value,
                    subtract: (value) => value - 100,
                    value: 100
                }
            },
            adjustedPrice: {
                subtract: (value) => value - 100,
                value: 100
            },
            getPrice: () => 100
        };

        var priceTotal = new PriceTotalModel(product, lineItem);
        assert.isDefined(priceTotal, 'priceTotal is not defined');
        assert.isNotNull(priceTotal, 'priceTotal is null');
        assert.equal(product.priceTotal.price, '$100');
    });

    it('Testing priceTotal Model for product only has list price without personlization Jersey name', () => {
        PriceTotalModel = proxyquire('../../../../../../cartridges/plugin_productpersonalize/cartridge/models/productLineItem/decorators/priceTotal.js', {
            'dw/util/StringUtils': {
                formatMoney: (price) => '$' + price.value
            },
            '*/cartridge/scripts/util/collections': require('../../../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/renderTemplateHelper': {
                getRenderedHtml: () => 'rendered HTML'
            },
            '*/cartridge/scripts/helpers/productPersonlizationHelpers': {
                isPersonalizationEligible: () => true
            },
            'dw/value/Money': require('../../../../../mocks/dw/dw_value_Money'),
            '*/cartridge/config/peronslizePreferences': {
                isPersonalizationEnable: true
            }
        });
        var product = {
            price: {
                list: {
                    currency: 'USD',
                    decimalPrice: 100
                },
                sales: {
                    currency: 'USD',
                    decimalPrice: 100
                },
                priceBookSalesPrice: {
                    currency: 'USD',
                    decimalPrice: 100
                }
            }
        };

        var lineItem = {
            quantityValue: 1,
            priceAdjustments: {
                getLength: () => 0,
                adjustedPrice: {
                    add: (value) => 100 + value,
                    subtract: (value) => value - 100,
                    value: 100
                }
            },
            adjustedPrice: {
                subtract: (value) => value - 100,
                value: 100
            },
            custom: {
                jerseyNameText: null,
                jerseyNumberText: null,
                sponsors: null
            }
        };

        var priceTotal = new PriceTotalModel(product, lineItem);
        assert.isDefined(priceTotal, 'priceTotal is not defined');
        assert.isNotNull(priceTotal, 'priceTotal is null');
        assert.equal(product.priceTotal.price, '$100');
        assert.equal(product.priceTotal.strikeThroughPrice, '$100');
    });

});
