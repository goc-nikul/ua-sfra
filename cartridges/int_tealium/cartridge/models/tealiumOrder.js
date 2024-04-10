const collections = require('*/cartridge/scripts/util/collections');
const utils = require('~/cartridge/scripts/tealiumUtils.js');

module.exports.buildOrderObject = function buildOrderObject(logicArgs) {
    const orderNumber = logicArgs.orderNumber;
    const pageName = logicArgs.pageName;
    const localeId = logicArgs.locale && logicArgs.locale.id;
    const shouldFetch = localeId && orderNumber;

    if (!shouldFetch) {
        return undefined;
    }
    const OrderMgr = require('dw/order/OrderMgr');
    const Locale = require('dw/util/Locale');
    const OrderModel = require('*/cartridge/models/order');
    const ArrayList = require('dw/util/ArrayList');

    const ORDER = OrderMgr.getOrder(orderNumber);
    if (!ORDER) {
        return { noOrder: '' };
    }
    const config = {
        numberOfLineItems: '*'
    };

    const currentLocale = Locale.getLocale(localeId);

    const sfraOrder = new OrderModel(
        ORDER,
        { config: config, countryCode: currentLocale.country, containerView: 'order' }
    );
    
    //Fetch the product level price adjustments to add to Tealium promo order object 
    var pliPriceAdjustmentsList = new ArrayList();
    for each(let pli in ORDER.allProductLineItems) {
        for each(var adjustment in pli.priceAdjustments) {
            pliPriceAdjustmentsList.push(adjustment);
        }
    }

    return {
        // used for client side mapping
        // TODO: filter for security?
        sfraModel: sfraOrder,
        // used for server data mapping
        mapped: {
            affiliatePartnerID: ORDER.affiliatePartnerID,
            paymentMethodEU: utils.paymentMethod(ORDER),
            affiliatePartnerName: ORDER.affiliatePartnerName,
            confirmationStatus: ORDER.confirmationStatus,
            currentOrderNo: ORDER.currentOrderNo,
            custom: ORDER.custom ? {
                isCommercialPickup: ORDER.custom.isCommercialPickup
            } : null,
            customerLocaleID: ORDER.customerLocaleID,
            customerOrderReference: ORDER.customerOrderReference,
            invoiceItems: [],
            invoiceNo: ORDER.invoiceNo,
            invoices: [],
            invoiceNo: ORDER.invoiceNo,
            orderToken: ORDER.orderToken,
            originalOrder: ORDER.originalOrder,
            originalOrderNo: ORDER.originalOrderNo,
            paymentStatus: ORDER.paymentStatus,
            refundedAmount: {},
            replacementOrderNo: ORDER.replacementOrderNo,
            returnCaseItems: [],
            returnCases: [],
            returnItems: [],
            returns: [],
            shippingOrderItems: [],
            shippingOrders: [],
            shippingStatus: ORDER.shippingStatus,
            sourceCode: ORDER.sourceCode,
            paymentStatus: ORDER.paymentStatus,
            sourceCodeGroup: ORDER.sourceCodeGroup ? {
                ID: ORDER.sourceCodeGroup.ID
            } : null,
            sourceCodeGroupID: ORDER.sourceCodeGroupID,
            status: ORDER.status,
            allProductLineItems: collections.map(ORDER.allProductLineItems, utils.mapProductLineItem),
            couponLineItems: collections.map(ORDER.couponLineItems, utils.mapCouponLineItem),
            priceAdjustments: collections.map(ORDER.priceAdjustments, utils.mapPriceAdjustment),
            pliPriceAdjustments: collections.map(pliPriceAdjustmentsList.iterator(), utils.mapPriceAdjustment),
            shippingPriceAdjustments: collections.map(ORDER.shippingPriceAdjustments, utils.mapPriceAdjustment),
            allShippingPriceAdjustments: collections.map(ORDER.allShippingPriceAdjustments, utils.mapPriceAdjustment),
            adjustedMerchandizeTotalTaxValue: utils.priceValue(ORDER.adjustedMerchandizeTotalTax),
            adjustedShippingTotalTaxValue: utils.priceValue(ORDER.adjustedShippingTotalTax),
            adjustedShippingTotalPriceValue: utils.priceValue(ORDER.adjustedShippingTotalPrice),
            shippingTotalPriceValue: utils.priceValue(ORDER.shippingTotalPrice)
        }
    };
};
