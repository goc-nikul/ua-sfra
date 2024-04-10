'use strict';
/*
 * API Includes
 */
const adobeTargetPreferences = require('~/cartridge/scripts/adobeTargetPreferences');

var atLogger = require('dw/system/Logger').getLogger(
    'adobeTarget',
    'adobeTarget'
);

/**
 * Initialize Adobe Service Side ECID service
 */

module.exports = require('dw/svc/LocalServiceRegistry').createService(
    'adobe.server.side.ecid.http',
    {
        createRequest: function (svc) {
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

            var credential = svc.getConfiguration().getCredential();
            var url = credential.getURL();

            svc.setRequestMethod('GET');
            svc.setURL(url);
            svc.addParam('d_ver', '2');
            svc.addParam('d_orgid', adobeTargetPreferences.orgId);
        },
        parseResponse: function (svc, response) {
            if (!response.statusCode === 200) {
                atLogger.error(
                    'adobeTarget: ECID request: Response status code {0}, response text {1}',
                    response.statusCode,
                    response.text
                );
            }

            return response.text;
        }
    }
);
