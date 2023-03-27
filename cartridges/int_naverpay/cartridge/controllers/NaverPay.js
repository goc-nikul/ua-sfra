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
                    merchantUserKey: orderNo,
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
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var orderNo = req.httpParameterMap.orderId.stringValue;
        var resultCode = req.httpParameterMap.resultCode.stringValue;
        var order = OrderMgr.getOrder(orderNo);
        var error = false;
        if (order) {
            try {
                if (resultCode && resultCode === 'Success') {
                    var paymentId = req.httpParameterMap.paymentId.stringValue;
                    Transaction.wrap(() => {
                        var UUIDUtils = require('dw/util/UUIDUtils');
                        var naverPayService = require('*/cartridge/scripts/service/naverPayService').paymentService;
                        // call Payment Approval API
                        naverPayService.call({
                            idempotencyKey: UUIDUtils.createUUID(),
                            url: naverPayHelpers.getPaymentApprovalUrl(),
                            paymentId: paymentId
                        });
                        var httpClient = naverPayService.getClient();
                        if (httpClient.statusCode === 200) {
                            var responseObject = JSON.parse(httpClient.getText());
                            naverPayHelpers.updateOrderJSON(order, httpClient.getText());

                            var paymentInstrument = order.getPaymentInstruments('NAVERPAY')[0];
                            order.custom.transactionID = responseObject.body.paymentId;
                            paymentInstrument.paymentTransaction.transactionID = responseObject.body.paymentId;
                            paymentInstrument.custom.naverPaymentMethod = responseObject.body.detail.primaryPayMeans;

                            var placeOrderResult = COHelpers.placeOrder(order);
                            if (!placeOrderResult.error) {
                                var Order = require('dw/order/Order');
                                order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                                order.setExportStatus(Order.EXPORT_STATUS_READY);
                            } else {
                                error = true;
                            }
                        } else {
                            Logger.error('NaverPay - Failed to place order ' + httpClient.statusCode + httpClient.errorText);
                            error = true;
                        }
                    });
                } else {
                    var message = req.httpParameterMap.resultMessage.stringValue || '';
                    Transaction.wrap(() => {
                        order.custom.naverPay_failedOrderReason = resultCode + ' ' + message;
                    });
                    Logger.error('NaverPay - Result Code ' + resultCode);
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
                });
            }
            var errorMessage = Resource.msg('subheading.error.general', 'error', null);
            res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment', 'paymentError', errorMessage).toString());
        } else {
            var Site = require('dw/system/Site');
            if (Site.getCurrent().getCustomPreferenceValue('isSetOrderConfirmationEmailStatusForJob')) {
                Transaction.wrap(() => {
                    order.custom.orderConfirmationEmailStatus = 'READY_FOR_PROCESSING'; // eslint-disable-line no-undef
                });
            } else {
                COHelpers.sendConfirmationEmail(order, order.customerLocaleID);
            }
            res.redirect(URLUtils.url('Order-Confirm', 'ID', orderNo, 'token', order.orderToken));
        }
        return next();
    }
);

module.exports = server.exports();
