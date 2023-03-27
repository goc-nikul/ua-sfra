/* eslint spellcheck/spell-checker: 0 */
const helpers = require('*/cartridge/scripts/dataLogic/products/helpers.js');
const availabilityHealthHelpers = require('*/cartridge/scripts/dataLogic/products/availabilityHealthHelpers.js');
const sizePreferencesHelper = require('*/cartridge/scripts/helpers/sizePreferencesHelper');
const logger = require('dw/system/Logger');

function productPromoArray(sfraProduct) {
    const promoArray = [];
    (sfraProduct.promotions || []).forEach(function mapPromo(promoItem) {
        let promoString = promoItem.calloutMsg;
        let plainPromoText = promoString.replace(/<[^>]+>/g, ''); // Regex to scrub alpha/num/space/punctuation from promo html.
        promoArray.push(plainPromoText);
    });
    return promoArray;
}
function productOptions(sfraProductModel) {
    var sfraProductModelID = (typeof sfraProductModel !== 'undefined' && !empty(sfraProductModel.id)) ? sfraProductModel.id : null;
    return availabilityHealthHelpers.getAvailabilityHealth(sfraProductModelID);
}
function mapProduct(sfraProduct, sizePrefs, logicArgs) {

    if (!sfraProduct) {
        logger.warn("sfraProduct variable is not defined");
        return undefined;
    }

    const MAPPED = helpers.mapSharedProperties(sfraProduct);
    if (!MAPPED) {
        logger.warn("Unable to map shared properties");
        return undefined;
    }

    const badge = (!empty(sfraProduct)) && (sfraProduct.productTileUpperLeftBadge && sfraProduct.productTileUpperLeftBadge.displayValue);
    const techIcon = (!empty(sfraProduct)) && sfraProduct.productTileBottomLeftBadge;
    var availabilityHealth = productOptions(sfraProduct);
    return {
        product_id: MAPPED.product_id,
        product_name: MAPPED.product_name,
        product_rating: MAPPED.product_rating,
        product_review_count: MAPPED.product_review_count,
        product_style: MAPPED.product_style,
        product_color: MAPPED.product_color,
        product_sku: MAPPED.product_sku, // if product size is selected as default on page load
        product_silhouette: MAPPED.product_silhouette,
        product_gender: MAPPED.product_gender,
        product_preorder: MAPPED.product_preorder,
        product_price: MAPPED.product_price,
        product_msrp: MAPPED.product_msrp,
        product_onsale: MAPPED.product_onsale, // yes, no
        product_size_prepopulated: (sizePrefs && sizePreferencesHelper.getSavedPrefs(sfraProduct.id, sizePrefs)) ? 'yes' : 'no',
        product_bopis: MAPPED.product_bopis,
        product_bopis_message: logicArgs.bopisDataObj.msg,
        product_bopis_available: logicArgs.bopisDataObj.available,
        product_bopis_selected: logicArgs.bopisDataObj.selected,
        product_bopis_stock: logicArgs.bopisDataObj.stock,
        product_image_count: sfraProduct.images.pdpMainDesktop.length.toString(),
        product_alert_text: productPromoArray(sfraProduct),
        product_badge_text: badge || '',
        product_tech_icon: techIcon ? 'yes' : 'no',
        // options count: Think of this as physical product counts
        // example: 20 pair of shoes, 10 red, 10 blue both are listed to have sizes 1 - 10.
        // - Red shoes have 2 pair of size 9 and none in size 10.
        // - Blue shoes have 2 pair of size 6 and none in size 3.
        // That means neither colors have full stock and only sizes 1,2,4,5,6,7,8,9 have full stock.
        // - color total would be 2, color full is 0
        // - size total would be 10 (10 different size options) and size_full is 8 since 3 and 10 are not fully stocked.
        product_options_color_total: String(availabilityHealth.product_options_color_total), // how many color chips total
        product_options_color_full: String(availabilityHealth.product_options_color_full), // how many color chips have all child options available
        product_options_size_total: String(availabilityHealth.product_options_size_total), // how many unique size options are there, blue:sm, red:sm is one size. (sm for all colors is count of one)
        product_options_size_full: String(availabilityHealth.product_options_size_full), // how many of those unique size options are selectable on for all colors
        product_feature_icons: MAPPED.product_feature_icons, // feature/benefit icons
    };
}
module.exports = function orderProductLogic(logicArgs) {
    const sfraProduct = logicArgs.productData && logicArgs.productData.sfraModel;
    const sizePrefs = logicArgs.productSizePrefs;
    return [
        mapProduct(sfraProduct, sizePrefs, logicArgs)
    ];
};
