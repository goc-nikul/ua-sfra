'use strict';

/**
 * Pipelet for acknowledging Successfully process POs.
 * 
 * @input ackOrderList : dw.util.ArrayList mandatory, list of all orders to be acknowledged
 * @input errorMailContent : dw.util.ArrayList mandatory, list of errors on PO
 * 
 */

const Service = require('dw/svc/Service');
const Result = require('dw/svc/Result');
const Logger = require('dw/system/Logger');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var svc;
var StringUtils = require('dw/util/StringUtils');
var Status = require('dw/system/Status');



function initService() {
	svc = LocalServiceRegistry.createService("borderfree.https.poacknowledgement.post", {
		createRequest: function(svc, args){
			var config = svc.getConfiguration();
			var ackOrderList = args.ackOrderList;
			var isMockMode = svc.isMock();
			if(!isMockMode){
				svc.setThrowOnError();
				var pwd = StringUtils.encodeBase64(config.credential.user+":"+config.credential.password);
				svc.addHeader("Authorization", "Basic "+pwd);
				svc.setRequestMethod("POST");
				var payLoad = {"orderIds" : ackOrderList.toArray()};
				return   JSON.stringify(payLoad);
			}
		},
		parseResponse: function(svc, client) {
			return client;
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

function execute(args)
{
	initService();
	let ackOrderList = args.ackOrderList;
	if(ackOrderList.size() > 0){
		return postPOAcknowledgement(args.ackOrderList, args.errorMailContent);
	}
	
	return PIPELET_NEXT;
}

function postPOAcknowledgement(ackOrderList, errorMailContent){
	let service, result, jsonResponse, errorMessage;
    try{
    	var request = {
    			"ackOrderList" : ackOrderList
    	};
    	Logger.info("Acknowledging " + ackOrderList.getLength() + " POs");
    	result = svc.call(request);
        if(result.ok && result.object && result.object.text) {
        	Logger.info("Acknowledged POs: " + result.object.text);
        }
        if(!result.ok) {
        	errorMessage = "Service " + service.URL + " returned with status " + result.status + ": " + result.errorMessage;
        	errorMailContent.add(errorMessage);
            Logger.error(errorMessage);
        	return new Status(Status.ERROR, 'ERROR', e);
        }
    }catch (e){
    	errorMessage = "Error while calling service " + svc.URL + ": " + e;
    	errorMailContent.add(errorMessage);
        Logger.error(errorMessage);    	
    	return new Status(Status.ERROR, 'ERROR', e);
    }
    
    return new Status(Status.OK, 'OK', '');
}

exports.execute = execute;
