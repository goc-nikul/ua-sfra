'use strict';
/*
 * API Includes
 */
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var paymetricXiPayHelper = require('~/cartridge/scripts/util/paymetricXiPayHelper');
var LoggerHelper = require('*/cartridge/scripts/util/loggerHelper.js');

// eslint-disable-next-line spellcheck/spell-checker
var createPaymetricXiPayService = LocalServiceRegistry.createService('int_paymetric.soap.xipay', {
    initServiceClient: function () {
        this.webReference = webreferences2.XiPay30WS; // eslint-disable-line no-undef
        return this.webReference.getDefaultService();
    },
    createRequest: function (svc, requestData) {
        var credential = svc.getConfiguration().getCredential();
        var newUrl = (!empty(credential) && !empty(credential.getURL())) ? credential.getURL() : '';
        if (!empty(newUrl)) {
            svc.setURL(newUrl);
        }
        paymetricXiPayHelper.setSecurityHeader(this.serviceClient, credential);
        return paymetricXiPayHelper.createSoapRequestBody(this.webReference, requestData);
    },
    execute: function (svc, request) {
        var serviceResponse = svc.serviceClient.soapOp(request);
        return serviceResponse;
    },
    parseResponse: function (svc, response) {
        return paymetricXiPayHelper.parseResponse(response);
    },
    mockFull: function (svc, requestData) { // eslint-disable-line no-unused-vars
        return paymetricXiPayHelper.getMockResponse();
    },
    filterLogMessage: function (logMsg) {
        return !empty(logMsg) ? LoggerHelper.maskSensitiveInfo(logMsg) : logMsg;
    }
});

module.exports.createPaymetricXiPayService = createPaymetricXiPayService;
