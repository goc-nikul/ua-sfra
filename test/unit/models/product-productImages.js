'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var Site = require('../../mocks/dw/dw_system_Site');
var currentSite = Site.getCurrent();

describe('app_ua_core/cartridge/models/product/productImages', () => {
    let Collection = require('../../mocks/dw/dw_util_Collection');
    let collections = proxyquire('../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/util/collections', {
        'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList')
    });
    let ImageModel = proxyquire('../../../cartridges/app_ua_core/cartridge/models/product/productImages', {
        '*/cartridge/scripts/util/collections': collections,
        '*/cartridge/scripts/helpers/productHelpers': {
            getNoImageURL: function () {
               return 'absURL';
            },
            recipeForPDPSizeModelImage : function() {
                return '?rp=standard-0pad|pdpMainDesktop&scl=1&fmt=jpg&qlt=85&resMode=sharp2&cache=on,on&bgc=F0F0F0&wid=566&hei=708&size=566,708';
            },
            sizeModelImagesMapping: function() {
                return 'sizeModelSM';
            },
            recipeForPDPSizeModelImage: function() {
                return 'recipeString';
            },
            getSelectedModelSpecObj: function () {
                return 'ModelSpecObj'
            },
            getImageSpecificModelSpec: function() {
                return {};
            }
        },
        'dw/system/Site':{
            current: {
                getCustomPreferenceValue: function (param) {
                    if (param === 'enableModelSpec') {
                        return 'enableModelSpec'
                    } else if (param === 'enableFitModels') {
                        return 'enableFitModels'
                    }
                }
            }
        },
        'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList'),
        'dw/web/Resource': {
            msg: function (params) { return params; }
        }

    });

    global.dw = {
        catalog: {
            ProductVariationModel: Object
        }
    }

    let image = {
        alt: 'No image, gridTileDesktop',
        URL: 'URL',
        title: 'No image',
        absURL: 'absURL'
    };

    it('ImageModel for all image types', function() {
        function fakeCollection() {
            var imagesItems = [{
                alt: 'alt',
                URL: 'URL',
                title: 'title',
                absURL: 'absURL'
            }, {
                alt: 'alt',
                URL: 'URL',
                title: 'title',
                absURL: 'absURL'
            }, {
                alt: 'alt',
                URL: 'URL',
                title: 'title',
                absURL: 'absURL'
            }];

            var index = 0;

            this.iterator = function() {
                return {
                    items: imagesItems,
                    hasNext: function() {
                        return index < imagesItems.length;
                    },
                    next: function() {
                        return imagesItems[index++];
                    }
                };
            }
        };

        let product = {
            getImages: () => {
                return new fakeCollection();
            },
            selectedVariant: {
                variationModel: {
                    getImages: () => {
                        return new fakeCollection();
                    },
                    getMaster: function() {
                        return {
                            custom: {
                                hasSizeModel: 'hasSizeModel'
                            }
                        }
                    }
                }
            },
            getMaster: function() {
                return {cusom: {
                    hasSizeModel:'hasSizeModel'
                }}
            }
        }
        global.dw = {
            catalog: {
                ProductVariationModel: Object
            }
        }
        let imagesResult = new ImageModel(product, {
            types: ['swatch'],
            quantity: 'all'
        }, 'fitModelViewPreference');

        assert.isTrue(imagesResult.swatch.length === 3);
    });

    it('ImageModel for single image type', function() {
        let product = {
            getImages: () => {
                return new Collection(image);
            }
        }
        global.dw = {
            catalog: {
                ProductVariationModel: Object
            }
        }
        let imagesResult = new ImageModel(product, {
            types: ['swatch'],
            quantity: 'single'
        });

        assert.deepEqual(imagesResult.swatch[0], {
            absURL: 'absURL',
            alt: 'No image, gridTileDesktop',
            index: '0',
            title: 'No image',
            noImgAlt: 'image.unavailable',
            url: 'absURL'
        });

    });

    it('ImageModel for single image type, configuration object with image types has single value for quantity attribute', function() {

        class Colle {
            constructor(items) {
                this.items = items ? [items] : [];
                this.empty = false;
                this.length = this.items.length;
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
        let product = {
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
                    getImages: function() {
                        return new Colle(image);
                    }
                }
            },
            selectedVariants:{}
        }
        global.dw = {
            catalog: {
                ProductVariationModel: Object
            }
        }
        let imagesResult = new ImageModel(product, {
            types: ['pdpMainDesktop'],
            quantity: 'single'
        });
        assert.deepEqual(imagesResult.pdpMainDesktop[0], {
            absURL: 'absURL',
            alt: 'No image, gridTileDesktop',
            index: '0',
            title: 'No image',
            modelSpec: {},
            url: 'URL'
        });
    });
});
