'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

describe('tile images decorator', function () {
    var tileImages = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/product/decorators/tileImages.js', {
        'dw/system/Logger': {
            error: function () {
                return {};
            }
        },
        'dw/web/Resource': {
            msg: function (params1) { return params1; }
        },
        '*/cartridge/scripts/helpers/productHelpers': {
            sizeModelImagesMapping: function () {
                return {};
            },
            getNoImageURL: function () {},
            getVariantForCustomAttribute: function () {
                return {
                    isVariant: function () {
                        return {};
                    },
                    onlineFlag: true,
                    availabilityModel: {
                        availability: 1,
                        orderable: true
                    },
                    custom: {
                        color: 'color'
                    }
                };
            },
            addRecipeToSizeModelImage: function () {
                return {};
            },
            getVariantForColor: function () {
                return {
                    onlineFlag: true,
                    availabilityModel: {
                        availability: 1,
                        orderable: true
                    }
                };
            },
            isHiddenColor: function () {
                return false;
            },
            isHiddenProduct: function () {
                return false;
            }
        },
        'dw/system/Site': {
            current: {
                preferences: {
                    custom: {
            
                    }
                },
                getCustomPreferenceValue: function () {
                    return false;
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

    it('Test tile images decorator', function () {
        var apiProduct = {
            getVariationModel: function () {
                return {
                    setSelectedAttributeValue: function () {},
                    getImages: function (param) {
                        if (param === 'gridTileDesktop') {
                            return {
                                toArray: function () {
                                    return [];
                                }
                            };
                        } else {
                            return {
                                toArray: function () {
                                    return [{}];
                                }
                            };
                        }
                    },
                    getProductVariationAttribute: function () {},
                    getSelectedValue: function () {},
                    getImage: function () {},
                    getVariants: function () {
                        return [{
                            availabilityModel: ''
                        }];
                    }
                };
            },
            custom: {
                giftCard: {
                    value: 'EGIFT_CARD'
                },
                defaultColorway: null
            },
            getProductVariationAttribute: function () {},
            isMaster: function () {
                return true;
            }
        };

        var productHit = {
            getRepresentedVariationValues: function () {
                return {
                    get: function () {
                        return {};
                    },
                    size: function () {
                        return 1;
                    }
                };
            }
        };
        global.request = {
            httpParameterMap: {
                team: {
                    value: ''
                },
                colorGroup: {
                    value: ''
                },
                shopThisLookoutfit: {
                    booleanValue: ''
                }
            }
        };
        var object = {};
        tileImages(object, apiProduct, productHit, '', '');
        assert.equal(object.images.desktop.main.viewType, 'gridTileDesktop');
    });

    it('Test tile images decorator ---> ATTRIBUTE_NAME = color and colorGroup not empty', function () {
        tileImages = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/product/decorators/tileImages.js', {
            'dw/system/Logger': {
                error: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/helpers/productHelpers': {
                sizeModelImagesMapping: function () {
                    return {};
                },
                getNoImageURL: function () {},
                getVariantForCustomAttribute: function () {
                    return {
                        isVariant: function () {
                            return {};
                        },
                        onlineFlag: true,
                        availabilityModel: {
                            availability: 1,
                            orderable: true
                        },
                        custom: {
                            color: 'color'
                        }
                    };
                },
                addRecipeToSizeModelImage: function () {
                    return {};
                },
                getVariantForColor: function () {
                    return {
                        onlineFlag: true,
                        availabilityModel: {
                            availability: 1,
                            orderable: true
                        }
                    };
                },
                isHiddenColor: function () {
                    return false;
                },
                isHiddenProduct: function () {
                    return false;
                }
            },
            'dw/system/Site': {
                current: {
                    preferences: {
                        custom: {
                            enableFitModels: 'enableFitModels'
                        }
                    },
                    getCustomPreferenceValue: function () {
                        return false;
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

        var apiProduct = {
            getVariationModel: function () {
                return {
                    setSelectedAttributeValue: function () {},
                    getImages: function (param) {
                        return {
                            toArray: function () {
                                return [{}];
                            }
                        };
                    },
                    getProductVariationAttribute: function () {
                        return {};
                    },
                    getSelectedValue: function () {},
                    getImage: function () {}
                };
            },
            custom: {
                giftCard: {
                    value: ''
                },
                defaultColorway: 'test'
            },
            getProductVariationAttribute: function () {},
            isMaster: function () {
                return true;
            }
        };

        var productHit = {
            getRepresentedVariationValues: function () {
                return {
                    get: function () {
                        return {
                            ID: 'color'
                        };
                    },
                    size: function () {
                        return 1;
                    }
                };
            }
        };

        global.request = {
            httpParameterMap: {
                team: {
                    value: 'test'
                },
                colorGroup: {
                    value: 'test'
                },
                shopThisLookoutfit: false
            }
        };
        var object = {};
        tileImages(object, apiProduct, productHit, '', 'outletMerchOverride');
        assert.isNotNull(object.images.desktop);
    });

    it('Test tile images decorator --> defaultColorway not empty and  ATTRIBUTE_NAME = color', function () {
        var apiProduct = {
            getVariationModel: function () {
                return {
                    setSelectedAttributeValue: function () {},
                    getImages: function (param) {
                        return {
                            toArray: function () {
                                return [{}];
                            }
                        };
                    },
                    getProductVariationAttribute: function () {
                        return {};
                    },
                    getSelectedValue: function () {},
                    getImage: function () {}
                };
            },
            custom: {
                giftCard: {
                    value: ''
                },
                defaultColorway: 'color, b'
            },
            getProductVariationAttribute: function () {},
            isMaster: function () {
                return true;
            }
        };

        var productHit = {
            getRepresentedVariationValues: function () {
                return {
                    get: function () {
                        return {
                            ID: 'color'
                        };
                    },
                    size: function () {
                        return 1;
                    }
                };
            }
        };

        global.request = {
            httpParameterMap: {
                team: {
                    value: ''
                },
                colorGroup: {
                    value: ''
                },
                shopThisLookoutfit: {
                    booleanValue: false
                }
            }
        };
        var object = {};
        tileImages(object, apiProduct, productHit, '', 'outletMerchOverride');
        assert.isNotNull(object.images.desktop);
    });

    it('Test tile images decorator ---> experienceType equal outletMerchOverride', function () {
        var count = 0;
        var apiProduct = {
            getVariationModel: function () {
                return {
                    setSelectedAttributeValue: function () {},
                    getImages: function (param) {
                        count++;
                        if (count === 1) {
                            return {
                                toArray: function () {
                                    return [];
                                }
                            };
                        } else {
                            return {
                                toArray: function () {
                                    return [{}];
                                }
                            };
                        }
                    },
                    getProductVariationAttribute: function () {
                        return {};
                    },
                    getSelectedValue: function () {},
                    getImage: function () {},
                    getVariants: function () {
                        return [{
                            onlineFlag: true,
                            availabilityModel: {
                                availability: 1,
                                orderable: true
                            }
                        }];
                    }
                };
            },
            custom: {
                giftCard: {
                    value: ''
                },
                defaultColorway: 'color, b'
            },
            getProductVariationAttribute: function () {},
            isMaster: function () {
                return true;
            }
        };

        var productHit = {
            getRepresentedVariationValues: function () {
                return {
                    get: function () {
                        return {
                            ID: 'color'
                        };
                    },
                    size: function () {
                        return 1;
                    }
                };
            }
        };

        global.request = {
            httpParameterMap: {
                team: {
                    value: ''
                },
                colorGroup: {
                    value: ''
                },
                shopThisLookoutfit: {
                    booleanValue: false
                }
            }
        };
        tileImages({}, apiProduct, productHit, '', 'outletMerchOverride');
    });

    it('Test tile images decorator --> experienceType equal outlet', function () {
        var count = 0;
        var apiProduct = {
            getVariationModel: function () {
                return {
                    setSelectedAttributeValue: function () {},
                    getImages: function (param) {
                        count++;
                        if (count === 1) {
                            return {
                                toArray: function () {
                                    return [];
                                }
                            };
                        } else {
                            return {
                                toArray: function () {
                                    return [{}];
                                }
                            };
                        }
                    },
                    getProductVariationAttribute: function () {
                        return {};
                    },
                    getSelectedValue: function () {},
                    getImage: function () {},
                    getVariants: function () {
                        return [{
                            onlineFlag: true,
                            availabilityModel: {
                                availability: 1,
                                orderable: true
                            }
                        }];
                    }
                };
            },
            custom: {
                giftCard: {
                    value: ''
                },
                defaultColorway: 'color, b',
                outletColors: 'red'
            },
            getProductVariationAttribute: function () {},
            isMaster: function () {
                return true;
            }
        };

        var productHit = {
            getRepresentedVariationValues: function () {
                return {
                    get: function () {
                        return {
                            ID: 'color'
                        };
                    },
                    size: function () {
                        return 1;
                    }
                };
            }
        };

        global.request = {
            httpParameterMap: {
                team: {
                    value: ''
                },
                colorGroup: {
                    value: ''
                },
                shopThisLookoutfit: {
                    booleanValue: false
                }
            }
        };
        tileImages({}, apiProduct, productHit, '', 'outlet');
    });

    it('Test tile images decorator --> experienceType equal premiumMerchOverride', function () {
        var count = 0;
        var apiProduct = {
            getVariationModel: function () {
                return {
                    setSelectedAttributeValue: function () {},
                    getImages: function (param) {
                        count++;
                        if (count === 1) {
                            return {
                                toArray: function () {
                                    return [];
                                }
                            };
                        } else {
                            return {
                                toArray: function () {
                                    return [{}];
                                }
                            };
                        }
                    },
                    getProductVariationAttribute: function () {
                        return {};
                    },
                    getSelectedValue: function () {},
                    getImage: function () {},
                    getVariants: function () {
                        return [{
                            onlineFlag: true,
                            availabilityModel: {
                                availability: 1,
                                orderable: true
                            }
                        }];
                    }
                };
            },
            custom: {
                giftCard: {
                    value: ''
                },
                defaultColorway: 'color, b',
                outletColors: 'color'
            },
            getProductVariationAttribute: function () {},
            isMaster: function () {
                return true;
            }
        };

        var productHit = {
            getRepresentedVariationValues: function () {
                return {
                    get: function () {
                        return {
                            ID: 'color'
                        };
                    },
                    size: function () {
                        return 1;
                    }
                };
            }
        };

        global.request = {
            httpParameterMap: {
                team: {
                    value: ''
                },
                colorGroup: {
                    value: ''
                },
                shopThisLookoutfit: {
                    booleanValue: false
                }
            }
        };
        tileImages({}, apiProduct, productHit, '', 'premiumMerchOverride');
    });

    it('Test tile images decorator --> check catch statment', function () {
        var stub = sinon.stub();
        var expectedError = new Error('Custom Error Check');
        stub.throws(expectedError);
        var apiProduct = {
            getVariationModel: function () {
                return {
                    setSelectedAttributeValue: function () {},
                    getImages: function (param) {
                        return {
                            toArray: function () {
                                return [{}];
                            }
                        };
                    },
                    getProductVariationAttribute: function () {
                        return {};
                    },
                    getSelectedValue: function () {},
                    getImage: function () {}
                };
            },
            custom: {
                giftCard: {
                    value: ''
                },
                defaultColorway: 'color, b'
            },
            getProductVariationAttribute: function () {},
            isMaster: stub
        };

        var productHit = {
            getRepresentedVariationValues: function () {
                return {
                    get: function () {
                        return {
                            ID: 'color'
                        };
                    },
                    size: function () {
                        return 1;
                    }
                };
            }
        };

        global.request = {
            httpParameterMap: {
                team: {
                    value: ''
                },
                colorGroup: {
                    value: ''
                },
                shopThisLookoutfit: {
                    booleanValue: false
                }
            }
        };
        tileImages({}, apiProduct, productHit, '', 'outletMerchOverride');
    });

    it('Test tile all mobile images decorator', function () {
        var apiProduct = {
            getVariationModel: function () {
                return {
                    setSelectedAttributeValue: function () {},
                    getImages: function (param) {
                        if (param === 'pdpMainDesktop') {
                            return {
                                toArray: function () {
                                    return [
                                        {URL: "https://underarmour.scene7.com/is/image/Underarmour/1342663-400_SLF_SL?rp=standard-0pad|gridTileDesktop&scl=1&fmt=jpg&qlt=50&resMode=sharp2&cache=on,on&bgc=F0F0F0&wid=512&hei=640&size=512,640"},
                                        {URL: "https://underarmour.scene7.com/is/image/Underarmour/3022711-100_DEFAULT?rp=standard-30pad|gridTileDesktop&scl=1&fmt=jpg&qlt=50&resMode=sharp2&cache=on,on&bgc=F0F0F0&wid=512&hei=640&size=472,600"},
                                        {URL: "https://underarmour.scene7.com/is/image/Underarmour/1315434-001_SLF_SL?rp=standard-0pad|gridTileDesktop&scl=1&fmt=jpg&qlt=50&resMode=sharp2&cache=on,on&bgc=F0F0F0&wid=512&hei=640&size=512,640"},
                                        {URL: "https://underarmour.scene7.com/is/image/Underarmour/1252084-001_SLF_SL?rp=standard-0pad|gridTileDesktop&scl=1&fmt=jpg&qlt=50&resMode=sharp2&cache=on,on&bgc=F0F0F0&wid=512&hei=640&size=512,640"},
                                        {URL: "https://underarmour.scene7.com/is/image/Underarmour/V5-1257471-001_FC_Main?rp=standard-0pad|gridTileDesktop&scl=1&fmt=jpg&qlt=50&resMode=sharp2&cache=on,on&bgc=F0F0F0&wid=512&hei=640&size=512,640"},
                                        {URL: "https://underarmour.scene7.com/is/image/Underarmour/1300488-991_SLF_SL?rp=standard-0pad|gridTileDesktop&scl=1&fmt=jpg&qlt=50&resMode=sharp2&cache=on,on&bgc=F0F0F0&wid=512&hei=640&size=512,640"},
                                        {URL: "https://underarmour.scene7.com/is/image/Underarmour/1300033-001_F?rp=standard-10pad|gridTileDesktop&scl=1&fmt=jpg&qlt=50&resMode=sharp2&cache=on,on&bgc=F0F0F0&wid=512&hei=640&size=512,600"},
                                        {URL: "https://underarmour.scene7.com/is/image/Underarmour/1305519-102_SLF_SL?rp=standard-0pad|gridTileDesktop&scl=1&fmt=jpg&qlt=50&resMode=sharp2&cache=on,on&bgc=F0F0F0&wid=512&hei=640&size=512,640"},
                                        {URL: "https://underarmour.scene7.com/is/image/Underarmour/V5-1313204-006_FC_Main?rp=standard-0pad|gridTileDesktop&scl=1&fmt=jpg&qlt=50&resMode=sharp2&cache=on,on&bgc=F0F0F0&wid=512&hei=640&size=512,640"},
                                        {URL: "https://underarmour.scene7.com/is/image/Underarmour/V5-1316264-012_FC_Main?rp=standard-0pad|gridTileDesktop&scl=1&fmt=jpg&qlt=50&resMode=sharp2&cache=on,on&bgc=F0F0F0&wid=512&hei=640&size=512,640"},
                                        {URL: "https://underarmour.scene7.com/is/image/Underarmour/V5-1289577-001_FC_Main?rp=standard-0pad|gridTileDesktop&scl=1&fmt=jpg&qlt=50&resMode=sharp2&cache=on,on&bgc=F0F0F0&wid=512&hei=640&size=512,640"}                                
                                    ];
                                }
                            };
                        } else {
                            return {
                                toArray: function () {
                                    return [{}];
                                }
                            };
                        }
                    },
                    getProductVariationAttribute: function () {},
                    getSelectedValue: function () {},
                    getImage: function () {},
                    getVariants: function () {
                        return [{
                            availabilityModel: ''
                        }];
                    }
                };
            },
            custom: {
                giftCard: {
                    value: 'EGIFT_CARD'
                },
                defaultColorway: null
            },
            getProductVariationAttribute: function () {},
            isMaster: function () {
                return true;
            }
        };

        var productHit = {
            getRepresentedVariationValues: function () {
                return {
                    get: function () {
                        return {};
                    },
                    size: function () {
                        return 1;
                    }
                };
            }
        };
        global.request = {
            httpParameterMap: {
                team: {
                    value: ''
                },
                colorGroup: {
                    value: ''
                },
                shopThisLookoutfit: {
                    booleanValue: ''
                }
            }
        };
        var object = {};
        tileImages(object, apiProduct, productHit, '', '');
        assert.isNotNull(object.images.mobile.all[0].URL);
    });

    it('Test tile all mobile images decorator -- Null check', function () {
        var apiProduct = {
            getVariationModel: function () {
                return {
                    setSelectedAttributeValue: function () {},
                    getImages: function (param) {
                        if (param === 'pdpMainDesktop') {
                            return {
                                toArray: function () {
                                    return [];
                                }
                            };
                        } else {
                            return {
                                toArray: function () {
                                    return [{}];
                                }
                            };
                        }
                    },
                    getProductVariationAttribute: function () {},
                    getSelectedValue: function () {},
                    getImage: function () {},
                    getVariants: function () {
                        return [{
                            availabilityModel: ''
                        }];
                    }
                };
            },
            custom: {
                giftCard: {
                    value: 'EGIFT_CARD'
                },
                defaultColorway: null
            },
            getProductVariationAttribute: function () {},
            isMaster: function () {
                return true;
            }
        };

        var productHit = {
            getRepresentedVariationValues: function () {
                return {
                    get: function () {
                        return {};
                    },
                    size: function () {
                        return 1;
                    }
                };
            }
        };
        global.request = {
            httpParameterMap: {
                team: {
                    value: ''
                },
                colorGroup: {
                    value: ''
                },
                shopThisLookoutfit: {
                    booleanValue: ''
                }
            }
        };
        var object = {};
        tileImages(object, apiProduct, productHit, '', '');
        assert.isNotNull(object.images.mobile.all);
    });
});
