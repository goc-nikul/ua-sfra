'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();


var getProductLineItems = function () {
    return [
        {
            product: {},
            quantity: {
                value: 2
            },
            productID: '883814258849',
            UUID: '9876543210',
            custom: {
                sku: '9876543210'
            },
            getProduct: function () {
                return {
                    custom: {
                        bvAverageRating: 'bvAverageRating',
                        bvReviewCount: 'bvReviewCount',
                        sku: 'sku',
                        giftCard: 'giftCard',
                        size: 'size'
                    },
                    isVariant: function () {
                        return true;
                    },
                    getID: function () {
                        return {};
                    },
                    getUPC: function () {
                        return {};
                    },
                    getImages: function () {
                        var image = [{
                            alt: 'cartFullDesktop',
                            URL: { toString: () => {
                                return 'image url';
                            }
                            },
                            title: ' cart image',
                            index: '0',
                            noImgAlt: 'cart image is not present',
                            absURL: 'image url'
                        }];
                        return image;
                    },
                    variationModel: {
                        master: {
                            ID: '1330767'
                        },
                        selectedVariant: false,
                        productVariationAttributes: [{
                            ID: 'color'
                        }, {
                            ID: 'size'
                        }],
                        getAllValues: function () {
                            return [{
                                value: 'someValue',
                                ID: 'size'
                            }];
                        },
                        setSelectedAttributeValue: function () {},
                        getSelectedVariant: function () {},
                        getSelectedValue: function (sizeAttr) {
                            return sizeAttr;
                        }
                    },
                    getMasterProduct: function () {
                        return {
                            getID: function () {
                                return {};
                            }
                        };
                    }
                };
            },
            getShipment: function () {
                return {};
            },
            getPrice: function () {
                return {};
            },
            getProratedPrice: function () {
                return {};
            },
            quantityValue: 1,
            adjustedTax: {},
            getQuantityValue: () => 1,
            getQuantity: function () {
                return {
                    getValue: function () {
                        return {};
                    }
                };
            },
            getOrderItem: function () {
                return {
                    getItemID: function () {
                        return {};
                    }
                };
            }
        }];
};
describe('int_klarna_payments_custom/cartridge/scripts/payments/requestBuilder/orderLineItem.js file test cases', () => {
    let orderLineItem = proxyquire('../../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/payments/requestBuilder/orderLineItem.js', {
        '*/cartridge/models/product/productImages': proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/product/productImages.js', {
            '*/cartridge/scripts/util/collections': require('../../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/helpers/productHelpers': {
                recipeForPDPSizeModelImage: function () {
                    return;
                }
            },
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/util/ArrayList': require('../../../../mocks/dw/dw_util_ArrayList')
        })
    });
    it('Test generateItemImageURL method image url is present', function () {
        global.dw = {
            catalog: {
                ProductVariationModel: Object
            }
        };
        var lineItem = getProductLineItems()[0];
        var imageURL = orderLineItem.prototype.generateItemImageURL(lineItem);
        assert.equal(imageURL, 'image url');
    });
});
