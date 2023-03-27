'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('quantity selector decorator', function () {
    var quantities = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/product/decorators/quantitySelector', {
        'dw/web/URLUtils': {
            url: function () {
                return {
                    relative: function () {
                        return {
                            toString: function () {
                                return 'string';
                            }
                        };
                    }
                };
            }
        },
        '*/cartridge/scripts/helpers/urlHelpers': {
            appendQueryParams: function () {
                return 'url';
            }
        },
        'dw/catalog/ProductMgr': {
            getProduct: function () {
                return {};
            }
        },
        '*/cartridge/scripts/helpers/basketValidationHelpers': {
            getLineItemInventory: function () {
                return 11;
            }
        }
    });
    it('should create a property on the passed in object called quantities', function () {
        var object = {
            minOrderQuantity: 1,
            maxOrderQuantity: 10,
            selectedQuantity: 2,
            id: 'someID'
        };
        quantities(object, 1, {}, []);
        assert.equal(object.quantities.length, 10);
    });

    it('should handle selected quantity being null', function () {
        var object = {
            minOrderQuantity: 1,
            maxOrderQuantity: 10,
            selectedQuantity: null,
            id: 'someID'
        };

        quantities(object, 1, {}, []);
        assert.equal(object.quantities.length, 10);
    });

    it('should handle null attributes', function () {
        var object = {
            minOrderQuantity: 1,
            maxOrderQuantity: 10,
            selectedQuantity: null,
            id: 'someID'
        };

        quantities(object, 1, null, null);
        assert.equal(object.quantities.length, 10);
    });

    it('should handle null attributes --->  Minimum order quantity > 1', function () {
        quantities = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/product/decorators/quantitySelector', {
            'dw/web/URLUtils': {
                url: function () {
                    return {
                        relative: function () {
                            return {
                                toString: function () {
                                    return 'string';
                                }
                            };
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/urlHelpers': {
                appendQueryParams: function () {
                    return 'url';
                }
            },
            'dw/catalog/ProductMgr': {
                getProduct: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/helpers/basketValidationHelpers': {
                getLineItemInventory: function () {
                    return 9;
                }
            }
        });
        var object = {
            minOrderQuantity: 1,
            maxOrderQuantity: 10,
            selectedQuantity: null,
            id: 'someID'
        };

        quantities(object, 2, null, null);
        assert.equal(object.quantities.length, 9);
    });
});
