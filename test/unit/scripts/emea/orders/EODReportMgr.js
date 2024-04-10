'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var ArrayList = require('../../../../mocks/dw/dw.util.Collection');
global.instanceof;
var orders = new ArrayList ([{
    custom: {
        adyenPaymentMethod: true,
    },
    getOrderNo: function () {
		     return ''
     }
}]);

var moreOrders = new ArrayList ([{
    custom: {
        adyenPaymentMethod: true,
    },
    getOrderNo: function () {
		     return ''
     }
}]);

class Calendar {
    constructor(date) {
        this.date = date;
    }
}

describe('app_ua_emea/cartridge/scripts/orders/EODReportMgr', () => {
	var EODReportMgr = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/orders/EODReportMgr.js', {
            'int_customfeeds/cartridge/scripts/util/JSONUtils': {
                getValue: function (data) {
	                return JSON.parse(data);
	            },
	            parse: function (data) {
	                return JSON.parse(data);
	            }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            'dw/util/StringUtils': {
        		formatCalendar: () => ''
    		},
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => null,
                queryCustomObjects: () => null,
                queryCustomObjects: () => {
                    return {
                        asList: function () {
				            return {
					              toArray: function () {
					                     return {};
					                 }
					           };
		        		}
                    }
                },
                createCustomObject: () => {
                    return {
                        custom: {
							data : '{"data":[{"name":"aaa", "value":"1212"}]}'
						}
                    }
                }
            },
             'dw/util/SeekableIterator': ArrayList,
    		'dw/util/Calendar': Calendar,
            'dw/system/Logger': {
        		getLogger: () => ''
    		},
     });
    
    it('Testing if getPLIDeliveryNumber will return delivery number', () => {
		var day = '05/05/2003';
		var result = EODReportMgr.getDayData(day);
		assert.isDefined(result, 'result is uefined');
    });
    
    it('Testing if getCustomObjectForEdit will return custom object number', () => {
		var day = '05/05/2003';
		var incDec = '05/05/2003';
		var result = EODReportMgr.getCustomObjectForEdit(day, incDec);
		assert.isDefined(result, 'result is defined');
    });
    
    it('Testing if setReportValue will return delivery number', () => {
		var day = '05/05/2003';
		var reportType = 'aaaa';
		var value = {
			orders: orders,
            moreOrders: moreOrders,
			count : 2222
		};
		var incDec = 'aaaa';
		var result = EODReportMgr.setReportValue(day, reportType, value, incDec);
		assert.isDefined(result, 'result is defined');
    });
    
    it('Testing if setReportValue will return delivery number', () => {
	var newOrders = new ArrayList ([{
		    custom: {
		        adyenPaymentMethod: true,
		    },
		    getOrderNo: function () {
				     return ''
		     }
		},
		{
		    custom: {
		        adyenPaymentMethod: true,
		    },
		    getOrderNo: function () {
				     return ''
		     }
		}]);
		var day = '05/05/2003';
		var reportType = 'aaaa';
		var value = {
			orders: newOrders,
            moreOrders: moreOrders,
			count : 10002
		};
		var incDec = 'aaaa';
		var result = EODReportMgr.setReportValue(day, reportType, value, incDec);
		assert.isDefined(result, 'result is defined');
    });
    
    it('Testing if incrementReportValue will return delivery number', () => {
		var day = '';
		var reportType = 'aaaa';
		var order = {
			replacedOrder: {
		        customerName: 'under armour',
		        getCreationDate: function () {
		            return {};
		        },
		        getOrderNo: function () {
		            return {};
		        },
	    },
	    getOrderNo: function () {
	            return {};
	        },
        getCreationDate: function () {
            return {};
        },
    };
		var result = EODReportMgr.incrementReportValue(reportType, day, order);
		assert.isDefined(result, 'result is defined');
    });
    
    it('Testing if decrementReportValue will return delivery number', () => {
		var day = '';
		var reportType = 'aaaa';
		var order = {
			replacedOrder: {
		        customerName: 'under armour',
		        getCreationDate: function () {
		            return {};
		        },
		        getOrderNo: function () {
		            return {};
		        },
	    	},
		    getOrderNo: function () {
		            return {};
		        },
	        getCreationDate: function () {
	            return {};
	        },
    	};
		var result = EODReportMgr.decrementReportValue(reportType, day, order);
		assert.isDefined(result, 'result is defined');
    });
    
    it('Testing if getQueueObjects will return delivery number', () => {
		var EODCustomObj = {};
		var queryString = 'aaaa';
		var sortString = 'aaaa';
		var result = EODReportMgr.getQueueObjects(EODCustomObj, queryString, sortString);
		assert.isDefined(result, 'result is defined');
    });
    
});
