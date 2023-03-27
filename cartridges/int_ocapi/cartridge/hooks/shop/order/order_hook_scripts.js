/* eslint-disable no-param-reassign */
var Status = require('dw/system/Status');
var errorLogHelper = require('*/cartridge/scripts/errorLogHelper');
var Logger = require('dw/system/Logger');
var orderInfoLogger = Logger.getLogger('orderInfo', 'orderInfo');
/**
 * This method modifies the OCAPI response for Order documents
 *
 * @param {dw.order.Order} order - B2C Script Order object
 * @param {Object} orderResponse - OCAPI Order response document
 * @returns{dw.system.Status} - OK to continue further hook processing, ERROR to abort
 */
function updateResponse(order, orderResponse) {
    try {
        /* Assign response arg to local variable to prevent eslint no-param-reassign
         * errors.  Object args are passed by reference, so changes will still apply.
         */
        var response = orderResponse;

        /* Add unadjusted (before discounts) merchandise total to response document. */
        response.c_merchandise_total_price = order.getMerchandizeTotalPrice().getValue();
    } catch (e) {
        return errorLogHelper.handleOcapiHookErrorStatus(e);
    }
    return new Status(Status.OK);
}

/**
 * This method gets the estimated Loyalty points for Loyalty users
 *
 * @param {dw.order} order - order
 */
function estimateLoyaltyPionts(order) {
    let PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    if (PreferencesUtil.getValue('isLoyaltyEnable')) {
        const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
        if (customer.isAuthenticated()) {
            if (customer.isMemberOfCustomerGroup('Loyalty')) {
                loyaltyHelper.updateBasketBallance(order);
            }
        } else if ('referenceCustomerNo' in order.custom && !empty(order.custom.referenceCustomerNo)) {
            loyaltyHelper.updateBasketBallance(order, order.custom.referenceCustomerNo);
        }
    }
}

/**
 * This method update the loyalty coupon status in loyalty for Loyalty users
 *
 * @param {dw.order} order - order
 */
function updateLoyaltyCouponStatus(order) {
    let PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    if (PreferencesUtil.getValue('isLoyaltyEnable') && customer.isMemberOfCustomerGroup('Loyalty')) {
        const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
        var loyaltyCoupons = loyaltyHelper.getLoyaltyCouponsFromLineItemCtnr(order);
        var customerNo = order.customerNo;
        if (!empty(loyaltyCoupons)) {
            var updateCouponResponse = loyaltyHelper.updateCoupon(loyaltyCoupons, customerNo);

            if (updateCouponResponse.ok && updateCouponResponse.object && updateCouponResponse.object.couponUpdated) {
                Logger.info('Coupon Status updated successfully');
            } else {
                const Transaction = require('dw/system/Transaction');
                Transaction.wrap(function () {
                    // eslint-disable-next-line no-param-reassign
                    order.custom.loyaltyCouponNotUpdated = true;
                    // eslint-disable-next-line no-param-reassign
                    order.custom.loyaltyCouponUpdateRetries = 0;
                });
                Logger.error('Error while updating the coupon status at LoyaltyPlus');
            }
        }
    }
}
/**
 * This Method updates order for BOPIS only
 *
 * @param {dw.order} order - current order / order
 */
function updateBOPIS(order) {
    if (!order) {
        return;
    }
    const Site = require('dw/system/Site');
    const Transaction = require('dw/system/Transaction');
    const collections = require('*/cartridge/scripts/util/collections');
    const instorePickupStoreHelper = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
    const bopisEnabled = 'isBOPISEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isBOPISEnabled');
    const orderHasBopisShipment = collections.find(order.shipments, function (item) { // eslint-disable-line
        return item.custom.fromStoreId;
    });
    if (bopisEnabled && orderHasBopisShipment) {
        Transaction.wrap(function () {
            collections.forEach(order.shipments, function (shipment) {
                if (shipment.custom && 'fromStoreId' in shipment.custom && shipment.custom.fromStoreId) {
                    var billingAddress = order.billingAddress;
                    shipment.shippingAddress.setFirstName(billingAddress.firstName);
                    shipment.shippingAddress.setLastName(billingAddress.lastName);
                    shipment.shippingAddress.setPhone(billingAddress.phone);
                    collections.forEach(shipment.productLineItems, function (PLI) { // eslint-disable-line
                        PLI.custom.fromStoreId = shipment.custom.fromStoreId; // eslint-disable-line
                        instorePickupStoreHelper.setStoreInProductLineItem(shipment.custom.fromStoreId, PLI);
                    });
                }
            });
        });
        const orderHasOnlyBopis = (order && order.shipments) ? instorePickupStoreHelper.basketHasOnlyBOPISProducts(order.shipments) : false;
        const orderHasMixedOrders = (order && order.shipments && order.shipments.length > 1 && instorePickupStoreHelper.basketHasInStorePickUpShipment && !orderHasOnlyBopis) ? true : false; // eslint-disable-line
        Transaction.wrap(function () {
            order.custom.isBOPISOrder = orderHasOnlyBopis;
            order.custom.isMixedBOPISOrder = orderHasMixedOrders;
        });
         // SKU Mapping Logic
        const itemsMapping = [];
        const plis = order.allProductLineItems.iterator();
        while (plis.hasNext()) {
            var pli = plis.next();
            var itemMapping = [
                pli.productID,
                pli.custom.sku,
                pli.productName,
                pli.price.value + ' ' + pli.price.currencyCode,
                pli.quantityValue
            ].join('|');
            itemsMapping.push(itemMapping);
        }
        Transaction.wrap(function () {
            order.custom.itemsMapping = itemsMapping.join('\n');
        });
        var customerGroups = '';
        const customerGroupObj = order.customer.customerGroups;

        for (var customerGroup in customerGroupObj) { // eslint-disable-line
            customerGroups = empty(customerGroups) ? customerGroups = customerGroupObj[customerGroup].ID : customerGroups + ',' + customerGroupObj[customerGroup].ID;
        }
        Transaction.wrap(function () {
            const MaoConstants = require('*/cartridge/scripts/MaoConstants');
            const applePayPaymentInstruments = order.getPaymentInstruments('DW_APPLE_PAY');
            var salesDocumentTypeFMS = MaoConstants.Extended.sapSalesDocumentTypeFMS.defaultSapSalesDocumentTypeFMS;
            const vipPaymentInstruments = order.getPaymentInstruments('VIP_POINTS');
            if (vipPaymentInstruments.length > 0) {
                salesDocumentTypeFMS = MaoConstants.Extended.sapSalesDocumentTypeFMS.vipSapSalesDocumentTypeFMS;
            } else if (applePayPaymentInstruments.length > 0) {
                salesDocumentTypeFMS = MaoConstants.Extended.sapSalesDocumentTypeFMS.applepaySapSalesDocumentTypeFMS;
            }

            if (!Object.prototype.hasOwnProperty.call(order.custom, 'orderReasonFMS')) {
                order.custom.orderReasonFMS = MaoConstants.Extended.orderReasonFMS;
            }

            order.custom.sapSalesDocumentTypeFMS = salesDocumentTypeFMS;
            order.custom.customerGroups = customerGroups;
        });
    }
}

/**
 * This method Remove Invalid Loyalty Coupon Code from Basket for Loyalty users
 *
 * @param {dw.order.Basket} basket - basket
 */
function removeInvalidLoyaltyCouponsBeforePlaceOrder(basket) {
    let PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    if (PreferencesUtil.getValue('isLoyaltyEnable') && customer.isMemberOfCustomerGroup('Loyalty')) {
        const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
        try {
            loyaltyHelper.removeInvalidLoyaltyCoupons(basket);
        } catch (e) {
            errorLogHelper.handleOcapiHookErrorStatus(e);
        }
    }
}

exports.afterPOST = function (order) {
    var BasketMgr = require('dw/order/BasketMgr');
    const giftcardsHooks = require('*/cartridge/scripts/giftcard/hooks/giftcardsHooks');
    const vipDataHelpers = require('*/cartridge/scripts/vipDataHelpers');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    const giftCardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
    const vipHooks = require('*/cartridge/scripts/vip/hooks/vipHooks');
    var Resource = require('dw/web/Resource');
    var HookMgr = require('dw/system/HookMgr');
    var Transaction = require('dw/system/Transaction');
    var Site = require('dw/system/Site');

    // eslint-disable-next-line no-undef
    var countryCode = session.custom.customerCountry || request.getLocale().slice(-2).toUpperCase();
    // eslint-disable-next-line no-param-reassign
    order.custom.customerCountry = countryCode;

    var customerGroups = '';
    var customerGroupObj = order.customer.customerGroups;

    for (var customerGroup in customerGroupObj) { // eslint-disable-line
        customerGroups = empty(customerGroups) ? customerGroups = customerGroupObj[customerGroup].ID : customerGroups + ',' + customerGroupObj[customerGroup].ID;
    }

    Transaction.wrap(function () {
        // eslint-disable-next-line no-param-reassign
        order.custom.customerGroups = customerGroups;
    });
    // Set isEmployeeOrder boolean attribute for Employee Orders
    require('*/cartridge/scripts/util/SetOrderStatus').setEmployeeOrder(order);

    if (Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience')) {
        var customer = order.customer;
        var isVIP = !empty(customer) && !empty(customer.profile) && customer.profile.custom && 'vipAccountId' in customer.profile.custom && !empty(customer.profile.custom.vipAccountId);

        Transaction.wrap(function () {
            // eslint-disable-next-line no-param-reassign
            order.custom.isVipOrder = isVIP;
        });
    }

    // Set the estimated delivery dates
    if (HookMgr.hasHook('dw.order.setDeliveryEstimateDate')) {
        HookMgr.callHook('dw.order.setDeliveryEstimateDate', 'setDeliveryEstimateDate', order);
    }

    // Set the customerName if not set already
    require('*/cartridge/scripts/util/SetOrderStatus').setCustomerName(order);

    // Set MAO Order Type
    require('*/cartridge/scripts/util/SetOrderStatus').setOrderType(order);
    var handlePaymentResult = COHelpers.handlePayments(order, order.orderNo, 'OCAPI');
    var currentBasket;
    var basketHasGCPaymentInstrument;
    var paymentErrorMessage = null;
    if (!handlePaymentResult.error) {
        // Payment status ok
        if (order.getCustom().onHold) {
            // Payment on hold
            session.custom.currentOrder = null;
            if (Site.getCurrent().getCustomPreferenceValue('isSetOrderConfirmationEmailStatusForJob')) {
                order.custom.orderConfirmationEmailStatus = 'READY_FOR_PROCESSING'; // eslint-disable-line no-param-reassign
            } else {
                COHelpers.sendConfirmationEmail(order, request.locale.id); // eslint-disable-line no-undef
            }
        } else {
            // Fail order if Klarna status is PENDING
            var handlePendingKlarnaOrderResult = COHelpers.handlePendingKlarnaOrder(order);
            if (handlePendingKlarnaOrderResult && handlePendingKlarnaOrderResult.error) {
                // log the order details for dataDog.
                if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
                    paymentErrorMessage = 'Klarna status is pending';
                    orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, true, paymentErrorMessage));
                }
                return new Status(Status.ERROR, 'placeOrderError', Resource.msg('error.ocapi.klarna.payment.pending', 'checkout', null));
            }

            // Payment approved
            // Fraud Protection Check
            var fraudDetectionStatus = require('*/cartridge/modules/providers').get('FraudScreen', order).validate();
            if (fraudDetectionStatus === 'accept') {
                // BOPIS updates for the order
                updateBOPIS(order);
                // Initializing eGift order level status attribute
                var eGiftCardLineItems = giftCardHelper.getEGiftCardLineItems(order);
                if (eGiftCardLineItems.length > 0) {
                    Transaction.wrap(function () {
                        // eslint-disable-next-line no-param-reassign
                        order.custom.eGiftCardStatus = 'READY_FOR_PROCESSING';
                    });
                }
                // Fraud check approved
                var placeOrderResult = COHelpers.placeOrder(order);

                if (placeOrderResult.error) {
                    // log the order details for dataDog.
                    if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
                        orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, false));
                    }
                    return new Status(Status.ERROR, 'placeOrderError', Resource.msg('error.ocapi.placeorder', 'checkout', null));
                }
                // Update Loyalty Estimation Points
                estimateLoyaltyPionts(order);

                // Update Loyalty Coupon Status
                updateLoyaltyCouponStatus(order);
                if (Site.getCurrent().getCustomPreferenceValue('isSetOrderConfirmationEmailStatusForJob')) {
                    order.custom.orderConfirmationEmailStatus = 'READY_FOR_PROCESSING'; // eslint-disable-line no-param-reassign
                } else {
                    COHelpers.sendConfirmationEmail(order, request.locale.id); // eslint-disable-line no-undef
                }
            } else if (fraudDetectionStatus === 'review' || fraudDetectionStatus === 'SERVER_UNAVAILABLE') {
                if (Site.getCurrent().getCustomPreferenceValue('isSetOrderConfirmationEmailStatusForJob')) {
                    order.custom.orderConfirmationEmailStatus = 'READY_FOR_PROCESSING'; // eslint-disable-line no-param-reassign
                } else {
                    COHelpers.sendConfirmationEmail(order, request.locale.id); // eslint-disable-line no-undef
                }
                // Fraud check hold
                session.custom.currentOrder = null;
            } else {
                // Fraud check fail
                COHelpers.failOrder(order);
                currentBasket = BasketMgr.getCurrentBasket();
                basketHasGCPaymentInstrument = giftCardHelper.basketHasGCPaymentInstrument(currentBasket);
                if (currentBasket && basketHasGCPaymentInstrument) {
                    giftcardsHooks.reverseGiftCardsAmount(currentBasket);
                }

                if (currentBasket && vipDataHelpers.isVIPOrder(currentBasket)) {
                    vipHooks.reverseVipPoints(currentBasket);
                }
                // Aurus Legacy Check
                var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();
                if (!isAurusEnabled) {
                    // Make a call to XiPay to do void authorization if secondary authorization site preference is enabled for PayPal.
                    // "isEnabled" site preference and valid payment instrument check is already there in "doVoidAuthorization" method. So no need to put additional checks here.
                    var paymetricXiPayHelper = require('int_paymetric/cartridge/scripts/util/paymetricXiPayHelper');
                    paymetricXiPayHelper.doVoidAuthorization(order, 'PayPal');
                    var orderHasEGC = require('*/cartridge/scripts/giftcard/giftcardHelper').basketHasGiftCardItems(order).eGiftCards;
                    if (orderHasEGC) {
                        paymetricXiPayHelper.doVoidAuthorization(order, 'Paymetric');
                    }
                }
                COHelpers.sendFraudNotificationEmail(order);
                // log the order details for dataDog.
                if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
                    orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, false));
                }
                return new Status(Status.ERROR, 'placeOrderError', Resource.msg('error.ocapi.fraud', 'checkout', null));
            }
        }

        // Update order status to ready for export
        require('*/cartridge/modules/providers').get('OrderStatus', order).handleReadyForExport();
    } else {
        // Payment fails
        COHelpers.failOrder(order);
        currentBasket = BasketMgr.getCurrentBasket();
        basketHasGCPaymentInstrument = giftCardHelper.basketHasGCPaymentInstrument(currentBasket);
        if (currentBasket && basketHasGCPaymentInstrument) {
            giftcardsHooks.reverseGiftCardsAmount(currentBasket);
        }
        if (currentBasket && vipDataHelpers.isVIPOrder(currentBasket)) {
            vipHooks.reverseVipPoints(currentBasket);
        }

        if (handlePaymentResult.errorCode) {
            if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
                paymentErrorMessage = handlePaymentResult.errorMessage ? handlePaymentResult.errorMessage : Resource.msg('error.handlePayment.msg', 'checkout', null);
                orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, true, paymentErrorMessage));
            }
            return new Status(Status.ERROR, handlePaymentResult.resultCode, handlePaymentResult.errorMessage);
        }
        if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
            paymentErrorMessage = handlePaymentResult.errorMessage ? handlePaymentResult.errorMessage : Resource.msg('error.handlePayment.msg', 'checkout', null);
            orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, true, paymentErrorMessage));
        }
        return new Status(Status.ERROR, 'placeOrderError', handlePaymentResult.errorMessage || Resource.msg('billingaddress.invalidcard.errormessage', 'checkout', null));
    }
    // log the order details for dataDog.
    if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
        orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, false));
    }
    return new Status(Status.OK);
};

exports.beforePOST = function (basket) {
    removeInvalidLoyaltyCouponsBeforePlaceOrder(basket);
    return new Status(Status.OK);
};

exports.modifyPOSTResponse = function (order, orderResponse) {
    // validates MAO Order Type
    if (!order.custom.maoOrderType.value) {
        var Resource = require('dw/web/Resource');
        return new Status(Status.ERROR, 'placeOrderError', Resource.msg('error.maoOrdertype.not.valid', 'checkout', null));
    }
    return updateResponse(order, orderResponse);
};

exports.modifyPATCHResponse = function (order, orderResponse) {
    return updateResponse(order, orderResponse);
};

exports.modifyGETResponse = function (order, orderResponse) {
    return updateResponse(order, orderResponse);
};

exports.modifyPUTResponse = function (order, orderResponse) {
    return updateResponse(order, orderResponse);
};
