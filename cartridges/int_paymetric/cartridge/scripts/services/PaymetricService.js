'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var PaymetricHelper = require('~/cartridge/scripts/util/PaymetricHelper');
var LoggerHelper = require('*/cartridge/scripts/util/loggerHelper.js');

/* eslint-disable no-unused-vars */

/**
 * Paymetric Payload Decryption API
 * @return {Service} Paymetric Service
 */
function createDecryptService() {
    return LocalServiceRegistry.createService('int_paymetric.http.decrypt', {
        createRequest: function (svc, params) {
            // Build full service request URL
            var requestURL = svc.getConfiguration().credential.URL;
            var token = PaymetricHelper.getJwtToken();

            svc.setRequestMethod('POST');
            svc.addHeader('authorization', 'Bearer ' + token);
            svc.addHeader('Content-Type', 'application/json');
            svc.setURL(requestURL);

            if (params) {
                return JSON.stringify({
                    payload: params
                });
            }

            return null;
        },
        parseResponse: function (svc, client) {
            return client.text;
        },
        getResponseLogMessage: function (response) {
            return response.text;
        },
        mockCall: function () {
            return {
                authorization: {
                    date: '2018-02-16T17:56:56.013Z',
                    code: 'XI00',
                    message: '[XiPay Null] Approved',
                    referenceNumber: '110630231',
                    referenceIndex: '18818',
                    responseCode: '',
                    avsCode: 'X',
                    status: 'authorized'
                },
                payment: {
                    type: 'CreditCardTokenized',
                    cardToken: '-E803-4500-YCC46YKBPE5340',
                    nameOnCard: 'Jane Doe',
                    cardType: 'VISA',
                    lastFour: '4500',
                    ccBinRange: '366655',
                    expiresMonth: '09',
                    expiresYear: '2018'
                }
            };
        },
        filterLogMessage: function (logMsg) {
            return !empty(logMsg) ? LoggerHelper.maskSensitiveInfo(logMsg) : logMsg;
        }
    });
}

/**
 * Paymetric Exchange Token API
 * @return {Service} Paymetric Service
 */
function exchangeTokenService() {
    return LocalServiceRegistry.createService('int_paymetric.http.exchangetoken', {
        createRequest: function (svc, intToken) {
            // Build full service request URL
            var requestURL = svc.getConfiguration().credential.URL + '/' + intToken;
            var token = PaymetricHelper.getJwtToken('tokens');

            svc.setRequestMethod('GET');
            svc.addHeader('Authorization', 'Bearer ' + token);
            svc.addHeader('Content-Type', 'application/json');
            svc.setURL(requestURL);

            return intToken;
        },
        parseResponse: function (svc, client) {
            return client.text;
        },
        getRequestLogMessage: function (req) {
            return req;
        },
        getResponseLogMessage: function (response) {
            return response.text;
        },
        mockCall: function (svc, client) {
            return {
                authorization: {
                    date: '2018-02-16T17:56:56.013Z',
                    code: 'XI00',
                    message: '[XiPay Null] Approved',
                    referenceNumber: '110630231',
                    referenceIndex: '18818',
                    responseCode: '',
                    avsCode: 'X',
                    status: 'authorized'
                },
                payment: {
                    type: 'CreditCardTokenized',
                    cardToken: '-E803-4500-YCC46YKBPE5340',
                    nameOnCard: 'Jane Doe',
                    cardType: 'VISA',
                    lastFour: '4500',
                    ccBinRange: '366655',
                    expiresMonth: '09',
                    expiresYear: '2018'
                }
            };
        },
        filterLogMessage: function (logMsg) {
            return !empty(logMsg) ? LoggerHelper.maskSensitiveInfo(logMsg) : logMsg;
        }
    });
}

module.exports.createDecryptService = createDecryptService;
module.exports.exchangeTokenService = exchangeTokenService;
