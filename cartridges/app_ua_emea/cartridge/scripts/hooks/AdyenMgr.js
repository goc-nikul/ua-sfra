'use strict';

var ReturnsUtils = require('app_ua_emea/cartridge/scripts/orders/ReturnsUtils');
var returnsUtils = new ReturnsUtils();
var Resource = require('dw/web/Resource');
var Logger = require('dw/system/Logger').getLogger('Adyen');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var Result = require('dw/svc/Result');

var AdyenMgr = (function () {
    var refund = function (referenceNo, amount, currency, returnReference, order, reason) {
        var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
        var MERCHANTACCOUNT = AdyenConfigs.getAdyenMerchantAccount(currency);
        var isFailed = false;

        // eslint-disable-next-line no-param-reassign
        order.custom.Adyen_refundAmount = amount;
        // eslint-disable-next-line no-param-reassign
        order.custom.Adyen_refundCurrency = currency;
        // eslint-disable-next-line no-param-reassign
        order.custom.Adyen_refundReason = reason;

        if (empty(MERCHANTACCOUNT)) {
            // eslint-disable-next-line new-cap
            returnsUtils.SetRefundsCountInfo(true, null, order);
            Logger.fatal('AdyenMgr.js: MERCHANTACCOUNT not set. Refund request');
            return 'Error: Merchant Account Not Set';
        }

        // eslint-disable-next-line radix
        var multiplier = parseInt(Resource.msg('amount.multiplier.' + currency.toLowerCase(), 'config', '100'));

        // Round DOWN amount value for currencies without decimals
        var fixedNumber = parseInt(Resource.msg('amount.fixednumber.' + order.getCurrencyCode().toLowerCase(), 'config', '2'), 10);
        if (fixedNumber === 0) {
            // eslint-disable-next-line no-param-reassign
            amount = Math.floor(amount);
        }

        var request = 'action=Payment.refund' +
		'&modificationRequest.originalReference=' + encodeURIComponent(referenceNo) +
		'&modificationRequest.reference=' + (!empty(returnReference) ? encodeURIComponent(returnReference) : encodeURIComponent(referenceNo)) +
		'&modificationRequest.merchantAccount=' + encodeURIComponent(MERCHANTACCOUNT) +
		'&modificationRequest.modificationAmount.value=' + encodeURIComponent(Number(amount * multiplier).toFixed()) +
		'&modificationRequest.modificationAmount.currency=' + encodeURIComponent(currency);
        Logger.debug('Adyen Refund Request: ' + request);

        var constants = require('*/cartridge/adyenConstants/constants');
        var service = AdyenHelper.getService(constants.SERVICE.ADYENREFUND);
        var serviceResult = null;
        var result = null;

        try {
            var serviceConfiguration = service.getConfiguration();
            var serviceCredential = !empty(serviceConfiguration) ? serviceConfiguration.getCredential() : null;
            var endpoint = !empty(serviceCredential) ? serviceCredential.getURL() : null;
            var user = !empty(serviceCredential) ? serviceCredential.getUser() : null;
            var pw = !empty(serviceCredential) ? serviceCredential.getPassword() : null;

            if (empty(endpoint) || empty(user) || empty(pw)) {
                // eslint-disable-next-line new-cap
                returnsUtils.SetRefundsCountInfo(true, null, order);
                Logger.fatal('AdyenMgr.js: Missing Adyen Refund configuration.');
                return 'Error: Missing configuration in Demandware';
            }
            serviceResult = service.call(request);
            result = service.getResponse();
        } catch (e) {
            // eslint-disable-next-line new-cap
            returnsUtils.SetRefundsCountInfo(true, null, order);
            Logger.error('AdyenMgr.js: Refund processing error: ' + e.message);
            return 'Error: ' + e.message;
        }

        if (serviceResult && serviceResult.status !== Result.OK) {
            isFailed = true;
            Logger.error('AdyenMgr.js: Refund request: ' + serviceResult.status + ':  ' + (serviceResult.errorMessage || serviceResult.msg));
        }

        if (result.statusCode === 200 && !isFailed) {
            // eslint-disable-next-line new-cap
            returnsUtils.SetRefundsCountInfo(false, null, order);
        } else {
            // eslint-disable-next-line new-cap
            returnsUtils.SetRefundsCountInfo(true, null, order);
        }

        return result;
    };

    var sendRefundNotifyMail = function (order, hpm, notificationType, subject) {
        var Site = require('dw/system/Site');
        var Status = require('dw/system/Status');
        var Mail = require('dw/net/Mail');
        var HashMap = require('dw/util/HashMap');
        var Template = require('dw/util/Template');

        if (empty(Site.getCurrent().getCustomPreferenceValue('AdyenNotifyEmail'))) {
            return new Status(Status.ERROR, '"adyenNofifyEmail" site preference was not set');
        }

        var template = new Template('mail/adyennotification.isml');
        var mail = new Mail();

        var args = new HashMap();
        args.put('Order', order);
        args.put('CurrentHttpParameterMap', hpm);
        args.put('NotificationType', notificationType);

        mail.setSubject(subject);

        var content = template.render(args);

        mail.addTo(Site.getCurrent().getCustomPreferenceValue('AdyenNotifyEmail'));
        mail.setFrom('system-notification@underarmour.com');
        mail.setContent(content);

        return mail.send();// returns either Status.ERROR or Status.OK,  mail might not be sent yet, when this method returns
    };

    // PUBLIC
    return {
        Refund: refund,
        SendRefundNotifyMail: sendRefundNotifyMail
    };
}());

module.exports = AdyenMgr;