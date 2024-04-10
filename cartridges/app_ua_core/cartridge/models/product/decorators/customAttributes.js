'use strict';

module.exports = function (object, apiProduct, options) {
    Object.defineProperty(object, 'custom', {
        enumerable: true,
        value: (function () {
            var custom = {};
            custom.bvAverageRating = 'bvAverageRating' in apiProduct.custom ? apiProduct.custom.bvAverageRating : null;
            custom.bvReviewCount = 'bvReviewCount' in apiProduct.custom ? apiProduct.custom.bvReviewCount : null;
            custom.modelName = 'modelName' in apiProduct.custom ? apiProduct.custom.modelName : null;
            custom.gender = 'gender' in apiProduct.custom ? apiProduct.custom.gender : null;
            custom.silhouette = 'silhouette' in apiProduct.custom ? apiProduct.custom.silhouette : null;
            custom.whatsItDo = 'whatsItDo' in apiProduct.custom ? apiProduct.custom.whatsItDo : null;
            custom.dna = 'dna' in apiProduct.custom ? apiProduct.custom.dna.map(function (dnaValue) { return dnaValue; }) : null; // eslint-disable-line
            custom.specs = 'specs' in apiProduct.custom ? apiProduct.custom.specs.map(function (specsValue) { return specsValue; }) : null;
            custom.fitCare = 'fitCare' in apiProduct.custom ? apiProduct.custom.fitCare.map(function (fitCareValue) { return fitCareValue; }) : null;
            custom.fittype = 'fittype' in apiProduct.custom ? apiProduct.custom.fittype : null;
            custom.style = 'style' in apiProduct.custom ? apiProduct.custom.style : null;
            custom.instoreAvailability = 'instoreAvailability' in apiProduct.custom ? apiProduct.custom.instoreAvailability : null;
            custom.storeAvailabilityMsg = 'storeAvailabilityMsg' in apiProduct.custom ? apiProduct.custom.storeAvailabilityMsg : null;
            custom.sku = 'sku' in apiProduct.custom ? apiProduct.custom.sku : null;
            custom.colorway = options && options.colorAttrSelection && options.colorAttrSelection.colorway ? options.colorAttrSelection.colorway : apiProduct.custom.colorway;
            custom.color = options && options.colorAttrSelection && options.colorAttrSelection.color ? options.colorAttrSelection.color : apiProduct.custom.color;
            custom.techBannerAssetIDs = 'techBannerAssetIDs' in apiProduct.custom ? apiProduct.custom.techBannerAssetIDs.map(function (techBannerAssetIDsValue) { return techBannerAssetIDsValue; }) : null;
            custom.enableCompleteTheLook = 'enableCompleteTheLook' in apiProduct.custom ? apiProduct.custom.enableCompleteTheLook : null;
            custom.completeTheLookTitle = 'completeTheLookTitle' in apiProduct.custom ? apiProduct.custom.completeTheLookTitle : null;
            custom.completeTheLookMainImageDesktop = 'completeTheLookMainImageDesktop' in apiProduct.custom ? apiProduct.custom.completeTheLookMainImageDesktop : null;
            custom.completeTheLookMainImageMobile = 'completeTheLookMainImageMobile' in apiProduct.custom ? apiProduct.custom.completeTheLookMainImageMobile : null;
            custom.completeTheLookProducts = 'completeTheLookProducts' in apiProduct.custom ? apiProduct.custom.completeTheLookProducts.map(function (completeTheLookProductsValue) { return completeTheLookProductsValue; }) : null;
            custom.giftCard = 'giftCard' in apiProduct.custom ? apiProduct.custom.giftCard.value : null;
            custom.size = 'size' in apiProduct.custom ? apiProduct.custom.size : null;
            custom.experienceType = 'experienceType' in apiProduct.custom ? apiProduct.custom.experienceType.value : null;
            custom.premiumFilter = 'premiumFilter' in apiProduct.custom ? apiProduct.custom.premiumFilter.value : null;
            custom.isPreOrder = 'isPreOrder' in apiProduct.custom ? apiProduct.custom.isPreOrder : false;
            custom.preOrderPDPMessage = 'preOrderPDPMessage' in apiProduct.custom ? apiProduct.custom.preOrderPDPMessage : '';
            custom.comingSoonMessage = 'comingSoonMessage' in apiProduct.custom ? apiProduct.custom.comingSoonMessage : '';
            custom.preOrderProductTileMessage = 'preOrderProductTileMessage' in apiProduct.custom ? apiProduct.custom.preOrderProductTileMessage : '';
            custom.masterID = apiProduct.isVariant() ? apiProduct.getMasterProduct().getID() : apiProduct.getID();
            custom.exclusive = 'exclusive' in apiProduct.custom ? apiProduct.custom.exclusive.value : '';
            custom.technologies = ('technologies' in apiProduct.custom && apiProduct.custom.technologies && Object.keys(apiProduct.custom.technologies).length > 0) ? apiProduct.custom.technologies.map(function (technology) { return technology.value; }) : null;
            custom.isPreSizeSelectionEligible = require('*/cartridge/scripts/helpers/sizePreferencesHelper').isPreSizeSelectionEligible(apiProduct);
            custom.promoCalloutAssetID = 'promoCalloutAssetID' in apiProduct.custom ? apiProduct.custom.promoCalloutAssetID : null;
            custom.outletColors = 'outletColors' in apiProduct.custom ? apiProduct.custom.outletColors : '';
            custom.team = 'team' in apiProduct.custom ? apiProduct.custom.team : '';
            custom.availableForLocale = 'availableForLocale' in apiProduct.custom ? apiProduct.custom.availableForLocale : '';
            custom.pdpLinkSKUID = 'pdpLinkSKUID' in apiProduct.custom ? apiProduct.custom.pdpLinkSKUID : null;
            custom.pdpLinkVerbiage = 'pdpLinkVerbiage' in apiProduct.custom ? apiProduct.custom.pdpLinkVerbiage : null;
            custom.isLoyaltyExcluded = 'isLoyaltyExcluded' in apiProduct.custom ? apiProduct.custom.isLoyaltyExcluded : false;
            custom.enableShopTheLook = 'disableShopthisOutfit' in apiProduct.custom ? !apiProduct.custom.disableShopthisOutfit : true;
            custom.division = 'division' in apiProduct.custom ? apiProduct.custom.division : '';
            custom.showFitScale = custom.division === 'Apparel' && custom.fittype !== 'No Fit Type';
            custom.icons = 'icons' in apiProduct.custom && apiProduct.custom.icons ? require('int_ocapi/cartridge/hooks/shop/product/productHookUtils').beautifySelectedFeatureAndBenifits(apiProduct) : null; // feature/benefit icons
            custom.masterQtyLimit = 'masterQtyLimit' in apiProduct.custom ? apiProduct.custom.masterQtyLimit : null;
            var HookMgr = require('dw/system/HookMgr');
            if (HookMgr.hasHook('app.earlyAccess.isEarlyAccessCustomer')) {
                custom.earlyAccess = HookMgr.callHook('app.earlyAccess.isEarlyAccessCustomer', 'isEarlyAccessCustomer', apiProduct);
            }
            return custom;
        }())
    });
};
