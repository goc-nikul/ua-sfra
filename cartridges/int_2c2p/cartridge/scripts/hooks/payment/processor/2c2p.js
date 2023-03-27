'use strict';

var logger = require('*/cartridge/scripts/logs/2c2p');

/**
 * Do Handle call
 * @param {Object} currentBasket DW basket object
 * @param {Object} paymentInformation payment information
 * @param {string} paymentMethodID payment method id
 * @param {Object} req request object
 * @returns {Object} status of handle
 */
function Handle(currentBasket, paymentInformation, paymentMethodID) {
    var fieldErrors = {};
    var serverErrors = [];
    var error = false;
    try {
        require('dw/system/Transaction').wrap(() => {
            var paymentInstruments = currentBasket.getPaymentInstruments();
            var collections = require('*/cartridge/scripts/util/collections');
            collections.forEach(paymentInstruments, (item) => {
                currentBasket.removePaymentInstrument(item);
            });
            var paymentInstrument = currentBasket.createPaymentInstrument(paymentMethodID, currentBasket.totalGrossPrice);
            if (!paymentInstrument) throw new Error('Not able to create payment Instrument');
        });
    } catch (e) {
        logger.writelog(logger.LOG_TYPE.ERROR, e.message + '\n' + e.stack);
        serverErrors.push(e.mesage);
        error = true;
    }
    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
}

/**
 * DO Auth call
 * @param {Object} order DW order
 * @returns {Object} returns AUTH call status
 */
function Authorize(order) {
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;
    try {
        var service2c2pHelper = require('*/cartridge/scripts/helpers/serviceHelper');
        var redirectURL = service2c2pHelper.get2C2pRedirectUrl(order);
        if (!redirectURL) throw new Error('Invalid payment request');
        return {
            error: false,
            twoC2pRedirect: redirectURL
        };
    } catch (e) {
        logger.writelog(logger.LOG_TYPE.ERROR, e.message + '\n' + e.stack);
        error = true;
        serverErrors.push(
            require('dw/web/Resource').msg('error.technical', 'checkout', null)
        );
    }
    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
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

    viewData.paymentMethod = {
        value: paymentForm.paymentMethod.value,
        htmlName: paymentForm.paymentMethod.value
    };

    return {
        error: false,
        viewData: viewData
    };
}

module.exports = {
    Handle: Handle,
    Authorize: Authorize,
    processForm: processForm
};
