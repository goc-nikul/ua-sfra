'use strict';

var StringUtils = require('dw/util/StringUtils');
var base = module.superModule;
var ReturnsUtils = require('*/cartridge/scripts/orders/ReturnsUtils');
var returnsUtils = new ReturnsUtils();
var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');
var Order = require('dw/order/Order');
var Calendar = require('dw/util/Calendar');

/**
 * Checks if the order is being viewed in the same country it is placed
 * @param {dw.order.LineItemCtnr} lineItemContainer order
 * @returns {boolean} true if country is the same
 */
function orderBelongsToCurrentCountry(lineItemContainer) {
    var countryCode = session.custom.customerCountry || request.getLocale().slice(-2).toUpperCase();
    var shippingAddress = lineItemContainer.defaultShipment.shippingAddress;
    var orderCountryCode = shippingAddress.countryCode.value ? shippingAddress.countryCode.value : shippingAddress.countryCode;
    return orderCountryCode === countryCode;
}

/**
 * Checks whther the order is eligible for return or not
 * @param {dw.order.LineItemCtnr} lineItemContainer - LineItemCtnr object
 * @param {Array} orderItems - orderItems
 * @returns {boolean} eligibleForReturn - return whether order is eligible for return or not
 */
function isOrderEligibleForReturn(lineItemContainer, orderItems) {
    var isEligibleForReturn = false;
    var returnPeriod = require('*/cartridge/scripts/helpers/holidaySeasonHelper').getReturnPeriod(lineItemContainer.orderNo);
    var currentDate = new Calendar();
    var returnCutOffDate = new Calendar(new Date(lineItemContainer.creationDate));
    returnCutOffDate.add(Calendar.DATE, returnPeriod);
    var isReturnsAvailable = returnCutOffDate.time > currentDate.time && lineItemContainer.getReturnCases().size() < 20;
    if (orderItems) {
        orderItems.forEach(function (item) {
            if (isReturnsAvailable && item.isEligibleForReturn) {
                 // eslint-disable-next-line no-param-reassign
                isEligibleForReturn = true;
                return;
            }
        });
    }
    return isEligibleForReturn;
}

/**
 * Get order status to display
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket/order
 * @returns {string} - Display Order Status
 */
function getOrderDisplayStatus(lineItemContainer) {
    var resources = {
        BEING_PROCESSED: Resource.msg('order.status.being.processed', 'account', null),
        NOT_SHIPPED: Resource.msg('order.status.not.shipped', 'account', null),
        SHIPPED: Resource.msg('order.status.shipped', 'account', null),
        CANCELLED: Resource.msg('order.status.cancelled', 'account', null),
        RETURNED: Resource.msg('order.status.returned', 'account', null),
        PARTIALLY_RETURNED: Resource.msg('order.status.partially.returned', 'account', null),
        PARTIAL_SHIPPED: Resource.msg('order.status.partial.shipped', 'account', null),
        FAILED: Resource.msg('order.status.failed', 'account', null)
    };
    var orderStatus = lineItemContainer.getStatus().value;
    var shippingStatus = lineItemContainer.getShippingStatus().value;
    var orderDisplayStatus = orderStatus;

    if (orderStatus === Order.ORDER_STATUS_COMPLETED || (shippingStatus === Order.SHIPPING_STATUS_SHIPPED && (orderStatus === Order.ORDER_STATUS_NEW || orderStatus === Order.ORDER_STATUS_OPEN))) {
        var returnStatus = null;
        var partiallyShipped = null;
        if ('refundsJson' in lineItemContainer.custom && !empty(lineItemContainer.custom.refundsJson) && (shippingStatus === Order.SHIPPING_STATUS_SHIPPED || shippingStatus === Order.SHIPPING_STATUS_PARTSHIPPED)) {
            returnStatus = returnsUtils.getReturnStatus(lineItemContainer);
        } else if ('shippingJson' in lineItemContainer.custom && (shippingStatus === Order.SHIPPING_STATUS_SHIPPED || shippingStatus === Order.SHIPPING_STATUS_PARTSHIPPED)) {
            partiallyShipped = returnsUtils.isPartiallyShipped(lineItemContainer);
        }
        if (returnStatus && resources[returnStatus]) {
            orderDisplayStatus = resources[returnStatus];
        } else if (partiallyShipped) {
            orderDisplayStatus = resources.PARTIAL_SHIPPED;
        } else {
            orderDisplayStatus = resources.SHIPPED;
        }
    } else if (shippingStatus !== Order.SHIPPING_STATUS_SHIPPED && (orderStatus === Order.ORDER_STATUS_NEW || orderStatus === Order.ORDER_STATUS_OPEN)) {
        orderDisplayStatus = resources.BEING_PROCESSED;
    } else if (orderStatus === Order.ORDER_STATUS_CANCELLED) {
        orderDisplayStatus = resources.CANCELLED;
    } else if (orderStatus === Order.ORDER_STATUS_CREATED) {
        orderDisplayStatus = resources.NOT_SHIPPED;
    } else if (orderStatus === Order.ORDER_STATUS_FAILED) {
        orderDisplayStatus = resources.FAILED;
    }
    return orderDisplayStatus;
}


/**
 * Order class that represents the current order
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket/order
 * @param {Object} options - The current order's line items
 * @param {Object} options.config - Object to help configure the orderModel
 * @param {string} options.config.numberOfLineItems - helps determine the number of lineitems needed
 * @param {string} options.countryCode - the current request country code
 * @constructor
 */
function OrderModel(lineItemContainer, options) {
    base.call(this, lineItemContainer, options);
    if (Site.getCurrent().getID() === 'KR') {
        this.creationDate = Object.hasOwnProperty.call(lineItemContainer, 'creationDate')
            ? StringUtils.formatCalendar(new Calendar(lineItemContainer.creationDate), 'yyyy/MM/dd')
            : null;
    }
    if (Site.getCurrent().getID() === 'SEA') {
        this.creationDate = Object.hasOwnProperty.call(lineItemContainer, 'creationDate')
            ? StringUtils.formatCalendar(new Calendar(lineItemContainer.creationDate), Resource.msg('order.creation.date.format', 'order', null))
            : null;
    }
    if (require('*/cartridge/config/preferences').isPersonalizationEnable
        && options
        && ((options.containerView === 'orderDetails') || (options.containerView !== 'basket'))) {
        this.orderItems.forEach((item) => {
            var collections = require('*/cartridge/scripts/util/collections');
            var pli = collections.find(lineItemContainer.getProductLineItems(item.ID), productLineItem => productLineItem.UUID === item.uuid);
            if (pli && pli.product) {
                require('*/cartridge/models/productLineItem/decorators/index').productPersonalization(item, pli);
                item.isEligibleForReturn = item.isEligibleForReturn && !item.isPersonalizationEligible;// eslint-disable-line
            }
            if (item.shippingAddress && !empty(item.shippingAddress.businessName)) item.shippedTo += (' ' + item.shippingAddress.businessName);// eslint-disable-line
        });
        this.isEligibleForReturn = isOrderEligibleForReturn(lineItemContainer, this.orderItems);
    }
    if (options && ((options.containerView === 'orderDetails') || (options.containerView !== 'basket'))) {
        this.orderItems.forEach((item) => {
            var collections = require('*/cartridge/scripts/util/collections');
            var pli = collections.find(lineItemContainer.getProductLineItems(item.ID), productLineItem => productLineItem.UUID === item.uuid);
            if (pli) {
                var addressHelper = require('*/cartridge/scripts/helpers/addressHelpers');
                var obj;
                if (item && item.shippingAddress.stateCode && item.shippingAddress.city) {
                    obj = addressHelper.getTranslatedLabel(item.shippingAddress.stateCode, item.shippingAddress.city);
                }
                if (!empty(obj && obj.stateCode)) {
                    item.stateCodeLabel = obj.stateCode;// eslint-disable-line
                }
                if (!empty(obj && obj.city)) {
                    item.cityLabel = obj.city;// eslint-disable-line
                }
                // To display the product return info
                var qtyInfo = returnsUtils.getQTYInformation(pli, lineItemContainer.getReturnCaseItems(), lineItemContainer.custom.shippingJson);
                if (Site.getCurrent().getID() !== 'OC' && !empty(qtyInfo) && qtyInfo.shippedQty >= 0 && qtyInfo.inReturnProcess > 0) {
                    var partialReturnText = Resource.msgf('refund.inprocess', 'order', null, qtyInfo.inReturnProcess, pli.quantity.value);
                    // eslint-disable-next-line no-param-reassign
                    item.partialReturnText = partialReturnText;
                }
                // Update translation for TH site
                var pliShippingDate = ('shippingJson' in lineItemContainer.custom && 'sku' in pli.custom) ? returnsUtils.getPLIShippingDate(lineItemContainer.custom.shippingJson, pli.custom.sku) : null;
                var isProductReturnBlocked = pli.product && returnsUtils.isProductReturnBlocked(pli.product);
                if (pli.getShipment().shippingStatus === 'SHIPPING_STATUS_NOTSHIPPED' || !pliShippingDate) {
                    // eslint-disable-next-line no-param-reassign
                    item.ineligibilityReasonTxt = Resource.msg('orderdetails.notshipped', 'order', null);
                } else if (!empty(qtyInfo) && qtyInfo.shippedQty >= 0 && qtyInfo.availableQTY === 0) {
                    if ((!empty(qtyInfo) && qtyInfo.customerReturnedQTY + qtyInfo.shortShipReturnedQty) === pli.quantity.value) {
                        // eslint-disable-next-line no-param-reassign
                        item.ineligibilityReasonTxt = Resource.msg('refund.itemsreturned', 'order', null);
                    } else {
                        // eslint-disable-next-line no-param-reassign
                        item.ineligibilityReasonTxt = Resource.msgf('refund.inprocess', 'order', null, qtyInfo.inReturnProcess, pli.quantity.value);
                    }
                } else if (isProductReturnBlocked) {
                    // eslint-disable-next-line no-param-reassign
                    item.ineligibilityReasonTxt = Resource.msg('returns.not.eligible', 'refunds', null);
                }
            }
        });
        if (this.isEligibleForReturn) {
            this.isEligibleForReturn = orderBelongsToCurrentCountry(lineItemContainer);
        }
        if (this.status) {
            this.displayStatus = getOrderDisplayStatus(lineItemContainer);
        }
    }
}

module.exports = OrderModel;
