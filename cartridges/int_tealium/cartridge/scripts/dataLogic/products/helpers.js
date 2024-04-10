const Logger = require('dw/system/Logger');

function productIsClearance(sfraProductModel) {
    const price = sfraProductModel.price || {};
    const priceSale = price.sales && price.sales.value || 0;
    const priceMSRP = price.list && price.list.value || 0;

    return priceSale < priceMSRP;
}
function pdpExperienceType(sfraProductModel) {
    const productHelpers = require('*/cartridge/scripts/helpers/productHelpers.js');
    const experienceType = (!empty(sfraProductModel.custom) && 'experienceType' in sfraProductModel.custom) ? sfraProductModel.custom.experienceType : '';
    var sourceValues = !empty(sfraProductModel.variationAttributes) ? sfraProductModel.variationAttributes[0].values : [];
    return upsellType = productHelpers.getUpsellType(sourceValues, sfraProductModel, experienceType, 'tealium');
}

function exchangeRates(qValue, pliPrice, pliTax) {
    let convertedExchangedRate = '0.00';
    try {
        convertedExchangedRate = (qValue * (pliPrice - pliTax)).toFixed(2).toString();
    } catch (e) {
        Logger.error('helpers.js in function exchanageRates(): ' + e.message);
    }
    return convertedExchangedRate;
}

function exchangeRatesUSD(productExchangeRate) {
    let exchangedRate = '0.00';
    try {
        const currencyCode = session.currency.currencyCode,
              CustomObjectMgr = require('dw/object/CustomObjectMgr');

        const exchangeRateOb = CustomObjectMgr.getCustomObject('SiteData', 'exchangeRates');
        if (exchangeRateOb) {
            const exchangeRateDollar = JSON.parse(exchangeRateOb.custom.data);

            if (currencyCode in exchangeRateDollar && 'USD' in exchangeRateDollar[currencyCode]) {
                exchangedRate = (exchangeRateDollar[currencyCode]['USD'] * productExchangeRate).toFixed(2).toString();
            } else {
                Logger.warn(`An exchange rate for a currency code of ${currencyCode} was requested but it could not be found in the SiteData.exchangeRate custom object.`);
            }
        } else {
            Logger.warn(`The SiteData.exchangeRate custom object could not be found`);
        }

    } catch (e) {
        Logger.error('helpers.js in function exchanageRateUSD(): ' + e.message);
    }
    return exchangedRate;
}

function mapSharedProperties(sfraProductModel) {
    if (!empty(sfraProductModel)) {
        const custom = sfraProductModel.custom || {};
        const price = sfraProductModel.price || {};
        const priceSale = price.sales && price.sales.value || 0;
        const msrp = price.list || price.priceBookSalesPrice;
        const priceMSRP = msrp && msrp.value || 0;
        return {
          product_id: sfraProductModel.id,
          product_name: sfraProductModel.productName,
          product_style: custom.style,
          product_color: custom.color ? custom.style + '-' + custom.color : undefined,
          product_sku: custom.sku || undefined, // if product size is selected as default on page load
          product_price: priceSale.toFixed('2'),
          product_msrp: priceMSRP.toFixed('2'),
          product_onsale: productIsClearance(sfraProductModel) ? 'yes' : 'no', // yes, no
          product_bopis: false,
          product_rating: custom.bvAverageRating || undefined,
          product_review_count: custom.bvReviewCount || undefined,
          product_silhouette: custom.silhouette || undefined,
          product_gender: custom.gender || undefined,
          product_preorder: custom.isPreOrder ? 'yes' : 'no', // yes, no
          product_feature_icons: 'icons' in custom && custom.icons ? custom.icons.map(function (icon) { return icon.value; }).join('|') : undefined, // feature/benefit icons
        }
    }
}

function mapPromoOrderLevelDiscounts(sfraProductLineItem) {
    const mapped = {
      product_line_item_coupon_discount: 0,
      product_line_item_sourcecode_discount: 0,
      product_line_item_customergroup_discount: 0
    };
    (sfraProductLineItem.proratedPriceAdjustmentPrices || []).forEach(function mapDiscounts(pricingGroup){
        const promotion = pricingGroup.priceAdjustment && pricingGroup.priceAdjustment.promotion || {};
        const promotionValue = pricingGroup.proratedPriceAdjustmentPriceValue * -1;
        const isOrderLevel = promotion.promotionClass === 'ORDER';
        if (isOrderLevel) {
          const basedOnCoupons = promotion.basedOnCoupons && !!promotion.coupons.length;
          const basedOnSourceCodes = promotion.basedOnSourceCodes && !!promotion.sourceCodeGroups.length;
          const basedOnCustomerGroups = promotion.basedOnCustomerGroups && !!promotion.customerGroups.length;
          // Promos can be based on multiple triggers. For analytics we weight coupons higher.
          switch (true) {
              case basedOnCoupons:
                mapped.product_line_item_coupon_discount += promotionValue;
                break;
              case basedOnSourceCodes:
                mapped.product_line_item_sourcecode_discount += promotionValue;
                break;
              case basedOnCustomerGroups:
                mapped.product_line_item_customergroup_discount += promotionValue;
                break;
          }
        }
    });
    return mapped;
}
function mapOrderCartProductLineItem(sfraProductLineItem) {
    const DISCOUNTS = mapPromoOrderLevelDiscounts(sfraProductLineItem);
    const product = sfraProductLineItem.product || {};
    const productCustom = product.custom || {};
    const productPriceModel = product.priceModel || {};
    const quantityValue = sfraProductLineItem.quantityValue || 0;
    const adjustedPriceValue = sfraProductLineItem.adjustedPriceValue || 0;
    const adjustedTaxValue = sfraProductLineItem.adjustedTaxValue || 0;
    const listPrice = productPriceModel.priceFactoryListPriceValue || 0;
    const salePrice = adjustedPriceValue / quantityValue;
    const currencyExchangeRate = exchangeRates(quantityValue, adjustedPriceValue, adjustedTaxValue);
    return {
        product_id: sfraProductLineItem.product.ID,
        product_name: sfraProductLineItem.product.name,
        product_quantity: sfraProductLineItem.quantityValue.toString(),
        product_style: productCustom.style,
        product_color: productCustom.color ? productCustom.style + '-' + productCustom.color : undefined,
        product_sku: productCustom.sku,
        product_silhouette: productCustom.silhouette,
        product_gender: productCustom.gender,
        product_preorder: productCustom.isPreOrder? 'yes' : 'no', // yes, no
        product_price: salePrice.toFixed(2),
        product_msrp: listPrice.toFixed(2),
        product_onsale: listPrice > salePrice ? 'yes' : 'no',
        product_oos: sfraProductLineItem.product.outOfStock,
        product_line_item_revenue:(sfraProductLineItem.proratedPriceValue || 0).toFixed(2),
        product_line_item_price: (sfraProductLineItem.adjustedPriceValue || 0).toFixed(2),
        product_line_item_tax: (sfraProductLineItem.adjustedTaxValue || 0).toFixed(2),
        product_line_item_coupon_discount: DISCOUNTS.product_line_item_coupon_discount.toFixed(2),
        product_line_item_sourcecode_discount: DISCOUNTS.product_line_item_sourcecode_discount.toFixed(2),
        product_line_item_customergroup_discount: DISCOUNTS.product_line_item_customergroup_discount.toFixed(2),
        product_exchange_rate: currencyExchangeRate,
        product_exchange_rate_usd: exchangeRatesUSD(currencyExchangeRate),
        product_bopis: sfraProductLineItem.bopis,
        product_bopis_message: sfraProductLineItem.bopis_message,
        product_bopis_available: sfraProductLineItem.bopis_available,
        product_bopis_selected: sfraProductLineItem.bopis_selected,
        product_bopis_stock: sfraProductLineItem.bopis_stock,
        store_id: sfraProductLineItem.store_id,
        product_uuid: sfraProductLineItem.productUUID
    };
}
module.exports = {
    mapSharedProperties: mapSharedProperties,
    mapOrderCartProductLineItem: mapOrderCartProductLineItem,
    productIsClearance: productIsClearance,
    pdpExperienceType: pdpExperienceType
};
