'use strict';

var StringUtils = require('dw/util/StringUtils');

var ReturnsUtils = require('app_ua_emea/cartridge/scripts/orders/ReturnsUtils');
var returnsUtils = new ReturnsUtils();

/**
 * Get Order Return Price and Quantity Details
 * @param {dw.order.ReturnCase} returnCase - Return Case Object
 * @returns {Object} returns Return Items Price
 */
function getPriceDetailsForReturn(returnCase) {
    var Money = require('dw/value/Money');
    var collections = require('*/cartridge/scripts/util/collections');
    var lineItemContainer = returnCase.getOrder();
    var items = returnCase.getItems();
    var currencyCode = lineItemContainer.getCurrencyCode();

    var subTotal = new Money(0, currencyCode);
    var orderTotal = new Money(0, currencyCode);
    var taxTotal = new Money(0, currencyCode);
    var itemCount = 0;

    collections.forEach(items, function (item) {
        var productLineItem = item.lineItem;
        var proratedPrice = productLineItem.proratedPrice;
        proratedPrice = proratedPrice.divide(productLineItem.quantityValue);
        subTotal = subTotal.add(proratedPrice.multiply(item.authorizedQuantity));
        orderTotal = orderTotal.add(proratedPrice.multiply(item.authorizedQuantity));

        var taxRate = productLineItem.getTaxRate();
        var tax = proratedPrice.divide(1 + taxRate);
        tax = tax.multiply(taxRate);
        tax = tax.multiply(item.authorizedQuantity);
        taxTotal = taxTotal.add(tax);

        itemCount += item.authorizedQuantity.value;
    });
    return {
        subTotal: StringUtils.formatMoney(subTotal),
        orderTotal: StringUtils.formatMoney(orderTotal),
        taxTotal: StringUtils.formatMoney(taxTotal),
        itemCount: itemCount
    };
}

/**
 * Returns total quantity value of return items
 * @param {Object} items - Order Items
 * @returns {number} itemsCount - Returned Items Count of Order
 */
function getTotalItemsCount(items) {
    var itemsCount = 0;
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        itemsCount += (!isNaN(item.quantity) ? Number(item.quantity) : 0);
    }
    return itemsCount;
}

/**
 * Update ProductLineItems info in order object
 * @param {dw.order.ReturnCase} returnCase - Return Case object
 * @param {Object} options - The current order's line items
 * @param {Object} orderItems - productLineItems object
 */
function updateItemInfo(returnCase, options, orderItems) {
    var URLUtils = require('dw/web/URLUtils');
    var Money = require('dw/value/Money');
    var Site = require('dw/system/Site');

    var imagesDecorator = require('*/cartridge/models/product/decorators/images');
    var variationAttributes = require('*/cartridge/models/product/decorators/variationAttributes');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var items = returnCase.getItems();
    var refundInfo = options.refundInfo;
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var orderItem = {};
        var productItem = {};
        var productLineItem = item.lineItem;
        var product = productLineItem.getProduct();

        if (options && options.containerView === 'orderDetails') {
            if (product) {
                var masterProduct = product.isVariant() ? product.getMasterProduct() : product;
                orderItem.url = URLUtils.url('Product-Show', 'pid', masterProduct.ID);
                orderItem.upc = product.getUPC();
                variationAttributes(productItem, product.variationModel, {
                    attributes: 'selected'
                });
                var attributes = productItem.variationAttributes;
                if (attributes) {
                    for (var j = 0; j < attributes.length; j++) {
                        var attribute = attributes[j];
                        orderItem[attribute.id] = attribute.displayValue;
                    }
                }
            } else {
                orderItem.url = URLUtils.url('Product-Show', 'pid', productLineItem.productID);
                orderItem.upc = productLineItem.productID;
            }
            orderItem.sku = (productLineItem.custom && Object.hasOwnProperty.call(productLineItem.custom, 'sku') && productLineItem.custom.sku) ? productLineItem.custom.sku : productLineItem.productID;
            orderItem.name = productLineItem.productName;
            orderItem.ID = productLineItem.productID;
            orderItem.exchangeItem = false;

            orderItem.quantity = refundInfo && refundInfo.items && orderItem.sku in refundInfo.items ? refundInfo.items[orderItem.sku] : item.authorizedQuantity.value;
            var unitPrice;
            if (refundInfo && refundInfo.itemAmounts && refundInfo.itemAmounts[orderItem.sku]) {
                unitPrice = new Money(refundInfo.itemAmounts[orderItem.sku], options.currencyCode);
                unitPrice = unitPrice.divide(orderItem.quantity);
            } else {
                unitPrice = productLineItem.getProratedPrice();
                unitPrice = unitPrice.divide(productLineItem.getQuantityValue());
            }
            orderItem.pricePerUnit = StringUtils.formatMoney(unitPrice);

            // Return flow attributes
            orderItem.shipmentId = productLineItem.getShipment().getID();
            orderItem.orderItemID = productLineItem.getOrderItem().getItemID();

            var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
            var returnReasonModel = returnHelpers.orderReturnReasonModel();
            orderItem.returnReason = returnReasonModel[item.reasonCode];

            // To display the product return info
            if ((Site.getCurrent().getID() === 'SEA' || Site.getCurrent().getID() === 'TH')) {
                orderItem.returnReason = item.reasonCode.value;
            }

            // Get returnReason for KR site
            if ((Site.getCurrent().getID() === 'KR' && 'reasonCode' in item && !empty(item.reasonCode))) {
                var Resource = require('dw/web/Resource');
                orderItem.returnReason = Resource.msg('return.reason.' + item.reasonCode.value, 'account', null);
            }
        }

        if (product) {
            imagesDecorator(productItem, product, { types: ['cartFullDesktop'], quantity: 'single' });
            if (productItem.images && productItem.images.cartFullDesktop) {
                orderItem.imageUrl = productItem.images.cartFullDesktop.length > 0 && productItem.images.cartFullDesktop[0].url ? productItem.images.cartFullDesktop[0].url : null;
            }
        } else {
            orderItem.imageUrl = productHelper.getNoImageURL('gridTileDesktop');
        }
        orderItems.push(orderItem);
    }
}

/**
 * Order class that represents the current order
 * @param {dw.order.ReturnCase} returnCase - Return Case Object
 * @param {Object} options - The current order's line items
 * @constructor
 */
function returnOrderModel(returnCase, options) {
    var Calendar = require('dw/util/Calendar');
    var Resource = require('dw/web/Resource');

    if (returnCase) {
        var lineItemContainer = returnCase.getOrder();
        // Setting Order Locale before processing order modal object to get price based on order locale.
        var requestLocale = request.locale; // eslint-disable-line no-undef
        request.setLocale(lineItemContainer.customerLocaleID); // eslint-disable-line no-undef

        var currencyCode = lineItemContainer.getCurrencyCode();
        this.rmaNumber = Object.hasOwnProperty.call(returnCase, 'returnCaseNumber')
            ? returnCase.returnCaseNumber : null;
        this.status = Object.hasOwnProperty.call(returnCase, 'status')
            ? returnCase.getStatus().getValue()
            : null;
        this.orderNo = lineItemContainer.orderNo;
        var refundsJson = 'refundsJson' in lineItemContainer.custom && lineItemContainer.custom.refundsJson ? lineItemContainer.custom.refundsJson : '';
        var refundInfo = !empty(refundsJson) ? returnsUtils.getRefundInfoForOrderDetail(this.rmaNumber, refundsJson) : '';
        if (refundInfo) {
            this.status = Resource.msg('order.status.processed', 'account', null);
            this.displayStatus = Resource.msg('order.status.processed', 'account', null);
            this.creationDate = StringUtils.formatCalendar(new Calendar(new Date(refundInfo.refundDate)), 'dd/MM');
        } else {
            this.status = Resource.msg('order.status.received', 'account', null);
            this.displayStatus = Resource.msg('order.status.received', 'account', null);
            this.creationDate = Object.hasOwnProperty.call(returnCase, 'creationDate')
                ? StringUtils.formatCalendar(new Calendar(returnCase.creationDate), 'dd/MM') : null;
        }
        options.refundInfo = refundInfo; // eslint-disable-line no-param-reassign
        options.currencyCode = currencyCode; // eslint-disable-line no-param-reassign
        this.orderItems = [];
        updateItemInfo(returnCase, options, this.orderItems);

        if (options && options.containerView === 'orderDetails') {
            var Money = require('dw/value/Money');

            this.hasExchangeOrder = false;
            this.rmaNumber = returnCase.returnCaseNumber;

            if (refundInfo) {
                this.subTotal = StringUtils.formatMoney(new Money(refundInfo.refundAmount, currencyCode));
                this.orderTotal = this.subTotal;
                this.taxTotal = StringUtils.formatMoney(returnCase.grandTotal.tax);
                this.itemCount = getTotalItemsCount(this.orderItems);
            } else {
                var total = getPriceDetailsForReturn(returnCase);
                this.subTotal = total.subTotal;
                this.orderTotal = total.orderTotal;
                this.taxTotal = total.taxTotal;
                this.itemCount = total.itemCount;
            }

            this.orderEmail = lineItemContainer.customerEmail;
            this.vatIncluded = true;
        } else {
            if (this.orderItems && this.orderItems.length > 4) {
                this.moreItemsCount = this.orderItems.length - 4;
            }
            if (this.orderItems && this.orderItems.length > 3) {
                this.moreItemsCountOnMobile = this.orderItems.length - 3;
            }
        }
        // Reverting back to original locale at end
        request.setLocale(requestLocale); // eslint-disable-line no-undef
    }
}

module.exports = returnOrderModel;
