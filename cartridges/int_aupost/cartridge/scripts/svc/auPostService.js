/* eslint-disable no-param-reassign */
'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger');

/**
* createOrderAndShipmentRequest  Request
* @returns {dw.svc.Service} - Create OrderAnd Shipment Request Service
* */
function createOrderAndShipmentRequest() {
    var service = LocalServiceRegistry.createService('aupost.http.createorderandshipment', {
        createRequest: function (svc, params) {
            var apMerchantID = svc.configuration.credential.user || '';
            var apMerchantKey = svc.configuration.credential.password || '';
            if (!empty(params.authToken)) {
                svc.addHeader('Authorization', 'Basic ' + params.authToken);
            } else if (!empty(apMerchantID) && !empty(apMerchantKey)) {
                var auth = [apMerchantID, apMerchantKey].join(':');
                var Bytes = require('dw/util/Bytes');
                var authCodeByte = new Bytes(auth);
                var encoding = require('dw/crypto/Encoding');
                var authCode = 'Basic ' + encoding.toBase64(authCodeByte);
                svc.setAuthentication('BASIC');
                svc.addHeader('Authorization', authCode);
            }
            svc.setRequestMethod('POST');
            svc.setURL(svc.URL);
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('account-number', params.auPostAccountID);
            Logger.getLogger('createOrderRequest', 'createOrdersRequest').info('createOrderAndShipmentRequest request: ' + JSON.stringify(params));
            return JSON.stringify(params.orderAndShipmentRequest);
        },
        parseResponse: function (svc, response) {
            return response;
        },
        /**
         * Description : Method to get Request log messages
         * @param {Object} request The request Object
         * @returns {Object} The request logs
         */
        getRequestLogMessage: function (request) {
            return request;
        },
        /**
         * Description : Method to show Response log messages
         * @param {Object} response The request Object
         * @returns {Object} The response logs
         */
        getResponseLogMessage: function (response) {
            return response.text;
        }
    });

    return service;
}

/**
* Create Label Request
* @returns {dw.svc.Service} - Create Label Request
* */
function createLabelRequest() {
    var service = LocalServiceRegistry.createService('aupost.http.label', {
        createRequest: function (svc, params) {
            svc.setRequestMethod('POST');
            svc.setURL(svc.URL);
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('Authorization', 'Basic ' + params.authToken);
            svc.addHeader('account-number', params.auPostAccountID);
            Logger.getLogger('credPayment', 'credPayment').info('credPayment request: ' + JSON.stringify(params));
            return JSON.stringify(params.createLabelReq);
        },
        parseResponse: function (svc, response) {
            return response;
        },
        /**
         * Description : Method to get Request log messages
         * @param {Object} request The request Object
         * @returns {Object} The request logs
         */
        getRequestLogMessage: function (request) {
            return request;
        },
        /**
         * Description : Method to show Response log messages
         * @param {Object} response The request Object
         * @returns {Object} The response logs
         */
        getResponseLogMessage: function (response) {
            return response.text;
        }
    });

    return service;
}

/**
* Get PDF Link Request
* @param {string} serviceID  - serviceID
* @param {string} url - url
* @returns {dw.svc.Service} - Get PDF Request
*/
function getPdf(serviceID, url) {
    var service = LocalServiceRegistry.createService(serviceID, {
        createRequest: function (svc) {
            svc.setURL(url);
            svc.setRequestMethod('GET');
            return svc;
        },
        parseResponse: function (svc, result) {
            return result;
        },
        /**
         * Description : Method to get Request log messages
         * @param {Object} request The request Object
         * @returns {Object} The request logs
         */
        getRequestLogMessage: function (request) {
            return request;
        },
        /**
         * Description : Method to show Response log messages
         * @param {Object} response The request Object
         * @returns {Object} The response logs
         */
        getResponseLogMessage: function (response) {
            return response.text;
        }
    });

    return service;
}
module.exports = {
    createOrderAndShipmentRequest: createOrderAndShipmentRequest,
    createLabelRequest: createLabelRequest,
    getPdf: getPdf
};
