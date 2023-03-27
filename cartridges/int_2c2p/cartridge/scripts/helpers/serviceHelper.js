'use strict';

var phelper = require('*/cartridge/scripts/helpers/2c2pHelper');

/**
 * Validate transaction is sucess or not
 * @param {string} respCode response status code
 * @returns {boolean} returns status of transaction success
 */
function isTransactionSuccess(respCode) {
    return require('dw/system/Transaction').wrap(() => {
        var twoCp2Pref = require('*/cartridge/scripts/config/2c2Prefs');
        // Exception handling already done at calling method so not handling here
        var successRespCode = (twoCp2Pref.configuration2C2P && JSON.parse(twoCp2Pref.configuration2C2P).returnresponsecodebe)
            ? JSON.parse(twoCp2Pref.configuration2C2P).returnresponsecodebe
            : ['0000'];
        return successRespCode.indexOf(respCode) !== -1;
    });
}

/**
 * Get storefront redirect url
 * @param {Object} order DW order object
 * @returns {string|null} returns return URL
 */
function get2C2pRedirectUrl(order) {
    var RequestData = require('*/cartridge/models/request/paymentToken');
    var paymentTokenResponse = require('*/cartridge/scripts/service/paymentToken')({
        payload: phelper.encrypt(JSON.stringify(new RequestData(order)))
    });
    // Exception handling already done at calling method so not handling here
    if (!paymentTokenResponse.ok || !paymentTokenResponse.object) throw new Error('Error service response');
    var decryt = phelper.decrypt(JSON.parse(paymentTokenResponse.object).payload);
    // Exception handling already done at calling method so not handling here
    if (!decryt) throw new Error('Invalid response Signature');
    var responseObj = JSON.parse(decryt);
    return responseObj.respCode === '0000' ? responseObj.webPaymentUrl : null;
}

/**
 * Get transaction inquiry object
 * @param {string} orderNo DW order number
 * @returns {Object} returns TransactionInquiry object
 */
function getTransactionInquiry(orderNo) {
    var paymentInquiryResponse = require('*/cartridge/scripts/service/paymentInquiry')({
        payload: phelper.encrypt(JSON.stringify({
            merchantID: require('*/cartridge/scripts/config/2c2Prefs').merchantID,
            invoiceNo: orderNo
        }))
    });
    if (!paymentInquiryResponse || !paymentInquiryResponse.ok || !paymentInquiryResponse.object) return null;

    // Exception handling already done at calling method so not handling here
    var payloadResponse = JSON.parse(paymentInquiryResponse.object);
    var response = phelper.decrypt(payloadResponse.payload);
    // Exception handling already done at calling method so not handling here
    if (!response) throw new Error('Invalid Signature from response');
    // Exception handling already done at calling method so not handling here
    return JSON.parse(response);
}

/**
 * Initiate refund process
 * @param {string} payload payload data
 * @returns {string} base64 decoded response
 */
function refund(payload) {
    var paymentRefundResponse = require('*/cartridge/scripts/service/paymentRefund')(payload);
    if (!paymentRefundResponse.ok || !paymentRefundResponse.object) return null;
    return require('dw/util/StringUtils').decodeBase64(paymentRefundResponse.object);
}

module.exports = {
    get2C2pRedirectUrl: get2C2pRedirectUrl,
    getTransactionInquiry: getTransactionInquiry,
    isTransactionSuccess: isTransactionSuccess,
    refund: refund
};
