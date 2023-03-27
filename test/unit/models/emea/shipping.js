'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var sinon = require('sinon');
var ArrayList = require('../../../mocks/dw/dw.util.Collection');

var mockSuperModule = require('../../../mockModuleSuperModule');
var baseOrderModelMock = require('./baseOrderModel');

var productLineItemsData = new ArrayList ([{
    productID: 'aaa',
    quantity: {
        value: 1
    }
}]);

var shipment = {
	shippingMethodID: 'shippingMethodID',
    productLineItems: productLineItemsData,
    custom: {
		paazlSelectedShippingMethod: {},
        fromStoreId: 'aa',
        paazlDeliveryInfo: '{"paazlDeliveryInfo":[{"name":"aaa", "ID":"1212"}], "deliveryType": "PICKUP_LOCATION", "pickupLocation": {"address": {}}}',
    }
};

var Site = {
    current: { 
		preferences: {
			custom: {
				isBOPISEnabled :true
			}	
		},
        getCustomPreferenceValue: function () { return { isBOPISEnabled: true, paazlEnabled : true }; }
    }
};

class Test {
    constructor(paazlDeliveryInfo) {
        this.paazlDeliveryInfo = paazlDeliveryInfo;
    }
}

describe('app_ua_emea/cartridge/models/shipping', () => {

    before(function () {
        mockSuperModule.create(baseOrderModelMock);
    });

    it('Testing if container view is not orderDetails or basket', () => {
        var ShippingModel = proxyquire('../../../../cartridges/app_ua_emea/cartridge/models/shipping.js', {
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/util/Locale': {
	            getLocale: function () {
	                return {
	                    country: 'US'
	                };
	            }
	        },
	        'dw/system/Logger': {
	            getLogger: function () {
	                return '';
	            }
	        },
	        '*/cartridge/scripts/helpers/productHelpers': {
	            showGiftBoxes: function () {
	                return {};
	            }
        	},
        	'*/cartridge/scripts/helpers/paazlHelper': {
	            getShippingMethodID: function () {
	                return {};
	            },
	            getPaazlStatus: function () {
	                return {
						active : true 		
					};
	            }
        	},
	        'dw/system/Site': Site,
	        'dw/catalog/StoreMgr': {
				getStore: function () {
	                return {
						name : 'aaaa' 		
					};
	            },
			},
			'*/cartridge/models/shipping/paazlShippingMethod': Test,
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
    		'dw/util/Calendar': {
                formatCalendar: function (calander) {
	                 return calander.toTimeString();
	            }
            },
			'*/cartridge/scripts/checkout/checkoutHelpers': {
				getInternationalShippingCountriesList: function () {
					return {};
				}
			}
        });
		
		request.locale = 'en_US';
		request.setLocale = function() {
            return 'en_US';
        }
        var containerView = 'orderDetails';
        var address = {};
        var shipping = new ShippingModel(shipment, address, customer, containerView);
        assert.isDefined(shipping, 'line items are not defined');
    });

	it('Testing if container view is not orderDetails or basket --> shipment has valid shippingMethodID', () => {
        var ShippingModel = proxyquire('../../../../cartridges/app_ua_emea/cartridge/models/shipping.js', {
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/util/Locale': {
	            getLocale: function () {
	                return {
	                    country: 'US'
	                };
	            }
	        },
	        'dw/system/Logger': {
	            getLogger: function () {
	                return '';
	            }
	        },
	        '*/cartridge/scripts/helpers/productHelpers': {
	            showGiftBoxes: function () {
	                return {};
	            }
        	},
        	'*/cartridge/scripts/helpers/paazlHelper': {
	            getShippingMethodID: function () {
	                return 'shippingMethodID1';
	            },
	            getPaazlStatus: function () {
	                return {
						active : false
					};
	            }
        	},
	        'dw/system/Site': Site,
	        'dw/catalog/StoreMgr': {
				getStore: function () {
	                return {
						name : 'aaaa'
					};
	            },
			},
			'*/cartridge/models/shipping/paazlShippingMethod': Test,
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
    		'dw/util/Calendar': {
                formatCalendar: function (calander) {
	                 return calander.toTimeString();
	            }
            },
			'*/cartridge/scripts/checkout/checkoutHelpers': {
				getInternationalShippingCountriesList: function () {
					return {};
				}
			}
        });
		request.locale = 'en_US';
		request.setLocale = function() {
            return 'en_US';
        }
        var containerView = 'orderDetails';
        var address = {};
		var shipment = {
			shippingMethodID: 'shippingMethodID',
			productLineItems: productLineItemsData,
			custom: {
				paazlSelectedShippingMethod: {},
				fromStoreId: 'aa',
				paazlDeliveryInfo: '{"paazlDeliveryInfo":[{"name":"aaa", "ID":"1212"}], "deliveryType": "PICKUP_LOCATION", "pickupLocation": {"address": {}}}',
			},
			shippingAddress: {
				countryCode: {
					value: 'US'
				}
			}
		};
		var customer = {
			addressBook: {
				addresses: [{
					countryCode: 'US',
					isEquivalentAddress: function () {
						return true
					}
				}]
			}
		}
        var shipping = new ShippingModel(shipment, address, customer, containerView);
        assert.isDefined(shipping, 'line items are not defined');
    });

	it('Test Custom Exception', () => {
        var ShippingModel = proxyquire('../../../../cartridges/app_ua_emea/cartridge/models/shipping.js', {
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/util/Locale': {
	            getLocale: function () {
	                return {
	                    country: 'US'
	                };
	            }
	        },
	        'dw/system/Logger': {
	            getLogger: function () {
	                return {
						error: function () {
							return 'error'
						}
					};
	            },
	        },
	        '*/cartridge/scripts/helpers/productHelpers': {
	            showGiftBoxes: function () {
	                return {};
	            }
        	},
        	'*/cartridge/scripts/helpers/paazlHelper': {
	            getShippingMethodID: function () {
	                return 'shippingMethodID1';
	            },
	            getPaazlStatus: function () {
	                return {
						active : true
					};
	            }
        	},
	        'dw/system/Site': Site,
	        'dw/catalog/StoreMgr': {
				getStore: function () {
	                return {
						name : 'aaaa'
					};
	            },
			},
			'*/cartridge/models/shipping/paazlShippingMethod': Test,
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
    		'dw/util/Calendar': {
                formatCalendar: function (calander) {
	                 return calander.toTimeString();
	            }
            },
			'*/cartridge/scripts/checkout/checkoutHelpers': {
				getInternationalShippingCountriesList: function () {
					return {};
				}
			}
        });
		request.locale = 'en_US';
		request.setLocale = function() {
            return 'en_US';
        }
        var containerView = 'orderDetails';
        var address = {};
		var shipment = {
			shippingMethodID: 'shippingMethodID',
			productLineItems: productLineItemsData,
			custom: {
				paazlSelectedShippingMethod: {},
				fromStoreId: 'aa',
				paazlDeliveryInfo: '{paazlDeliveryInfo[{"name":"aaa", "ID":"1212"}], "deliveryType": "PICKUP_LOCATION", "pickupLocation": {"address": {}}}',
			},
			shippingAddress: {
				countryCode: {
					value: 'US'
				}
			}
		};
		var customer = {
			addressBook: {
				addresses: [{
					countryCode: 'US',
					isEquivalentAddress: function () {
						return true
					}
				}]
			}
		}
        var shipping = new ShippingModel(shipment, address, customer, containerView);
        assert.isDefined(shipping, 'line items are not defined');
    });

});
