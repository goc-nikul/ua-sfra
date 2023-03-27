'use strict';
var superMdl = module.superModule;
var HashMap = require('dw/util/HashMap');


/**
 * Function that returns the Klarna API endpoints
 * @return {dw.util.HashMap} Hashmap containing the Klarna endpoints
 */
superMdl.prototype.getFlowApiUrls = function () {
    if (!this.flowApiUrls) {
        this.flowApiUrls = new HashMap();

        this.flowApiUrls.put('createSession', 'payments/v1/sessions');
        this.flowApiUrls.put('updateSession', 'payments/v1/sessions/{0}');
        this.flowApiUrls.put('getSession', 'payments/v1/sessions/{0}');
        this.flowApiUrls.put('getOrder', '/ordermanagement/v1/orders/{0}');
        this.flowApiUrls.put('cancelAuthorization', 'payments/v1/authorizations/{0}');
        this.flowApiUrls.put('createOrder', 'payments/v1/authorizations/{0}/order');
        this.flowApiUrls.put('cancelOrder', '/ordermanagement/v1/orders/{0}/cancel');
        this.flowApiUrls.put('getCompletedOrder', '/ordermanagement/v1/orders/{0}');
        this.flowApiUrls.put('acknowledgeOrder', 'ordermanagement/v1/orders/{0}/acknowledge');
        this.flowApiUrls.put('vcnSettlement', 'merchantcard/v3/settlements');
        this.flowApiUrls.put('createCapture', '/ordermanagement/v1/orders/{0}/captures');
    }

    return this.flowApiUrls;
};

module.exports = superMdl;
