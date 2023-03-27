'use strict';

var serverForms = require('server').forms;
/**
 * Checks the card type information and returns valid card type for payment validation
 * @param {Object} paymetricForm - The PayMetric form object
 * @returns {string} Valid Card Type
 */
function getCardType(paymetricForm) {
    var Logger = require('dw/system/Logger');
    var cardType = '';
    try {
        var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
        var countryListJson = PreferencesUtil.getJsonValue('paymetricCardTypeMapping');
        cardType = (countryListJson && paymetricForm.cardType.value && (paymetricForm.cardType.value in countryListJson)) ? countryListJson[paymetricForm.cardType.value] : paymetricForm.cardType.value;
    } catch (e) {
        Logger.getLogger('PayMetric').error(e.message);
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
    var viewData = viewFormData;
    var paymetricForm = serverForms.getForm('paymetric');
    var cardType = getCardType(paymetricForm);
    viewData.paymentMethod = {
        value: paymentForm.paymentMethod.value,
        htmlName: paymentForm.paymentMethod.value
    };

    viewData.paymentInformation = {
        paymentMethodID: {
            value: paymentForm.paymentMethod.value
        },
        payload: {
            value: paymetricForm.payload.value
        },
        cardType: {
            value: cardType
        },
        lastFour: {
            value: paymetricForm.lastFour.value
        },
        ccBinRange: {
            value: paymetricForm.ccBinRange.value
        },
        expiresMonth: {
            value: paymetricForm.expiresMonth.value
        },
        expiresYear: {
            value: paymetricForm.expiresYear.value
        }
    };

    return {
        error: false,
        viewData: viewData
    };
}

/**
 * Save the credit card information to login account if save card option is selected
 * @returns {boolean} Status
 */
function savePaymentInformation() {
    // Already handled in paymetric.js processor script after service response
    return true;
}

exports.processForm = processForm;
exports.savePaymentInformation = savePaymentInformation;
exports.getCardType = getCardType;
