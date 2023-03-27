'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var ArrayList = require('../../../../mocks/dw/dw.util.Collection');


describe('app_ua_emea/cartridge/scripts/orders/ShippingUtils', () => {
	var ShippingUtils = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/orders/ShippingUtils.js', {
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/value/Money': require('../../../../mocks/dw/dw_value_Money'),
            'dw/util/ArrayList': ArrayList,
            '*/cartridge/scripts/util/collections': require('../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections')
     });
    it('Testing if getQtyJsonPLIBySku will return qty', () => {
		var orderJsonObj =  [{
			           items: {
							aaaa : 1
						}
			     }]
		var sku = 'aaaa';
		var total = 0;
		var result = ShippingUtils.prototype.getQtyJsonPLIBySku(sku ,orderJsonObj, total);
		assert.equal(result, 1);
    });
    
    it('Testing if getPLIDeliveryNumber will return delivery number', () => {
		var shippingJson = "[{\"emailSent\":true,\"date\":\"2019-08-12T01:01:01.000Z\",\"carrier\":\"UPS-STD\",\"deliveryNumber\":\"07373737377727\",\"trackingCode\":\"1Z0WE74368037111202PAUL2\",\"trackingLink\":\"\",\"items\":{\"3021034-201-11\":\"1\"},\"sentToPaazl\":true}]";
		var pliSku = 'aaaa';
		var result = ShippingUtils.prototype.getPLIDeliveryNumber(shippingJson ,pliSku);
		assert.isUndefined(result, 'result is undefined');
    });
    
    it('Testing if parseJsonSafely will return json', () => {
		var jsonString =  "[{\"emailSent\":true,\"date\":\"2019-08-12T01:01:01.000Z\",\"carrier\":\"UPS-STD\",\"deliveryNumber\":\"07373737377727\",\"trackingCode\":\"1Z0WE74368037111202PAUL2\",\"trackingLink\":\"\",\"items\":{\"3021034-201-11\":\"1\"},\"sentToPaazl\":true}]";
		var result = ShippingUtils.prototype.parseJsonSafely(jsonString);
		assert.isDefined(result, 'result is fined');
    });
    
    it('Testing if parseJsonSafely will return json', () => {
		var jsonString =  {"items":[{"name":"aaa", "amount":"1212"}]};
		var result = ShippingUtils.prototype.parseJsonSafely(jsonString);
		assert.isDefined(result, 'result is defined');
    });
    
    it('Testing if getShippedCollection will return json', () => {
		var jsonString =  [
				  {
				    "emailSent": true,
				    "date": "2019-08-12T01:01:01.000Z",
				    "carrier": "UPS-STD",
				    "deliveryNumber": "07373737377727",
				    "trackingCode": "1Z0WE74368037111202PAUL2",
				    "trackingLink": "",
				    "items": {
				      "3021034-201-11": "1"
				    },
				    "sentToPaazl": true
				  }
			];
		var productLineItems = new ArrayList ([{
				    product: {
				        custom :{
							sku : 'ssss'
						}
				    },
		}]);
		var result = ShippingUtils.prototype.getShippedCollection(jsonString,productLineItems);
		assert.isDefined(result, 'result is defined');
    });
    
    it('Testing if getNotShippedCollection will return json', () => {
		var jsonString =  [
				  {
				    "emailSent": true,
				    "date": "2019-08-12T01:01:01.000Z",
				    "carrier": "UPS-STD",
				    "deliveryNumber": "07373737377727",
				    "trackingCode": "1Z0WE74368037111202PAUL2",
				    "trackingLink": "",
				    "items": {
				      "3021034-201-11": "1"
				    },
				    "sentToPaazl": true
				  }
			];
		var productLineItems = new ArrayList ([{
				    product: {
				        custom :{
							sku : '3021034-201-11',
							virtualProduct : '3021034-201-11'
						}
				    },
				    custom :{
							sku : '3021034-201-11'
						},
				    getQuantity: function () {
        				return 1;
   				 }
		}]);
		var result = ShippingUtils.prototype.getNotShippedCollection(jsonString,productLineItems);
		assert.isDefined(result, 'result is defined');
    });
    
    it('Testing if getOnlyShippableItems will return json', () => {
		var productLineItems = new ArrayList ([{
				    product: {
				        custom :{
							sku : '3021034-201-11',
							virtualProduct : '3021034-201-11'
						}
				    },
				    custom :{
							sku : '3021034-201-11'
						},
				    getQuantity: function () {
        				return 1;
   				 }
		}]);
		var result = ShippingUtils.prototype.getOnlyShippableItems(productLineItems);
		assert.isDefined(result, 'result is defined');
    });
    
    it('Testing if getSapItems will return sapItems', () => {
		var jsonString =  [
				  {
				    "emailSent": true,
				    "date": "2019-08-12T01:01:01.000Z",
				    "carrier": "UPS-STD",
				    "deliveryNumber": "07373737377727",
				    "trackingCode": "1Z0WE74368037111202PAUL2",
				    "trackingLink": "",
				    "items": {
				      "3021034-201-11": "1"
				    },
				    "sentToPaazl": true
				  }
			];
		var result = ShippingUtils.prototype.getSapItems(jsonString);
		assert.isDefined(result, 'result is defined');
    });
    
    it('Testing if updateEmailFlag will updaate the email flag', () => {
		var jsonString =  [
				  {
				    "emailSent": true,
				    "date": "2019-08-12T01:01:01.000Z",
				    "carrier": "UPS-STD",
				    "deliveryNumber": "07373737377727",
				    "trackingCode": "1Z0WE74368037111202PAUL2",
				    "trackingLink": "",
				    "items": {
				      "3021034-201-11": "1"
				    },
				    "sentToPaazl": true
				  }
			];
		var result = ShippingUtils.prototype.updateEmailFlag(jsonString);
		assert.isDefined(result, 'result is defined');
    });
    
    it('Testing if getUpdatedLineItemPrice will return json', () => {
		var qty =  2;
		var productLineItems ={
			adjustedPrice : 40,
			getQuantity: function () {
		            return {
			              value :2
			           };
        		},
		};
		var result = ShippingUtils.prototype.getUpdatedLineItemPrice(productLineItems, qty);
		assert.equal(result.value, 40);
    });
    
     it('Testing if isShortShip will return boolean', () => {
			var productLineItems = new ArrayList ([{
				    product: {
				        custom :{
							sku : '3021034-201-11',
							virtualProduct : '3021034-201-11'
						}
				    },
				    custom :{
							sku : '3021034-201-11'
						},
				    getQuantity: function () {
        				return 1;
   				 }
		}]);
		var order = {
			custom :{
					shippingJson : "[{\"emailSent\":true,\"date\":\"2019-08-12T01:01:01.000Z\",\"carrier\":\"UPS-STD\",\"deliveryNumber\":\"07373737377727\",\"trackingCode\":\"1Z0WE74368037111202PAUL2\",\"trackingLink\":\"\",\"items\":{\"3021034-201-11\":\"1\"},\"sentToPaazl\":true}]"
			},
			shipments :[{productLineItems : productLineItems}] 
		};
		
		var result = ShippingUtils.prototype.isShortShip(order);
		assert.isDefined(result, 'result is defined');
    });
    
    it('Testing if getLastShipmentQty will return qty', () => {
			var productLineItems = new ArrayList ([{
				    product: {
				        custom :{
							sku : '3021034-201-11',
							virtualProduct : '3021034-201-11'
						}
				    },
				    custom :{
							sku : '3021034-201-11'
						},
				    getQuantity: function () {
        				return 1;
   				 }
		}]);
		var order = {
			custom :{
					shippingJson : "[{\"emailSent\":true,\"date\":\"2019-08-12T01:01:01.000Z\",\"carrier\":\"UPS-STD\",\"deliveryNumber\":\"07373737377727\",\"trackingCode\":\"1Z0WE74368037111202PAUL2\",\"trackingLink\":\"\",\"items\":{\"3021034-201-11\":\"1\"},\"sentToPaazl\":true}]"
			},
			shipments :[{productLineItems : productLineItems}] 
		};
		
		var result = ShippingUtils.prototype.getLastShipmentQty(order);
		assert.isDefined(result, 'result is defined');
    });
    
    
    it('Testing if getOlreadyShipmentsQty will return qty', () => {
			var productLineItems = new ArrayList ();
		var order = {
			custom :{
					shippingJson : "[{\"emailSent\":true,\"date\":\"2019-08-12T01:01:01.000Z\",\"carrier\":\"UPS-STD\",\"deliveryNumber\":\"07373737377727\",\"trackingCode\":\"1Z0WE74368037111202PAUL2\",\"trackingLink\":\"\",\"items\":{\"3021034-201-11\":\"1\"},\"sentToPaazl\":true}]"
			},
			shipments :[{productLineItems : productLineItems}] 
		};
		var isLast = false;
		var result = ShippingUtils.prototype.getOlreadyShipmentsQty(order, isLast);
		assert.isDefined(result, 'result is defined');
    });
    
    it('Testing if isPLIShipped will return bollen', () => {
		var shippingJson =  [
				  {
				    "emailSent": true,
				    "date": "2019-08-12T01:01:01.000Z",
				    "carrier": "UPS-STD",
				    "deliveryNumber": "07373737377727",
				    "trackingCode": "1Z0WE74368037111202PAUL2",
				    "trackingLink": "",
				    "items": {
				      "3021034-201-11": "1"
				    },
				    "sentToPaazl": true
				  }
			];
		var pli = {
				  custom :{
					sku : 'ssss'
					},
				    getQuantity: function () {
		            	return 1;
        			},
				};
		var isShipped = true;
		var result = ShippingUtils.prototype.isPLIShipped(pli, shippingJson, isShipped);
		assert.isTrue(result);
    });
    
});
