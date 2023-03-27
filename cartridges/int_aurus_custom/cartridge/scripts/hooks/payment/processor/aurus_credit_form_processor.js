'use strict';

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

/**
 * Checks the card type information and returns valid card type for payment validation
 * @param {Object} creditCardForm - The Credit Card field form object
 * @returns {string} Valid Card Type
 */
function getCardType(creditCardForm) {
    var Logger = require('dw/system/Logger');
    var cardType = '';
    try {
        var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
        var countryListJson = PreferencesUtil.getJsonValue('paymetricCardTypeMapping');
        cardType = (countryListJson && creditCardForm.cardType.value && (creditCardForm.cardType.value in countryListJson)) ? countryListJson[creditCardForm.cardType.value] : creditCardForm.cardType.value;
    } catch (e) {
        Logger.error(e.message);
    }
    return cardType;
}

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(req, paymentForm, viewFormData) {
    var array = require('*/cartridge/scripts/util/array');
    var Resource = require('dw/web/Resource');

    var viewData = viewFormData;
    var creditCardErrors = {};

    if (!req.form.storedPaymentUUID) {
        // verify credit card form data
        creditCardErrors = COHelpers.validateCreditCard(paymentForm);
    }

    if (Object.keys(creditCardErrors).length) {
        return {
            fieldErrors: creditCardErrors,
            error: true
        };
    }

    viewData.paymentMethod = {
        value: paymentForm.paymentMethod.value,
        htmlName: paymentForm.paymentMethod.value
    };

    viewData.paymentInformation = {
        paymentMethodID: {
            value: paymentForm.paymentMethod.value
        },
        // This comes back from the Aurus Pay iFrame
        cardType: {
            value: getCardType(paymentForm.creditCardFields),
            htmlName: paymentForm.creditCardFields.cardType.htmlName
        },
        // This also comes back from the Aurus Pay iFrame partially i.e. 411111XXXXXX1111
        cardNumber: {
            value: paymentForm.creditCardFields.cardNumber.value,
            htmlName: paymentForm.creditCardFields.cardNumber.htmlName
        },

        securityCode: {
            value: paymentForm.creditCardFields.securityCode.value,
            htmlName: paymentForm.creditCardFields.securityCode.htmlName
        },
        expirationMonth: {
            value: parseInt(
                paymentForm.creditCardFields.expirationDate.htmlValue.substring(0, 2),
                10
            ),
            htmlName: paymentForm.creditCardFields.expirationMonth.htmlName
        },
        expirationYear: {
            value: parseInt(paymentForm.creditCardFields.expirationDate.htmlValue.substring(2),
                10
            ),
            htmlName: paymentForm.creditCardFields.expirationYear.htmlName
        },
        oneTimeToken: {
            value: paymentForm.creditCardFields.ott.htmlValue,
            htmlName: 'one_time_token'
        }
    };

    if (req.form.storedPaymentUUID) {
        viewData.storedPaymentUUID = req.form.storedPaymentUUID;
    }

    viewData.saveCard = paymentForm.creditCardFields.saveCard.checked;

    // process payment information
    if (viewData.storedPaymentUUID
        && req.currentCustomer.raw.authenticated
        && req.currentCustomer.raw.registered
    ) {
        var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
        var paymentInstrument = array.find(paymentInstruments, function (item) {
            return viewData.storedPaymentUUID === item.UUID;
        });
        if (typeof paymentInstrument === 'undefined') {
            return {
                error: true,
                serverErrors: Resource.msg('error.payment.not.valid', 'checkout', null)
            };
        }

        viewData.paymentInformation.cardNumber.value = paymentInstrument.creditCardNumber;
        viewData.paymentInformation.cardType.value = paymentInstrument.creditCardType;
        viewData.paymentInformation.securityCode.value = req.form.securityCode;
        viewData.paymentInformation.expirationMonth.value = paymentInstrument.creditCardExpirationMonth;
        viewData.paymentInformation.expirationYear.value = paymentInstrument.creditCardExpirationYear;
        viewData.paymentInformation.creditCardToken = paymentInstrument.raw.creditCardToken;
    }

    return {
        error: false,
        viewData: viewData
    };
}

/**
 * Save the credit card information to login account if save card option is selected
 * @param {Object} req - The request object
 * @param {dw.order.Basket} basket - The current basket
 * @param {Object} billingData - payment information
 * @returns {bool} return true because payment information is saved after pre-auth request
 */
function savePaymentInformation() {
    // Handled after the preauth request for Aurus
    return true;
}

exports.processForm = processForm;
exports.savePaymentInformation = savePaymentInformation;
