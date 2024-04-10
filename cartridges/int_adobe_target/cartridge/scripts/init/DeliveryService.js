'use strict';
/*
 * API Includes
 */
const adobeTargetPreferences = require('~/cartridge/scripts/adobeTargetPreferences');

/* Script Modules */
var DeliveryService = require('int_adobe_target/cartridge/scripts/util/DeliveryHelper');
var atLogger = require('dw/system/Logger').getLogger(
    'adobeTarget',
    'adobeTarget'
);

/**
 * Initialize Adobe Target Delivery service
 */

module.exports = require('dw/svc/LocalServiceRegistry').createService(
    'adobe.target.delivery.http',
    {
        createRequest: function (svc, params) {
            var origCredentialID =
                svc.getCredentialID() || svc.getConfiguration().getID();
            var credArr = origCredentialID.split('-');
            var credArrSiteID = credArr[credArr.length - 1];
            var currentSite = require('dw/system/Site').current;
            if (
                currentSite &&
                currentSite.ID &&
                credArrSiteID !== currentSite.ID
            ) {
                // Attempt to set to site-specific credential
                try {
                    svc.setCredentialID(credArr[0] + '-' + currentSite.ID);
                } catch (e) {
                    // site-specific credential doesn't exist, reset
                    svc.setCredentialID(origCredentialID);
                }
            }

            this.deliveryHelper = new DeliveryService();
            var credential = svc.getConfiguration().getCredential();
            var url = credential.getURL();
            var deliveryRequest = this.deliveryHelper.createAdobeTargetDeliveryRequest(
                params
            );

            svc.setRequestMethod('POST');
            svc.setURL(url);
            svc.addParam('client', adobeTargetPreferences.clientCode);
            svc.addParam(
                'sessionId',
                this.deliveryHelper.getAdobeTargetSessionId()
            );
            svc.addHeader('content-type', 'application/json');
            svc.addHeader('cache-control', 'no-cache');

            return deliveryRequest;
        },
        parseResponse: function (svc, response) {
            if (!response.statusCode === 200) {
                atLogger.error(
                    'adobeTarget: Response status code {0}, response text {1}',
                    response.statusCode,
                    response.text
                );
            }

            return response.text;
        }
    }
);
