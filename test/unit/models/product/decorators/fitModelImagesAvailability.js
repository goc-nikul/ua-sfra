'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
let Collection = require('../../../../mocks/dw/dw_util_Collection');
describe('app_ua_core/cartridge/models/product/decorators/fitModelImagesAvailability.js', () => {
    let Obj = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/product/decorators/fitModelImagesAvailability.js', {
        'dw/system/Site': {
            current: {
                getCustomPreferenceValue: function () {
                    return {};
                }
            }
        }
    });

    global.dw = {
        catalog: {
            ProductVariationModel: Object
        }
    };

    let image = {
        alt: 'No image, gridTileDesktop',
        URL: 'URL',
        title: 'No image',
        absURL: 'absURL'
    };

    it('Testing for fitModelImagesAvailability --> prosuct has defaultVariant', () => {
        var product = {
            getImages: () => {
                return new Collection(image);
            },
            selectedVariant: false,
            defaultVariant: {
                variationModel: {
                    getMaster: function() {
                        return {
                            custom: {
                                hasSizeModel: 'hasSizeModel'
                            }
                        }
                    },
                    getImages: function () {
                        return new Collection(image);
                    }
                }
            },
            selectedVariants: {}
        };
        var object = {};
        new Obj(object, product);
        assert.isTrue(object.fitModelImagesAvailability.fitModelAvailable);
        assert.isNotNull(object.fitModelImagesAvailability.fitModelImageViewType);
    });

    it('Testing for fitModelImagesAvailability -->  --> prosuct has selectedVariant', () => {
        class Collections {
            constructor(items) {
                this.items = items ? [items] : [];
                this.empty = false;
            }
            iterator() {
                var index = 0;
                return {
                    items: this.items,
                    hasNext: () => {
                        return index < this.items.length;
                    },
                    next: () => {
                        return this.items[index++];
                    }
                };
            }
        }
        var product = {
            getImages: () => {
                return new Collection(image);
            },
            selectedVariant: {
                variationModel: {
                    getMaster: function () {
                        return {
                            custom: {
                                hasSizeModel: 'hasSizeModel'
                            }
                        }
                    },
                    getImages: function () {
                        return new Collections(image);
                    }
                }
            },
            defaultVariant: {
                variationModel: {
                    getMaster: function() {
                        return {
                            custom: {
                                hasSizeModel: 'hasSizeModel'
                            }
                        };
                    },
                    getImages: function () {
                        return new Collection(image);
                    }
                }
            },
            selectedVariants: {}
        };
        var object = {};
        new Obj(object, product);
        assert.isFalse(object.fitModelImagesAvailability.fitModelAvailable);
    });

    it('Testing for fitModelImagesAvailability --> enableFitModels custom attribute not exist', () => {
        Obj = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/product/decorators/fitModelImagesAvailability.js', {
            'dw/system/Site': {
                current: {
                    getCustomPreferenceValue: function () {
                        return false;
                    }
                }
            }
        });
        var product = {
            getImages: () => {
                return new Collection(image);
            },
            selectedVariant: false,
            defaultVariant: {
                variationModel: {
                    getMaster: function () {
                        return {
                            custom: {}
                        };
                    },
                    getImages: function () {
                        return new Collection(image);
                    }
                }
            },
            selectedVariants: [{}]
        };
        var object = {};
        new Obj(object, product);
        assert.isNotNull(object.fitModelImagesAvailability);
    });
});
