module.exports.buildCartObject = function buildProductObject() {
    var currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
    if (!currentBasket) {
        return {};
    }
    const collections = require('*/cartridge/scripts/util/collections');
    const utils = require('~/cartridge/scripts/tealiumUtils.js');
    var hasItems = Boolean(currentBasket && currentBasket.productLineItems.length);
    const sfraCartModel = require("*/cartridge/models/cart");

    return {
        currentBasket: currentBasket,
        approachingDiscounts: hasItems && (new sfraCartModel(currentBasket) || {}).approachingDiscounts,
        sfraBasket: currentBasket ? {
            agentBasket: currentBasket.agentBasket,
            allLineItems: (currentBasket.allLineItems) ? collections.map(currentBasket.allLineItems, function (m) {
                const describe = m.describe && m.describe();
                return {
                    describe: describe ? {
                        ID: describe.ID
                    } : {}
                }
            }) : [],
            couponLineItems: collections.map(currentBasket.couponLineItems, utils.mapCouponLineItem),
            priceAdjustments: collections.map(currentBasket.priceAdjustments, utils.mapPriceAdjustment)
        } : false,
        hasCartItems: hasItems,
        mapped: {
            allProductLineItems: collections.map(currentBasket.allProductLineItems, utils.mapProductLineItem)
        }
    };
};
