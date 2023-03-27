'use strict';

/* eslint-disable no-unused-vars */
/* eslint-disable spellcheck/spell-checker */

const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const MAOPreferences = require('~/cartridge/scripts/MaoPreferences');
const AvailabilityHelper = require('int_mao/cartridge/scripts/availability/MAOAvailabilityHelper');
var LoggerHelper = require('*/cartridge/scripts/util/loggerHelper.js');

/**
 * Service call to MAO to get token for saving orders.
 * @return {void}
 */
function createOauthTokenService() {
    return LocalServiceRegistry.createService('mao.oauth.token', {
        createRequest: function (svc, params) {
            var Encoding = require('dw/crypto/Encoding');
            var StringUtils = require('dw/util/StringUtils');
            var parameters = 'grant_type=password&username={0}&password={1}';
            // Replace placeholders with URL-encoded username and password
            parameters = StringUtils.format(parameters, Encoding.toURI(MAOPreferences.MaoDomTokenChildOrgUsername), Encoding.toURI(MAOPreferences.MaoDomTokenChildOrgPassword));
            svc.setRequestMethod('POST');
            svc.addHeader('Content-Type', 'application/x-www-form-urlencoded');
            return parameters;
        },
        parseResponse: function (svc, response) {
            return response;
        },
        filterLogMessage: function (logMsg) {
            return !empty(logMsg) ? LoggerHelper.maskSensitiveInfo(logMsg) : logMsg;
        }
    });
}
/**
 * Service call to save order in MAO
 * @return {void}
 */
function saveOrderService() {
    return LocalServiceRegistry.createService('mao.save.order', {
        createRequest: function (svc, params) {
            svc.setRequestMethod('POST');
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('Authorization', 'Bearer ' + params.accessToken);
            svc.setAuthentication('NONE');
            svc.setURL(MAOPreferences.MaoDomSaveOrderEndpointUrl);
            return params.orderData;
        },
        parseResponse: function (svc, response) {
            return response;
        },
        filterLogMessage: function (logMsg) {
            return !empty(logMsg) ? LoggerHelper.maskSensitiveInfo(logMsg) : logMsg;
        }
    });
}

/**
 * Service call to save order in MAO
 * @return {void}
 */
function getAvailability() {
    return LocalServiceRegistry.createService('mao.availability.availabilitydetail', {
        createRequest: function (svc, params, endPointUrl) {
            svc.setRequestMethod('POST');
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('Authorization', 'Bearer ' + params.accessToken);
            svc.setAuthentication('NONE');
            if (endPointUrl) {
                svc.setURL(endPointUrl);
            } else if (MAOPreferences.MaoAvailabilityEndpointUrl) {
                svc.setURL(MAOPreferences.MaoAvailabilityEndpointUrl);
            }
            return params.requestData;
        },
        parseResponse: function (svc, response) {
            return AvailabilityHelper.parseResponse(response);
        },
        mockCall: function (svc, params) {
            var obj = {
                data: [
                    {
                        ItemId: '1330767-233-8',
                        Status: 'AVAILABLE',
                        StatusCode: 2,
                        NextAvailabilityDate: null,
                        ViewName: 'ECOM US',
                        ViewId: '3e516816-88a5-4c0a-a7f5-30b941c51f96',
                        TransactionDateTime: '2018-12-07T18:34:37.803',
                        TotalQuantity: 127,
                        TotalIncludingSubstituteItems: 127,
                        SubstituteItemsAvailable: false,
                        SubstitutionDetails: null,
                        Quantity: {
                            DistributionCenters: 0,
                            Stores: 127
                        },
                        NetworkProtectionQuantity: {}
                    }
                ]
            };
            return {
                statusCode: 200,
                statusMessage: 'Success',
                text: JSON.stringify(obj)
            };
        },
        filterLogMessage: function (logMsg) {
            return !empty(logMsg) ? LoggerHelper.maskSensitiveInfo(logMsg) : logMsg;
        }
    });
}

module.exports.createOauthTokenService = createOauthTokenService;
module.exports.saveOrderService = saveOrderService;
module.exports.getAvailability = getAvailability;
