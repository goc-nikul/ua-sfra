'use strict';

const Logger = require('dw/system/Logger'),
    LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const preferencesUtil = require('app_ua_core/cartridge/scripts/utils/PreferencesUtil');
    


const AdobeAssetApi = LocalServiceRegistry.createService('Adobeassetapi.http.outfit', {
        createRequest: function(svc, params) {
            var cacheTime = preferencesUtil.getValue('ShopThisLookserviceCacheTime');
            var adobeClientId = preferencesUtil.getValue('adobeClientID');
            var adobeClientSecret = preferencesUtil.getValue('adobeClientSecret');
            const url = svc.getConfiguration().credential.URL +'?'+ params;
            svc.setRequestMethod('GET');
            svc.addHeader('client_id', adobeClientId);
            svc.addHeader('client_secret', adobeClientSecret);
            svc.setURL(url);
            svc.client.enableCaching(cacheTime);
            return params;
       },
       parseResponse: function(svc, response) {
           if (response.statusCode === 200) {
               return response.text;
           } else {
               Logger.getLogger('AdobeAsset').error('AdobeAsset: Response status code {0}, response text {1}', response.statusCode, response.text);
           }
       }
   });
const AdobeAssetApiMgr = {
	    call: function(params) {
	        AdobeAssetApi.call(params);
	        return AdobeAssetApi.getResponse();
	    }
	}
module.exports = AdobeAssetApiMgr;
