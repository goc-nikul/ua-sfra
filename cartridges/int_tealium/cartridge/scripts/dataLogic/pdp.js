/* eslint spellcheck/spell-checker: 0 */
const helpers = require('*/cartridge/scripts/dataLogic/products/helpers.js');
const productHelpers = require('int_tealium/cartridge/scripts/helpers/productHelpers.js');

function yesNo(truthy) {
  return truthy ? 'yes' : 'no'
}

function mapPdp(logicArgs) {
    const sfraProductModel = logicArgs.productData && logicArgs.productData.sfraModel || {};
    const customData = sfraProductModel && 'custom' in sfraProductModel && sfraProductModel.custom ? sfraProductModel.custom : {};
    const videoMaterial360 = sfraProductModel && 'video360Material' in sfraProductModel && sfraProductModel.video360Material ? sfraProductModel.video360Material : null;
    const selectedVariant = productHelpers.getSelectedVariant(logicArgs.productId);

    return {
        pdp_price_type: helpers.productIsClearance(sfraProductModel) ? 'on-sale' : 'full',
        pdp_type: customData.combinepdp ? 'regular|inclusive' : 'regular', // or regular|inclusive
        pdp_360_video: yesNo(videoMaterial360 && videoMaterial360.length),
        pdp_merch_product_stack: undefined,
        pdp_preorder: yesNo(false),
        pdp_discount_exclusions: yesNo(false),
        pdp_merch_product_stack: undefined,
        pdp_combined_style: customData.combinepdp || undefined,
        pdp_extended_sizing: yesNo(sfraProductModel.variationAttributes && sfraProductModel.variationAttributes.length > 2),
        pdp_outofstock: yesNo(!sfraProductModel.available),
        pdp_discount_exclusions: yesNo(customData.promoCalloutAssetID ? (customData.promoCalloutAssetID).indexOf('exclude') > -1: false),
        pdp_experience_type: helpers.pdpExperienceType(sfraProductModel),
        pdp_feature_icons: 'icons' in sfraProductModel.custom && sfraProductModel.custom.icons ? sfraProductModel.custom.icons.map(function (icon) { return icon.value; }).join('|') : null, // feature/benefit icons
        product_inventory_stock_level:  !selectedVariant.error ? selectedVariant.inventoryATSValue : []
    }
}

module.exports = function pdpProductLogic(logicArgs) {
    return logicArgs.pageType !== 'product-detail' ? {} : mapPdp(logicArgs);
};
