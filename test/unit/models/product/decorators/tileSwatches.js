'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var Collections = require('../../../../mocks/dw/dw_util_Collection');

var hit = {
    getRepresentedVariationValues: function () {
        return new Collections(
            {
                value: 'blue',
                ID: 'blue',
                getImage: function () {
                    return {
                        URL: 'URL'
                    };
                }
            });
    },
    getProduct: function () {
        return {
            getVariationModel: function () {
                return {
                    getMaster: function () {
                        return {
                            custom: {
                                enduse: true
                            }
                        };
                    },
                    setSelectedAttributeValue: function () {
                        return {};
                    },
                    getProductVariationAttribute: function () {
                        return {};
                    },
                    getSelectedVariants: function () {
                        return [{ custom: { team: {} } }];
                    },
                    getVariationValue: function () {
                        return {};
                    },
                    hasOrderableVariants: function () {
                        return {};
                    },
                    getImages: function () {
                        return {
                            toArray: function () {
                                return [{}];
                            }
                        };
                    }
                };
            }
        };
    },
    getRepresentedProducts: function () {
        return [
            {
                value: 'blue',
                ID: 'blue',
                custom: {
                    color: 'blue'
                }
            }
        ];
    }
};
describe('tile swathes decorator', function () {
    var tileSwatches = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/product/decorators/tileSwatches.js', {
        '*/cartridge/scripts/util/collections': require('../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
        '*/cartridge/scripts/helpers/productHelpers': {
            sizeModelImagesMapping: function () {
                return {};
            },
            addRecipeToSizeModelImage: function () {
                return {};
            },
            changeSwatchBorder: function () {
                return {};
            }
        },
        'dw/web/URLUtils': {
            url: function () {
                return {
                    toString: function () {
                        return '';
                    }
                };
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
                    return {};
                }
            }
        }
    });

    it('Test tile Swatches decorator --> if hit equal null', function () {
        var object = {};
        tileSwatches(object, null, '', '', '', true);
        assert.isNull(object.swatches);
    });

    it('Test tile Swatches decorator', function () {
        var object = {};
        tileSwatches(object, hit, '', '', '', true);
        assert.equal(object.swatches.count, 1);
    });

    it('Test tile Swatches decorator --> Variant Custom Attributes Exist', function () {
        hit.getRepresentedProducts = function () {
            return [
                {
                    value: 'blue',
                    ID: 'blue',
                    custom: {
                        color: 'blue',
                        hexcolor: 'hexcolor',
                        secondaryhexcolor: 'secondaryhexcolor',
                        logohexcolor: 'logohexcolor'
                    }
                }
            ];
        };
        var object = {};
        tileSwatches(object, hit, '', '', '', true);
        assert.equal(object.swatches.count, 1);
    });

    it('Test tile Swatches decorator ---> experienceType = outletMerchOverride ', function () {
        var object = {};
        tileSwatches(object, hit, 'color', 'outletMerchOverride', '', true);
        assert.equal(object.swatches.count, 0);
    });

    it('Test tile Swatches decorator ---> experienceType = premiumMerchOverride ', function () {
        hit.getRepresentedVariationValues = function () {
            return new Collections(
                {
                    value: 'blue',
                    ID: 'blue',
                    getImage: function () {
                        return {
                            URL: 'URL'
                        };
                    }
                });
        };
        var object = {};
        tileSwatches(object, hit, 'blue', 'premiumMerchOverride', '', true);
        assert.equal(object.swatches.count, 0);
    });

    it('Test tile Swatches decorator ---> hasOrderableVariants = false ', function () {
        hit.getProduct = function () {
            return {
                getVariationModel: function () {
                    return {
                        getMaster: function () {
                            return {
                                custom: {
                                    enduse: true
                                }
                            };
                        },
                        setSelectedAttributeValue: function () {
                            return {};
                        },
                        getProductVariationAttribute: function () {
                            return {};
                        },
                        getSelectedVariants: function () {
                            return [{ custom: { team: {} } }];
                        },
                        getVariationValue: function () {
                            return {};
                        },
                        hasOrderableVariants: function () {
                            return false;
                        },
                        getImages: function () {
                            return {
                                toArray: function () {
                                    return [{}];
                                }
                            };
                        }
                    };
                }
            };
        };
        var object = {};
        tileSwatches(object, hit, '', '', '', true);
        assert.equal(object.swatches.count, 0);
    });

    it('Test tile Swatches decorator ---> filterTeam = selectedTeam in colorVariant ', function () {
        hit.getProduct = function () {
            return {
                getVariationModel: function () {
                    return {
                        getMaster: function () {
                            return {
                                custom: {
                                    enduse: true
                                }
                            };
                        },
                        setSelectedAttributeValue: function () {
                            return {};
                        },
                        getProductVariationAttribute: function () {
                            return {};
                        },
                        getSelectedVariants: function () {
                            return [{ custom: { team: {} } }];
                        },
                        getVariationValue: function () {
                            return {};
                        },
                        hasOrderableVariants: function () {
                            return {};
                        },
                        getImages: function () {
                            return {
                                toArray: function () {
                                    return [{}];
                                }
                            };
                        }
                    };
                }
            };
        };
        var object = {};
        tileSwatches(object, hit, '', '', '', true, 'filterTeam');
        assert.equal(object.swatches.count, 0);
    });
});
