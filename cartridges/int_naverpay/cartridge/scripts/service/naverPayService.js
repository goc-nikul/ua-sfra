'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

exports.paymentService = LocalServiceRegistry.createService('naverpay.api', {
    createRequest: (svc, requestObject) => {
        var Site = require('dw/system/Site').getCurrent();
        var clientID = Site.getCustomPreferenceValue('NaverPayClientID');
        var clientSecret = Site.getCustomPreferenceValue('NaverPayClientSecret');

        svc.addHeader('Content-Type', 'application/x-www-form-urlencoded');
        svc.addHeader('X-Naver-Client-Id', clientID);
        svc.addHeader('X-Naver-Client-Secret', clientSecret);
        svc.addHeader('X-NaverPay-Idempotency-Key', requestObject.idempotencyKey);
        svc.setRequestMethod('POST');
        svc.setURL(requestObject.url);

        return 'paymentId=' + requestObject.paymentId;
    },
    parseResponse: (svc, response) => {
        return response;
    }
});

exports.cancelService = LocalServiceRegistry.createService('naverpay.api', {
    createRequest: (svc, requestObject) => {
        var Site = require('dw/system/Site').getCurrent();
        var clientID = Site.getCustomPreferenceValue('NaverPayClientID');
        var clientSecret = Site.getCustomPreferenceValue('NaverPayClientSecret');

        svc.addHeader('Content-Type', 'application/x-www-form-urlencoded');
        svc.addHeader('X-Naver-Client-Id', clientID);
        svc.addHeader('X-Naver-Client-Secret', clientSecret);
        svc.addHeader('X-NaverPay-Idempotency-Key', requestObject.idempotencyKey);
        svc.setRequestMethod('POST');
        svc.setURL(requestObject.url);

        return 'paymentId=' + requestObject.paymentId + '&cancelAmount=' + requestObject.cancelAmount + '&cancelReason=' + requestObject.cancelReason + '&cancelRequester=2&taxScopeAmount=' + requestObject.cancelAmount + '&taxExScopeAmount=0';
    },
    parseResponse: (svc, response) => {
        return response;
    }
});
