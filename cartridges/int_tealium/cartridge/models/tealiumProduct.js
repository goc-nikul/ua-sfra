const productFactory = require('*/cartridge/scripts/factories/product');
const utils = require('*/cartridge/scripts/tealiumUtils.js');

/**
* uses sfraProduct product to call values
*/
function getBadges(sfraProduct) {
    return {
        exclusive: {
            value: sfraProduct.exclusive.value,
            displayValue: sfraProduct.exclusive.displayValue,
        },
        productTileBottomLeftBadge: sfraProduct.productTileBottomLeftBadge,
        productTileUpperLeftBadge: {
            value: sfraProduct.productTileUpperLeftBadge.value,
            displayValue: sfraProduct.productTileUpperLeftBadge.displayValue,
        }
    };
}
module.exports.buildProductObject = function buildProductObject(productId) {
    if (!productId) {
        return undefined;
    }
    const sfraProduct = productFactory.get({
        pid: productId
    });
    const badges = getBadges(sfraProduct);
    return {
        // used for client side mapping
        // TODO: filter for security?
        sfraModel: utils.objectsMerge([
          sfraProduct,
          badges
        ])
    };
};
