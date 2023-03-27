'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

global.empty = (data) => {
    return !data;
};

describe('int_mao/cartridge/scripts/services/MaoService.js', function() { 

    var MaoServiceProxy = require('../../../mocks/scripts/mao/MaoService');
    
    it('MaoService should be initialized', function () {
        var result = MaoServiceProxy.createOauthTokenService();
        var res = result.call();
        assert.isNotNull(res);
        var responseData = result.getResponse();
        assert.isNotNull(responseData);
    });

    it('MaoService createRequest is working', function () {
        var MaoServiceResponse = MaoServiceProxy.createOauthTokenService().getRequestData();
        assert.equal(MaoServiceResponse, 'grant_type=password&username={0}&password={1}');
    });

    it('MaoService getLogs', function () {
        var result = MaoServiceProxy.createOauthTokenService().getMessage({text: 'response'});
        assert.isNotNull(result.logResponse.text, 'response');
   });

    it('MaoService - saveOrderService service should be initialized', function () {
        var result = MaoServiceProxy.saveOrderService();
        var res = result.call();
        assert.isNotNull(res);
        var responseData = result.getResponse();
        assert.isNotNull(responseData);
    });

    it('MaoService - saveOrderService - createRequest with accessToken should work', function () {
        var params = {
            accessToken: '11111',
            orderData : {
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
            }
        }
        var MaoServiceResponse = MaoServiceProxy.saveOrderService().getRequestData(params);
        assert.isNotNull(MaoServiceResponse, 'MaoServiceResponse saveOrderService is  not null');
        assert.equal(MaoServiceResponse, params.orderData);
    });

    it('MaoService createRequest should return empty orderData', function () {
        var params = {
            accessToken: '11111',
            orderData : null
        }
       var MaoServiceResponse = MaoServiceProxy.saveOrderService().getRequestData(params);
        assert.isNull(MaoServiceResponse, null);
    });

     it('MaoService createRequest ---> when auth token null', function () {
        var params = {
            accessToken: '',
            orderData: {}
         }
         var MaoServiceResponse = MaoServiceProxy.saveOrderService().getRequestData(params);
         assert.isObject(MaoServiceResponse, 'MaoServiceResponse should not return empty object');
    });

    it('MaoService saveOrderService getLogs', function () {
        var result = MaoServiceProxy.saveOrderService().getMessage({text: 'response'});
        assert.isNotNull(result.logResponse.text)
        assert.equal(result.logResponse.text, 'response')
   });

   it('MaoService  getAvailability should be initialized', function () {
        var result = MaoServiceProxy.getAvailability();
        var res = result.call();
        assert.isNotNull(res);
        var responseData = result.getResponse();
        assert.isNotNull(responseData);
    });

    it('MaoService getAvailability:MockCall() should be initialized', function () {
        var result = MaoServiceProxy.getAvailability();
        var res = result.call();
        assert.isNotNull(res);
        var params = true;
        var responseData = result.getResponse(params);
        assert.isNotNull(responseData);
        assert.equal(responseData.statusCode, '200');
        assert.equal(responseData.statusMessage, 'Success');
    });

    it('MaoService - getAvailability service should return undefined value', function () {
        var endPointUrl = '';
        var params = {
            accessToken: '111111',
            endPointUrl: true
        }
        var MaoServiceResponse = MaoServiceProxy.getAvailability().getRequestData(params, endPointUrl);
        assert.isUndefined(MaoServiceResponse);
    });

    it('MaoService should be initialized and should return requested data', function () {
        var endPointUrl = 'https://uarms.omni.manh.com/order/api/order/order/save';
        var params = {
            accessToken: '111111',
            endPointUrl: true,
            requestData: 'Requested Data'
        }
        var MaoServiceResponse = MaoServiceProxy.getAvailability().getRequestData(params, endPointUrl);
        assert.isNotNull(MaoServiceResponse, 'MaoServiceResponse is not null');
    });

    it('MaoService getAvailability should be initialized without endpoint URL and should be call MAOPreference URL', function () {
        var endPointUrl = 'https://uarms.omni.manh.com/order/api/order/order/save';
        var params = {
            accessToken: '111111',
            endPointUrl: false,
            requestData: ''
        }
       var result = MaoServiceProxy.getAvailability().getRequestData(params, endPointUrl);
        assert.isNotNull(result);
    });

    it('MaoService getAvailability getLogs', function () {
        var result = MaoServiceProxy.getAvailability().getMessage({text: 'response'});
        assert.isNotNull(result.logResponse.text)
   });

});