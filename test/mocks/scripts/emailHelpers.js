'use strict';

/* eslint-disable */

class EmailHelper {
    constructor() {
        this.emailTypes = {
            registration: 1,
            passwordReset: 2,
            passwordChanged: 3,
            orderConfirmation: 4,
            accountLocked: 5,
            accountEdited: 6,
            possibleFraudNotification: 7,
            invoiceConfirmation: 8,
            eGiftCard: 9,
            returnLabel: 10,
            shipmentConfirmation: 11,
            refundConfirmation: 12,
            returnOrderCreated: 13
        };
    }

    send(options) {
        options.isCalled = true;
        return;
    }
}

module.exports = new EmailHelper();
