'use strict';

/**
 * Pipelet for fetching unacknowledged orders from border free.
 * 
 * @input mismatchOrderList : dw.util.ArrayList mandatory , list of all mismatched unacknowledged orders
 * @input ackOrderList : dw.util.ArrayList mandatory, list of all orders to be acknowledged
 * @input siteOrder : dw.order.Order mandatory, site Order
 * @input poOrder : Object mandatory, PO Order to be processed.
 * @input errorMailContent : dw.util.ArrayList mandatory, list of errors on PO
 */

const OrderMgr = require('dw/order/OrderMgr');
const Logger = require('dw/system/Logger');
const Resource = require('dw/web/Resource');
const Status = require('dw/system/Status');
const Order = require('dw/order/Order');
const Transaction = require('dw/system/Transaction');
const Util = require('*/cartridge/scripts/utils/Util');
var Money = require('dw/value/Money');
var Site = require('dw/system/Site');


/**
 * 
 * @param args
 * @return
 */
function execute(args) {
    processPOOrder(args.siteOrder, args.poOrder, args.ackOrderList, args.mismatchOrderList, args.errorMailContent);
}

/**
 * This function is used to process a SiteOrder basing on PO
 * @param siteOrder
 * @param poOrder
 * @param ackOrderList
 * @param mismatchOrderList
 * @return
 */
function processPOOrder(siteOrder, poOrder, ackOrderList) {
	var orderInfoLogger = Logger.getLogger('orderInfo', 'orderInfo');
	var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    let fraudState, orderStatus, bfxOrderId, authStatus, bfxEnableAuthorization = false;

    bfxEnableAuthorization = (dw.system.Site.current.getCustomPreferenceValue('bfxEnableAuthorization') === true);

    fraudState = poOrder.fraudState;
    if (Util.GREENSTATE === fraudState) {
        orderStatus = siteOrder.status.value;
        if (Order.ORDER_STATUS_FAILED === orderStatus) {
	        // log the order details for dataDog.
            if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && siteOrder) {
                orderInfoLogger.info(COHelpers.getOrderDataForDatadog(siteOrder, false));
            }
            Logger.info('Order is already marked as failed, so ignore further processing for order number: ' + siteOrder.orderNo);
        } else if (Order.ORDER_STATUS_CREATED === orderStatus) {

            try {

                Transaction.begin();

                updateBFOrder(poOrder, siteOrder);
                // We commented it out because it causes following issues:
                // 1. Product price  is taken from storefront price book instead of using BF sales price
                // 2. Tax is calculated using SFCC tax table but should be ZERO
                // 3. Shipping price is override from SFCC too.
                // dw.system.HookMgr.callHook('dw.ocapi.shop.basket.calculate', 'calculate', siteOrder);

                Transaction.commit();

            } catch (e) {

                Transaction.rollback();

                Logger.error("Error while updating the Order due to mismatch " + siteOrder.orderNo + ' error: ' + e.message);
            }

            addBfxCreditCard(siteOrder, poOrder);

            // Set MAO Order Type as E4X for Borderfree
            Transaction.wrap(function() {
                siteOrder.custom.maoOrderType = 'E4X'
            });

            if (bfxEnableAuthorization) {
                authStatus = authorizePayment(siteOrder, poOrder);
            }

            if ((bfxEnableAuthorization && !empty(authStatus) && authStatus.OK) || !bfxEnableAuthorization) {
                if (placeOrder(siteOrder, ackOrderList)) {
                    bfxOrderId = siteOrder.custom.bfxOrderId;
                    if (null === bfxOrderId) {
                        Logger.error('bfxOrderId is not associated with order: ' + siteOrder.orderNo);
                    } else {
                        Logger.info('Order placed, PO to ack: ' + bfxOrderId);
                    }

                    // log the order details for dataDog.
                    if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && siteOrder) {
                        orderInfoLogger.info(COHelpers.getOrderDataForDatadog(siteOrder, false));
                    }
                }
            } else {
	            // log the order details for dataDog.
                // EPMD-8467 removed the code because at this stage the order is with status CREATED
                // if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && siteOrder) {
                    // orderInfoLogger.info(COHelpers.getOrderDataForDatadog(siteOrder, true));
                // }

                //TODO: cancel order here if you'd prefere that workflow. This leaves order "created"
                Logger.error('Authorization attempted and failed, order not placed. order: ' + siteOrder.orderNo + '. Error: ' + authStatus.code + ' ' + authStatus.message.toString());
            }

        } else if (Order.ORDER_STATUS_NEW === orderStatus || Order.ORDER_STATUS_OPEN === orderStatus) {
            bfxOrderId = siteOrder.custom.bfxOrderId;
            // log the order details for dataDog.
            if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && siteOrder) {
                orderInfoLogger.info(COHelpers.getOrderDataForDatadog(siteOrder, false));
            }
            if (null !== bfxOrderId) {
                Logger.info('Order already placed, PO to ack: ' + bfxOrderId);
                ackOrderList.add(bfxOrderId);
            } else {
                Logger.error('bfxOrderId is not associated with order: ' + siteOrder.orderNo);
            }
        }

    } else if (Util.REDSTATE === fraudState) {
        cancelOrder(siteOrder);
        // log the order details for dataDog.
        if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && siteOrder) {
                orderInfoLogger.info(COHelpers.getOrderDataForDatadog(siteOrder, false));
        }
    }
}


/**
 * Place an order using OrderMgr. If order is placed successfully,
 * its status will be set as confirmed.
 * @param {dw.order.Order} order
 */
function placeOrder(order, ackOrderList) {
    let placeOrderStatus;
    try {
        Transaction.begin();
        placeOrderStatus = OrderMgr.placeOrder(order);
        if (placeOrderStatus === Status.ERROR) {
            Logger.error('Error while placing order for orderId: ' + order.orderNo + 'error: ' + e.message);
        } else {
            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
            order.setExportStatus(Order.EXPORT_STATUS_READY);
        }
        Transaction.commit();

        if (placeOrderStatus !== Status.ERROR) {
            ackOrderList.add(order.custom.bfxOrderId);
            return true;
        } else {
            // log error and send email if unable to place order
            Logger.error('Error while placing order for orderId: ' + order.orderNo);
            return false;
        }
    } catch (e) {
        Logger.error('Error while placing order for orderId: ' + order.orderNo + 'error' + e);
        Transaction.rollback();
        return false;
    }
}

/**
 * Save the Borderfree credit card info on an order. Note, this kills all METHOD_CREDIT_CARD payment methods on order
 * @param {dw.order.Order} sfccOrder SFCC Order object that matches borderfree order
 * @param {Object} bfxOrder Borderfree order JSON from po request
 */
function addBfxCreditCard(sfccOrder, bfxOrder) {
    try {
        Transaction.wrap(function() {
            sfccOrder.removeAllPaymentInstruments();
            //Aurus Legacy Check
            var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();
            var paymentMethod = isAurusEnabled ? 'AURUS_CREDIT_CARD' : 'Paymetric';
            var paymentInstrument = sfccOrder.createPaymentInstrument(paymentMethod, sfccOrder.getTotalGrossPrice());
            if (bfxOrder && bfxOrder.creditCard) {
                if (bfxOrder.creditCard.nameOnCard) {
                    paymentInstrument.creditCardHolder = bfxOrder.creditCard.nameOnCard;
                }
                if (bfxOrder.creditCard.number) {
                    paymentInstrument.creditCardNumber = bfxOrder.creditCard.number;
                }
                if (bfxOrder.creditCard.type) {
                    paymentInstrument.creditCardType = updateCardType(bfxOrder.creditCard.type);
                }
                if (bfxOrder.creditCard.expiry.month) {
                    paymentInstrument.creditCardExpirationMonth = bfxOrder.creditCard.expiry.month;
                }
                if (bfxOrder.creditCard.expiry.year) {
                    paymentInstrument.creditCardExpirationYear = bfxOrder.creditCard.expiry.year;
                }
            }

            var PaymentMgr = require('dw/order/PaymentMgr');
            paymentInstrument.paymentTransaction.paymentProcessor = PaymentMgr.getPaymentMethod(paymentMethod).getPaymentProcessor();
        });
    } catch (e) {
        Logger.error("Error while saving credit card info for SFCC orrder " + sfccOrder.orderNo + " / bfx order " + bfxOrder.orderId.e4XOrderId + " error: " + e.message);
    }
}


/**
 * Cancel order using OrderMgr. 
 * @param {dw.order.Order} order
 * @return {Boolean}
 */
function cancelOrder(order) {
    try {
        Transaction.begin();
        OrderMgr.failOrder(order,true);
        Transaction.commit();
        return true;
    } catch (e) {
        Logger.error('Error while cancelling order for orderId: ' + order.orderNo + ' error: ' + e.message);
        Transaction.rollback();
        return false;
    }
}

/**
 * This function iterates through order items and updates the existing SFCC order
 * @param {Object} bfxorder
 * @param {dw.order.Order} order
 * @return {dw.order.Order}
 */
function updateBFOrder(bfxOrder, order) {
    let basketItems = bfxOrder.basketDetails.basketItems;
    let productIter = order.getAllProductLineItems().iterator();
    let priceAdjustments = order.getPriceAdjustments();
    let coupons = order.getCouponLineItems();
    let bfxTotalOrderLevelDiscounts = Number(bfxOrder.basketDetails.orderDetails.totalOrderLevelDiscounts);

    //Looping through all of the price adjustments, and totaling them
    for (let i = 0, j = priceAdjustments.length; i < j; i++) {
        order.removePriceAdjustment(priceAdjustments[i]);
    }

    if (bfxTotalOrderLevelDiscounts > 0) {
        var bfPriceAdjustment = order.createPriceAdjustment('BorderfreeOrderLevelAdjustments', new dw.campaign.AmountDiscount(bfxTotalOrderLevelDiscounts));
        bfPriceAdjustment.setPriceValue(-1 * bfxTotalOrderLevelDiscounts);
        bfPriceAdjustment.updateTax(0);
        bfPriceAdjustment.setLineItemText('Adjustment from Borderfree PO');
    }

    let pli, qty, productID, errorMessage;
    while (productIter.hasNext()) {
        pli = productIter.next();
        order.removeProductLineItem(pli);
    }

    // create bfxorder item mapping
    let productId, productQuantity, customAttributes;
    for (var i = 0; i < basketItems.length; i += 1) {
        // Fetch product ID from custom attribute which is being passed to Borderfree from cartProductCard.isml
        customAttributes = JSON.parse(basketItems[i].custom);
        productId = customAttributes.productId;
        productQuantity = basketItems[i].productQuantity;
        var lineItem = order.createProductLineItem(productId, order.defaultShipment);
        lineItem.setQuantityValue(productQuantity);

        //set price based on PO order
        lineItem.setPriceValue(basketItems[i].productSalePrice);

        //zero out taxes, taxes handled on BF side
        // Manually calculate and update the tax basis
        var lineItemTotalSalePrice = basketItems[i].productSalePrice * productQuantity;
        var proratedDiscount = (lineItemTotalSalePrice / bfxOrder.basketDetails.orderDetails.totalProductSaleValue) * bfxTotalOrderLevelDiscounts;
        var taxBasis = new Money(lineItemTotalSalePrice - proratedDiscount, order.getCurrencyCode());
        lineItem.updateTax(0, taxBasis);
    }


    //set shipping price
    var shippingLineItems = order.defaultShipment.shippingLineItems;

    for (var s = 0; s < shippingLineItems.length; s++) {
        shippingLineItems[s].setPriceValue(bfxOrder.copShippingMethod.shippingPrice);
        //zero out taxes, taxes handled on BF side
        shippingLineItems[s].updateTax(0);
    }

    var bfxEmail = empty(bfxOrder.domesticProfile.Billing.email) ? '' : bfxOrder.domesticProfile.Billing.email;
    if (bfxEmail) {
        order.setCustomerEmail(bfxEmail);
    }

    updateShippingAddress(order, bfxOrder);

    // Set Delivery Date for Borderfree Orders
    if (order && order.getDefaultShipment() && order.getDefaultShipment().getShippingMethod()) {
        var DeliveryHelper = require('*/cartridge/scripts/util/DeliveryHelper');
        var deliveryDateRange = DeliveryHelper.getShippingDeliveryDates(order.getDefaultShipment().getShippingMethod(), false);
        if (deliveryDateRange) {
            Transaction.wrap(function () {
                order.getDefaultShipment().custom.deliveryDateMin = deliveryDateRange[0].getTime();
                order.getDefaultShipment().custom.deliveryDateMax = deliveryDateRange[1].getTime();
            });
        }
    }

    // Update order totals
    order.updateTotals();

    return order;
}

/**
 * @description Saves actual custom shipping address from BFX PO
 * @param {dw.order.Order} order 
 * @param {Object} bfxOrder 
 */
function updateShippingAddress(order, bfxOrder) {
    var defaultShipment = !empty(order) && !empty(order.getDefaultShipment()) ? order.getDefaultShipment() : null;
    var shippingAddress = !empty(defaultShipment) ? defaultShipment.getShippingAddress() : null;
    var currentSite = require('dw/system/Site').getCurrent();
    if (!empty(shippingAddress)) {
        // address 2 must be E4X order number
        var bfxOrderNo = !empty(bfxOrder) && !empty(bfxOrder.orderId) && !empty(bfxOrder.orderId.e4XOrderId) ? bfxOrder.orderId.e4XOrderId : '';
        if (!empty(bfxOrderNo)) {
            shippingAddress.setAddress2(bfxOrderNo);
        }

        var domesticProfile = !empty(bfxOrder) && !empty(bfxOrder.domesticProfile) ? bfxOrder.domesticProfile : null;
        var bfxShipping = !empty(domesticProfile) && !empty(domesticProfile.Shipping) ? domesticProfile.Shipping : null;
        if (!empty(bfxShipping)) {
            if (!empty(bfxShipping.firstName)) {
                shippingAddress.setFirstName(currentSite.getCustomPreferenceValue('bfxShippingFirstName') || 'BorderFree');
            }
            if (!empty(bfxShipping.lastName)) {
                shippingAddress.setLastName(currentSite.getCustomPreferenceValue('bfxShippingLastName') || 'Order');
            }
            if (!empty(bfxShipping.addressLine1)) {
                shippingAddress.setAddress1(bfxShipping.addressLine1);
            }
            // only set address2 if it was not set above
            if (empty(bfxOrderNo) && !empty(bfxShipping.addressLine2)) {
                shippingAddress.setAddress2(bfxShipping.addressLine2);
            }
            if (!empty(bfxShipping.city)) {
                shippingAddress.setCity(bfxShipping.city);
            }
            if (!empty(bfxShipping.postalCode)) {
                shippingAddress.setPostalCode(bfxShipping.postalCode);
            }
            if (!empty(bfxShipping.region)) {
                shippingAddress.setStateCode(bfxShipping.region);
            }
            if (!empty(bfxShipping.country)) {
                shippingAddress.setCountryCode(bfxShipping.country);
            }
            if (!empty(bfxShipping.primaryPhone)) {
                shippingAddress.setPhone(bfxShipping.primaryPhone);
            }
        }
    }
}

/**
 * @description Implement authorization of the BFX credit card with your specific payment gateway here
 * @param {dw.order.Order} order SFCC Order
 * @param {Object} bfxOrder BFX Order from PO api
 * @return {dw.system.Status} 
 */
function authorizePayment(order, bfxOrder) {
    if (order.getPaymentInstruments().length === 0) {
        return new Status(Status.ERROR, 'bfx.authorizePayment.noPaymentInstrument', 'No payment instrument on order');
    }

    if (empty(bfxOrder) || empty(bfxOrder.creditCard)) {
        return new Status(Status.ERROR, 'bfx.authorizePayment.noBfxCreditCard', 'No credit card details from Borderfree');
    }

    return new Status(Status.ERROR, 'bfx.authorizePayment.notImplemented', 'Custom authorization logic not implemented');
    // return new Status(Status.OK) when successful
}

/**
 * @description Convert from BFX credit card type name to SFCC standard
 * @param {String} bfxCardType 
 * @return {String} 'Visa' or 'MasterCard' etc.
 */
function updateCardType(bfxCardType) {
    if (!empty(bfxCardType)) {
        switch (bfxCardType.toLowerCase()) {
            case 'visa':
                bfxCardType = 'Visa';
                break;
            case 'mastercard':
            case 'master':
                bfxCardType = 'MasterCard';
                break;
            case 'amex':
                bfxCardType = 'Amex';
                break;
            case 'discover':
                bfxCardType = 'Discover';
                break;
            case 'maestro':
                bfxCardType = 'Maestro';
                break;
        }
    }
    return bfxCardType;
}

exports.execute = execute;