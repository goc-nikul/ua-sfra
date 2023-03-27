'use strict';

/* eslint-disable */

var assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();


describe('product videoMaterial decorator', function() {
    let Collection = require('../../mocks/dw/dw_util_Collection');

    let videoModel = require('../../../cartridges/app_ua_core/cartridge/models/product/productVideoMaterial');

    let decorator = proxyquire('../../../cartridges/app_ua_core/cartridge/models/product/decorators/videoMaterial', {
        '~/cartridge/models/product/productVideoMaterial': videoModel
    });

    global.empty = (data) => {
        return !data;
    };

    var expectedVideoMaterial = [
        {
            poster_url: "https://underarmour.scene7.com/is/image/Underarmour/someID-sample064_DEFAULT?bgc=f0f0f0&wid=640&hei=480&size=550,460",
            video_url_mp4: "https://underarmour.scene7.com/is/content/Underarmour/auto_dim7_someID-sample064-0x480-300k",
            masterID_selectedColor: "someID-sample064"
        }
    ]

    it('should create video360Material property for product with out options - selected color', function() {
        let object = {};
        let options = {
            variables: {
                color: null
            }
        };

        let productMock = {
            isVariant: function() {
                return true;
            },
            variationModel: {
                getProductVariationAttribute: function() {
                    return new Collection('');
                },
                getSelectedValue: function() {
                    return {
                        value: 'sample064'
                    };
                }
            },
            masterProduct: {
                ID: 'someID'
            },
            custom: {
                division: 'Footwear'
            }
        };

        decorator(object, productMock, options.variables);
        assert.deepEqual(object.video360Material, expectedVideoMaterial);
    });

    it('should create video360Material property for product with options - selected color ', function() {
        let object = {};
        let options = {
            variables: {
                color: {
                    value: 'sample064'
                }
            }
        };

        let productMock = {
            isVariant: function() {
                return true;
            },
            variationModel: {
                getProductVariationAttribute: function() {
                    return new Collection('');
                },
                getSelectedValue: function() {
                    return null;
                }
            },
            masterProduct: {
                ID: 'someID'
            },
            custom: {
                division: 'Footwear'
            }
        };

        decorator(object, productMock, options.variables);
        assert.deepEqual(object.video360Material, expectedVideoMaterial);
    });

    it('should create video360Material property for product with out selected color', function() {
        let object = {};
        let options = {
            variables: {
                color: null
            }
        };

        let productMock = {
            isVariant: function() {
                return false;
            },
            masterProduct: {
                variationModel: {

                }
            },
            ID: 'someID',
            variationModel: {
                defaultVariant: {},
                getProductVariationAttribute: function() {
                    return new Collection('');
                },
                getSelectedValue: function() {
                    return null;
                },
                getVariationValue: function() {
                    return {
                        value: 'sample064'
                    };
                },
                hasOrderableVariants: function() {
                    return true;
                }
            },
            custom: {
                division: 'Footwear'
            }
        };

        decorator(object, productMock, options.variables);
        assert.deepEqual(object.video360Material, expectedVideoMaterial);
    });

    it('should return empty array if not footwear', function() {
        let object = {};
        let options = {
            variables: {
                color: null
            }
        };

        let productMock = {
            isVariant: function() {
                return false;
            },
            masterProduct: {
                variationModel: {

                }
            },
            ID: 'someID',
            variationModel: {
                defaultVariant: {},
                getProductVariationAttribute: function() {
                    return new Collection('');
                },
                getSelectedValue: function() {
                    return null;
                },
                getVariationValue: function() {
                    return {
                        value: 'sample064'
                    };
                },
                hasOrderableVariants: function() {
                    return true;
                }
            },
            custom: {
                division: 'Not Footwear'
            }
        };

        decorator(object, productMock, options.variables);
        assert.deepEqual(object.video360Material, []);
    });


    it('should return empty array if invalid product is passed', function() {
        let object = {};

        decorator(object, null, null);
        assert.deepEqual(object.video360Material, []);
    });

    it('should return empty array if getProductVariationAttribute is null', function() {
        let object = {};
        let options = {
            variables: {
                color: {
                    value: 'sample064'
                }
            }
        };

        let productMock = {
            isVariant: function() {
                return false;
            },
            variationModel: {
                getProductVariationAttribute: function() {
                    return null;
                },
                getSelectedValue: function() {
                    return {
                        value: 'sample064'
                    };
                }
            },
            ID: 'someID',
            custom: {
                division: 'Footwear'
            }
        };

        decorator(object, productMock, options);
        assert.deepEqual(object.video360Material, []);
    });

    it('should return empty array if hasOrderableVariants is false', function() {
        let object = {};
        let options = {
            variables: {
                color: null
            }
        };

        let productMock = {
            isVariant: function() {
                return false;
            },
            masterProduct: {
                variationModel: {

                }
            },
            ID: 'someID',
            variationModel: {
                defaultVariant: {},
                variants: ['abc', 'def'],
                getProductVariationAttribute: function() {
                    return new Collection('');
                },
                getSelectedValue: function() {
                    return null;
                },
                getVariationValue: function() {
                    return {
                        value: 'sample064'
                    };
                },
                hasOrderableVariants: function() {
                    return false; // Test for hasOrderableVariants false
                }
            },
            custom: {
                division: 'Footwear'
            }
        };

        decorator(object, productMock, options.variables);
        assert.deepEqual(object.video360Material, expectedVideoMaterial);
    });

    it('should create video360Material property for product with out selected color', function() {
        let object = {};
        let options = {
            variables: {
                color: null
            }
        };

        let productMock = {
            isVariant: function() {
                return false; // This
            },
            masterProduct: {
                variationModel: {
                }
            },
            ID: 'someID',
            variationModel: {
                variants: ['abc', 'def'],
                getProductVariationAttribute: function() {
                    return new Collection('');
                },
                getSelectedValue: function() {
                    return null;
                },
                getVariationValue: function() {
                    return {
                        value: 'sample064'
                    };
                },
                hasOrderableVariants: function() {
                    return true;
                }
            },
            custom: {
                division: 'Footwear'
            }
        };

        decorator(object, productMock, options.variables);
        assert.deepEqual(object.video360Material, expectedVideoMaterial);
    });

    it('list of variants with orderable variants', function() {
        let object = {};
        let options = {
            variables: {
                color: null
            }
        };

        let productMock = {
            isVariant: function() {
                return false;
            },
            masterProduct: {
                variationModel: {

                }
            },
            ID: 'someID',
            variationModel: {
                defaultVariant: {},
                variants: ['abc', 'def'],
                getProductVariationAttribute: function() {
                    return new Collection('');
                },
                getSelectedValue: function() {
                    return null;
                },
                getVariationValue: function() {
                    return {
                        value: 'sample064'
                    };
                },
                hasOrderableVariants: function() {
                    return true; // Test for hasOrderableVariants false
                }
            },
            custom: {
                division: 'Footwear'
            }
        };

        decorator(object, productMock, options.variables);
        assert.deepEqual(object.video360Material, expectedVideoMaterial);
    });

});
