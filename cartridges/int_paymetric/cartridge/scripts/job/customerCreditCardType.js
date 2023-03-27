'use script';

var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');

/**
 * Return the new Payment Instrument with updated card type
 * @param {Object} paymentInstrument - Payment Instrument
 * @param {Object} wallet - profile wallet
 * @param {string} cardType - card type
 * @return {Object} - Returns new paymentInstrument
 */
function updateCardTypeForMaskedCreditCard(paymentInstrument, wallet, cardType) {
    var newPaymentInstrument = wallet.createPaymentInstrument(paymentInstrument.getPaymentMethod());
    Transaction.wrap(function () {
        newPaymentInstrument.setCreditCardHolder(paymentInstrument.getCreditCardHolder());
        newPaymentInstrument.setCreditCardNumber(paymentInstrument.getCreditCardNumber());
        newPaymentInstrument.setCreditCardType(cardType);
        newPaymentInstrument.setCreditCardExpirationMonth(paymentInstrument.getCreditCardExpirationMonth());
        newPaymentInstrument.setCreditCardExpirationYear(paymentInstrument.getCreditCardExpirationYear());
        newPaymentInstrument.setCreditCardToken(paymentInstrument.getCreditCardToken());

        newPaymentInstrument.custom.creditCardBinRange = paymentInstrument && 'creditCardBinRange' in paymentInstrument.custom ? paymentInstrument.custom.creditCardBinRange : null;
        newPaymentInstrument.custom.internalToken = paymentInstrument && 'internalToken' in paymentInstrument.custom ? paymentInstrument.custom.internalToken : null;

        wallet.removePaymentInstrument(paymentInstrument);
    });
    return newPaymentInstrument;
}

/**
 * Update Credit Card Type for specific credit cards based on condition
 * @param {Object} creditCardPaymentInstrument - Payment Instrument
 * @param {Object} wallet - profile wallet
 * @param {string} customerID - customer ID
 */
function updateCardType(creditCardPaymentInstrument, wallet, customerID) {
    // Valid card types
    let validCardTypes = ['VISA', 'MAST', 'DISC', 'AMEX'];
    var paymentInstrument = creditCardPaymentInstrument;
    let cardType = paymentInstrument.getCreditCardType();
    let cardTypeUpperCase = !empty(cardType) ? cardType.toUpperCase() : '';

    try {
        // Handle Master Cards - 'MC' cards, if any, by setting to 'MAST'
        if (cardTypeUpperCase === 'MC') {
            Transaction.wrap(function () {
                if (paymentInstrument.isPermanentlyMasked) {
                    paymentInstrument = updateCardTypeForMaskedCreditCard(paymentInstrument, wallet, 'MAST');
                } else {
                    paymentInstrument.setCreditCardType('MAST');
                }
            });
            return;
        }

        // Handle cards that have valid card types except for letter case
        if (validCardTypes.indexOf(cardTypeUpperCase) > -1 && cardType !== cardTypeUpperCase) {
            Transaction.wrap(function () {
                if (paymentInstrument.isPermanentlyMasked) {
                    paymentInstrument = updateCardTypeForMaskedCreditCard(paymentInstrument, wallet, cardTypeUpperCase);
                } else {
                    paymentInstrument.setCreditCardType(cardTypeUpperCase);
                }
            });
            return;
        } else if (validCardTypes.indexOf(cardTypeUpperCase) === -1) {
            Logger.warn('Card Type [{0}] not to be found match with any from list [VISA, MAST, DISC, AMEX] for customer with ID {1}', paymentInstrument.getCreditCardType(), customerID);
        }
    } catch (e) {
        // Logging Exception while setting card type.
        Logger.error('Exception occurred while updating Credit Card of type : {0}. {1}', cardType, e.message);
    }
    return;
}

/**
 * Job to update Credit Card Type.
 */
function update() {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var collections = require('*/cartridge/scripts/util/collections');
    var profiles = CustomerMgr.searchProfiles('', null);

    while (profiles.hasNext()) {
        var profile = profiles.next();
        var wallet = profile.getWallet();
        var paymentInstruments = profile.getWallet().getPaymentInstruments('CREDIT_CARD');

        collections.forEach(paymentInstruments, function (paymentInstrument) { // eslint-disable-line no-loop-func
            updateCardType(paymentInstrument, wallet, profile.getCustomer().getID());
        });
    }
}


module.exports.update = update;
