/* eslint-disable spellcheck/spell-checker */
'use strict';

var StringUtils = require('dw/util/StringUtils');
var Order = require('dw/order/Order');
var ReturnsUtils = require('*/cartridge/scripts/orders/ReturnsUtils');
var returnsUtils = new ReturnsUtils();
var formatMoney = require('dw/util/StringUtils').formatMoney;
var Money = require('dw/value/Money');
var base = module.superModule;

/**
 * Validate selected PIDs with line item
 * @param {Object} selectedPidsArray - selected PIDs
 * @param {string} shipmentID - Shipment ID
 * @param {string} productID - product ID
 * @returns {boolean} return status of order item
 */
function isEligibleLineItem(selectedPidsArray, shipmentID, productID) {
    return selectedPidsArray.some(function (selectedPid) {
        var isMatchingShipment = !selectedPid.shipmentId || (shipmentID && selectedPid.shipmentId && shipmentID === selectedPid.shipmentId.toString());
        return isMatchingShipment && productID && productID === selectedPid.pid;
    });
}


/**
 * Get Order Return Price and Quantity Details
 * @param {dw.order.LineItemCtnr} lineItemContainer - LineItemCtnr object
 * @param {Object} selectedPidsArray - selected PIDs
 * @param {Object} pidQtyObj - selected PIDs
 * @returns {Object} returns Return Items Price
 */
function getPriceDetailsForReturn(lineItemContainer, selectedPidsArray, pidQtyObj) {
    var collections = require('*/cartridge/scripts/util/collections');
    var productLineItems = lineItemContainer.getProductLineItems();
    var currencyCode = lineItemContainer.getCurrencyCode();

    var subTotal = new Money(0, currencyCode);
    var orderTotal = new Money(0, currencyCode);
    var totalTax = new Money(0, currencyCode);
    var itemCount = 0;

    collections.forEach(productLineItems, function (productLineItem) {
        var shipment = productLineItem.getShipment();
        var itemEligibleForSelectReasonPage = isEligibleLineItem(selectedPidsArray, shipment.ID, productLineItem.productID);
        if (itemEligibleForSelectReasonPage) {
            var proratedPrice = productLineItem.proratedPrice;
            proratedPrice = proratedPrice.divide(productLineItem.quantityValue);

            var tax = productLineItem.adjustedTax;
            tax = tax.divide(productLineItem.quantityValue);

            if (!empty(pidQtyObj) && pidQtyObj.length > 0) {
                pidQtyObj.forEach(function (itemToUpdate) {
                    if (itemToUpdate.pid === productLineItem.productID) {
                        subTotal = subTotal.add(proratedPrice.multiply(itemToUpdate.qty));
                        orderTotal = orderTotal.add(proratedPrice.multiply(itemToUpdate.qty));
                        totalTax = totalTax.add(tax.multiply(itemToUpdate.qty));
                        itemCount += Number(itemToUpdate.qty);
                    }
                });
            } else {
                subTotal = subTotal.add(proratedPrice);
                orderTotal = orderTotal.add(proratedPrice);
                totalTax = totalTax.add(tax);
                itemCount += 1;
            }
        }
    });
    return {
        subTotal: StringUtils.formatMoney(subTotal),
        orderTotal: StringUtils.formatMoney(orderTotal),
        totalTax: StringUtils.formatMoney(totalTax),
        itemCount: itemCount
    };
}

/**
 * Reutrns the item return details
 * @param {dw.order.ProductLineItem} productLineItem - productLineItem
 * @param {dw.order.LineItemCtnr} order - order object
 * @param {dw.order.Shipment} shipment - shipment object
 * @returns {Object} result
 */
function getItemReturnDetails(productLineItem, order, shipment) {
    var qtyInfo = returnsUtils.getQTYInformation(productLineItem, order.getReturnCaseItems(), order.custom.shippingJson);
    var Resource = require('dw/web/Resource');
    var ineligibilityReasonTxt = '';
    var pliShippingDate = ('shippingJson' in order.custom && 'sku' in productLineItem.custom) ? returnsUtils.getPLIShippingDate(order.custom.shippingJson, productLineItem.custom.sku) : null;
    var isProductReturnBlocked = productLineItem.product && returnsUtils.isProductReturnBlocked(productLineItem.product);
    var displayTooltip = false;

    if (shipment.shippingStatus === 'SHIPPING_STATUS_NOTSHIPPED' || !pliShippingDate) {
        ineligibilityReasonTxt = Resource.msg('orderdetails.notshipped', 'order', null);
    } else if (!empty(qtyInfo) && qtyInfo.shippedQty >= 0 && qtyInfo.availableQTY === 0) {
        if ((!empty(qtyInfo) && qtyInfo.customerReturnedQTY + qtyInfo.shortShipReturnedQty) === productLineItem.quantity.value) {
            ineligibilityReasonTxt = Resource.msg('refund.itemsreturned', 'order', null);
        } else {
            ineligibilityReasonTxt = Resource.msgf('refund.inprocess', 'order', null, qtyInfo.inReturnProcess, productLineItem.quantity.value);
        }
    } else if (isProductReturnBlocked) {
        displayTooltip = true;
        ineligibilityReasonTxt = Resource.msg('returns.not.eligible', 'refunds', null);
    }

    var result = {
        isEligibleForReturn: qtyInfo && qtyInfo.availableQTY > 0 && !isProductReturnBlocked,
        availableQty: qtyInfo && qtyInfo.availableQTY,
        ineligibilityReasonTxt: ineligibilityReasonTxt,
        displayTooltip: displayTooltip
    };

    return result;
}

/**
 * Checks whther the order is eligible for return or not
 * @param {dw.order.LineItemCtnr} lineItemContainer - LineItemCtnr object
 * @param {Array} orderItems - orderItems
 * @returns {boolean} eligibleForReturn - return whether order is eligible for return or not
 */
function isOrderEligibleForReturn(lineItemContainer, orderItems) {
    var isEligibleForReturn = false;
    var returnsPreferences = returnsUtils.getReturnsPreferences(lineItemContainer.creationDate, lineItemContainer.getReturnCases().size());
    var isReturnsAvailable = returnsPreferences.isReturnsAvailable;
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
 * Update ProductLineItems info in order object
 * @param {dw.order.LineItemCtnr} lineItemContainer - LineItemCtnr object
 * @param {Object} options - The current order's line items
 * @param {Object} orderItems - productLineItems object
 */
function updateItemInfo(lineItemContainer, options, orderItems) {
    var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');
    var AddressModel = require('*/cartridge/models/address');
    var collections = require('*/cartridge/scripts/util/collections');
    var imagesDecorator = require('*/cartridge/models/product/decorators/images');
    var variationAttributes = require('*/cartridge/models/product/decorators/variationAttributes');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var productLineItems = lineItemContainer.getProductLineItems();
    collections.forEach(productLineItems, function (productLineItem) {
        var item = {};
        var productItem = {};
        var product = productLineItem.getProduct();

        if (options && (options.containerView === 'orderDetails')) {
            var shipment = productLineItem.getShipment();
            var itemReturnInfo = getItemReturnDetails(productLineItem, lineItemContainer, shipment);

            if (product) {
                var masterProduct = product.isVariant() ? product.getMasterProduct() : product;
                item.url = URLUtils.url('Product-Show', 'pid', masterProduct.ID);
                variationAttributes(productItem, product.variationModel, {
                    attributes: 'selected'
                });
                var attributes = productItem.variationAttributes;
                if (attributes) {
                    for (var i = 0; i < attributes.length; i++) {
                        var attribute = attributes[i];
                        item[attribute.id] = attribute.displayValue;
                    }
                }
                item.upc = product.getUPC();
                imagesDecorator(productItem, product, { types: ['cartFullDesktop'], quantity: 'single' });
                if (productItem.images && productItem.images.cartFullDesktop) {
                    item.imageUrl = productItem.images.cartFullDesktop.length > 0 && productItem.images.cartFullDesktop[0].url ? productItem.images.cartFullDesktop[0].url : null;
                    item.name = productItem.images.cartFullDesktop.length > 0 && productItem.images.cartFullDesktop[0].title ? productItem.images.cartFullDesktop[0].title : productItem.images.cartFullDesktop[0].alt;
                }
            } else {
                item.upc = productLineItem.productID;
                item.url = URLUtils.url('Product-Show', 'pid', productLineItem.productID);
                item.imageUrl = productHelper.getNoImageURL('gridTileDesktop');
            }
            item.sku = (productLineItem.custom && Object.hasOwnProperty.call(productLineItem.custom, 'sku') && productLineItem.custom.sku) ? productLineItem.custom.sku : productLineItem.productID;
            item.ID = productLineItem.productID;
            item.name = productLineItem.productName;
            item.exchangeItem = false;
            item.isEligibleForReturn = itemReturnInfo.isEligibleForReturn;
            item.ineligibilityReasonTxt = itemReturnInfo.ineligibilityReasonTxt;
            item.displayTooltip = itemReturnInfo.displayTooltip;
            item.quantity = productLineItem.getQuantity().getValue();
            var unitPrice = productLineItem.getProratedPrice().divide(productLineItem.getQuantityValue());
            var listPrice = productLineItem.getPrice().divide(productLineItem.getQuantityValue());
            if (!listPrice.equals(unitPrice)) {
                item.listPrice = listPrice;
            }
            item.pricePerUnit = StringUtils.formatMoney(unitPrice);
            var details = [];
            if (productLineItem.custom.jerseyNameText) {
                details.push(productLineItem.custom.jerseyNameText);
            }
            if (productLineItem.custom.jerseyNumberText) {
                details.push(productLineItem.custom.jerseyNumberText);
            }
            item.personalizationDetail = (details.length > 0)
                ? Resource.msgf('personalize.detail', 'personalize', null, details.join(' | '))
                : null;

            var shippingAddress = shipment.shippingAddress;
            item.shippingAddress = new AddressModel(shipment.shippingAddress).address;

            // Replace address 2 with address 1 and set address to null
            if (shipment.custom.paazlDeliveryInfo && item.shippingAddress.address2) {
                item.shippingAddress.address1 = item.shippingAddress.address2;
                item.shippingAddress.address2 = '';
            }

            item.shippedTo = (shippingAddress.firstName ? (shippingAddress.firstName + ' ') : '') + (shippingAddress.firstName ? shippingAddress.lastName : null);
            // Return flow attributes
            item.shipmentId = productLineItem.getShipment().getID();
            item.orderItemID = productLineItem.getOrderItem().getItemID();
            item.uuid = productLineItem.UUID;

            if (options.selectedPidsArray) {
                var itemEligibleForSelectReasonPage = isEligibleLineItem(options.selectedPidsArray, shipment.ID, productLineItem.productID);
                if (itemEligibleForSelectReasonPage) {
                    item.quantity = itemReturnInfo.availableQty;
                    orderItems.push(item);
                }
            } else {
                orderItems.push(item);
            }
        } else {
            if (product) {
                imagesDecorator(productItem, product, { types: ['cartFullDesktop'], quantity: 'single' });
                item.imageUrl = productItem.images && productItem.images.cartFullDesktop && productItem.images.cartFullDesktop.length > 0 && productItem.images.cartFullDesktop[0].url ? productItem.images.cartFullDesktop[0].url : null;
                item.name = productItem.images && productItem.images.cartFullDesktop && productItem.images.cartFullDesktop.length > 0 && productItem.images.cartFullDesktop[0].title ? productItem.images.cartFullDesktop[0].title : productItem.images.cartFullDesktop[0].alt;
            } else {
                item.imageUrl = productHelper.getNoImageURL('cartMiniDesktop');
            }
            orderItems.push(item);
        }
    });
}

/**
 * Get order status to display
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket/order
 * @returns {string} - Display Order Status
 */
function getOrderDisplayStatus(lineItemContainer) {
    var Resource = require('dw/web/Resource');
    var resources = {
        BEING_PROCESSED: Resource.msg('order.status.being.processed', 'account', null),
        NOT_SHIPPED: Resource.msg('order.status.not.shipped', 'account', null),
        SHIPPED: Resource.msg('order.status.shipped', 'account', null),
        CANCELLED: Resource.msg('order.status.cancelled', 'account', null),
        RETURNED: Resource.msg('order.status.returned', 'account', null),
        PARTIALLY_RETURNED: Resource.msg('order.status.partially.returned', 'account', null),
        PARTIAL_SHIPPED: Resource.msg('order.status.partial.shipped', 'account', null),
        FAILED: Resource.msg('order.status.failed', 'account', null),
        OXXO_NOT_PAID: Resource.msg('order.status.oxxo.pending', 'account', null)
    };
    var orderStatus = lineItemContainer.getStatus().value;
    var orderPaymentStatus = lineItemContainer.getPaymentStatus().value;
    var shippingStatus = lineItemContainer.getShippingStatus().value;
    var orderDisplayStatus = orderStatus;

    // Special case for Oxxo if order is Not Paid
    if ('adyenPaymentMethod' in lineItemContainer.paymentInstrument.custom
        && lineItemContainer.paymentInstrument.custom.adyenPaymentMethod === 'Oxxo'
        && orderPaymentStatus !== Order.PAYMENT_STATUS_PAID) {
            return resources.OXXO_NOT_PAID; // eslint-disable-line indent
    }

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
 * update order Status based shipping status
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket/order
 * @returns {string} - Updated Order Status
 */
function updateOrderStatus(lineItemContainer) {
    var resources = {
        SHIPPED: 'SHIPPED',
        PARTSHIPPED: 'PARTIAL_SHIPPED',
        CANCELLED: 'CANCELLED',
        BEING_PROCESSED: 'BEING_PROCESSED'
    };
    var orderStatus = lineItemContainer.getStatus().value;
    var shippingStatus = lineItemContainer.getShippingStatus().value;
    var status = orderStatus;
    if (shippingStatus === Order.SHIPPING_STATUS_SHIPPED) {
        status = resources.SHIPPED;
    } else if (shippingStatus === Order.SHIPPING_STATUS_PARTSHIPPED) {
        status = resources.PARTSHIPPED;
    } else if (orderStatus === Order.ORDER_STATUS_NEW || orderStatus === Order.ORDER_STATUS_OPEN) {
        status = resources.BEING_PROCESSED;
    } else if (orderStatus === Order.ORDER_STATUS_CANCELLED) {
        status = resources.CANCELLED;
    }
    return status;
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
    var Calendar = require('dw/util/Calendar');
    var Site = require('dw/system/Site');
    var TotalsModel = require('*/cartridge/models/totals');
    var totalsModel;
    var requestLocale = request.locale; // eslint-disable-line no-undef
    var selectedPaymentInstrument;
    if (options && options.containerView === 'basket') {
        totalsModel = new TotalsModel(lineItemContainer);
        base.call(this, lineItemContainer, options);
        if (this.billing && !empty(this.billing.payment.selectedPaymentInstruments)) {
            selectedPaymentInstrument = this.billing.payment.selectedPaymentInstruments[0];
            selectedPaymentInstrument.formattedAmount = formatMoney(new Money(selectedPaymentInstrument.amount, lineItemContainer.getCurrencyCode()));
        }

        this.isInternationalBillingAddressEnabled = Site.current.getCustomPreferenceValue('isInternationalBillingAddressEnabled');
    } else if (options && options.containerView === 'orderDetails') {
        // Setting Order Locale before processing order modal object to get price based on order locale.
        request.setLocale(lineItemContainer.customerLocaleID); // eslint-disable-line no-undef

        totalsModel = new TotalsModel(lineItemContainer);
        this.orderNo = Object.hasOwnProperty.call(lineItemContainer, 'orderNo')
            ? lineItemContainer.orderNo
            : null;
        this.status = Object.hasOwnProperty.call(lineItemContainer, 'status')
            ? lineItemContainer.status
            : null;
        this.creationDate = Object.hasOwnProperty.call(lineItemContainer, 'creationDate')
            ? StringUtils.formatCalendar(new Calendar(lineItemContainer.creationDate), 'dd/MM/yyyy')
            : null;
        this.updatedDate = null;
        var shippingJson;
        var shippedData;
        var hasMultipleShipments;

        if ('shippingJson' in lineItemContainer.custom && !empty(lineItemContainer.custom.shippingJson)) {
            shippingJson = lineItemContainer.custom.shippingJson;
            shippedData = returnsUtils.parseJsonSafely(shippingJson);
        }

        if (this.status) {
            this.displayStatus = getOrderDisplayStatus(lineItemContainer);
            this.status = updateOrderStatus(lineItemContainer);
            if ('refundsJson' in lineItemContainer.custom && !empty(lineItemContainer.custom.refundsJson) && (this.status === 'SHIPPED' || this.status === 'PARTIAL_SHIPPED')) {
                var refundsJson = lineItemContainer.custom.refundsJson;
                var refunds = returnsUtils.parseJsonSafely(refundsJson);
                if (refunds && refunds.length > 0) {
                    var recentRefund = refunds[refunds.length - 1];
                    var recentRefundDate = recentRefund.refundDate;
                    if (recentRefundDate) {
                        recentRefundDate = new Date(recentRefundDate);
                        this.updatedDate = StringUtils.formatCalendar(new Calendar(recentRefundDate), 'dd/MM');
                    }
                }
            } else if (shippedData && (this.status === 'SHIPPED' || this.status === 'PARTIAL_SHIPPED')) {
                if (shippedData && shippedData.length > 0) {
                    var recentShippedData = shippedData[shippedData.length - 1];
                    var recentShippedDate = recentShippedData.date;
                    if (recentShippedDate) {
                        recentShippedDate = new Date(recentShippedDate);
                        this.updatedDate = StringUtils.formatCalendar(new Calendar(recentShippedDate), 'dd/MM');
                    }
                }
            }
        }

        if (options.handleMultipleShipments) {
            hasMultipleShipments = (shippedData && shippedData.length > 1) || returnsUtils.isPartiallyShipped(lineItemContainer);
        }
        this.orderItems = [];
        updateItemInfo(lineItemContainer, options, this.orderItems);

        if (hasMultipleShipments) {
            var shipmentCounter = 0;
            this.orderItems.forEach(function (currentItem) {
                var sku = currentItem.sku;
                shippedData.forEach(function (shipment) {
                    var items = shipment.items;
                    if (items[sku] && items[sku] > 0) {
                        // eslint-disable-next-line no-param-reassign
                        currentItem.shipment = {
                            status: 'Shipped',
                            updatedDate: shipment.date ? StringUtils.formatCalendar(new Calendar(new Date(shipment.date)), 'yyyy-MM-dd') : '',
                            trackingLink: returnsUtils.getShippingTrackingLink(lineItemContainer, shipment),
                            shipmentCounter: ++shipmentCounter
                        };
                    }
                });
                if (!currentItem.shipment) {
                    // eslint-disable-next-line no-param-reassign
                    currentItem.shipment = {
                        status: 'inprogress'
                    };
                }
            });
            this.shipmentCounter = shipmentCounter;
        }

        this.hasExchangeOrder = false;
        this.rmaNumber = this.orderNo;
        this.isCommercialPickUp = false;
        this.hasMultipleShipments = false;
        this.isEligibleForExchange = false;
        this.isEligibleForReturn = isOrderEligibleForReturn(lineItemContainer, this.orderItems);

        if (options.selectedPidsArray) {
            var total = getPriceDetailsForReturn(lineItemContainer, options.selectedPidsArray, options.pidQtyObj);
            this.subTotal = total.subTotal;
            this.orderTotal = total.orderTotal;
            this.taxTotal = total.totalTax;
            this.itemCount = total.itemCount;
        } else {
            this.subTotal = totalsModel.subTotal;
            this.orderTotal = totalsModel.grandTotal;
            this.taxTotal = totalsModel.totalTax;
            this.itemCount = lineItemContainer.productQuantityTotal;
        }

        this.shippingTotal = totalsModel.totalShippingCost;
        // Shipment tracking URL
        if (this.status && (this.status === 'SHIPPED' || this.status === 'PARTIAL_SHIPPED' || this.status === 'PICKUP_READY' || this.status === 'RETURNING')) {
            this.shipment = {
                trackingLink: returnsUtils.getShippingTrackingLink(lineItemContainer)
            };
        } else {
            this.shipment = {
                trackingLink: null
            };
        }
        this.orderEmail = lineItemContainer.customerEmail;
        this.vatIncluded = true;
        this.returnService = returnsUtils.getPreferenceValue('returnService');
        // Reverting back to original locale at end
        request.setLocale(requestLocale); // eslint-disable-line no-undef
    } else {
        // Setting Order Locale before processing order modal object to get price based on order locale.
        request.setLocale(lineItemContainer.customerLocaleID); // eslint-disable-line no-undef

        totalsModel = new TotalsModel(lineItemContainer);
        base.call(this, lineItemContainer, options);

        this.orderNo = Object.hasOwnProperty.call(lineItemContainer, 'orderNo')
            ? lineItemContainer.orderNo
            : null;
        this.status = Object.hasOwnProperty.call(lineItemContainer, 'status')
            ? lineItemContainer.status
            : null;
        this.creationDate = Object.hasOwnProperty.call(lineItemContainer, 'creationDate')
            ? StringUtils.formatCalendar(new Calendar(lineItemContainer.creationDate), 'dd/MM/yyyy')
            : null;
        if (this.status) {
            this.displayStatus = getOrderDisplayStatus(lineItemContainer);
        }
        if (this.billing && !empty(this.billing.payment.selectedPaymentInstruments)) {
            selectedPaymentInstrument = this.billing.payment.selectedPaymentInstruments[0];
            selectedPaymentInstrument.formattedAmount = formatMoney(new dw.value.Money(selectedPaymentInstrument.amount, lineItemContainer.getCurrencyCode()));
        }
        this.orderTotal = totalsModel ? totalsModel.grandTotal : null;

        this.orderItems = [];
        updateItemInfo(lineItemContainer, options, this.orderItems);

        if (this.orderItems && this.orderItems.length > 4) {
            this.moreItemsCount = this.orderItems.length - 4;
        }
        if (this.orderItems && this.orderItems.length > 3) {
            this.moreItemsCountOnMobile = this.orderItems.length - 3;
        }
        // Reverting back to original locale at end
        request.setLocale(requestLocale); // eslint-disable-line no-undef
    }

    if ('oxxoDetails' in lineItemContainer.custom && lineItemContainer.custom.oxxoDetails) {
        try {
            this.oxxoDetails = JSON.parse(lineItemContainer.custom.oxxoDetails);
        } catch (e) {
            dw.system.Logger.error('order.js: Can not parse oxxoDetails JSON: ' + e.message);
        }
    }
}

module.exports = OrderModel;
