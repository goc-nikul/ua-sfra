/* eslint-disable consistent-return */
'use strict';

var server = require('server');

var Resource = require('dw/web/Resource');
var Logger = require('dw/system/Logger');

var OrderHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/orderHelpers');

server.get(
    'CancelModal',
    function (req, res, next) {
        var orderId = req.querystring.orderId;

        var cancelReasons = OrderHelpers.getCancelReasons();

        res.render('account/order/orderCancelModal', {
            orderId: orderId,
            cancelReasons: cancelReasons
        });

        next();
    }
);

server.post(
    'Cancel',
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var Order = require('dw/order/Order');
        var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
        var note = req.form.note;
        var orderId = req.querystring.orderId;
        var orderUUID = req.form.orderUUID;
        var cancelReasons = req.form.cancelReasons;
        var orderCancellationEmail = req.form.trackOrderEmail || req.form.orderConfirmationEmail;
        var orderTracking = req.form.orderTracking === 'true';

        var success = false;
        var context = {};
        var templateContent = '';

        try {
            var order = OrderMgr.getOrder(orderId);
            if (orderTracking || !req.currentCustomer.raw.authenticated) {
                if (!order || orderCancellationEmail !== order.customerEmail || order.getUUID() !== orderUUID) {
                    context = {
                        failReason: 'ORDER_CANCELLATION_FAILED',
                        orderID: orderId
                    };
                    templateContent = renderTemplateHelper.getRenderedHtml(context, 'account/order/orderCancelFail.isml');
                    res.json({
                        html: templateContent,
                        success: success,
                        message: success ? Resource.msg('order.cancel.success', 'order', null) : Resource.msg('order.cancel.error', 'order', null)
                    });
                    return next();
                }
            } else if (req.currentCustomer.raw.authenticated && (!order || order.customer.ID !== req.currentCustomer.raw.ID || order.getUUID() !== orderUUID)) {
                context = {
                    failReason: 'ORDER_CANCELLATION_FAILED',
                    orderID: orderId
                };
                templateContent = renderTemplateHelper.getRenderedHtml(context, 'account/order/orderCancelFail.isml');
                res.json({
                    html: templateContent,
                    success: success,
                    message: success ? Resource.msg('order.cancel.success', 'order', null) : Resource.msg('order.cancel.error', 'order', null)
                });
                return next();
            }

            if (order.exportStatus.getValue() === Order.EXPORT_STATUS_EXPORTED) {
                var orderCancel = OrderHelpers.cancelOrder(order, cancelReasons, note);

                if (orderCancel.success) {
                    success = true;
                    var orderCancelConfirmTemplate = 'account/order/orderCancelConfirm.isml';
                    context = {
                        orderID: orderId
                    };
                    templateContent = renderTemplateHelper.getRenderedHtml(context, orderCancelConfirmTemplate);
                } else {
                    context = {
                        failReason: 'ORDER_CANCELLATION_FAILED',
                        orderID: orderId
                    };
                    templateContent = renderTemplateHelper.getRenderedHtml(context, 'account/order/orderCancelFail.isml');
                }
            } else {
                context = {
                    failReason: 'ORDER_NOT_EXPORTED'
                };
                templateContent = renderTemplateHelper.getRenderedHtml(context, 'account/order/orderCancelFail.isml');
            }
        } catch (error) {
            Logger.error(JSON.stringify(error));
        }

        res.json({
            html: templateContent,
            success: success,
            message: success ? Resource.msg('order.cancel.success', 'order', null) : Resource.msg('order.cancel.error', 'order', null)
        });

        next();
    }
);

module.exports = server.exports();
