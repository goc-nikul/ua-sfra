'use strict';

var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Transaction = require('dw/system/Transaction');





var run = function () {
    var getPO = require('~/cartridge/scripts/jobsteps/GetPORequest');
var proPO = require('~/cartridge/scripts/jobsteps/ProcessPO');
var createMissingOrder = require('~/cartridge/scripts/jobsteps/CreateMissingOrder');
var acknowledgePO = require('~/cartridge/scripts/jobsteps/AcknowledgePO');


    var ackOrderList = new dw.util.ArrayList();
    var mismatchOrderList = new dw.util.ArrayList();
    var errorMailContent = new dw.util.ArrayList();
    var poRequest = getPO.getPoRequest();
    for (var i = 0; i < poRequest.length; i++) {
        var order = poRequest[i];
        var orders = OrderMgr.searchOrders(
            '(custom.bfxMerchantOrderRef != NULL AND custom.bfxMerchantOrderRef={0}) OR (custom.bfxOrderId != NULL AND custom.bfxOrderId={1})',
            'creationDate desc',
            order.orderId.merchantOrderRef,
            order.orderId.e4XOrderId
        );
        var siteOrder;
        if (!empty(orders) && orders.hasNext()) {
            siteOrder = orders.next();
        } else {
            var createOrderArgs = {
                poOrder: order,
                errorMailContent: errorMailContent
            };
            createMissingOrder.execute(createOrderArgs);
            var missingOrders = OrderMgr.queryOrders(
                    'custom.bfxOrderId={0}',
                    'creationDate desc',
                    order.orderId.e4XOrderId
                );
            if (!empty(missingOrders) && missingOrders.hasNext()) {
                siteOrder = missingOrders.next();
            } 
        }
        if (!empty(siteOrder)) {
            Transaction.wrap(function () {
                siteOrder.custom.bfxOrderId = order.orderId.e4XOrderId;
            });
            var ordersObj = {
                siteOrder: siteOrder,
                poOrder: order,
                ackOrderList: ackOrderList,
                mismatchOrderList: mismatchOrderList,
                errorMailContent: errorMailContent
            }
            proPO.execute(ordersObj);
        }
    }
    //run ackPO
    var ackArgs = {
        ackOrderList: ackOrderList,
        errorMailContent: errorMailContent
    }
    acknowledgePO.execute(ackArgs);
    if (errorMailContent.size() > 0) {
        var mailContent = errorMailContent;
        var mailSubject = dw.web.Resource.msg('resource.errorprocessingpo.subject','borderfree',null);
        var mailTo = dw.system.Site.getCurrent().getCustomPreferenceValue('bfxErrorEmail').join(";");
        var mailFrom = dw.system.Site.getCurrent().getCustomPreferenceValue('customerServiceEmail');
        var mailTemplate = "mail/borderfree/poprocessingerror";
        var context = {
            MailSubject: mailSubject,
            MailContent: mailContent
        }
        var Mail = require('dw/net/Mail');
        var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    
        var email = new Mail();
        email.addTo(mailTo);
        email.setSubject(mailSubject);
        email.setFrom(mailFrom);
        email.setContent(renderTemplateHelper.getRenderedHtml(context, mailTemplate), 'text/html', 'UTF-8');
        email.send();
    }
};

exports.run = run;
