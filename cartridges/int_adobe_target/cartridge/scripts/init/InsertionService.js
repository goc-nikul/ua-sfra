/*
 * API Includes
 */
const adobeTargetPreferences = require('~/cartridge/scripts/adobeTargetPreferences');

module.exports = require('dw/svc/LocalServiceRegistry').createService(
    'adobe.data.insertion.http',
    {
        createRequest: function (svc, params) {
            var origCredentialID =
                svc.getCredentialID() || svc.getConfiguration().getID();
            var credArr = origCredentialID.split('-');
            var credArrSiteID = credArr[credArr.length - 1];
            var currentSite = require('dw/system/Site').current;
            var rsid = adobeTargetPreferences.rsid;

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
            var url = credential.getURL() + rsid + '/0/CODEVERSION';

            svc.setRequestMethod('GET');
            svc.setURL(url);
            svc.addParam('pe', 'tnt');
            svc.addParam('tnta', params.payload);
            svc.addParam('mid', params.marketingCloudVisitorId);
        },
        parseResponse: function (svc, response) {
            return response;
        }
    }
);
