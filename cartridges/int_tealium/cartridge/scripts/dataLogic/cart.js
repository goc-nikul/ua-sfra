var collections = require('*/cartridge/scripts/util/collections');
function getBopisItems(currentBasket) {
    var bopisProdArray = [];
    collections.forEach(currentBasket.productLineItems, function (item) {
        var bopisObj = {};
        bopisObj.prod_sku = item.product.custom.sku;
        bopisObj.store_id = 'fromStoreId' in item.shipment.custom && item.shipment.custom.fromStoreId ? item.shipment.custom.fromStoreId : undefined;
        bopisObj.bopis = 'fromStoreId' in item.shipment.custom && item.shipment.custom.fromStoreId ? true : false;
        bopisProdArray.push(bopisObj);
    });
    return bopisProdArray;
}
function mapCart(logicArgs) {
    const TotalsModel = require('*/cartridge/models/totals');
    const currentBasket = logicArgs.cartData.currentBasket;
    const totals = new TotalsModel(logicArgs.cartData.currentBasket);
    const orderLevelDiscountValue = totals.orderLevelDiscountTotal && totals.orderLevelDiscountTotal.value || 0;
    const cleanMoney = require('*/cartridge/scripts/tealiumUtils').cleanMoney;
    const approachingDiscounts = (function getApproachingDiscounts(sfraApproachingDiscounts) {
        return (sfraApproachingDiscounts || []).map(function mapDiscounts(promoItem) {
            return {
                approaching_discount_name: promoItem.promotionCalloutMsg,
                approaching_discount_percentage: promoItem.approachingPromoPercentage
                    ? promoItem.approachingPromoPercentage.toFixed(2)
                    : '',
            };
        });
    })(logicArgs.cartData.approachingDiscounts);

    return {
        cart_subtotal: cleanMoney(totals.subTotal), // amount without discounts or shipping
        cart_shipping: cleanMoney(totals.totalShippingCost), // amount of shipping
        cart_discount: orderLevelDiscountValue.toFixed(2), // amount of applied discounts
        cart_total: cleanMoney(totals.grandTotal), // total with shipping and tax
        cart_tax: cleanMoney(totals.totalTax), // vat
        cart_item_count: currentBasket.productLineItems.length.toString(),
        cart_payment_method: logicArgs.selectedPaymentMethod || undefined,
        cart_approaching_discounts: (logicArgs.pageName === 'cart' && approachingDiscounts.length)
        ? approachingDiscounts
        : undefined,
        cart_bopis: getBopisItems(currentBasket)
    }
}

module.exports = function cartLogic(logicArgs) {
    const hasBasket = logicArgs.cartData && logicArgs.cartData.sfraBasket;
    return hasBasket && logicArgs.pageName !== 'order-receipt'
      ? mapCart(logicArgs)
      : {};
};
