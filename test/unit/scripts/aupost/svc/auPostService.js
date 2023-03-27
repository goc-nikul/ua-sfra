'use strict';

/* eslint-disable */

const assert = require('chai').assert;

global.empty = (data) => {
    return !data;
};

describe('int_aupost/cartridge/scripts/svc/auPostService', function () {
    var auPostServiceInit = require('../../../../mocks/aupost/aupostService.js');

    it('aupostService should be initialized', function () {
        var result = auPostServiceInit.createOrderAndShipmentRequest();
        var res = result.call();
        assert.isNotNull(res);
        var responseData = result.getResponse();
        assert.isNotNull(responseData);
    });

    it('aupostService createRequest is working', function () {
        var params = {
           authToken: '11111'
        }
        auPostServiceInit.createOrderAndShipmentRequest().getRequestData(params);
    });

     it('aupostService createRequest ---> when auth token null', function () {
        var params = {
            authToken: ''
         }
         auPostServiceInit.createOrderAndShipmentRequest().getRequestData(params);
    });

    it('aupostService getLogs', function () {
         var result = auPostServiceInit.createOrderAndShipmentRequest().getMessage({text: 'response'});
         assert.isNotNull(result.logResponse)
    });


      // create Label Request
      it('aupostService (createLabelRequest) should be initialized', function () {
        var result = auPostServiceInit.createLabelRequest();
        var res = result.call();
        assert.isNotNull(res);
        var responseData = result.getResponse();
        assert.isNotNull(responseData);
    });

    it('aupostService createLabelRequest is working', function () {
        var params = {
           authToken: '11111'
        }
        auPostServiceInit.createLabelRequest().getRequestData(params);
    });

     it('aupostService createLabelRequest ---> when auth token null', function () {
        var params = {
            authToken: ''
         }
         auPostServiceInit.createLabelRequest().getRequestData(params);
    });

    it('aupostService (createLabelRequest) getLogs', function () {
         var result = auPostServiceInit.createLabelRequest().getMessage({text: 'response'});
         assert.isNotNull(result.logResponse)
    });

    // getPdf

    it('aupostService (getPdf) should be initialized', function () {
        var result = auPostServiceInit.getPdf();
        var res = result.call();
        assert.isNotNull(res);
        var responseData = result.getResponse();
        assert.isNotNull(responseData);
    });

    it('aupostService getPdf is working', function () {
        var params = {
           authToken: '11111'
        }
        auPostServiceInit.getPdf().getRequestData(params);
    });

     it('aupostService getPdf ---> when auth token null', function () {
        var params = {
            authToken: ''
         }
         auPostServiceInit.getPdf().getRequestData(params);
    });

    it('aupostService (getPdf) getLogs', function () {
         var result = auPostServiceInit.getPdf().getMessage({text: 'response'});
         assert.isNotNull(result.logResponse)
    });
});
