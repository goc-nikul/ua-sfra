'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var ArrayList = require('../../../mocks/dw/dw.util.Collection');

var Site = {
    current: {
        getCustomPreferenceValue: function () { return { paazlEnabled: true }; }
    }
};

var priceAdjustment = new ArrayList ([{
    promotion : {
		calloutMsg :'aaaa'
	},
}]);

var lineItemContainer = {
	customerLocaleID : 'US',
	defaultShipment: {
		 custom: {
		 	paazlDeliveryInfo: '',
			}
	},
	couponLineItems :[{
		priceAdjustments:priceAdjustment,
		couponLineItem:'aaaa',
		couponCode:'coupon',
		applied:'aaaa',
		valid:true
	}],
    getAllProductLineItems: function () {
        return [
            {
                UUID: '9876543210',
                custom : {
					sku: '9876543210'
				},
                getProduct: function () {
		            return {
		                custom: {
			                bvAverageRating: 'bvAverageRating'
			            },
			            isVariant: function () {
			                return true;
			            },
			            getID: function () {
			                return {};
			            },
			            getUPC: function () {
			                return {};
			            },
			            getMasterProduct: function () {
			                return {
			                    getID: function () {
			                        return {};
			                    }
			                };
			            }
		            };
        		},
        		getShipment: function () {
		            return {
						shippingStatus : 'SHIPPING_STATUS_NOTSHIPPED',
						custom: {
							paazlDeliveryInfo:false
						},
						shippingAddress: {
		                    firstName: 'David',
		                    lastName: 'Johnson',
		                    address1: '25 Quincy Rd.',
		                    address2: '',
		                    city: 'Boston',
		                    postalCode: '01234',
		                    countryCode: {
		                        value: 'us'
		                    },
		                    phone: '617-777-1010',
		                    stateCode: 'MA',
                		},
                		getID: function () {
                               return 'aaaaa';
                        }
					};
        		},
        		getPrice: function () {
                          return {
                            divide: function () {
                                return {
                                   equals: function () {
                                      return false;
                                     }
                                 };
                                },
                             subtract: function () {
                                return '1';
                                }
                           };
                },
                getProratedPrice: function () {
                          return {
                            divide: function () {
                                return '1';
                                },
                            subtract: function () {
                                return '1';
                                }
                           };
                },
        		getQuantityValue: () => 1,
        		getQuantity: function () {
		            return {
			              getValue: function () {
			                     return {};
			                 }
			           };
        		},
        		getOrderItem: function () {
		            return {
			              getItemID: function () {
			                     return {};
			                 }
			           };
        		}
            }
        ];
    },
    getReturnCases: function () {
        return {
            size: function () { return 0; }
        };
    },
    getReturnCaseItems: function () {
        return '';
    },
    getMerchandizeTotalPrice: function () {
        return 10;
    },
    getTotalGrossPrice: function () {
        return 10;
    },
    custom: {
		 shippingJson: '',
	},
	priceAdjustments: new ArrayList ([{
		promotion : {
			calloutMsg :'aaaa',
			basedOnSourceCodes: 'basedOnSourceCodesz',
			sourceCodeGroups: new ArrayList([
				{
					ID: 'ID'
				}
			])
		},
		basedOnCoupon: false,
		price: {
			value: '1'
		}
	}]),
	getAdjustedMerchandizeTotalPrice: function () {
		return 10;
	}
};


describe('app_ua_emea/cartridge/models/totals', () => {

    it('Testing if container view is not orderDetails or basket', () => {
        var TotalsModel = proxyquire('../../../../cartridges/app_ua_emea/cartridge/models/totals.js', {
            'app_storefront_base/cartridge/models/totals': {
	            call: function () {
	                return {};
	            }
        	},
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            'dw/util/StringUtils': {
        		formatMoney: (price) => '$' + price.value
    		},
    		'dw/system/Site': Site,
    		'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
    		'*/cartridge/scripts/checkout/checkoutHelpers': {
	            isKlarnaPaymentEnabled: function () {
	                return true;
	            }
        	},
        	'*/cartridge/scripts/marketing/klarnaOSM': {
	            formatPurchaseAmount: function () {
	                return '12';
	            }
        	}
        });
		
		request.locale = 'en_US';
		request.setLocale = function() {
            return 'en_US';
        }
        var options = { containerView: 'orderDetails' };
        var totals = new TotalsModel(lineItemContainer, options);
        assert.isDefined(totals, 'totals items are defined');
    });

});
