'use strict';

const Logger = require('dw/system/Logger'),
    HTTPClient = require('dw/net/HTTPClient'),
    HTTPService = require('dw/svc/HTTPService'),
    LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const preferencesUtil = require('app_ua_core/cartridge/scripts/utils/PreferencesUtil');

/* API Includes */
var Site = require('dw/system/Site');
/* Global variables */
var currentSite = Site.getCurrent();

const BrandifyApiService = LocalServiceRegistry.createService('brandify.store', {
    createRequest: function(svc, params) {
        var appkey = preferencesUtil.getValue('brandifyAppKey');
        svc.setRequestMethod('GET');
        var countryCode = params;
        var xmlParam ='<request>'+
        '<appkey>'+ appkey + '</appkey>'+
        '<formdata id="getlist">'+
            '<objectname>StoreLocator</objectname>'+
            '<where>'+
            '<and>' +
             '<country>'+
                 '<eq>'+ countryCode + '</eq>'+
             '</country>'+
             '<or>'+
                '<uaoutlet>1</uaoutlet>'+
                '<uaspeciality>1</uaspeciality>'+
              '</or>'+
              '</and>'+
            '</where>'+
        '</formdata>'+
    '</request>';
    var xmlString = encodeURI(xmlParam);
    svc.addParam('xml_request', decodeURI(xmlString));
    return xmlParam;
    },
    parseResponse: function(svc, response) {
        if (response.statusCode === 200) {
            return response.text;
        } else {
            Logger.getLogger('brandify').error('brandifyAPI: Response status code {0}, response text {1}', response.statusCode, response.text);
        }
    }
});

const BrandifyApiMgr = {
    call: function(params) {
        BrandifyApiService.call(params);
        return BrandifyApiService.getResponse();
    }
}

module.exports = BrandifyApiMgr;