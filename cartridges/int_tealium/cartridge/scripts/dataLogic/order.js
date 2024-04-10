const utils = require('*/cartridge/scripts/tealiumUtils');

function getPaymentInstrument(sfraOrderModel) {
    const payment = sfraOrderModel.billing && sfraOrderModel.billing.payment || {};
    const paymentInstrument = payment.selectedPaymentInstruments && payment.selectedPaymentInstruments[0];
    return paymentInstrument || {};
}
function getShippingMethod(sfraOrderModel) {
    const shippingItem = (sfraOrderModel.shipping || [])[0];
    return shippingItem.selectedShippingMethod || {};
}
function getOrderType(logicArgs) {
    switch(true) {
       case !!logicArgs.isVIP: return 'vip'; break;
       case !!logicArgs.isEmployee: return 'employee'; break;
       case false: return 'exchange'; break;
       case false: return 'athlete'; break;
       default: return 'regular';
    }
}
function mapAppliedPromos(logicArgs) {
    const mappedOrderModel = logicArgs.orderData && logicArgs.orderData.mapped || {};
    const allPriceAdjustments = [].concat(
        mappedOrderModel.pliPriceAdjustments || [],
        mappedOrderModel.priceAdjustments || [],
        mappedOrderModel.allShippingPriceAdjustments || []
    );
    const appliedPromos = allPriceAdjustments.filter(function (p) {
        return p.promotion && (p.promotion.basedOnCoupons || p.promotion.basedOnSourceCodes || p.promotion.basedOnCustomerGroups);
    }).map(function (p) {
        const promotion = p.promotion || {};
        const appliedPromo = {
          order_promo_segments: promotion.ID,
          order_promo_names: promotion.name,
          order_promo_classes: promotion.promotionClass && promotion.promotionClass.toLowerCase(),
          order_promo_discount: ((p.price || 0) * -1).toFixed(2)
        };
        if (promotion.basedOnCoupons) {
            appliedPromo.order_promo_codes = p.couponLineItem && p.couponLineItem.couponCode || 'no couponLineItem';
            appliedPromo.order_promo_trigger_ids = promotion.coupons && promotion.coupons[0] && promotion.coupons[0].ID;
            appliedPromo.order_promo_trigger_types = 'coupon';
        } else if (p.promotion.basedOnSourceCodes) {
            appliedPromo.order_promo_codes = mappedOrderModel.sourceCode;
            appliedPromo.order_promo_trigger_ids = mappedOrderModel.sourceCodeGroupID;
            appliedPromo.order_promo_trigger_types = 'source-code';
        } else {
            appliedPromo.order_promo_codes = '';
            appliedPromo.order_promo_trigger_ids = promotion.customerGroups && promotion.customerGroups[0] && promotion.customerGroups[0].ID;
            appliedPromo.order_promo_trigger_types = 'customer-group';
        }
        return appliedPromo;
    });

    return appliedPromos.length ? appliedPromos : undefined;
}
function mapLoyaltyRewards(logicArgs) {
    const mappedOrderModel = logicArgs.orderData && logicArgs.orderData.mapped || {};
    const allCouponLineItems = mappedOrderModel.couponLineItems || [];
    const loyalty_type_of_reward = [];
    const loyalty_type_of_reward_action = [];
    allCouponLineItems.filter(function (c) {
        return c.couponCode.indexOf('LYLD') !== -1;
    }).map(function (c) {
        const rewardClaimedFrom = !empty(c.rewardFlowType) ? 'claimed–cart' : 'claimed-locker';
        const rewardAction = c.priceAdjustments[0].appliedDiscount === 'FREE' ? 'apparel' : 'dollar certificate online';
        loyalty_type_of_reward.push(rewardClaimedFrom);
        loyalty_type_of_reward_action.push(rewardAction);
    });
    const loyaltyRewardsData = {
        loyalty: true,
        loyalty_type_of_reward: loyalty_type_of_reward.sort(),
        loyalty_type_of_reward_action: loyalty_type_of_reward_action
    };

    return loyalty_type_of_reward.length > 0 ? loyaltyRewardsData : undefined;
}
function mapLoyaltyEarnedPoints(logicArgs, totals) {
    if ((totals !== undefined && totals !== null) && 'estimatedLoyaltyPoints' in totals && totals.estimatedLoyaltyPoints > 0) {
        return {
            loyalty: true,
            action: 'purchase',
            loyalty_points_earned: totals.estimatedLoyaltyPoints
        }
    }
}
function tealiumLoyaltyConfimationData(logicArgs, totals) {
    const loyaltyRewards = mapLoyaltyRewards(logicArgs);
    const loyaltyEarnedPoints = mapLoyaltyEarnedPoints(logicArgs, totals);
    if (loyaltyRewards !== undefined || loyaltyEarnedPoints !== undefined ) {
        return Object.assign({}, loyaltyRewards, loyaltyEarnedPoints);
    }
}
module.exports = function orderLogic(logicArgs) {
    const orderData = logicArgs.orderData;
    if (logicArgs.pageType !== 'order-receipt' || !orderData) {
        return {};
    }
    const emailOptin = logicArgs.emailOptin;
    const sfraOrderModel = logicArgs.orderData.sfraModel;
    const mappedModel = logicArgs.orderData.mapped;

    const paymentInstrument = getPaymentInstrument(sfraOrderModel);
    const shippingMethod = getShippingMethod(sfraOrderModel);
    const totals = sfraOrderModel.totals;
    const orderLevelDiscountValue = totals.orderLevelDiscountTotal && totals.orderLevelDiscountTotal.value || 0;
    const cleanMoney = utils.cleanMoney;

    return {
        order_id: sfraOrderModel.orderNumber,
        order_payment_method: mappedModel.paymentMethodEU || paymentInstrument.type && paymentInstrument.type.toLowerCase() 
                              || paymentInstrument.paymentMethod && paymentInstrument.paymentMethod.toLowerCase(),
        order_shipping_method: shippingMethod.displayName,
        order_shipping_revenue: (mappedModel.adjustedShippingTotalPriceValue || 0).toFixed(2),
        order_shipping_subtotal: (mappedModel.shippingTotalPriceValue || 0).toFixed(2),
        order_shipping_discount: ((mappedModel.shippingTotalPriceValue || 0) - (mappedModel.adjustedShippingTotalPriceValue || 0)).toFixed(2),
        order_subtotal: cleanMoney(totals.subTotal),
        order_tax: cleanMoney(totals.totalTax),
        order_merchandize_tax: (mappedModel.adjustedMerchandizeTotalTaxValue || 0).toFixed(2),
        order_shipping_tax: (mappedModel.adjustedShippingTotalTaxValue || 0).toFixed(2),
        order_total: cleanMoney(totals.grandTotal),
        order_type: getOrderType(logicArgs),
        order_discount: orderLevelDiscountValue.toFixed(2),
        order_promo_codes: mapAppliedPromos(logicArgs),
        order_checkout_optin: emailOptin,
        order_flags: (mappedModel.custom.isCommercialPickup) ? ['hold_at_location'] : [],
        plain_text_email: sfraOrderModel.orderEmail,
        loyalty_order_data: tealiumLoyaltyConfimationData(logicArgs, totals)
    };
};