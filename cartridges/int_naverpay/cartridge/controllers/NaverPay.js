'use strict';

var server = require('server');

var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger').getLogger('NAVERPAY');

var naverPayHelpers = require('*/cartridge/scripts/helpers/naverPayHelpers');
var Resource = require('dw/web/Resource');

/**
 *
 * @param {Obj} productLineItems productlineitems
 * @return {array} productItems
 */
function getProductLineItemsDetails(productLineItems) {
    var productItems = [];
    for (var i = 0; i < productLineItems.length; i++) {
        var item = productLineItems[i];
        var productInfo = {};
        productInfo.uid = item.productID;
        productInfo.name = item.productName;
        productInfo.count = item.quantity.value;
        productInfo.categoryId = Resource.msg('naver.category.id', 'payment', null);
        productInfo.categoryType = Resource.msg('naver.category.type', 'payment', null);
        productItems.push(productInfo);
    }
    return productItems;
}

server.get(
    'PaymentWindow',
    server.middleware.https,
    function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        var orderNo = req.querystring.orderNo;
        try {
            if (!empty(orderNo)) {
                var Site = require('dw/system/Site');
                var order = OrderMgr.getOrder(orderNo);
                var currentCustomer = req.currentCustomer.raw;
                if (currentCustomer.authenticated && currentCustomer.profile && currentCustomer.profile.custom.isNaverUser) {
                    Transaction.wrap(() => {
                        order.custom.isOrderWithNaverSSO = true;
                    });
                }

                var productItems;
                productItems = order.getProductLineItems();

                var naverPaySDKObject = {
                    merchantPayKey: orderNo,
                    productName: order.getProductLineItems()[0].getProductName() || '',
                    productCount: order.getProductQuantityTotal(),
                    totalPayAmount: order.getTotalGrossPrice().value,
                    taxScopeAmount: order.getTotalGrossPrice().value,
                    taxExScopeAmount: 0,
                    deliveryFee: order.getShippingTotalPrice().value,
                    returnUrl: URLUtils.https('NaverPay-Return', 'orderId', orderNo).toString(),
                    productItems: getProductLineItemsDetails(productItems)
                };

                // Check if ammount is 0, redirect customer to checkout with the error
                if (order.getTotalGrossPrice().value === 0) {
                    res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('message.error.zero.amount', 'error', null)).toString());
                } else {
                    res.render('checkout/triggerNaverPay', {
                        mode: Site.getCurrent().getCustomPreferenceValue('NaverPayMode'),
                        clientID: Site.getCurrent().getCustomPreferenceValue('NaverPayClientID'),
                        sdkObject: JSON.stringify(naverPaySDKObject)
                    });
                }
            } else {
                res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment'));
            }
        } catch (e) {
            Logger.error(e.message + e.stack);
            res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment'));
        }
        next();
    }
);

server.get(
    'Return',
    server.middleware.https,
    function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        var Order = require('dw/order/Order');
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var Site = require('dw/system/Site');
        var orderInfoLogger = require('dw/system/Logger').getLogger('orderInfo', 'orderInfo');
        var orderNo = req.httpParameterMap.orderId.stringValue;
        var resultCode = req.httpParameterMap.resultCode.stringValue;
        var order = OrderMgr.getOrder(orderNo);
        var error = false;
        var cancelPayment = {
            cancel: false
        };
        var errorMessage = Resource.msg('subheading.error.general', 'error', null);
        if (order) {
            try {
                if (resultCode && resultCode === 'Success') {
                    var paymentId = req.httpParameterMap.paymentId.stringValue;
                    Transaction.begin();
                    var UUIDUtils = require('dw/util/UUIDUtils');
                    var naverPayService = require('*/cartridge/scripts/service/naverPayService').paymentService;
                    // call Payment Approval API
                    naverPayService.call({
                        idempotencyKey: UUIDUtils.createUUID(),
                        url: naverPayHelpers.getPaymentApprovalUrl(),
                        paymentId: paymentId
                    });
                    var httpClient = naverPayService.getClient();
                    var responseObject = JSON.parse(httpClient.getText());
                    naverPayHelpers.updateOrderJSON(order, httpClient.getText());
                    if (httpClient.statusCode === 200 && 'Success'.equalsIgnoreCase(responseObject.code)) {
                        var paymentInstrument = order.getPaymentInstruments('NAVERPAY')[0];
                        order.custom.transactionID = responseObject.body.paymentId;
                        paymentInstrument.paymentTransaction.transactionID = responseObject.body.paymentId;
                        paymentInstrument.custom.naverPaymentMethod = responseObject.body.detail.primaryPayMeans;

                        var totalPayAmount = parseFloat(responseObject.body.detail.totalPayAmount);

                        if (order.status.value === Order.ORDER_STATUS_FAILED) {
                            // If order is already failed, cancel the payment and redirect customer to checkout with error message
                            naverPayHelpers.cancelPayment(order, totalPayAmount, totalPayAmount, '');
                            // log the order details for dataDog.
                            if (Site.getCurrent().getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
                                orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, false));
                            }
                            res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment', 'paymentError', errorMessage).toString());
                            return next();
                        }

                        var amountVerified = order.getTotalGrossPrice().value === totalPayAmount;
                        if (!amountVerified) {
                            Logger.error('NaverPay - Amount Mismatch ' + order.getTotalGrossPrice().value + ' - ' + totalPayAmount);
                            error = true;
                            cancelPayment.cancel = true;
                            cancelPayment.cancelAmount = totalPayAmount;
                        } else {
                            var placeOrderResult = COHelpers.placeOrder(order);
                            if (!placeOrderResult.error) {
                                order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                                order.setExportStatus(Order.EXPORT_STATUS_READY);
                            } else {
                                error = true;
                            }
                        }
                    } else {
                        var naverErrorMessage = responseObject.message;
                        naverErrorMessage = naverErrorMessage.substring(naverErrorMessage.indexOf('/') + 1);
                        // log the order details for dataDog.
                        if (Site.getCurrent().getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
                            orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, true, naverErrorMessage));
                        }
                        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment', 'paymentError', naverErrorMessage).toString());
                        return next();
                    }
                    Transaction.commit();
                } else if (resultCode && resultCode === 'TimeExpired') {
                    Transaction.begin();
                    OrderMgr.failOrder(order, true);
                    Transaction.commit();
                    var CartErrorMessage = req.httpParameterMap.resultMessage.stringValue || Resource.msg('subheading.error.general', 'error', null);
                    // log the order details for dataDog.
                    if (Site.getCurrent().getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
                        orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, true, CartErrorMessage));
                    }
                    res.redirect(URLUtils.url('Cart-Show', 'paymentError', CartErrorMessage).toString());
                    return next();
                } else {
                    var message = req.httpParameterMap.resultMessage.stringValue || '';
                    Transaction.wrap(() => {
                        order.custom.naverPay_failedOrderReason = resultCode + ' ' + message;
                    });
                    Logger.error('NaverPay - Result Code ' + resultCode);
                    // log the order details for dataDog.
                    if (Site.getCurrent().getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
                        orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, true, 'NaverPay - Result Code ' + resultCode));
                    }
                    res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment', 'paymentError', message).toString());
                    return next();
                }
            } catch (e) {
                Logger.error('NaverPay - Failed to place order ' + e.message + e.stack);
                error = true;
            }
        } else {
            Logger.error('NaverPay - Could not find order');
        }
        if (error) {
            if (order) {
                Transaction.wrap(() => {
                    OrderMgr.failOrder(order, true);
                    if (cancelPayment.cancel) {
                        var cancelReason = Resource.msg('reason.fraud.cancel', 'naverpay', null);
                        naverPayHelpers.cancelPayment(order, cancelPayment.cancelAmount, cancelPayment.cancelAmount, cancelReason);
                    }
                });
                // log the order details for dataDog.
                if (Site.getCurrent().getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
                    orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, false));
                }
            }
            res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment', 'paymentError', errorMessage).toString());
        } else {
            // log the order details for dataDog.
            if (Site.getCurrent().getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
                orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, false));
            }
            if (Site.getCurrent().getCustomPreferenceValue('isSetOrderConfirmationEmailStatusForJob')) {
                Transaction.wrap(() => {
                    order.custom.orderConfirmationEmailStatus = 'READY_FOR_PROCESSING'; // eslint-disable-line no-undef
                });
            } else {
                COHelpers.sendConfirmationEmail(order, order.customerLocaleID);
            }
            if (Site.getCurrent().getCustomPreferenceValue('naverPay_SFRA6_Compatibility')) {
                res.render('orderConfirmForm', {
                    orderID: orderNo,
                    orderToken: order.orderToken
                });
            } else {
                res.redirect(URLUtils.url('Order-Confirm', 'ID', orderNo, 'token', order.orderToken));
            }
        }
        return next();
    }
);

module.exports = server.exports();
