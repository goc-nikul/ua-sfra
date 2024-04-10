const assert = require('chai').assert;
const expect = require('chai').expect;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockProductHelper = require('../../../../../mocks/constructor/custom/productHelper');

var utcReleaseDate = new Date('2023-11-15T12:30:00Z')

var mockedProduct = {
    ID: 1316724,
    custom: {
        releaseDate: utcReleaseDate
    },
    priceModel: {},
    getPrimaryCategory: function() {
        return {
            ID: 'men-clothing-outerwear',
            getPageURL: function() {
                return 'c/mens/clothing/outerwear';
            }
        };
    },
    getLongDescription: function() {
        return 'Men\'s Ridge Reaper® Infil Ops WINDSTOPPER® Jacket';
    },
    getLastModified: function() {
        return '2023-12-11T22:34:06.000Z';
    }
};

var mockedData = {
    defaultColorwayId: '{"id":"999"}',
    itemMeta: [
        {
            key: 'season',
            value: 'FW21, FW22'
        },
        {
            key: 'suggestedScore',
            value: 89
        }
    ],
    minListPrice: 200,
    maxSalePrice: 175,
    maxListPrice: 300,
    minSalePrice: 150,
    preorderMessages: {
        pdpMessage: 'PDP message',
        tileMessage: 'PLP message'
    },
    promoPricingEnabled: true,
    sortOptions: {
        "newest": 545,
        "rating": 4912,
        "bestSellers": 2407
    },
    isSlicedProduct: false
};

var mockedReleaseDate = mockProductHelper.getReleaseDate(mockedProduct);

describe('getItemMetadata Function', function() {
    it('should return an array of objects representing custom metadata', function() {
        var customizeItemMetadata = proxyquire('../../../../../mocks/constructor/transformers/customizeItemMetadata', {
            '../custom/productHelper': {
                getVariantData: function(product, data) {
                    return {
                        colors: 'Misc/Assorted',
                        qtys: '0,50,76,176,193,110,1',
                        sizes: 'XS,SM,MD,LG,XL,XXL,3XL',
                        skus: ['1316724-999-XS','1316724-999-SM','1316724-999-MD','1316724-999-LG','1316724-999-XL','1316724-999-XXL','1316724-999-3XL'],
                        upcs: ['193444955705','191632022635','191632022642','191632022659','191632022666','191632022673','191632022680'],
                        customerGroupPricing: {
                            "Everyone Minus Employee, ID.me, & VIP": {
                                "max": 55,
                                "min": 41.97
                            }
                        }
                    };
                },
                getOnModelImage: function(product) {
                    return 'https://underarmour.scene7.com/is/image/Underarmour/V5-1361033-100_FC_MD?rp=standard-0pad%7CpdpMainDesktop&scl=1&fmt=jpg&qlt=75&resMode=sharp2&cache=on%2Con&bgc=F0F0F0&wid=566&hei=708&size=566%2C708';
                },
                getCategoryPath: function(product, primaryCategory) {
                    return 'Men > Shop by Category > Jackets & Vests';
                },
                getFitCare: function(product) {
                    return 'Zip up front zipper before washing|Machine wash cold with like colors|Do not bleach|Line dry|Do not iron|Do not dry clean';
                },
                getVideoMaterials: function(product) {
                    return null;
                },
                getPriceCurrency: function(priceModel) {
                    return 'USD';
                },
                getSwatchCount: function(productID) {
                    return 5;
                },
                getPromotions: function(product) {
                    return [
                        {
                            'id': 'Green Monday 2023 Message',
                            'rank': 10,
                            'callOut': '30% Off + Free Shipping use code UAHOLIDAY',
                            'endDate': '2023-12-15T08:00:00.000Z',
                            'startDate': '2023-12-07T08:00:00.000Z',
                            'toolTipText': 'Cannot be combined with other offers. Exclusions apply. Ends 12/14.',
                            'customerGroups': [
                                'Everyone Minus Employee, ID.me, & VIP'
                            ]
                        }
                    ];
                },
                getTileUpperLeftFlameIconBadge: function(product) {
                    return 'New';
                }
            }
        });

        var response = [
            {
                key: 'onModelImageURL',
                value: 'https://underarmour.scene7.com/is/image/Underarmour/V5-1361033-100_FC_MD?rp=standard-0pad%7CpdpMainDesktop&scl=1&fmt=jpg&qlt=75&resMode=sharp2&cache=on%2Con&bgc=F0F0F0&wid=566&hei=708&size=566%2C708'
            },
            {
                key: 'categoryPath',
                value: 'Men > Shop by Category > Jackets & Vests'
            },
            {
                key: 'fitCare',
                value: 'Zip up front zipper before washing|Machine wash cold with like colors|Do not bleach|Line dry|Do not iron|Do not dry clean'
            },
            {
                key: 'longDescription',
                value: 'Men\'s Ridge Reaper® Infil Ops WINDSTOPPER® Jacket'
            },
            {
                key: 'lastModified',
                value: '2023-12-11T22:34:06.000Z'
            },
            {
                key: 'masterColors',
                value: 'Misc/Assorted'
            },
            {
                key: 'masterSizes',
                value: 'XS,SM,MD,LG,XL,XXL,3XL'
            },
            {
                key: 'masterStockSizes',
                value: '0,50,76,176,193,110,1'
            },
            {
                key: 'variantSkuList',
                value: ['1316724-999-XS','1316724-999-SM','1316724-999-MD','1316724-999-LG','1316724-999-XL','1316724-999-XXL','1316724-999-3XL']
            },
            {
                key: 'variantUpcList',
                value: ['193444955705','191632022635','191632022642','191632022659','191632022666','191632022673','191632022680']
            },
            {
                key: 'videoMaterials',
                value: null
            },
            {
                key: 'priceCurrency',
                value: 'USD'
            },
            {
                key: 'colorCount',
                value: 5
            },
            {
                key: 'json:defaultColorwayId',
                value: '{"id":"999"}'
            },
            {
                key: 'categoryUrl',
                value: 'c/mens/clothing/outerwear'
            },
            {
                key: 'preorderMessage',
                value: {
                    pdpMessage: 'PDP message',
                    tileMessage: 'PLP message'
                }
            },
            {
                key: 'json:promotions',
                value: [
                    {
                        'id': 'Green Monday 2023 Message',
                        'rank': 10,
                        'callOut': '30% Off + Free Shipping use code UAHOLIDAY',
                        'endDate': '2023-12-15T08:00:00.000Z',
                        'startDate': '2023-12-07T08:00:00.000Z',
                        'toolTipText': 'Cannot be combined with other offers. Exclusions apply. Ends 12/14.',
                        'customerGroups': [
                            'Everyone Minus Employee, ID.me, & VIP'
                        ]
                    }
                ]
            },
            {
                key: 'upperLeftFlameIcon',
                value: 'New'
            },
            {
                key: 'listPriceLow',
                value: 200
            },
            {
                key: 'listPriceHigh',
                value: 300
            },
            {
                key: 'salePriceLow',
                value: 150
            },
            {
                key: 'salePriceHigh',
                value: 175
            },
            {
                key: 'sortOptions',
                value: {
                    "newest": 545,
                    "rating": 4912,
                    "bestSellers": 2407
                }
            },
            {
                key: 'json:groupPricing',
                value: {
                    "Everyone Minus Employee, ID.me, & VIP": {
                        "max": 55,
                        "min": 41.97
                    }
                }
            },
            {
                key: 'isColorSlicedProduct',
                value: false
            },
            {
                key: '__cnstrc_release_time',
                value: mockedReleaseDate
            },
            {
                key: 'season',
                value: 'FW21, FW22'
            },
            {
                key: 'suggestedScore',
                value: 89
            }
        ];

        const result = customizeItemMetadata.getItemMetadata(mockedProduct, mockedData);

        expect(result).to.be.an('array');
        expect(result).to.deep.equal(response);
    });

    it('should handle empty variant data', function() {
        var customizeItemMetadata = proxyquire('../../../../../mocks/constructor/transformers/customizeItemMetadata', {
            '../custom/productHelper': {
                getVariantData: function(product, data) {
                    return null;
                },
                getOnModelImage: function(product) {
                    return 'https://underarmour.scene7.com/is/image/Underarmour/V5-1361033-100_FC_MD?rp=standard-0pad%7CpdpMainDesktop&scl=1&fmt=jpg&qlt=75&resMode=sharp2&cache=on%2Con&bgc=F0F0F0&wid=566&hei=708&size=566%2C708';
                },
                getCategoryPath: function(product, primaryCategory) {
                    return 'Men > Shop by Category > Jackets & Vests';
                },
                getFitCare: function(product) {
                    return 'Zip up front zipper before washing|Machine wash cold with like colors|Do not bleach|Line dry|Do not iron|Do not dry clean';
                },
                getVideoMaterials: function(product) {
                    return null;
                },
                getPriceCurrency: function(priceModel) {
                    return 'USD';
                },
                getSwatchCount: function(productID) {
                    return 5;
                },
                getPromotions: function(product) {
                    return [
                        {
                            'id': 'Green Monday 2023 Message',
                            'rank': 10,
                            'callOut': '30% Off + Free Shipping use code UAHOLIDAY',
                            'endDate': '2023-12-15T08:00:00.000Z',
                            'startDate': '2023-12-07T08:00:00.000Z',
                            'toolTipText': 'Cannot be combined with other offers. Exclusions apply. Ends 12/14.',
                            'customerGroups': [
                                'Everyone Minus Employee, ID.me, & VIP'
                            ]
                        }
                    ];
                },
                getTileUpperLeftFlameIconBadge: function(product) {
                    return 'New';
                }
            }
        });

        var response = [
            {
                key: 'onModelImageURL',
                value: 'https://underarmour.scene7.com/is/image/Underarmour/V5-1361033-100_FC_MD?rp=standard-0pad%7CpdpMainDesktop&scl=1&fmt=jpg&qlt=75&resMode=sharp2&cache=on%2Con&bgc=F0F0F0&wid=566&hei=708&size=566%2C708'
            },
            {
                key: 'categoryPath',
                value: 'Men > Shop by Category > Jackets & Vests'
            },
            {
                key: 'fitCare',
                value: 'Zip up front zipper before washing|Machine wash cold with like colors|Do not bleach|Line dry|Do not iron|Do not dry clean'
            },
            {
                key: 'longDescription',
                value: 'Men\'s Ridge Reaper® Infil Ops WINDSTOPPER® Jacket'
            },
            {
                key: 'lastModified',
                value: '2023-12-11T22:34:06.000Z'
            },
            {
                key: 'masterColors',
                value: ''
            },
            {
                key: 'masterSizes',
                value: ''
            },
            {
                key: 'masterStockSizes',
                value: ''
            },
            {
                key: 'variantSkuList',
                value: ''
            },
            {
                key: 'variantUpcList',
                value: ''
            },
            {
                key: 'videoMaterials',
                value: null
            },
            {
                key: 'priceCurrency',
                value: 'USD'
            },
            {
                key: 'colorCount',
                value: 5
            },
            {
                key: 'json:defaultColorwayId',
                value: '{"id":"999"}'
            },
            {
                key: 'categoryUrl',
                value: 'c/mens/clothing/outerwear'
            },
            {
                key: 'preorderMessage',
                value: {
                    pdpMessage: 'PDP message',
                    tileMessage: 'PLP message'
                }
            },
            {
                key: 'json:promotions',
                value: [
                    {
                        'id': 'Green Monday 2023 Message',
                        'rank': 10,
                        'callOut': '30% Off + Free Shipping use code UAHOLIDAY',
                        'endDate': '2023-12-15T08:00:00.000Z',
                        'startDate': '2023-12-07T08:00:00.000Z',
                        'toolTipText': 'Cannot be combined with other offers. Exclusions apply. Ends 12/14.',
                        'customerGroups': [
                            'Everyone Minus Employee, ID.me, & VIP'
                        ]
                    }
                ]
            },
            {
                key: 'upperLeftFlameIcon',
                value: 'New'
            },
            {
                key: 'listPriceLow',
                value: 200
            },
            {
                key: 'listPriceHigh',
                value: 300
            },
            {
                key: 'salePriceLow',
                value: 150
            },
            {
                key: 'salePriceHigh',
                value: 175
            },
            {
                key: 'sortOptions',
                value: {
                    "newest": 545,
                    "rating": 4912,
                    "bestSellers": 2407
                }
            },
            {
                key: 'json:groupPricing',
                value: ''
            },
            {
                key: 'isColorSlicedProduct',
                value: false
            },
            {
                key: '__cnstrc_release_time',
                value: mockedReleaseDate
            },
            {
                key: 'season',
                value: 'FW21, FW22'
            },
            {
                key: 'suggestedScore',
                value: 89
            }
        ];

        const result = customizeItemMetadata.getItemMetadata(mockedProduct, mockedData);
        expect(result).to.deep.equal(response);
    });
});