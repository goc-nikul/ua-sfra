'use strict';

var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');

exports.execute = function (params) {
    try {
        var notificationCustomObjectsItr = CustomObjectMgr.getAllCustomObjects('membersonVoucherCancellation');
        var notificationObjects = [];
        while (notificationCustomObjectsItr.hasNext()) {
            var notificationCustomObject = notificationCustomObjectsItr.next();

            var order = OrderMgr.getOrder(notificationCustomObject.custom.membersonOrderNumber);

            notificationObjects.push({
                orderNo: notificationCustomObject.custom.membersonOrderNumber,
                customerNo: order.custom['Loyalty-ID'],
                coupon: notificationCustomObject.custom.voucherCode,
                voucherNo: order.custom['Loyalty-VoucherName'].split('=')[1],
                cancelStatus: notificationCustomObject.custom.voucherCancellationStatus
            });

            Transaction.begin();
            CustomObjectMgr.remove(notificationCustomObject);
            Transaction.commit();
        }
        if (notificationObjects.length > 0) {
            var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
            var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
            var dateString = StringUtils.formatCalendar(new Calendar(), 'dd-MM-yy hh:mm');
            var recipientEmails = PreferencesUtil.getValue('voucherCancellationNotificationEmails').join(',');
            var emailObj = {
                to: recipientEmails,
                subject: Resource.msgf('memberson.notificationemail.subject', 'membersonGlobal', null, dateString),
                from: params.senderEmail
            };
            emailHelpers.sendEmail(emailObj, 'mail/cancellationNotificationEmail', { notificationObjects: notificationObjects });
        }
    } catch (e) {
        Logger.error('Memberson - Could not send notification ' + e.message + e.stack);
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
};
