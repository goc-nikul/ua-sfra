'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

// Since there isn't really a way to validate an ocapi token in ua-sfra
// we make an arbitrary coupon lookup request against ocapi
// using a ocapi token we passed through from another application
// if the request is a 404 we consider the token valid
var AuthCheckService = LocalServiceRegistry.createService('int_ocapi.https.couponcode.auth', {
    createRequest: function (svc, params) {
        const url = svc.getConfiguration().credential.URL + '/sites/US/coupons/' + encodeURIComponent(params.couponId);
        svc.addHeader('Authorization', 'Bearer ' + params.token);
        svc.setRequestMethod('GET');
        svc.setURL(url);
        return params;
    },
    parseResponse: function () {
        return null;
    }
});

const AuthCheck = {
    call: function (params) {
        var response = AuthCheckService.call(params);
        if (response.status === 'OK' || response.error === 404) {
            return true;
        }

        return false;
    }
};

module.exports = AuthCheck;
