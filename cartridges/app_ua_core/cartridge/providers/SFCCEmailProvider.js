'use strict';

/* API includes */
var Locale = require('dw/util/Locale');

/* Script modules */
var AbstractEmailProvider = require('./AbstractEmailProvider');
var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');

/* eslint-disable no-undef */

var EmailProvider = AbstractEmailProvider.extend({
    send: function () {
        var emailType = this.options.emailData.type;
        emailHelpers.send(this.options.emailData, this.getTemplateByEmailType(emailType), this.options.templateData);
    },
    getTemplateByEmailType: function (emailType) {
        var emailTemplate;
        switch (emailType) {
            case emailHelpers.emailTypes.passwordChanged:
                emailTemplate = 'account/password/passwordChangedEmail';
                break;
            case emailHelpers.emailTypes.orderConfirmation:
                emailTemplate = 'checkout/confirmation/confirmationEmail';
                var OrderModel = require('*/cartridge/models/order');
                var currentLocale = Locale.getLocale(request.getLocale());
                this.options.templateData.order = new OrderModel(this.options.templateData.order, {
                    countryCode: currentLocale.country,
                    containerView: 'order'
                });
                break;
            case emailHelpers.emailTypes.registration:
                emailTemplate = 'checkout/confirmation/accountRegisteredEmail';
                break;
            case emailHelpers.emailTypes.passwordReset:
                emailTemplate = 'account/password/passwordResetEmail';
                break;
            case emailHelpers.emailTypes.accountEdited:
                emailTemplate = 'account/components/accountEditedEmail';
                break;
            case emailHelpers.emailTypes.possibleFraudNotification:
                emailTemplate = 'account/components/orderFraudNotification';
                break;
            default:
                emailTemplate = 'account/password/passwordChangedEmail';
                break;
        }

        return emailTemplate;
    }
});

module.exports = EmailProvider;
