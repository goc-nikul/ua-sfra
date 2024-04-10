'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var pathToCoreMock = '../../../../mocks/';

describe('app_ua_core/cartridge/models/product/decorators/customAttributes.js', () => {
    let Obj = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/product/decorators/customAttributes.js', {
        '*/cartridge/scripts/helpers/sizePreferencesHelper': {
            isPreSizeSelectionEligible: function () {
                return {};
            }
        },
        'dw/system/HookMgr': require(pathToCoreMock + 'dw/dw_system_HookMgr'),
    });
    it('Testing for Custom Attributes', () => {
        var apiProduct = {
            custom: {
                dna: [1, 2, 3],
                specs: [1, 2, 3],
                fitCare: [1, 2, 3],
                techBannerAssetIDs: [1, 2, 3],
                completeTheLookProducts: [1, 2, 3],
                technologies: [1, 2, 3]
            },
            isVariant: function () {
                return false;
            },
            getID: function () {
                return {};
            }
        };
        var result = {
            pid: 'productListItemObject.productID',
            UUID: 'productListItemObject.UUID',
            id: 'productListItemObject.ID',
            name: 'productListItemObject.product.name',
            minOrderQuantity: 1,
            maxOrderQuantity: 1,
            qty: 1,
            lastModified: '',
            creationDate: '',
            publicItem: '',
            imageObj: '',
            priceObj: 3,
            master: 'productListItemObject.product.master',
            bundle: 'productListItemObject.product.bundle',
            bundleItems: [],
            options: 'options',
            selectedOptions: ''
        };
        var res = new Obj(result, apiProduct, {});
        assert.isNotNull(res, 'not null');
    });

    it('Testing for Custom Attributes ---> values exist for it', () => {
        var apiProduct = {
            custom: {
                bvAverageRating: 'bvAverageRating',
                bvReviewCount: 'bvReviewCount',
                modelName: 'modelName',
                gender: 'gender',
                silhouette: 'silhouette',
                whatsItDo: 'whatsItDo',
                fittype: 'fittype',
                style: 'style',
                instoreAvailability: 'instoreAvailability',
                storeAvailabilityMsg: 'storeAvailabilityMsg',
                sku: 'sku',
                enableCompleteTheLook: 'enableCompleteTheLook',
                completeTheLookTitle: 'completeTheLookTitle',
                completeTheLookMainImageDesktop: 'completeTheLookMainImageDesktop',
                completeTheLookMainImageMobile: 'completeTheLookMainImageMobile',
                giftCard: 'giftCard',
                size: 'size',
                experienceType: 'experienceType',
                premiumFilter: 'premiumFilter',
                isPreOrder: 'isPreOrder',
                preOrderPDPMessage: 'preOrderPDPMessage',
                comingSoonMessage: 'comingSoonMessage',
                preOrderProductTileMessage: 'preOrderProductTileMessage',
                exclusive: 'exclusive',
                promoCalloutAssetID: 'promoCalloutAssetID',
                outletColors: 'outletColors',
                team: 'team',
                availableForLocale: 'availableForLocale',
                pdpLinkSKUID: 'pdpLinkSKUID',
                pdpLinkVerbiage: 'pdpLinkVerbiage',
                isLoyaltyExcluded: 'isLoyaltyExcluded',
                disableShopthisOutfit: 'disableShopthisOutfit'
            },
            isVariant: function () {
                return true;
            },
            getID: function () {
                return {};
            },
            getMasterProduct: function () {
                return {
                    getID: function () {
                        return {};
                    }
                };
            }
        };
        var result = {
            pid: 'productListItemObject.productID',
            UUID: 'productListItemObject.UUID',
            id: 'productListItemObject.ID',
            name: 'productListItemObject.product.name',
            minOrderQuantity: 1,
            maxOrderQuantity: 1,
            qty: 1,
            lastModified: '',
            creationDate: '',
            publicItem: '',
            imageObj: '',
            priceObj: 3,
            master: 'productListItemObject.product.master',
            bundle: 'productListItemObject.product.bundle',
            bundleItems: [],
            options: 'options',
            selectedOptions: ''
        };
        var options = {
            colorAttrSelection: {
                colorway: {},
                color: {}
            }
        };
        var res = new Obj(result, apiProduct, options);
        assert.isNotNull(res, 'not null');
    });
});
