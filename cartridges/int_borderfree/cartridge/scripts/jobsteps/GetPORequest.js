'use strict';

/**
 * Pipelet for fetching unacknowledged orders from border free.
 * 
 * @output poOrders : Object mandatory, list of all unacknowledged orders
 * 
 * 
 */

/**
 * Require API dependencies
 */
const Service = require('dw/svc/Service');
const Logger = require('dw/system/Logger');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var StringUtils = require('dw/util/StringUtils');

var svc;

function initService() {
		svc = LocalServiceRegistry.createService("borderfree.https.porequest.get", {
		createRequest: function(svc, args){
			var config = svc.getConfiguration();
			var isMockMode = svc.isMock();
			if(!isMockMode){
				svc.setThrowOnError();
				var pwd = StringUtils.encodeBase64(config.credential.user+":"+config.credential.password);
				svc.addHeader("Authorization", "Basic "+pwd);
				svc.setRequestMethod("GET");
			}
		},
		parseResponse: function(svc, client) {
			// if call is successful, then return the 
			if(client.statusCode == 200){
			 	return client.text;
			}
		},
		mockCall: function(svc, client){
            po = "[     {         \"orderId\": {             \"e4XOrderId\": \"E4X001000904454\",             \"merchantOrderRef\": \"8-UgDJeAVt21pRApwHu1jcqPiqby2nslVljDwQJoa-hwfWrtBgXy9ywSDkj9p_CwNCzJPjAsCsN8vqr1ljWlmQ%3D%3D\"         },         \"orderDates\": {             \"createDate\": \"2019-04-19T20:40:38.000+0000\",             \"expiryDate\": \"2020-04-19T20:40:38.000+0000\"         },         \"fraudState\": \"GREEN\",         \"basketDetails\": {             \"basketItems\": [                 {                     \"basketItemID\": \"7237623\",                     \"merchantSKU\": \"095068990509\",                     \"productName\": \"Trench Coat\",                     \"productURL\": \"http:\/\/www.test.com\/s\/BorderfreePipelines\/095068990509.html\",                     \"productDescription\": \"Our trench coat is a staple in every wardrobe. This trench coat can take you through all seasons!\",                     \"productListPrice\": 180,                     \"productDiscount\": 0,                     \"productSalePrice\": 180,                     \"productQuantity\": 1,                     \"productExtraShipping\": 0,                     \"productParentCategoryID\": \"2c92cedfaf4fac9a3866\",                     \"custom\": \"{\\\"sku\\\":\\\"095068990509\\\",\\\"quantity\\\":1,\\\"\\\":\\\"\\\",\\\"name\\\":\\\"Trench Coat\\\",\\\"description\\\":\\\"\\\",\\\"productUrl\\\":\\\"http:\/\/www.test.com\/s\/BorderfreePipelines\/095068990509.html\\\",\\\"imageUrl\\\":\\\"https:\/\/fiftyone01.tech-prtnr-na01.dw.demandware.net\/on\/demandware.static\/-\/Sites-apparel-catalog\/default\/dw9434e2c7\/images\/small\/PG.Z11712JOT0.SANDUFB.PZ.jpg\\\",\\\"color\\\":\\\"Sand\\\",\\\"size\\\":\\\"XL\\\",\\\"attributes\\\":\\\"Width:Regular\\\",\\\"inventory\\\":\\\"\\\"}\",                     \"productExtraHandling\": 0                 }             ],             \"orderDetails\": {                 \"totalProductSaleValue\": 180,                 \"totalItemLevelDiscounts\": 0,                 \"totalOrderLevelDiscounts\": 5.18,                 \"totalDiscounts\": 5.18,                 \"totalProductVAT\": 0,                 \"totalServiceVAT\": 0,                 \"totalVAT\": 0,                 \"custom\": \"{\\\"\\\":\\\"\\\"}\"             }         },         \"copShippingMethod\": {             \"deliveryType\": \"Standard\",             \"shippingPrice\": 10,             \"handlingPrice\": 0,             \"deliveryPromiseMin\": 0,             \"deliveryPromiseMax\": 0,             \"extraInsurancePrice\": 0         },         \"domesticProfile\": {             \"Billing\": {                 \"firstName\": \"vPayment\",                 \"lastName\": \"E4X\",                 \"addressLine1\": \"292 Madison Avenue\",                 \"addressLine2\": \"5th Floor\",                 \"city\": \"New York\",                 \"region\": \"NY\",                 \"country\": \"US\",                 \"postalCode\": \"10017\",                 \"email\": \"E4X001000904454@sandboxorders.fiftyone.com\",                 \"primaryPhone\": \"18002073295\"             },             \"Shipping\": {                 \"firstName\": \"asdf\",                 \"lastName\": \"asdf\",                 \"addressLine1\": \"4900 Creekside Parkway\",                 \"addressLine2\": \"E4X001000904454\",                 \"city\": \"Lockbourne\",                 \"region\": \"OH\",                 \"country\": \"US\",                 \"postalCode\": \"43194\",                 \"email\": \"E4X001000904454@sandboxorders.fiftyone.com\",                 \"primaryPhone\": \"2122993555\"             }         },         \"creditCard\": {             \"type\": \"MASTERCARD\",             \"nameOnCard\": \"E4X vPayment\",             \"number\": \"5105105105105100\",             \"cvn\": \"999\",             \"expiry\": {                 \"month\": \"04\",                 \"year\": \"2022\"             }         },         \"marketing\": {             \"Shipping\": {                 \"firstName\": \"asdf\",                 \"lastName\": \"asdf\",                 \"addressLine1\": \"Av 123e\",                 \"city\": \"Saint-hippolyte\",                 \"region\": \"QC\",                 \"country\": \"CA\",                 \"postalCode\": \"J8A2G7\",                 \"email\": \"lawrence.walters@capgemini.com\",                 \"primaryPhone\": \"+1224-725-0292\"             },             \"Billing\": {                 \"firstName\": \"asdf\",                 \"lastName\": \"asdf\",                 \"addressLine1\": \"Av 123e\",                 \"city\": \"Saint-hippolyte\",                 \"region\": \"QC\",                 \"country\": \"CA\",                 \"postalCode\": \"J8A2G7\",                 \"email\": \"lawrence.walters@capgemini.com\",                 \"primaryPhone\": \"+1224-725-0292\"             }         }     } ]"		;
            return {
		        statusCode: 200,
		        statusMessage: "Success",
		        text: po
            };
		}
	});
}


function execute(args)
{
	
	// get orders
	args.poOrders = getPoRequest();
	
	return PIPELET_NEXT;
}


/**
 * function to invoke PO Request to get Unacknowledged orders
 */
function getPoRequest(){
	initService();
	let service, result, jsonResponse;
    try{
        result = svc.call();
        if (null != result.object){
        	 jsonResponse = JSON.parse(result.object);
        }
    }catch (e){
    	var error = svc.URL + e;
    	Logger.error( "Error while calling PO Service " + svc.URL + e);
    	return PIPELET_ERROR;
    }
    
    return jsonResponse
}

exports.getPoRequest = getPoRequest;

