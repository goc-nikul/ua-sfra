'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const { toArray } = require('lodash');
var ArrayList = require('../../../../../cartridges/storefront-reference-architecture/test/mocks/dw.util.Collection');
var toProductMock = require('../../../../../cartridges/storefront-reference-architecture/test/util');

describe('productAttributes', function () {
    var ProductAttributes = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/models/product/productAttributes', {
        '*/cartridge/scripts/util/collections': proxyquire('../../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/util/collections', {
            'dw/util/ArrayList': ArrayList
        }),
        '*/cartridge/scripts/helpers/urlHelpers': { appendQueryParams: function () {
            return '?pid=25604524&dwvar_25604524_size=038&dwvar_25604524_color=BLACKFB';
        } },
        '*/cartridge/scripts/helpers/productHelpers': {},
        'dw/system/Site': {
            current: {
                preferences: {
                    custom: {
                    }
                }
            }
        },
        'dw/util/HashMap': function () {
            return {
                result: {},
                put: function (key, context) {
                    this.result[key] = context;
                }
            };
        }
    });

    var variationsMock = {
        productVariationAttributes: new ArrayList([]),
        getSelectedValue: {
            return: {
                equals: {
                    return: true,
                    type: 'function'
                }
            },
            type: 'function'
        },
        getAllValues: {
            return: new ArrayList([]),
            type: 'function'
        },
        hasOrderableVariants: {
            return: false,
            type: 'function'
        },
        urlUnselectVariationValue: {
            return: 'unselect_url',
            type: 'function'
        },
        urlSelectVariationValue: {
            return: 'select_url',
            type: 'function'
        },
        getFilteredValues: {
            return: new ArrayList([]),
            type: 'function'
        },
        master: {
            variationModel: {
                variants: ''
            },
            master: {},
            setSelectedAttributeValue: function () {},
            getImages: function () {}
        },
        getVariants: function () {
            var variants = {
                onlineFlag: true,
                availabilityModel: {
                    orderable: true
                },
                custom: {
                    color: '003',
                    size: '038',
                    exclusive: 'out-of-stock'
                },
                masterProduct: {
                    ID: 'productID'
                }
            };
            return new ArrayList(variants);
        }
    };

    it('should return empty array if product doesn not have attributes', function () {
        var mock = toProductMock(variationsMock);
        var attributeConfig = {
            attributes: ['color'],
            endPoint: 'Show'
        };
        var attrs = new ProductAttributes(mock, attributeConfig);

        assert.equal(attrs.length, 0);
    });

    it('should return color attributes', function () {
        var tempMock = Object.assign({}, variationsMock);
        tempMock.productVariationAttributes = new ArrayList([{
            attributeID: 'color',
            displayName: 'color',
            ID: 'color'
        }]);

        tempMock.getSelectedValue = {
            return: {
                description: 'lorum ipsum',
                displayValue: 'Black',
                ID: 'BlackFB',
                value: 'BlackFB',
                equals: {
                    return: true,
                    type: 'function'
                }
            },
            type: 'function'
        };

        var mock = toProductMock(tempMock);
        var attributeConfig = {
            attributes: ['color'],
            endPoint: 'Show'
        };
        var attrs = new ProductAttributes(mock, attributeConfig);

        assert.equal(attrs.length, 1);
        assert.equal(attrs[0].displayName, 'color');
        assert.equal(attrs[0].attributeId, 'color');
        assert.equal(attrs[0].id, 'color');
        assert.isTrue(attrs[0].swatchable);
        assert.equal(attrs[0].values.length, 0);
    });

    it('should return color attributes with multiple values', function () {
        ProductAttributes = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/models/product/productAttributes', {
            '*/cartridge/scripts/util/collections': proxyquire('../../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/util/collections', {
                'dw/util/ArrayList': ArrayList
            }),
            '*/cartridge/scripts/helpers/urlHelpers': { appendQueryParams: function () {
                return '?pid=25604524&dwvar_25604524_size=038&dwvar_25604524_color=BLACKFB';
            } },
            '*/cartridge/scripts/helpers/productHelpers': {
                changeSwatchBorder: function () {
                    return {};
                },
                sizeModelImagesMapping: function () {
                    return {};
                },
                recipeForPDPSizeModelImage: function () {
                    return {};
                }
            },
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            enableFitModels: true
                        }
                    },
                    getCustomPreferenceValue: function () {
                        return true;
                    }
                }
            },
            'dw/util/HashMap': function () {
                return {
                    result: {},
                    put: function (key, context) {
                        this.result[key] = context;
                    }
                };
            },
            '*/cartridge/scripts/UACAPI/helpers/order/exchangeProductVariationModelHelper': {
                hasOrderableVariants: function () {
                    return true;
                }
            }
        });
        var tempMock = Object.assign({}, variationsMock);
        tempMock.productVariationAttributes = new ArrayList([{
            attributeID: 'color',
            displayName: 'color',
            ID: 'color'
        }, {
            attributeID: 'size',
            displayName: 'size',
            ID: 'SIZE_ID'
        }]);
        tempMock.getAllValues.return = new ArrayList([{
            ID: 'asdfa9s87sad',
            description: '',
            displayValue: 'blue',
            value: 'asdfa9s87sad',
            getImage: function () {
                return {
                    URL: 'URL'
                };
            }
        }, {
            ID: 'asd98f7asdf',
            description: '',
            displayValue: 'grey',
            value: 'asd98f7asdf',
            getImage: function () {
                return {
                    URL: 'URL'
                };
            }
        }]);
        tempMock.getFilteredValues = new ArrayList([{
            attributeID: 'color',
            displayName: 'color',
            ID: 'color'
        }]);

        tempMock.getFilteredValues = function () {
            return new ArrayList([{
                attributeID: 'color',
                displayName: 'color',
                ID: 'color',
                getImage: function () {
                    return {
                        URL: 'URL'
                    };
                }
            }]);
        };
        tempMock.getVariants = function () {
            return new ArrayList([{
                custom: {
                    color: 'color'
                },
                attributeID: 'color',
                displayName: 'color',
                ID: 'color',
                getImage: function () {
                    return {
                        URL: 'URL'
                    };
                }
            }]);
        };
        tempMock.master = {
            variationModel: {
                variants: '',
                master: {
                    custom: {
                        exclusive: {
                            value: 'exclusive'
                        }
                    }
                },
                setSelectedAttributeValue: function () {},
                getImages: function () {
                    return {
                        toArray: function () {
                            return [{}];
                        }
                    };
                }
            }
        };
        var mock = toProductMock(tempMock);
        var attributeConfig = {
            attributes: ['color'],
            endPoint: 'Show'
        };
        var attrs = new ProductAttributes(mock, attributeConfig);

        assert.equal(attrs.length, 1);
        assert.equal(attrs[0].displayName, 'color');
    });

    it('should return color attributes with multiple values --> colorVariant.custom.exclusive.value !== null', function () { // varient based color
        ProductAttributes = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/models/product/productAttributes', {
            '*/cartridge/scripts/util/collections': proxyquire('../../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/util/collections', {
                'dw/util/ArrayList': ArrayList
            }),
            '*/cartridge/scripts/helpers/urlHelpers': { appendQueryParams: function () {
                return '?pid=25604524&dwvar_25604524_size=038&dwvar_25604524_color=BLACKFB';
            } },
            '*/cartridge/scripts/helpers/productHelpers': {
                changeSwatchBorder: function () {
                    return {};
                },
                sizeModelImagesMapping: function () {}
            },
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            enableFitModels: true
                        }
                    },
                    getCustomPreferenceValue: function () {
                        return true;
                    }
                }
            },
            'dw/util/HashMap': function () {
                return {
                    result: {},
                    put: function (key, context) {
                        this.result[key] = context;
                    }
                };
            },
            '*/cartridge/scripts/UACAPI/helpers/order/exchangeProductVariationModelHelper': {
                hasOrderableVariants: function () {
                    return true;
                }
            }
        });
        var tempMock = Object.assign({}, variationsMock);
        tempMock.productVariationAttributes = new ArrayList([{
            attributeID: 'color',
            displayName: 'color',
            ID: 'color',
            value: 'color'
        }, {
            attributeID: 'size',
            displayName: 'size',
            ID: 'SIZE_ID'
        }]);
        tempMock.getAllValues.return = new ArrayList([{
            ID: 'asdfa9s87sad',
            description: '',
            displayValue: 'blue',
            value: 'asdfa9s87sad',
            getImage: function () {
                return {};
            }
        }, {
            ID: 'asd98f7asdf',
            description: '',
            displayValue: 'grey',
            value: 'asd98f7asdf',
            getImage: function () {
                return {};
            }
        }]);
        tempMock.getFilteredValues = new ArrayList([{
            attributeID: 'color',
            displayName: 'color',
            ID: 'color',
            value: 'color'
        }]);

        tempMock.getFilteredValues = function () {
            return new ArrayList([{
                attributeID: 'color',
                displayName: 'color',
                ID: 'color',
                value: 'color',
                getImage: function () {
                    return {};
                }
            }]);
        };
        tempMock.getVariants = function () {
            return new ArrayList([{
                custom: {
                    color: 'color'
                },
                attributeID: 'color',
                displayName: 'color',
                ID: 'color',
                value: 'color',
                getImage: function () {
                    return {};
                }
            }]);
        };
        tempMock.master = {
            variationModel: {
                variants: {
                    length: 1,
                    0: {
                        custom: {
                            color: 'color',
                            exclusive: 'exclusive'
                        }
                    }
                },
                master: {
                    custom: {
                        exclusive: {
                            value: null
                        }
                    }
                },
                setSelectedAttributeValue: function () {},
                getImages: function () {
                    return {
                        toArray: function () {
                            return [{}];
                        }
                    };
                }
            }
        };
        var mock = toProductMock(tempMock);
        var attributeConfig = {
            attributes: ['color'],
            endPoint: 'Show'
        };
        var attrs = new ProductAttributes(mock, attributeConfig);

        assert.equal(attrs.length, 1);
        assert.equal(attrs[0].displayName, 'color');
    });

    it('should return color attributes with multiple values --> masterVariationModel hasOrderableVariants', function () { // varient based color second case
        ProductAttributes = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/models/product/productAttributes', {
            '*/cartridge/scripts/util/collections': proxyquire('../../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/util/collections', {
                'dw/util/ArrayList': ArrayList
            }),
            '*/cartridge/scripts/helpers/urlHelpers': { appendQueryParams: function () {
                return '?pid=25604524&dwvar_25604524_size=038&dwvar_25604524_color=BLACKFB';
            } },
            '*/cartridge/scripts/helpers/productHelpers': {
                changeSwatchBorder: function () {
                    return {};
                },
                sizeModelImagesMapping: function () {}
            },
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            enableFitModels: true
                        }
                    },
                    getCustomPreferenceValue: function () {
                        return true;
                    }
                }
            },
            'dw/util/HashMap': function () {
                return {
                    result: {},
                    put: function (key, context) {
                        this.result[key] = context;
                    }
                };
            },
            '*/cartridge/scripts/UACAPI/helpers/order/exchangeProductVariationModelHelper': {
                hasOrderableVariants: function () {
                    return true;
                }
            }
        });
        var tempMock = Object.assign({}, variationsMock);
        tempMock.productVariationAttributes = new ArrayList([{
            attributeID: 'color',
            displayName: 'color',
            ID: 'color',
            value: 'color'
        }, {
            attributeID: 'size',
            displayName: 'size',
            ID: 'SIZE_ID'
        }]);
        tempMock.getAllValues.return = new ArrayList([{
            ID: 'asdfa9s87sad',
            description: '',
            displayValue: 'blue',
            value: 'asdfa9s87sad',
            getImage: function () {
                return {};
            }
        }, {
            ID: 'asd98f7asdf',
            description: '',
            displayValue: 'grey',
            value: 'asd98f7asdf',
            getImage: function () {
                return {};
            }
        }]);
        tempMock.getFilteredValues = new ArrayList([{
            attributeID: 'color',
            displayName: 'color',
            ID: 'color',
            value: 'color'
        }]);

        tempMock.getFilteredValues = function () {
            return new ArrayList([{
                attributeID: 'color',
                displayName: 'color',
                ID: 'color',
                value: 'color',
                getImage: function () {
                    return {};
                }
            }]);
        };
        tempMock.getVariants = function () {
            return new ArrayList([{
                custom: {
                    color: 'color'
                },
                attributeID: 'color',
                displayName: 'color',
                ID: 'color',
                value: 'color',
                getImage: function () {
                    return {};
                }
            }]);
        };
        tempMock.master = {
            variationModel: {
                variants: {
                    length: 1,
                    0: {
                        custom: {
                            color: 'color',
                            exclusive: null
                        }
                    }
                },
                master: {
                    custom: {
                        exclusive: {
                            value: null
                        }
                    }
                },
                setSelectedAttributeValue: function () {},
                getImages: function () {
                    return {
                        toArray: function () {
                            return [{}];
                        }
                    };
                },
                hasOrderableVariants: function () {
                    return true;
                }
            }
        };
        var mock = toProductMock(tempMock);
        var attributeConfig = {
            attributes: ['color'],
            endPoint: 'Show'
        };
        var attrs = new ProductAttributes(mock, attributeConfig);

        assert.equal(attrs.length, 1);
        assert.equal(attrs[0].displayName, 'color');
    });

    it('should return size attributes with multiple values', function () {
        var tempMock = Object.assign({}, variationsMock);
        tempMock.productVariationAttributes = new ArrayList([{
            attributeID: 'color',
            displayName: 'color',
            ID: 'COLOR_ID'
        }, {
            attributeID: 'size',
            displayName: 'size',
            ID: 'SIZE_ID'
        }]);
        tempMock.getAllValues.return = new ArrayList([{
            ID: '038',
            description: '',
            displayValue: '38',
            value: '038'
        }, {
            ID: '039',
            description: '',
            displayValue: '39',
            value: '039'
        }]);
        var mock = toProductMock(tempMock);
        var attributeConfig = {
            attributes: ['size'],
            endPoint: 'Show'
        };
        var attrs = new ProductAttributes(mock, attributeConfig);

        assert.equal(attrs.length, 1);
        assert.equal(attrs[0].displayName, 'size');
    });

    it('should return size attributes with a resetUrl', function () {
        ProductAttributes = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/models/product/productAttributes', {
            '*/cartridge/scripts/util/collections': proxyquire('../../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/util/collections', {
                'dw/util/ArrayList': ArrayList
            }),
            '*/cartridge/scripts/helpers/urlHelpers': { appendQueryParams: function () {
                return '?pid=25604524&dwvar_25604524_size=038&dwvar_25604524_color=BLACKFB';
            } },
            '*/cartridge/scripts/helpers/productHelpers': {},
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                        }
                    }
                }
            },
            'dw/util/HashMap': function () {
                return {
                    result: {},
                    put: function (key, context) {
                        this.result[key] = context;
                    }
                };
            },
            '*/cartridge/scripts/UACAPI/helpers/order/exchangeProductVariationModelHelper': {
                hasOrderableVariants: function () {
                    return true;
                }
            }
        });
        var tempMock = Object.assign({}, variationsMock);

        tempMock.productVariationAttributes = new ArrayList([{
            attributeID: 'color',
            displayName: 'color',
            ID: 'color'
        }, {
            attributeID: 'size',
            displayName: 'size',
            ID: 'size',
            resetUrl: ''
        }]);

        tempMock.getAllValues.return = new ArrayList([{
            ID: '038',
            description: '',
            displayValue: '38',
            value: '038',
            selectable: true,
            selected: false,
            url: 'attrID=something'
        }, {
            ID: '039',
            description: '',
            displayValue: '39',
            value: '039',
            selectable: true,
            selected: false,
            url: 'attrID=something'

        }]);

        tempMock.getSelectedValue.return = false;
        tempMock.hasOrderableVariants.return = true;
        tempMock.urlSelectVariationValue.return = '?pid=25604524&dwvar_25604524_size=038&dwvar_25604524_color=BLACKFB';
        tempMock.getVariants = function () {
            var arr = [{
                custom: {
                    size: '',
                    exclusive: {
                        value: 'out-of-stock'
                    }
                }
            }];
            return arr;
        };

        var mock = toProductMock(tempMock);
        var attributeConfig = {
            attributes: ['color'],
            endPoint: 'Show'
        };
        var attrs = new ProductAttributes(mock, attributeConfig, null, null, true);

        assert.equal(attrs[0].attributeId, 'color');
    });

    it('should return size attributes with a resetUrl and variantsBasedOnColor.length > 0', function () { // exchangeorderItem = false
        ProductAttributes = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/models/product/productAttributes', {
            '*/cartridge/scripts/util/collections': proxyquire('../../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/util/collections', {
                'dw/util/ArrayList': ArrayList
            }),
            '*/cartridge/scripts/helpers/urlHelpers': { appendQueryParams: function () {
                return '?pid=25604524&dwvar_25604524_size=038&dwvar_25604524_color=BLACKFB';
            } },
            '*/cartridge/scripts/helpers/productHelpers': {},
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                        }
                    }
                }
            },
            'dw/util/HashMap': function () {
                return {
                    result: {},
                    put: function (key, context) {
                        this.result[key] = context;
                    }
                };
            },
            '*/cartridge/scripts/UACAPI/helpers/order/exchangeProductVariationModelHelper': {
                hasOrderableVariants: function () {
                    return true;
                }
            }
        });
        var tempMock = Object.assign({}, variationsMock);

        tempMock.productVariationAttributes = new ArrayList([{
            attributeID: 'color',
            displayName: 'color',
            ID: 'color'
        }, {
            attributeID: 'size',
            displayName: 'size',
            ID: 'size',
            resetUrl: ''
        }]);

        tempMock.getAllValues.return = new ArrayList([{
            ID: '038',
            description: '',
            displayValue: '38',
            value: '038',
            selectable: true,
            selected: false,
            url: 'attrID=something'
        }, {
            ID: '039',
            description: '',
            displayValue: '39',
            value: '039',
            selectable: true,
            selected: false,
            url: 'attrID=something'

        }]);

        tempMock.getSelectedValue.return = false;
        tempMock.hasOrderableVariants.return = true;
        tempMock.urlSelectVariationValue.return = '?pid=25604524&dwvar_25604524_size=038&dwvar_25604524_color=BLACKFB';
        tempMock.getVariants = function () {
            var arr = [{
                custom: {
                    size: '038',
                    exclusive: {
                        value: 'out-of-stock'
                    }
                }
            }];
            return arr;
        };

        var mock = toProductMock(tempMock);
        var attributeConfig = {
            attributes: ['color'],
            endPoint: 'Show'
        };
        var attrs = new ProductAttributes(mock, attributeConfig, null, null, false);

        assert.equal(attrs[0].attributeId, 'color');
    });

    it('sorted Values Array has values', function () { // exchangeorderItem = false
        ProductAttributes = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/models/product/productAttributes', {
            '*/cartridge/scripts/util/collections': proxyquire('../../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/util/collections', {
                'dw/util/ArrayList': ArrayList
            }),
            '*/cartridge/scripts/helpers/urlHelpers': { appendQueryParams: function () {
                return '?pid=25604524&dwvar_25604524_size=038&dwvar_25604524_color=BLACKFB';
            } },
            '*/cartridge/scripts/helpers/productHelpers': {},
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                        }
                    }
                }
            },
            'dw/util/HashMap': function () {
                return {
                    result: {},
                    put: function (key, context) {
                        this.result[key] = context;
                    }
                };
            },
            '*/cartridge/scripts/UACAPI/helpers/order/exchangeProductVariationModelHelper': {
                hasOrderableVariants: function () {
                    return true;
                }
            }
        });
        var tempMock = Object.assign({}, variationsMock);

        tempMock.productVariationAttributes = new ArrayList([{
            attributeID: 'color',
            displayName: 'color',
            ID: 'color'
        }, {
            attributeID: 'length',
            displayName: 'length',
            ID: 'length',
            resetUrl: ''
        }]);

        tempMock.getAllValues.return = new ArrayList([{
            ID: '038',
            description: '',
            displayValue: '38',
            value: '038',
            selectable: true,
            selected: false,
            url: 'attrID=something'
        }, {
            ID: 'S',
            description: '',
            displayValue: 'S',
            value: 'S',
            selectable: true,
            selected: false,
            url: 'attrID=something'

        }]);

        tempMock.getSelectedValue.return = false;
        tempMock.hasOrderableVariants.return = true;
        tempMock.urlSelectVariationValue.return = '?pid=25604524&dwvar_25604524_size=038&dwvar_25604524_color=BLACKFB';
        tempMock.getVariants = function () {
            var arr = [{
                custom: {
                    size: '038',
                    exclusive: {
                        value: 'out-of-stock'
                    }
                }
            }];
            return arr;
        };

        var mock = toProductMock(tempMock);
        var attributeConfig = {
            attributes: ['color'],
            endPoint: 'Show'
        };
        var attrs = new ProductAttributes(mock, attributeConfig, null, null, false);

        assert.equal(attrs[0].attributeId, 'color');
    });

    it('Test Case attrConfig.attributes = selected', function () { // exchangeorderItem = false
        ProductAttributes = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/models/product/productAttributes', {
            '*/cartridge/scripts/util/collections': proxyquire('../../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/util/collections', {
                'dw/util/ArrayList': ArrayList
            }),
            '*/cartridge/scripts/helpers/urlHelpers': { appendQueryParams: function () {
                return '?pid=25604524&dwvar_25604524_size=038&dwvar_25604524_color=BLACKFB';
            } },
            '*/cartridge/scripts/helpers/productHelpers': {},
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                        }
                    }
                }
            },
            'dw/util/HashMap': function () {
                return {
                    result: {},
                    put: function (key, context) {
                        this.result[key] = context;
                    }
                };
            },
            '*/cartridge/scripts/UACAPI/helpers/order/exchangeProductVariationModelHelper': {
                hasOrderableVariants: function () {
                    return true;
                }
            }
        });
        var tempMock = Object.assign({}, variationsMock);

        tempMock.productVariationAttributes = new ArrayList([{
            attributeID: 'color',
            displayName: 'color',
            ID: 'color'
        }, {
            attributeID: 'length',
            displayName: 'length',
            ID: 'length',
            resetUrl: ''
        }]);

        tempMock.getAllValues.return = new ArrayList([{
            ID: '038',
            description: '',
            displayValue: '38',
            value: '038',
            selectable: true,
            selected: false,
            url: 'attrID=something'
        }, {
            ID: 'S',
            description: '',
            displayValue: 'S',
            value: 'S',
            selectable: true,
            selected: false,
            url: 'attrID=something'

        }]);

        tempMock.getSelectedValue.return = false;
        tempMock.hasOrderableVariants.return = true;
        tempMock.urlSelectVariationValue.return = '?pid=25604524&dwvar_25604524_size=038&dwvar_25604524_color=BLACKFB';
        tempMock.getVariants = function () {
            var arr = [{
                custom: {
                    size: '038',
                    exclusive: {
                        value: 'out-of-stock'
                    }
                }
            }];
            return arr;
        };

        var mock = toProductMock(tempMock);
        var attributeConfig = {
            attributes: 'selected'
        };
        var attrs = new ProductAttributes(mock, attributeConfig, null, null, false);

        assert.equal(attrs[0].attributeId, 'color');
    });
});
