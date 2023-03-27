'use strict';

var Encoding = require('dw/crypto/Encoding');
var StringUtils = require('dw/util/StringUtils');
const PAYMENT_2C2P_METHOD_ID = '2c2';
var logger = require('*/cartridge/scripts/logs/2c2p');

/**
 * Returns header json string
 * @returns {string} returns stringified header
 */
function getHeader() {
    return JSON.stringify({
        alg: 'HS256',
        typ: 'JWT'
    });
}

/**
 * Encode to base64 format
 * @param {string} data input data
 * @returns {string} converts to base64
 */
function base64UrlEncode(data) {
    return StringUtils.encodeBase64(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/m, '');// eslint-disable-line
}

/**
 * Generate JWT token
 * @param {string} payload JWT paylaod
 * @param {string} header JWT header
 * @returns {string} returns JWT token
 */
function getEncryptWithHeader(payload, header) {
    var Mac = require('dw/crypto/Mac');
    var mac = new Mac(Mac.HMAC_SHA_256);
    var encodedPayload = base64UrlEncode(header) + '.' + base64UrlEncode(payload);
    var sigature = Encoding.toBase64(mac.digest(encodedPayload, require('*/cartridge/scripts/config/2c2Prefs').secret)).replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/m, '');// eslint-disable-line
    return encodedPayload + '.' + sigature;
}

/**
 * Encrypt payload
 * @param {Object} payload encrypt payload
 * @returns {string} encrypted payload
 */
function encrypt(payload) {
    return getEncryptWithHeader(payload, getHeader());
}

/**
 * Validates signature
 * @param {string} data signature
 * @returns {boolean} validates whether signature is valid or not
 */
function isValidSignature(data) {
    var fields = data.split('.');
    return data === getEncryptWithHeader(StringUtils.decodeBase64(fields[1]), StringUtils.decodeBase64(fields[0]));
}

/**
 * Decrypt JWT token
 * @param {Object} data incomming data
 * @returns {string} decrypt JWT token
 */
function decrypt(data) {
    if (!data || data.split('.').length !== 3 || !isValidSignature(data)) return null;
    return StringUtils.decodeBase64(data.split('.')[1]);
}

/**
 * Converts to unformate to format date
 * @param {string} responseDate unformatted date
 * @returns {string} returns formatted date
 */
function convertDateFormat(responseDate) {
    var Calendar = require('dw/util/Calendar');
    var resCalendar = new Calendar();
    resCalendar.parseByFormat(responseDate, 'yyyyMMddHHmmss');
    return StringUtils.formatCalendar(resCalendar, 'YYYY-MM-dd HH:mm:SS');
}

/**
 * Update order details and returns its status
 * @param {Object} responseObj service response object
 * @returns {boolean} status of order details
 */
function updateOrderDetails(responseObj) {
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(responseObj.invoiceNo);
    if (!order) {
        logger.writelog(logger.LOG_TYPE.DEBUG, 'Order Number: ' + responseObj.invoiceNo + ' Not found in DW');
        return false;
    }

    var Order = require('dw/order/Order');
    if (order.status.value === Order.ORDER_STATUS_NEW || order.status.value === Order.ORDER_STATUS_OPEN) {
        logger.writelog(logger.LOG_TYPE.DEBUG, 'Order Number: ' + responseObj.invoiceNo + ' Already placed');
        return false;
    }

    return require('dw/system/Transaction').wrap(() => {
        var isTransactionSuccess = require('*/cartridge/scripts/helpers/serviceHelper').isTransactionSuccess(responseObj.respCode);
        if (!isTransactionSuccess) {
            try {
                if (Object.prototype.hasOwnProperty.call(order.custom, 'Loyalty-VoucherName') && !empty(order.custom['Loyalty-VoucherName'])) {
                    var loyaltyVoucherName = order.custom['Loyalty-VoucherName'].split('=')[1];
                    var HookMgr = require('dw/system/HookMgr');
                    if (HookMgr.hasHook('app.memberson.UnUtilizeMemberVoucher')) {
                        HookMgr.callHook('app.memberson.UnUtilizeMemberVoucher', 'unUtilizeMemberVoucher', order, loyaltyVoucherName);
                    }
                }
            } catch (e) {
                var Logger = require('dw/system/Logger');
                Logger.error('Unable to unutlize Loyalty voucher ' + e.message + e.stack);
            }
            OrderMgr.failOrder(order, true);
            return true;
        }
        order.custom.PaymentCode2c2 = responseObj.approvalCode;
        order.custom.PaymentAmount2c2 = responseObj.amount;
        order.custom.PaymentBackendInvoice2c2 = responseObj.referenceNo;
        order.custom.PaymentTransactionTime2c2 = convertDateFormat(responseObj.transactionDateTime);
        var orderMapping;
        try {
            var config2c2p = require('*/cartridge/scripts/config/2c2Prefs').configuration2C2P;
            orderMapping = JSON.parse(config2c2p).ordermapping || require('*/cartridge/scripts/config/ordermapping');
        } catch (e) {
            logger.writelog(logger.LOG_TYPE.ERROR, e.message + '\n' + e.stack);
        }
        if (orderMapping) {
            var channelCode = orderMapping[responseObj.channelCode] || orderMapping.default;
            order.custom.PaymentChannel2c2 = channelCode.paymentChannel;
            order.custom.PaymentType2c2 = channelCode.paymentType;
        }
        // Exception handle done in calling method
        var paymentInstrument = order.getPaymentInstruments(PAYMENT_2C2P_METHOD_ID)[0];
        var paymentProcessor = require('dw/order/PaymentMgr').getPaymentMethod(PAYMENT_2C2P_METHOD_ID).getPaymentProcessor();
        paymentInstrument.paymentTransaction.setTransactionID(responseObj.tranRef);
        paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
        // Place order and set export export status to ready to export
        if (order.status.value === require('dw/order/Order').ORDER_STATUS_CREATED) require('*/cartridge/scripts/checkout/checkoutHelpers').placeOrder(order);

        if (order.exportStatus.value === Order.EXPORT_STATUS_EXPORTED) {
            logger.writelog(logger.LOG_TYPE.DEBUG, 'Order Number: ' + responseObj.invoiceNo + ' Already Exported');
            return false;
        }

        order.setExportStatus(require('dw/order/Order').EXPORT_STATUS_READY);
        order.setPaymentStatus(require('dw/order/Order').PAYMENT_STATUS_PAID);
        order.custom.transactionCheck2C2P = false;
        // Update Order to invoke order confimation mail
        if (require('dw/system/Site').getCurrent().getCustomPreferenceValue('isSetOrderConfirmationEmailStatusForJob')) {
            if (!('orderConfirmationEmailStatus' in order.custom) ||
                ('orderConfirmationEmailStatus' in order.custom &&
                    order.custom.orderConfirmationEmailStatus &&
                    order.custom.orderConfirmationEmailStatus.value &&
                    order.custom.orderConfirmationEmailStatus.value !== 'PROCESSED')) {
                order.custom.orderConfirmationEmailStatus = 'READY_FOR_PROCESSING'; // eslint-disable-line no-undef
            }
        } else {
            require('*/cartridge/scripts/checkout/checkoutHelpers').sendConfirmationEmail(order, order.customerLocaleID);
        }
        return true;
    });
}

/**
 * Get Redirect url depending on status of order or inquiry status
 * @param {Object} order DW order object
 * @returns {string|null} redirect url
 */
function getRedirectURL(order) {
    var Order = require('dw/order/Order');
    var URLUtils = require('dw/web/URLUtils');
    switch (order.status.value) {
        case Order.ORDER_STATUS_CREATED:
            try {
                var serviceHelpers = require('*/cartridge/scripts/helpers/serviceHelper');
                var responseObj = serviceHelpers.getTransactionInquiry(order.orderNo);
                updateOrderDetails(responseObj);
                return (serviceHelpers.isTransactionSuccess(responseObj.respCode))
                    ? URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken)
                    : URLUtils.https('Checkout-Begin', 'stage', 'payment', 'error', 1);
            } catch (e) {
                logger.writelog(logger.LOG_TYPE.ERROR, e.message + '\n' + e.stack);
            }
            return URLUtils.https('Cart-Show', 'error', 1);
        case Order.ORDER_STATUS_FAILED:
            return URLUtils.https('Checkout-Begin', 'stage', 'payment', 'error', 1);
        case Order.ORDER_STATUS_NEW:
        case Order.ORDER_STATUS_OPEN:
            return URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken);
        default:
            return null;
    }
}

module.exports = {
    encrypt: encrypt,
    decrypt: decrypt,
    updateOrderDetails: updateOrderDetails,
    getRedirectURL: getRedirectURL
};
