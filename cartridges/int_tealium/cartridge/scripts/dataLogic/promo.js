function findSourceCodeAppliedPromo(activeCustomerPromotions, sourceCodeInfoGroupId) {
    return activeCustomerPromotions.filter(function (promotion) {
        const basedOnSourceCodes = promotion && promotion.basedOnSourceCodes;
        const sourceCodeGroups = promotion && promotion.sourceCodeGroups;
        if (basedOnSourceCodes && sourceCodeGroups && sourceCodeGroups.length) {
            const foundSourceCodeGroup = sourceCodeGroups.filter(function(group) {
                return group && group.ID === sourceCodeInfoGroupId;
            });
            return !!foundSourceCodeGroup[0];
        }
        return false;
    })[0];
}
/**
* This is method mimics as though we know when a sourcecode is applied.
* - query param exists and equals the source code applied and promo attached = APPLIED
*/
function mapSourceCodePromo(logicArgs) {
    const srcParam = logicArgs.srcParam;
    const customerObjectData = logicArgs.customerData;
    const sourceCodeInfo = customerObjectData && customerObjectData.session && customerObjectData.session.sourceCodeInfo;
    const sourceCodeGroupId = sourceCodeInfo && sourceCodeInfo.group && sourceCodeInfo.group.ID;
    const activeCustomerPromotions = customerObjectData && customerObjectData.activeCustomerPromotions && customerObjectData.activeCustomerPromotions.promotions;
    const failedPromoResponse = {
        promo_code: srcParam,
        promo_error_message: 'sourcecode did not apply',
        promo_trigger_type: 'source-code'
    };
    if (srcParam === sourceCodeInfo.code && sourceCodeGroupId && activeCustomerPromotions && activeCustomerPromotions) {
        const foundPromo = findSourceCodeAppliedPromo(activeCustomerPromotions, sourceCodeGroupId);
        if (foundPromo) {
            return {
              promo_code: sourceCodeInfo.code,
              promo_segment: foundPromo.ID,
              promo_name: foundPromo.name,
              promo_trigger_id: sourceCodeGroupId,
              promo_trigger_type: 'source-code', // source-code, coupon
              promo_class: foundPromo.promotionClass.toLowerCase()
            }
        }
        return failedPromoResponse;
    }

    return failedPromoResponse;
}
module.exports = function promoLogic(logicArgs) {
    const shouldTrySourceCode = logicArgs.pageType !== 'order-receipt' && logicArgs.srcParam;

    return shouldTrySourceCode
      ? mapSourceCodePromo(logicArgs)
      : {};
};
