'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var ArrayList = require('../../../mocks/dw/dw.util.Collection');
var mockSuperModule = require('../../../mockModuleSuperModule');
var sinon = require('sinon');
var stubisKlarnaPaymentEnabled = sinon.stub();
var Money = require('../../../mocks/dw/dw_value_Money');
var totals;
var TotalsModel;

var Site = {
    current: {
        getCustomPreferenceValue: function () { return { paazlEnabled: true }; }
    }
};

function baseTotalModelMock(_this) {
    _this.orderLevelDiscountTotal = {
        value: 0
    };
    _this.shippingLevelDiscountTotal = {
        value: 0
    };
}

var total = {
    available: '',
    value: '40'
};

var Template = function () {
    return {
        render: function () {
            return {
                text: 'returning text'
            }
        }
    }
};

var priceAdjustment = new ArrayList ([{
    promotion: {
        calloutMsg: 'Hello',
        ID: '2HGDDJ',
        custom: {
            isEmployeeDiscount: true
        },
        getPromotionClass: function () {
            return {};
        }
    },
    price:{
        value:231
    },
}]);

var priceAdjustments = {
    item: [{
        promotion: [Object],
        price: 90
    }],
    basedOnCoupon: true,
    price: 67,
    empty: true,
    length: 1,
    promotion: {
        basedOnSourceCodes: [{
            ID: 'RTE345'
        }],
        sourceCodeGroups: [{
            ID: 'RTE345'
        }],
        custom: {
            isEmployeeDiscount: true
        }
    }
};

var lineItemContainer = {
	customerLocaleID : 'US',
	currencyCode: '$',
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
	priceAdjustments: [priceAdjustments],
	allShippingPriceAdjustments: [priceAdjustments],
	custom: 'ABS',
    getAllProductLineItems: function () {
        return [
            {
                UUID: '9876543210',
                custom : {
					sku: '9876543210'
				},
				product: {
					priceModel: 1,
					custom: {}
				},
				priceAdjustments: [],
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
	getAdjustedMerchandizeTotalPrice: () => {
        return {
            subtract: () => {
                return {
                    add: () => {
                        return {
                            value: 345
                        }
                    }
                }
            }
        }
    },
	getMerchandizeTotalPrice: () => {
        return total;
    },
    price: {
        value: 100
    },
    adjustedShippingTotalPrice: new Money(5),
    shippingTotalPrice: new Money(15),
    getAdjustedMerchandizeTotalPrice: (param) => {
        if (!param) {
            return new Money(5);
        }
        return new Money(0);
    },
};


describe('app_ua_emea/cartridge/models/totals', () => {
	 TotalsModel = proxyquire('../../../../cartridges/app_ua_emea/cartridge/models/totals.js', {
        'dw/util/HashMap' : require('../../../mocks/dw/dw_util_HashMap'),
        'dw/util/Template' : Template,
        'app_storefront_base/cartridge/models/totals': {
            call: function (_this) {
                baseTotalModelMock(_this);
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
    	},
		'*/cartridge/scripts/checkout/checkoutHelpers': {
			isKlarnaPaymentEnabled : stubisKlarnaPaymentEnabled
		},
        'dw/util/Currency': {
            getCurrency: function (currencyCode='USD') {
                return currencyCode;
            }
        },
        '*/cartridge/scripts/factories/price': {
            getListPrice: function () {
                return null;
            }
        },
        'app_ua_core/cartridge/scripts/util/PriceHelper':{
            getProductTotalDiscount: function () {
                return {
                    value: 1,
                    formatted: '$1'
                };
            }
        }
    });

    it('Testing if container view is not orderDetails or basket', () => {
        session.setCurrency = function () {
            return 'USD'
        };
        session.getCurrency = function () {
            return {
                getCurrencyCode: function () {
                    return 'USD';
                }
            };
        };
		request.locale = 'en_US';
		request.setLocale = function() {
            return 'en_US';
        }
        var options = { containerView: 'orderDetails' };
        totals = new TotalsModel(lineItemContainer, options);
        assert.isDefined(totals, 'totals items are defined');
    });

    it('Testing totals model for totalListPrice is null', () => {
        totals = new TotalsModel(lineItemContainer);

        assert.isNotNull(totals, 'online should exists');
        assert.isNotNull(totals.totalListPrice, 'totalListPrice should exists');
    });
	it('Testing stubisKlarnaPaymentEnabled is enabled', () => {
        stubisKlarnaPaymentEnabled.returns(true);
        stubisKlarnaPaymentEnabled.reset();

        totals = new TotalsModel(lineItemContainer);
        assert.isNotNull(totals, 'online should exists');
    });

    it('Testing stubisKlarnaPaymentEnabled is disabled', () => {
        stubisKlarnaPaymentEnabled.returns(false);
        stubisKlarnaPaymentEnabled.reset();

        totals = new TotalsModel(lineItemContainer);
        assert.isNotNull(totals, 'online should exists');
    });

});
