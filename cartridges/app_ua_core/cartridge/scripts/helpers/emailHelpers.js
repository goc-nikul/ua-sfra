'use strict';

var EmailHelpersBase = require('app_storefront_base/cartridge/scripts/helpers/emailHelpers');

module.exports = EmailHelpersBase;
module.exports.emailTypes = (function () {
    var emailTypes = JSON.parse(JSON.stringify(EmailHelpersBase.emailTypes));
    emailTypes.possibleFraudNotification = 7;
    emailTypes.invoiceConfirmation = 8;
    emailTypes.eGiftCard = 9;
    emailTypes.returnLabel = 10;
    emailTypes.shipmentConfirmation = 11;
    emailTypes.refundConfirmation = 12;
    emailTypes.returnOrderCreated = 13;
    emailTypes.SAPACEmailValidation = 14;
    emailTypes.uniformInquiry = 15;
    emailTypes.franchiseInquiry = 16;
    emailTypes.sleepingNotification = 17;
    return emailTypes;
}());
