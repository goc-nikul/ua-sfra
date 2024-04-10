const assert = require('chai').assert;
const expect = require('chai').expect;
const sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var customizeVariationMetadata = require('../../../../../mocks/constructor/transformers/customizeVariationMetadata');

describe('getVariationMetadata', function() {
    it('should correctly generate variation metadata for a product with valid data', function() {
        const mockProduct = {
            variationModel: {
                getProductVariationAttribute: function(attributeName) {
                    return attributeName === 'color' ? { displayName: 'Color' } : null;
                },
                getVariationValue: function(product, attribute) {
                    return {
                        displayValue: 'Red'
                    }
                },
                getDefaultVariant: function() {
                    return true;
                }
            },
            getUPC: function() {
                return '123456789';
            },
            getImage: function() {
                return {
                    getURL: function() {
                        return {
                            toString: function() {
                                return 'https://underarmour.scene7.com/is/image/Underarmour/V5-1379845-294_FC?rp=standard-0pad%7CpdpMainDesktop&scl=1&fmt=jpg&qlt=75&resMode=sharp2&cache=on%2Con&bgc=F0F0F0&wid=566&hei=708&size=566%2C708';
                            }
                        };
                    },
                    getTitle: function() {
                        return 'Image Title';
                    }
                };
            },
            custom: {
                hexcolor: '#FF0000',
                exclusive: {
                    value: 'premium-filter'
                },
                color: 'Red',
                defaultColorway: '001'
            },
            availabilityModel: {
                getAvailabilityLevels: function(qty) {
                    return {
                        getPreorder: function() {
                            return {
                                getValue: function() {
                                    return 0;
                                }
                            }
                        }
                    }
                }
            },
            isVariant: function() {
                return true;
            },
            masterProduct: {
                custom: {
                    defaultColorway: '003'
                }
            }
        };

        const mockData = {
            inventory: 10,
            hideColorWay: false,
            orderable: true,
            defaultColorwayId: 'defaultColorway123',
            preorderMessages: 'Preorder available',
            sizeModelImages: [
                {
                    URL: 'image1.jpg'
                },
                {
                    URL: 'image2.jpg'
                }
            ],
            variationMeta: [{ key: 'attribute1', value: 'value1' }],
            listPrice: 99.99,
            salePrice: 79.99,
            sortOptions: ['option1', 'option2']
        };

        const result = customizeVariationMetadata.getVariationMetadata(mockProduct, mockData);

        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(25);

        expect(result).to.deep.include({ key: 'defaultColor', value: 'Red' });
        expect(result).to.deep.include({ key: 'colorValue', value: 'Red' });
        expect(result).to.deep.include({ key: 'json:hexColor', value: '"FF0000"' });
        expect(result).to.deep.include({ key: 'upc', value: '123456789' });
        expect(result).to.deep.include({ key: 'json:colorWayId', value: '{"color":"Red"}' });
        expect(result).to.deep.include({ key: 'currentHealth', value: 10 });
    });
});
