'use strict';

/**
 * Initialize HTTP services for a Accertify cartridge
 */

 /* Script Modules */
var AccertifyHelper = require('int_accertify/cartridge/scripts/util/AccertifyHelper');

module.exports = require('dw/svc/LocalServiceRegistry').createService('int_accertify.http.fraud', {
    createRequest: function (svc, order) {
        var origCredentialID = svc.getCredentialID() || svc.getConfiguration().getID();
        var credArr = origCredentialID.split('-');
        var credArrSiteID = credArr[credArr.length - 1];
        var currentSite = require('dw/system/Site').current;
        var siteID = currentSite.ID;
        if (credArrSiteID !== siteID) {
            // Attempt to set to site-specific credential
            try {
                svc.setCredentialID(credArr[0] + '-' + siteID);
            } catch (e) {
                // site-specific credential doesn't exist, reset
                svc.setCredentialID(origCredentialID);
            }
        }
        this.accertifyHelper = new AccertifyHelper();
        var credential = svc.getConfiguration().getCredential();
        var url = credential.getURL();
        var orderRequest = this.accertifyHelper.createAccertifyProcessRequest(order);

        svc.setRequestMethod('POST');
        svc.setURL(url);
        svc.addHeader('content-type', 'application/xml');

        return orderRequest;
    },
    parseResponse: function (svc, client) {
        return this.accertifyHelper.parseAccertifyResponse(svc, client);
    },
    mockCall: function (svc, client) {
        return this.accertifyHelper.getMockedAccertifyResponse(svc, client);
    }
});
