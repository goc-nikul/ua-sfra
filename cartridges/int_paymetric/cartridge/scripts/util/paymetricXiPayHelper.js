'use strict';
/*
 * API Includes
 */
var Logger = require('dw/system/Logger').getLogger('PaymetricXiPay', 'PaymetricXiPay');

/**
 * Paymetric XiPay Service Operations
 */
var PAYMETRIC_XIPAY_CONSTANTS = {
    AUTHORIZATION_OPERATION: 1,
    VOID_OPERATION: 10
};
/**
 * Sets security header to the SOAP request.
 * @param {serviceClient} serviceClient - SOAP service client object
 * @param {dw.svc.ServiceCredential} credential - Service credential configuration object
 * @return {void}
 */
function setSecurityHeader(serviceClient, credential) {
    var WSUtil = require('dw/ws/WSUtil');
    var StringUtils = require('dw/util/StringUtils');
    var username = credential.getUser();
    var password = credential.getPassword();
    var userNameToken = 'AE9C8EEAAF31B6FDAF15260941602431'; // Dummy Token. It's not required to generate a new token for each service call
    // eslint-disable-next-line no-undef
    var securityHeader = new XML(StringUtils.format('<wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"><wsse:UsernameToken wsu:Id="UsernameToken-{0}"><wsse:Username>{1}</wsse:Username><wsse:Password>{2}</wsse:Password></wsse:UsernameToken></wsse:Security>', userNameToken, username, password));
    WSUtil.addSOAPHeader(serviceClient, securityHeader, true, null);
}
/**
 * Constructs SOAP request for authorization
 * @param {webRef} webRef - SOAP webReference service object
 * @param {dw.order.Order} order - dw order object
 * @param {string} paymentMethodId - payment method id. Possible values are PayPal and Paymetric.
 * @returns {Object} IPackets - Authorization SOAP request object
 */
function createAuthorizationRequest(webRef, order, paymentMethodId) {
    var IPackets;
    try {
        var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
        var ITransactionHeader = new webRef.ITransactionHeader();
        var InfoItem = new webRef.InfoItem();
        InfoItem.setKey('TRANS_TYPE'); // Always "TRANS_TYPE"
        InfoItem.setValue('7'); // Always 7
        var paymentInstruments = order.getPaymentInstruments(paymentMethodId);
        var paymentInstrument = paymentInstruments[0];
        var billingAddress = order.getBillingAddress();
        var merchantId;
        if (paymentMethodId === 'PayPal') {
            // PayPal PaymentInstrument
            var paypalTransactionId = paymentInstrument.paymentTransaction.transactionID;
            ITransactionHeader.setAmount(paymentInstrument.paymentTransaction.amount.value); // paymentInstrument amount for PayPal orders
            ITransactionHeader.setCardExpirationDate('12/99'); // Always 12/99 for PayPal orders
            ITransactionHeader.setCardHolderName(billingAddress.fullName); // Billing address full name for PayPal Orders
            ITransactionHeader.setCardNumber(paypalTransactionId); // PayPal transaction id Example value - O-33L74545VC6503823
            ITransactionHeader.setCardType('PP'); // Always PP for PayPal orders
            InfoItem.setKey('TR_TRANS_REFID');
            InfoItem.setValue(paypalTransactionId); // PayPal transaction id Example value - O-33L74545VC6503823
            merchantId = PreferencesUtil.getValue('Paymetric_XiPay_PP_Merchant_ID'); // Paymetric XiPay PayPal Merchant ID
            ITransactionHeader.setMerchantID(merchantId);
        } else {
            // CC PaymentInstrument
            let ccExpYear = paymentInstrument.creditCardExpirationYear.toString();
            ccExpYear = (ccExpYear.length === 4) ? ccExpYear.substr(2) : ccExpYear;
            // eslint-disable-next-line spellcheck/spell-checker
            ITransactionHeader.setAmount(paymentInstrument.paymentTransaction.amount.value); // Order total value of orders with eGC. "int_paymetric.soap.xipay" authorization service should be called only if order has eGC.
            var cardExpirationDate = paymentInstrument.creditCardExpirationMonth + '/' + ccExpYear;
            ITransactionHeader.setCardExpirationDate(cardExpirationDate); // CC expiration date
            ITransactionHeader.setCardHolderName(paymentInstrument.creditCardHolder);
            ITransactionHeader.setCardNumber(paymentInstrument.creditCardToken);
            ITransactionHeader.setCardType(paymentInstrument.creditCardType);
            merchantId = PreferencesUtil.getValue('Paymetric_XiPay_Merchant_ID'); // Paymetric XiPay Merchant ID
            ITransactionHeader.setMerchantID(merchantId);
        }
        ITransactionHeader.setPacketOperation(PAYMETRIC_XIPAY_CONSTANTS.AUTHORIZATION_OPERATION); // 1 for authorization 10 for void
        ITransactionHeader.setCurrencyKey(order.currencyCode);
        ITransactionHeader.setCardHolderAddress1(billingAddress.address1);
        ITransactionHeader.setCardHolderCity(billingAddress.city);
        ITransactionHeader.setCardHolderCountry(billingAddress.countryCode.value);
        ITransactionHeader.setCardHolderState(billingAddress.stateCode);
        ITransactionHeader.setCardHolderZip(billingAddress.postalCode);
        ITransactionHeader.setCardDataSource('E'); // Always "E"
        var ArrayOfInfoItem = new webRef.ArrayOfInfoItem();
        ArrayOfInfoItem.infoItem.push(InfoItem);
        ITransactionHeader.infoItems = ArrayOfInfoItem;
        IPackets = new webRef.IPackets();
        IPackets.setCount(1);
        IPackets.setXipayvbresult(false); // eslint-disable-line spellcheck/spell-checker
        var ArrayOfITransactionHeader = new webRef.ArrayOfITransactionHeader();
        ArrayOfITransactionHeader.ITransactionHeader.push(ITransactionHeader);
        IPackets.packets = ArrayOfITransactionHeader;
    } catch (e) {
        Logger.error('Error in paymetricXiPayHelper.js -> createAuthorizationRequest() :: error {0}', e.message);
    }
    return IPackets;
}

/**
 * Constructs SOAP request for void operation
 * @param {webRef} webRef - SOAP webReference service object
 * @param {dw.order.Order} order - dw order object
 * @param {string} paymentMethodId - payment method id. Possible values are PayPal and Paymetric.
 * @returns {Object} IPackets - SOAP request object to perform void operation
 */
function createVoidRequest(webRef, order, paymentMethodId) {
    var IPackets;
    try {
        var ITransactionHeader = new webRef.ITransactionHeader();
        var paymentInstruments = order.getPaymentInstruments(paymentMethodId);
        var paymentInstrument = paymentInstruments[0];
        ITransactionHeader.setTransactionID(paymentInstrument.paymentTransaction.custom.xipayTransactionId); // Transaction ID received in authorization service response
        ITransactionHeader.setPacketOperation(PAYMETRIC_XIPAY_CONSTANTS.VOID_OPERATION); // // 1 for authorization 10 for void
        IPackets = new webRef.IPackets();
        IPackets.setCount(1);
        IPackets.setXipayvbresult(false); // eslint-disable-line spellcheck/spell-checker
        var ArrayOfITransactionHeader = new webRef.ArrayOfITransactionHeader();
        ArrayOfITransactionHeader.ITransactionHeader.push(ITransactionHeader);
        IPackets.packets = ArrayOfITransactionHeader;
    } catch (e) {
        Logger.error('Error in paymetricXiPayHelper.js -> createVoidRequest() :: error {0}', e.message);
    }
    return IPackets;
}
/**
 * Constructs SOAP request for authorization
 * @param {webRef} webRef - SOAP webReference service object
 * @param {Object} requestData - data to construct SOAP request body and operation to perform
 * Example requestData -
 * {
 *     operation : '1' // 1 for authorization 10 for void operation
 *     order: order // dw order object
 *     paymentMethodId: 'PayPal' // Possible values are PayPal and Paymetric.
 * }
 * @returns {Object} IPackets - Authorization SOAP request object
 */
function createSoapRequestBody(webRef, requestData) {
    var requestBody;
    switch (requestData.operation) {
        case PAYMETRIC_XIPAY_CONSTANTS.AUTHORIZATION_OPERATION:
            // create soap request body for authorization
            requestBody = createAuthorizationRequest(webRef, requestData.order, requestData.paymentMethodId);
            break;
        case PAYMETRIC_XIPAY_CONSTANTS.VOID_OPERATION:
            // create soap request body for void operation
            requestBody = createVoidRequest(webRef, requestData.order, requestData.paymentMethodId);
            break;
        default:
    }
    return requestBody;
}
/**
 * Parse SOAP service response and construct JSON object
 * @param {Object} response - SOAP service response object
 * @returns {Object} paymetricSoapResponse - JSON response
 */
function parseResponse(response) {
    var paymetricSoapResponse;
    try {
        if (!empty(response)) {
            var ITransactionHeader = response.getPackets().getITransactionHeader()[0];
            var InfoItems = ITransactionHeader.getInfoItems();
            if (!empty(InfoItems)) {
                InfoItems = InfoItems.infoItem;
            }
            var InfoItem;
            var trPaypalRefId;
            var trTransRefId;
            var infoItemKey;
            if (!empty(InfoItems) && InfoItems.length > 0) {
                for (var i = 0; i < InfoItems.length; i++) {
                    InfoItem = InfoItems[i];
                    if (!empty(InfoItem) && !empty(InfoItem.getKey())) {
                        infoItemKey = InfoItem.getKey();
                        if (infoItemKey === 'TR_PAYPAL_REFID') {
                            trPaypalRefId = InfoItem.getValue();
                        }
                        if (infoItemKey === 'TR_TRANS_REFID') {
                            trTransRefId = InfoItem.getValue();
                        }
                    }
                }
            }
            paymetricSoapResponse = {
                statusCode: ITransactionHeader.getStatusCode(),
                transactionID: ITransactionHeader.getTransactionID()
            };
            if (!empty(trPaypalRefId)) {
                paymetricSoapResponse.trPaypalRefId = trPaypalRefId;
            }
            if (!empty(trTransRefId)) {
                paymetricSoapResponse.trTransRefId = trTransRefId;
            }
        }
    } catch (e) {
        Logger.error('Error in paymetricXiPayHelper.js -> parseResponse() :: error {0}', e.message);
    }
    return paymetricSoapResponse;
}
/**
 * Constructs and returns mock JSON object
 * @returns {Object} mockResponse - mock JSON object
 */
function getMockResponse() {
    var mockResponse = {
        statusCode: '100', // Success status code
        transactionID: '1234567890', // dummy transaction id
        trPaypalRefId: '4abef1c81b009', // eslint-disable-line spellcheck/spell-checker
        trTransRefId: '39P70827RV830153J' // dummy trans ref id
    };
    return mockResponse;
}
/**
 * Performs Paymetric XiPay authorization
 * @param {dw.order.Order} order -dw order object
 * @param {string} paymentMethodId - payment method id. Possible values are PayPal and Paymetric.
 * @returns {boolean} status - true if successful authorization, else false
 */
function doAuthorization(order, paymentMethodId) {
    var status = false;
    try {
        var paymentInstruments = order.getPaymentInstruments(paymentMethodId);
        var isSecondaryAuthEnabled = require('*/cartridge/scripts/utils/PreferencesUtil').getValue('Paymetric_XiPay_Is_PayPal_Auth_Enabled');
        if (((paymentMethodId === 'PayPal' && isSecondaryAuthEnabled) || paymentMethodId === 'Paymetric') && paymentInstruments.length > 0) {
            var paymentInstrument = paymentInstruments[0];
            var paymetricXiPayService = require('~/cartridge/scripts/services/paymetricXiPayService').createPaymetricXiPayService;
            var Transaction = require('dw/system/Transaction');
            var requestData = {
                operation: PAYMETRIC_XIPAY_CONSTANTS.AUTHORIZATION_OPERATION,
                order: order,
                paymentMethodId: paymentMethodId
            };
            var serviceResponse = paymetricXiPayService.call(requestData);
            if (!empty(serviceResponse) && serviceResponse.status === 'OK' && !empty(serviceResponse.object)) {
                var responseData = serviceResponse.object;
                Transaction.wrap(function () {
                    order.addNote('XIPay Response (simplified)', JSON.stringify(responseData));
                    // 100 is the status code for successful authorization
                    if (responseData.statusCode === 100 && !empty(responseData.transactionID)) {
                        // store transaction id in payment instrument
                        var paymentTransactionCustom = paymentInstrument.paymentTransaction.custom;
                        paymentTransactionCustom.xipayTransactionId = responseData.transactionID;
                        paymentTransactionCustom.xipayTransactionType = 'Authorization';
                        if (!empty(responseData.trPaypalRefId)) {
                            paymentTransactionCustom.xipayTRPaypalRefId = responseData.trPaypalRefId;
                        }
                        if (!empty(responseData.trTransRefId)) {
                            paymentTransactionCustom.xipayTRTransRefId = responseData.trTransRefId;
                        }
                        status = true;
                    }
                });
            }
        } else {
            // send true if there is no payment instrument exists of given payment method id
            status = true;
        }
    } catch (e) {
        Logger.error('Error in paymetricXiPayHelper.js -> doAuthorization() :: error {0}', e.message);
    }
    return status;
}
/**
 * Performs Paymetric XiPay void authorization
 * @param {dw.order.Order} order - dw order object
 * @param {string} paymentMethodId - payment method id. Possible values are PayPal and Paymetric.
 * @returns {boolean} result - true if successful void operation, else false
 */
function doVoidAuthorization(order, paymentMethodId) {
    var status = false;
    try {
        var paymentInstruments = order.getPaymentInstruments(paymentMethodId);
        // Not checking if secondary authorization site preference is enabled because
        // if "xipayTransactionId" is not empty and last "xipayTransactionType" is "Authorization",
        // It means that the site preference was enabled during authorization (“isEnabled” check is already there in “doAuthorization” method)
        // and the order has been already authorized successfully.
        // We must make a void authorization call if we get "reject" status from Accertify (Fraud Check).
        if ((paymentMethodId === 'PayPal' || paymentMethodId === 'Paymetric') && paymentInstruments.length > 0) {
            var paymentInstrument = paymentInstruments[0];
            var paymentTransactionCustom = paymentInstrument.paymentTransaction.custom;
            if (!empty(paymentTransactionCustom.xipayTransactionId) && !empty(paymentTransactionCustom.xipayTransactionType) && paymentTransactionCustom.xipayTransactionType === 'Authorization') {
                var paymetricXiPayService = require('~/cartridge/scripts/services/paymetricXiPayService').createPaymetricXiPayService;
                var Transaction = require('dw/system/Transaction');
                var requestData = {
                    operation: PAYMETRIC_XIPAY_CONSTANTS.VOID_OPERATION,
                    order: order,
                    paymentMethodId: paymentMethodId
                };
                var serviceResponse = paymetricXiPayService.call(requestData);
                if (!empty(serviceResponse) && serviceResponse.status === 'OK' && !empty(serviceResponse.object)) {
                    var responseData = serviceResponse.object;
                    // 500 is the status code for successful void operation
                    if (responseData.statusCode === 500 && !empty(responseData.transactionID)) {
                        // store transaction id in payment instrument
                        Transaction.wrap(function () {
                            paymentTransactionCustom.xipayTransactionId = responseData.transactionID;
                            paymentTransactionCustom.xipayTransactionType = 'Void Authorization';
                        });
                        status = true;
                    }
                }
            }
        } else {
            // send true if there is no payment instrument exists of given payment method id
            status = true;
        }
    } catch (e) {
        Logger.error('Error in paymetricXiPayHelper.js -> doVoidAuthorization() :: error {0}', e.message);
    }
    return status;
}

module.exports = {
    setSecurityHeader: setSecurityHeader,
    createSoapRequestBody: createSoapRequestBody,
    parseResponse: parseResponse,
    getMockResponse: getMockResponse,
    doAuthorization: doAuthorization,
    doVoidAuthorization: doVoidAuthorization
};
