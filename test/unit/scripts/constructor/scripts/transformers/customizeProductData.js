const assert = require('chai').assert;
const expect = require('chai').expect;
const sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var Collection = require('../../../../../mocks/dw/dw_util_Collection');
var customizeProductData = require('../../../../../mocks/constructor/transformers/customizeProductData');

describe('getProductData', () => {
    let product;
    let data;

    beforeEach(() => {
        // Initialize product and data before each test
        var categories = new Collection();
        categories.add(
            {
                displayName: 'Womens',
                UUID: 'jf485f8945jf94f',
                ID: 'women'
            }
        );

        product = {
            UUID: '1234',
            ID: '1378676',
            name: 'Sample Product',
            categories: categories,
            online: true,
            availabilityModel: {
                inventoryRecord: {
                    ATS: 10,
                    preorderable: false,
                    allocation: 5,
                },
                isInStock: () => true,
            },
            priceModel: {
                getPriceBookPrice: () => ({ value: 100 }),
            },
            isVariant: () => true,
            custom: {
                sku: '1378676-001-OSFA',
                agegroup: 'Adult',
                team: 'N/A',
                experienceType: 'outlet',
                defaultColorway: 883,
                preOrderPDPMessage: 'pdp message',
                preOrderProductTileMessage: 'tile message'
            },
            getMasterProduct: () => ({ ID: 196040206172 }),
            categories: categories,
            getImage: () => ({
                getURL() {
                    return 'https://underarmour.scene7.com/is/image/Underarmour/V5-1379845-294_FC?rp=standard-0pad%7CpdpMainDesktop&scl=1&fmt=jpg&qlt=75&resMode=sharp2&cache=on%2Con&bgc=F0F0F0&wid=566&hei=708&size=566%2C708';
                }
            }),
            activeData: {
                revenueMonth: 10000000,
                conversionMonth: 500009,
                viewsMonth: 99999999,
                daysAvailable: 265,
                bvAverageRating: 3
            }
        };

        const CustomObjectMgrMock = {
            getAllCustomObjects: function() {
                const customObjects = [
                    {
                        custom: {
                            constructorKey: 'dna',
                            sfccAttribute: 'custom.dna',
                            constructorFeedType: ['master', 'variation'],
                            constructorDataType: ['metadata']
                        }
                    },
                    {
                        custom: {
                            constructorKey: 'subsubsilhouette',
                            sfccAttribute: 'custom.subsubsilhouette',
                            constructorFeedType: ['master', 'variation'],
                            constructorDataType: ['facet', 'metadata']
                        }
                    },
                    {
                        custom: {
                            constructorKey: 'categoryID',
                            sfccAttribute: 'primaryCategory.ID',
                            constructorFeedType: ['master'],
                            constructorDataType: ['metadata']
                        }
                    }
                ];
                let index = 0;
                return {
                    hasNext: function() {
                        return index < customObjects.length;
                    },
                    next: function() {
                        return customObjects[index++];
                    }
                };
            }
        };

        var objectHelper = proxyquire('../../../../../../cartridges/int_constructor_custom_legacy/cartridge/scripts/custom/objectHelper.js', {
            'dw/object/CustomObjectMgr': CustomObjectMgrMock
        });

        data = {
            additionalData: 'some additional data',
            attributeList: objectHelper.buildSimpleProductAttributeList(),
            image: {
                url: 'https://someurl.com'
            }
        };
    });

    it('should return transformed product data', () => {
        const result = customizeProductData.getProductData(product, data);

        expect(result).to.be.an('object');
        expect(result).to.have.property('uuid', '1234');
        expect(result).to.have.property('id', '1378676-001-OSFA');
        expect(result).to.have.property('pageURL');
        expect(result).to.have.property('name', 'Sample Product');
        expect(result).to.have.property('categories').to.deep.equal([{
            "displayName": "Womens",
            "id": "women",
            "uuid": "jf485f8945jf94f"
        }]);
        expect(result).to.have.property('description');
        expect(result).to.have.property('image');
        expect(result).to.have.property('online', true);
        expect(result).to.have.property('parentId');
        expect(result).to.have.property('promos').to.deep.equal([{ promo: 'discount' }]);
        expect(result).to.have.property('searchRefinements').to.deep.equal(
            [
                {
                    key: 'team',
                    value: ['Cubs']
                },
                {
                    key: 'experienceType',
                    value: ['Premium']
                },
                {
                    key: 'ageGroup',
                    value: ['Adult']
                }
            ]
        );
        expect(result).to.have.property('sortOptions').to.deep.equal(
            {
                "bestSellers": 16625002.15,
                "newest": 265,
                "rating": 0
            }
        );
        expect(result).to.have.property('defaultColorwayId').to.deep.equal(JSON.stringify({ id:883 }));
        expect(result).to.have.property('preorderMessages').to.deep.equal(JSON.stringify({
            pdpMessage: 'pdp message',
            tileMessage: 'tile message'
        }));
    });
});

describe('parseCategories', function() {
    it('should parse product categories correctly', function() {
        const categoriesMock = {
            toArray: function() {
                return [
                    { displayName: 'Category 1', UUID: '12345', ID: 'cat1' },
                    { displayName: 'Category 2', UUID: '67890', ID: 'cat2' }
                ];
            }
        };

        const parsedCategories = customizeProductData.parseCategories(categoriesMock);

        const expectedCategories = [
            { displayName: 'Category 1', uuid: '12345', id: 'cat1' },
            { displayName: 'Category 2', uuid: '67890', id: 'cat2' }
        ];

        expect(parsedCategories).to.deep.equal(expectedCategories);
    });

    it('should return an empty array if no categories are provided', function() {
        const parsedCategories = customizeProductData.parseCategories(null);

        expect(parsedCategories).to.be.an('array').that.is.empty;
    });
});

describe('parseDescription', function() {
    it('should parse product description correctly when description exists', function() {
        const productMockWithDescription = {
            getAttributeValue: function(attributeName) {
                if (attributeName === 'whatsItDo') {
                    return 'This is the product description.';
                }
                return null;
            },
            custom: {
                whatsItDo: 'lots of things'
            }
        };

        const parsedDescription = customizeProductData.parseDescription(productMockWithDescription);

        const expectedDescription = 'This is the product description.';

        expect(parsedDescription).to.equal('lots of things');
    });

    it('should return null if product description is not found', function() {
        const productMockWithoutDescription = {
            getAttributeValue: function(attributeName) {
                return null;
            },
            custom: {
                whatsItDo: ''
            }
        };

        const parsedDescription = customizeProductData.parseDescription(productMockWithoutDescription);

        expect(parsedDescription).to.be.null;
    });
});

describe('prepAttributeData', function() {
    it('should correctly prepare attribute data when attributes exist for master product', function() {
        const mockProduct = {
            ID: '12345',
            productName: 'Test Product',
            variant: false,
            getProductVariationAttributes: function() {
                return {
                    color: 'Red',
                    size: 'Medium'
                };
            },
            custom: {
                color: 'Red',
                size: 'Medium'
            }
        };

        const mockData = {
            attributeList: [
                {
                    sfccKey: 'custom.color',
                    cioKey: 'Color',
                    feedType: [{ value: 'master' }],
                    dataType: [{ value: 'facet' }]
                },
                {
                    sfccKey: 'custom.size',
                    cioKey: 'Size',
                    feedType: [{ value: 'master' }],
                    dataType: [{ value: 'facet' }]
                }
            ]
        };

        const result = customizeProductData.prepAttributeData(mockProduct, mockData);

        expect(result.itemFacets).to.have.lengthOf(2); // Two facets for master product
        expect(result.itemMeta).to.have.lengthOf(0); // No metadata for master product
        expect(result.variationFacets).to.have.lengthOf(0); // No facets for variation product
        expect(result.variationMeta).to.have.lengthOf(0); // No metadata for variation product
    });

    it('should return empty attribute arrays when no attributes are found', function() {
        const mockProduct = {
            ID: '67890',
            productName: 'Test Product',
            variant: true,
            getProductVariationAttributes: function() {
                return {};
            }
        };

        const mockData = {
            attributeList: []
        };

        const result = customizeProductData.prepAttributeData(mockProduct, mockData);

        expect(result.itemFacets).to.have.lengthOf(0); // No facets for master product
        expect(result.itemMeta).to.have.lengthOf(0); // No metadata for master product
        expect(result.variationFacets).to.have.lengthOf(0); // No facets for variation product
        expect(result.variationMeta).to.have.lengthOf(0); // No metadata for variation product
    });
});
