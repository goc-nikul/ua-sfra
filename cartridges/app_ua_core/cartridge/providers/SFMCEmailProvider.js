'use strict';

/* API includes */
var HookMgr = require('dw/system/HookMgr');

/* Script modules */
var AbstractEmailProvider = require('./AbstractEmailProvider');
var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');

/* istanbul ignore next */
/**
 * @constructor
 * @classdesc Promise
 */
function SynchronousPromiseStub() { // Testing response object should be functional testing if applicable
    var response;
    var isPending = true;

    this.resolve = function (data) {
        response = data;
        isPending = false;
    };
    this.reject = function () {};
    this.isPending = function () {
        return isPending;
    };

    this.getResponse = function () {
        return response;
    };
}

var EmailProvider = AbstractEmailProvider.extend({
    send: function () {
        var requestData = this.updateRequestData(this.options);
        var hookID = requestData.hookID;
        var responseData;

        // istanbul ignore next
        if (hookID && HookMgr.hasHook(hookID)) { // Can't test undefined hooks
            responseData = HookMgr.callHook(
                hookID,
                hookID.slice(hookID.lastIndexOf('.') + 1),
                new SynchronousPromiseStub(),
                requestData.data
            );
        }
        return responseData;
    },

    updateRequestData: function (options) {
        var requestData = {
            hookID: '',
            data: {
                fromEmail: options.emailData.from,
                toEmail: options.emailData.to,
                params: {
                    orderCancelledType: options.templateData && options.templateData.orderCancelledType ? options.templateData.orderCancelledType : 'fraud'
                }
            }
        };

        switch (options.emailData.type) {
            case emailHelpers.emailTypes.registration:
                requestData.hookID = 'app.communication.account.created';
                break;
            case emailHelpers.emailTypes.passwordChanged:
                requestData.hookID = 'app.communication.account.passwordChanged';
                if ('templateData' in options && !empty(options.templateData)) {
                    requestData.data.params.Customer = options.templateData.resettingCustomer;
                }
                break;
            case emailHelpers.emailTypes.passwordReset:
                requestData.hookID = 'app.communication.account.passwordReset';
                break;
            case emailHelpers.emailTypes.possibleFraudNotification:
                requestData.hookID = 'app.communication.order.fraud';
                requestData.data.params.Order = options.templateData.order;
                break;
            case emailHelpers.emailTypes.orderConfirmation:
                requestData.hookID = 'app.communication.order.confirmation';
                requestData.data.params.Order = options.templateData.order;
                break;
            case emailHelpers.emailTypes.accountEdited:
                requestData.hookID = 'app.communication.account.updated';
                break;
                // istanbul ignore next
            case emailHelpers.emailTypes.shippingConfirmation: // This is not a defined email type
                requestData.hookID = 'app.communication.order.shippingConfirmation';
                break;
            case emailHelpers.emailTypes.invoiceConfirmation:
                requestData.hookID = 'app.communication.order.invoiceConfirmation';
                break;
            case emailHelpers.emailTypes.eGiftCard:
                requestData.hookID = 'app.communication.giftCertificate.sendCertificate';
                requestData.data.params.Order = options.templateData.order;
                requestData.data.params.eGiftCardsDetails = options.eGiftCardsDetails;
                break;
            case emailHelpers.emailTypes.returnLabel:
                requestData.hookID = 'app.communication.order.returnLabel';
                requestData.data.params.returnLabelData = options.templateData;
                break;
            case emailHelpers.emailTypes.shipmentConfirmation:
                requestData.hookID = 'app.communication.oms.shipment';
                requestData.data.params.Order = options.params.Order;
                requestData.data.params.trackingLink = options.params.trackingLink;
                requestData.data.params.trackingCode = options.params.trackingCode;
                break;
            case emailHelpers.emailTypes.refundConfirmation:
                requestData.hookID = 'app.communication.oms.orderRefund';
                requestData.data.params.Order = options.params.Order;
                requestData.data.params.tax = options.params.tax;
                requestData.data.params.subTotal = options.params.subTotal;
                break;
            case emailHelpers.emailTypes.returnOrderCreated:
                requestData.hookID = 'app.communication.oms.returnOrderCreated';
                requestData.data.params.Order = options.params.Order;
                requestData.data.params.returnInfoLink = options.params.returnInfoLink;
                requestData.data.params.returnCase = options.params.returnCase;
                requestData.data.params.trackingNumber = options.params.trackingNumber;
                requestData.data.params.trackingLink = options.params.trackingLink;
                requestData.data.params.returnShipmentProvider = options.params.returnShipmentProvider;
                break;
            case emailHelpers.emailTypes.SAPACEmailValidation:
                requestData.hookID = 'app.communication.account.SAPACEmailValidation';
                requestData.data.params.url_link = options.templateData.url_link;
                requestData.data.params.email_address = options.templateData.email_address;
                requestData.data.params.firstname = options.templateData.firstname;
                requestData.data.params.lastname = options.templateData.lastname;
                requestData.data.params.emailtype = options.templateData.emailtype;
                requestData.data.params.email_source = options.templateData.email_source;
                requestData.data.params.recip_type = options.templateData.recip_type;
                requestData.data.params.signup_date = options.templateData.signup_date;
                requestData.data.params.creativeversion = options.templateData.creativeversion;
                requestData.data.params.segmentcode = options.templateData.segmentcode;

                break;
                // istanbul ignore next
            case emailHelpers.emailTypes.uniformInquiry:
                requestData.hookID = 'app.communication.customerService.uniformInquiry';
                requestData.data.params.TeamName = options.templateData.TeamName;
                requestData.data.params.ApplicantName = options.templateData.ApplicantName;
                requestData.data.params.ApplicantEmail = options.templateData.ApplicantEmail;
                requestData.data.params.ApplicantMobile = options.templateData.ApplicantMobile;
                requestData.data.params.Quantity = options.templateData.Quantity;
                requestData.data.params.Region = options.templateData.Region;

                break;
            case emailHelpers.emailTypes.franchiseInquiry:
                requestData.hookID = 'app.communication.customerService.franchiseInquiry';
                Object.keys(options.templateData).forEach(key => {
                    requestData.data.params[key] = options.templateData[key];
                });

                break;
            case emailHelpers.emailTypes.sleepingNotification:
                requestData.hookID = 'app.communication.account.sleepingNotification';
                requestData.data.params.FirstName = options.templateData.FirstName;
                requestData.data.params.SleepingDate = options.templateData.SleepingDate;
                requestData.data.params.RedirectButtonLink = options.templateData.RedirectButtonLink;
                requestData.data.params.Date = options.templateData.Date;

                break;


            default:
                break;
        }

        return requestData;
    }
});

module.exports = EmailProvider;
