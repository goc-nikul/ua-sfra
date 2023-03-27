'use strict';

/**
 * Pipelet for processing orders from border free not found in SFCC.
 * @input poOrder : Object mandatory, PO Order to be processed.
 * @input errorMailContent : dw.util.ArrayList mandatory, list of errors on PO
 */

const Logger = require('dw/system/Logger');
const Status = require('dw/system/Status');
const Service = require('dw/svc/Service');
const crypto = require('dw/crypto/Encoding');
const Result = require('dw/svc/Result');
const Site = require('dw/system/Site');
const StringUtils = require('dw/util/StringUtils');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const Util = require('*/cartridge/scripts/utils/Util');
var svc;


function initService() {
    svc = LocalServiceRegistry.createService("borderfree.https.createmissingorder", {
        createRequest: function(serv, args){
            var config = serv.getConfiguration();
            var poOrder = args.poOrder;
            var pwd = args.pwd;
            var isMockMode = serv.isMock();
            var orderObj = {};
            if(!isMockMode){
                serv.setThrowOnError();
                var url = serv.getURL();
                var poOrderString = JSON.stringify(poOrder);
                // var encoded = crypto.toURI(poOrderString); This encoding is not required as we are sending data through POST 
                var params = url + "?password=" + pwd;
                // Changing the request method from GET to POST in order to except bulk orders through body.
                // Sending the large data through GET results in 414 error code, request-URI too large.
                serv.setRequestMethod('POST');
                serv.addHeader('Content-Type', 'application/json');
                if (Site.current.status === Site.SITE_STATUS_PROTECTED) {
                    // Set basic authorization header if the site is password-protected
                    serv.addHeader('Authorization', 'Basic ' + StringUtils.encodeBase64('storefront:' + Site.current.getCustomPreferenceValue('uaidmSfccStorefrontPassword')));
                }
                serv.setURL(params);
                orderObj.poOrder = poOrderString;
                // Send the stringified request object.
                return JSON.stringify(orderObj);
            }
        },
        parseResponse: function(svc, client) {
            // if call is successful, then return the 
            if(client.statusCode == 200){
                return client.text;
            }
        },
        mockCall: function(svc, client){
            return {
                statusCode: 200,
                statusMessage: "Success",
                text: "MOCK RESPONSE"
                };
            }
});
}

/**
 * 
 * @param args
 * @returns
 */
function execute(args) {
    initService();
    let service, result, jsonResponse, errorMessage;
    var order = {};
    order.details = args.poOrder;
    var pwd = Util.VALUE.CREATEMISSINGORDER_PASSWORD;
    try{
        var request = {
            "poOrder" : order.details,
            "pwd": pwd
        };
        result = svc.call(request);
        var resultDetails = result && result.object ? result.object.replace(/[\n\r]+/g, ' ').replace(/\s{2,}/g,' ').replace(/^\s+|\s+$/,'') : null;
        var resultString = resultDetails ? resultDetails.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:([^\/])/g, '"$2":$4') : null;
        var details = resultString ? JSON.parse(resultString) : null;
        if (result.status === 'OK') {
            Logger.info("Created Missing Order: " + args.poOrder.orderId.e4XOrderId );
        }
        if (result.status !== 'OK' || (details && details.status !== 'OK')) {
            var message = !empty(result.errorMessage) ? result.errorMessage : details.statusMessage;
            message = message + ' : ' + order.details.orderId.e4XOrderId;
            if (details && details.statusCode) {
                errorMessage = "Service " + svc.URL + " returned with status " + details.statusCode + " :  e4XOrderId: " + args.poOrder.orderId.e4XOrderId;
            } else {
                errorMessage = "Service " + svc.URL + " :  e4XOrderId: " + args.poOrder.orderId.e4XOrderId;
            }
            args.errorMailContent.add(errorMessage);
            Logger.info("Failed to Create Missing Order: " + args.poOrder.orderId.e4XOrderId);
            Logger.error(errorMessage);
            return PIPELET_ERROR;
        }
    }catch (e){
        errorMessage = "Error while calling service " + svc.URL + ": " + e;
        args.errorMailContent.add(errorMessage);
        Logger.error(errorMessage);    	
        return new Status(Status.ERROR, 'ERROR', e);
    }
    return new Status(Status.OK, 'OK', '');
}

exports.execute = execute;

