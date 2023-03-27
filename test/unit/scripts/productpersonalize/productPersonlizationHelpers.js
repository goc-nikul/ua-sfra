'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

class cartModel {
    constructor() {}
}

var productPersonlizationHelpers = proxyquire('../../../../cartridges/plugin_productpersonalize/cartridge/scripts/helpers/productPersonlizationHelpers', {
    'dw/system/Transaction': {
        wrap: function (callback) {
            callback.apply();
        }
    },
    'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
    'dw/object/CustomObjectMgr': {
        getCustomObject: function () {
            return {
                custom: {
                    ID: 'personlize'
                }
            };
        }
    },
    'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
    '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
    '*/cartridge/scripts/helpers/basketCalculationHelpers': {
        calculateTotals: function () {}
    },
    '*/cartridge/models/cart': cartModel
});

describe('plugin_productpersonalize/cartridge/models/productPersonlizationHelpers', () => {

    it('Testing method: isPersonalizationEligible is no optional model', () => {
        assert.isFalse(productPersonlizationHelpers.isPersonalizationEligible({
            optionModel: null
        }), 'isPersonalizationEligible Failed');
    });

    var apiProduct = {
        optionModel: {
            getOption: function () {
                return {
                    id: 'personlize'
                };
            }
        }
    };

    it('Testing method: isPersonalizationEligible', () => {
        assert.isTrue(productPersonlizationHelpers.isPersonalizationEligible(apiProduct), 'isPersonalizationEligible Failed');
    });

    it('Testing method: isPersonalizationEligible for master', () => {
        var apiProductMaster = {
            optionModel: {
                getOption: function () {
                    return null;
                }
            },
            masterProduct: {
                optionModel: {
                    getOption: function () {
                        return {
                            id: 'personlize'
                        };
                    }
                }
            }
        };
        assert.isTrue(productPersonlizationHelpers.isPersonalizationEligible(apiProductMaster), 'isPersonalizationEligible Failed');
    });

    it('Testing method: getCustomObject', () => {
        assert.isNotNull(productPersonlizationHelpers.getCustomObject(apiProduct), 'custom object is null');
    });

    it('Testing method: get custom object', () => {
        productPersonlizationHelpers = proxyquire('../../../../cartridges/plugin_productpersonalize/cartridge/scripts/helpers/productPersonlizationHelpers', {
            'dw/system/Transaction': {
                wrap: function (callback) {
                    callback.apply();
                }
            },
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => null
            },
            'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/helpers/basketCalculationHelpers': {
                calculateTotals: function () {}
            },
            '*/cartridge/models/cart': cartModel
        });
        var apiProductVar = {
            master: false,
            ID: 'ID',
            custom: {
                color: 'Black'
            },
            masterProduct: {}
        };
        assert.isNull(productPersonlizationHelpers.getCustomObject(apiProductVar), 'custom object is null');
    });

    it('Testing method: ensureProductQuantities when basket is null', () => {
        var productPersonlizationHelpersEmpty = proxyquire('../../../../cartridges/plugin_productpersonalize/cartridge/scripts/helpers/productPersonlizationHelpers', {
            'dw/system/Transaction': {
                wrap: function (callback) {
                    callback.apply();
                }
            },
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/object/CustomObjectMgr': {
                getCustomObject: function () {
                    return {
                        custom: {
                            ID: 'personlize'
                        }
                    };
                }
            },
            'dw/order/BasketMgr': {
                getCurrentBasket: () => null
            },
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/helpers/basketCalculationHelpers': {
                calculateTotals: function () {}
            },
            '*/cartridge/models/cart': cartModel
        });
        assert.isNull(productPersonlizationHelpersEmpty.ensureProductQuantities(apiProduct), 'ensureProductQuantities is null')
    });

    it('Testing method: ensureProductQuantities when basket exists and same line item', () => {
        var productPersonlizationHelpersEmpty = proxyquire('../../../../cartridges/plugin_productpersonalize/cartridge/scripts/helpers/productPersonlizationHelpers', {
            'dw/system/Transaction': {
                wrap: function (callback) {
                    callback.apply();
                }
            },
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/object/CustomObjectMgr': {
                getCustomObject: function () {
                    return {
                        custom: {
                            ID: 'personlize'
                        }
                    };
                }
            },
            'dw/order/BasketMgr': {
                getCurrentBasket: () => {
                    return {
                        removeProductLineItem: () => {},
                        getAllProductLineItems: () => {
                            return {
                                toArray: () => [{
                                    UUID: '1234',
                                    getQuantity: () => 1,
                                    setQuantityValue: () => {},
                                    getQuantityValue: () => 1,
                                    custom: {
                                        jerseyNameText: 'jerseyNameText',
                                        jerseyNumberText: 'jerseyNumberText',
                                        sponsors: 'Yes'
                                    }
                                }, {
                                    UUID: '1235',
                                    getQuantity: () => 1,
                                    setQuantityValue: () => {},
                                    getQuantityValue: () => 1,
                                    custom: {
                                        jerseyNameText: 'jerseyNameText',
                                        jerseyNumberText: 'jerseyNumberText',
                                        sponsors: 'Yes'
                                    }
                                }]
                            }
                        }
                    }
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/helpers/basketCalculationHelpers': {
                calculateTotals: function () {}
            },
            '*/cartridge/models/cart': cartModel
        });
        assert.isNotNull(productPersonlizationHelpersEmpty.ensureProductQuantities(), 'ensureProductQuantities is null')
    });

    it('Testing method: ensureProductQuantities when basket exists and same line item without personlization change', () => {
        var productPersonlizationHelpersEmpty = proxyquire('../../../../cartridges/plugin_productpersonalize/cartridge/scripts/helpers/productPersonlizationHelpers', {
            'dw/system/Transaction': {
                wrap: function (callback) {
                    callback.apply();
                }
            },
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/object/CustomObjectMgr': {
                getCustomObject: function () {
                    return {
                        custom: {
                            ID: 'personlize'
                        }
                    };
                }
            },
            'dw/order/BasketMgr': {
                getCurrentBasket: () => {
                    return {
                        removeProductLineItem: () => {},
                        getAllProductLineItems: () => {
                            return {
                                toArray: () => [{
                                    UUID: '1234',
                                    getQuantity: () => 1,
                                    setQuantityValue: () => {},
                                    getQuantityValue: () => 1,
                                    custom: {
                                        jerseyNameText: 'jerseyNameText',
                                        jerseyNumberText: 'jerseyNumberText',
                                        sponsors: 'Yes'
                                    }
                                }, {
                                    UUID: '1235',
                                    getQuantity: () => 1,
                                    setQuantityValue: () => {},
                                    getQuantityValue: () => 1,
                                    custom: {
                                        jerseyNameText: null,
                                        jerseyNumberText: null,
                                        sponsors: null
                                    }
                                }]
                            }
                        }
                    }
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/helpers/basketCalculationHelpers': {
                calculateTotals: function () {}
            },
            '*/cartridge/models/cart': cartModel
        });
        assert.isNotNull(productPersonlizationHelpersEmpty.ensureProductQuantities(), 'ensureProductQuantities is null')
    });

    it('Testing method: ensureProductQuantities', () => {
        assert.isNotNull(productPersonlizationHelpers.ensureProductQuantities(apiProduct), 'ensureProductQuantities is null')
    });

    it('Testing method: updateProductLineItem', () => {
        productPersonlizationHelpers = proxyquire('../../../../cartridges/plugin_productpersonalize/cartridge/scripts/helpers/productPersonlizationHelpers', {
            'dw/system/Transaction': {
                wrap: function (callback) {
                    callback.apply();
                }
            },
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/object/CustomObjectMgr': {
                getCustomObject: function () {
                    return {
                        custom: {
                            ID: 'personlize'
                        }
                    };
                }
            },
            'dw/order/BasketMgr': {
                getCurrentBasket: () => {
                    return {
                        getProductLineItems: () => []
                    };
                }
            },
            '*/cartridge/scripts/util/collections': {
                find: () => {
                    return {
                        custom: {
                            jerseyName: null,
                            jerseyNameText: null,
                            jerseyNumber: null
                        },
                        product: {
                            optionModel: {
                                getOption: function () {
                                    return {
                                        id: 'personlize'
                                    };
                                }
                            }
                        }
                    }
                }
            },
            '*/cartridge/scripts/helpers/basketCalculationHelpers': {
                calculateTotals: function () {}
            },
            '*/cartridge/models/cart': cartModel
        });
        var formData = {};
        assert.doesNotThrow(() => {
            productPersonlizationHelpers.updateProductLineItem('1234', '1234', formData);
        });
    });

    it('Testing method: updateProductLineItem with formdata', () => {
        productPersonlizationHelpers = proxyquire('../../../../cartridges/plugin_productpersonalize/cartridge/scripts/helpers/productPersonlizationHelpers', {
            'dw/system/Transaction': {
                wrap: function (callback) {
                    callback.apply();
                }
            },
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/object/CustomObjectMgr': {
                getCustomObject: function () {
                    return {
                        custom: {
                            ID: 'personlize'
                        }
                    };
                }
            },
            'dw/order/BasketMgr': {
                getCurrentBasket: () => {
                    return {
                        getProductLineItems: () => []
                    };
                }
            },
            '*/cartridge/scripts/util/collections': {
                find: (item, callback) => {
                    callback({
                        UUID: '1234'
                    });
                    return {
                        custom: {
                            jerseyName: null,
                            jerseyNameText: null,
                            jerseyNumber: null
                        },
                        product: {
                            optionModel: {
                                getOption: function () {
                                    return {
                                        id: 'personlize'
                                    };
                                }
                            }
                        }
                    }
                }
            },
            '*/cartridge/scripts/helpers/basketCalculationHelpers': {
                calculateTotals: function () {}
            },
            '*/cartridge/models/cart': cartModel
        });
        var formData = {
            personalizationName: 'personalizationName',
            personalizationNumber: 'personalizationNumber',
            personalizationSponsors: 'Yes'
        };
        assert.doesNotThrow(() => {
            productPersonlizationHelpers.updateProductLineItem('1234', '1234', formData);
        });
    });

});
