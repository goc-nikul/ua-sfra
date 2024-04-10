'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var ArrayList = require('../../../mocks/dw/dw.util.Collection');
var assert = require('chai').assert;
var TotalsModel;
var Money = require('../../../mocks/dw/dw_value_Money');

var mockSuperModule = require('../../../mockModuleSuperModule');

function baseTotalModelMock() {
    this.orderLevelDiscountTotal = {
        value: 0
    };
    this.shippingLevelDiscountTotal = {
        value: 0
    };
}

var priceAdjustment = new ArrayList ([{
    promotion : {
		calloutMsg :'aaaa'
	},
}]);

var lineItemContainer = {
    customerLocaleID : 'US',
    currencyCode: 'USD',
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
                getpriceAdjustments: function () {
                    return new ArrayList ([{
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
                    }])
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
        return {
            currencyCode: 'USD',
            value: 10
        }
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
	getAdjustedMerchandizeTotalPrice: (param) => {
        if (!param) {
            return new Money(5);
        }
        return new Money(0);
    },
	adjustedShippingTotalPrice: new Money(5),
	shippingTotalPrice: new Money(5),
    totalGrossPrice: {
        value: 99
    },
    getTotalGrossPrice: function () {
        return 100;
    }
};

describe('app_ua_apac/cartridge/models/totals', () => {

    before(function () {
        mockSuperModule.create(baseTotalModelMock);
    });

    it('Testing totals when atomeEnabled is disabled and afterpay disabled', () => {
        session.currency = {
            symbol: '$'
        };
        var TotalModel = proxyquire('../../../../cartridges/app_ua_apac/cartridge/models/totals.js', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                isCountryEnabled: function () { return false; }
            },
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function () { return false; }
                    }
                }
            },
            '*/cartridge/scripts/atome/helpers/atomeHelpers': {
                toFixed: function (installmentGrossPrice) { return installmentGrossPrice.toFixed(2) }
            },
		    '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            'app_ua_core/cartridge/scripts/util/PriceHelper':{
                getProductTotalDiscount: function () {
                    return '';
                }
            }
        });
        var total = new TotalModel(lineItemContainer);
        assert.isUndefined(total.installmentGrandTotal, 'atomeEnabled is disabled and it should not define installmentGrandTotal property');
        assert.isUndefined(total.afterPayCartPrice, 'afterpay is disabled and it should not define afterPayCartPrice property');
    });

    it('Testing totals when atomeEnabled is enabled and afterpay disabled', () => {
        session.currency = {
            symbol: '$'
        };
        var TotalModel = proxyquire('../../../../cartridges/app_ua_apac/cartridge/models/totals.js', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                isCountryEnabled: function () { return false; }
            },
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function () { return true; }
                    }
                }
            },
            '*/cartridge/scripts/atome/helpers/atomeHelpers': {
                toFixed: function (installmentGrossPrice) { return installmentGrossPrice.toFixed(2) }
            },
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            'app_ua_core/cartridge/scripts/util/PriceHelper':{
                getProductTotalDiscount: function () {
                    return '';
                }
            }
        });
        var total = new TotalModel(lineItemContainer);
        assert.isDefined(total.installmentGrandTotal, 'property installmentGrandTotal is not defined in total model');
        assert.equal(total.installmentGrandTotal, '$33.00');
        assert.isUndefined(total.afterPayCartPrice, 'afterpay is disabled and it should not define afterPayCartPrice property');
    });

    it('Testing totals when atomeEnabled is disabled and afterpay enabled', () => {
        session.currency = {
            symbol: '$'
        };
        var TotalModel = proxyquire('../../../../cartridges/app_ua_apac/cartridge/models/totals.js', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                isCountryEnabled: function () { return true; }
            },
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function () { return false; }
                    }
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/scripts/atome/helpers/atomeHelpers': {
                toFixed: function (installmentGrossPrice) { return installmentGrossPrice.toFixed(2) }
            },
            '*/cartridge/scripts/helpers/afterPayHelper': {
                getAfterPayInstallmentPrice: function (price) {
                    return '$' + price / 4;
                }
            },
            'app_ua_core/cartridge/scripts/util/PriceHelper':{
                getProductTotalDiscount: function () {
                    return '';
                }
            }
        });
        var total = new TotalModel(lineItemContainer);
        assert.isUndefined(total.installmentGrandTotal, 'atomeEnabled is disabled and it should not define installmentGrandTotal property');
        assert.isDefined(total.afterPayCartPrice, 'property afterPayCartPrice is not defined');
        assert.equal(total.afterPayCartPrice, '$25');
    });


    it('Testing totals when atomeEnabled is enabled and afterpay enabled', () => {
        session.currency = {
            symbol: '$'
        };
        var TotalModel = proxyquire('../../../../cartridges/app_ua_apac/cartridge/models/totals.js', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                isCountryEnabled: function () { return true; }
            },
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function () { return true; }
                    }
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/scripts/atome/helpers/atomeHelpers': {
                toFixed: function (installmentGrossPrice) { return installmentGrossPrice.toFixed(2) }
            },
            '*/cartridge/scripts/helpers/afterPayHelper': {
                getAfterPayInstallmentPrice: function (price) {
                    return '$' + price / 4;
                }
            },
            'app_ua_core/cartridge/scripts/util/PriceHelper':{
                getProductTotalDiscount: function () {
                    return '';
                }
            }
        });
        var total = new TotalModel(lineItemContainer);
        assert.isDefined(total.installmentGrandTotal, 'installmentGrandTotal should be defined');
        assert.isDefined(total.afterPayCartPrice, 'afterPayCartPrice should be defined');
        assert.equal(total.installmentGrandTotal, '$33.00');
        assert.equal(total.afterPayCartPrice, '$25');
    });

    it('Testing saveTotal and totalEmployeeDiscount attributes in totlas', () => {
        session.currency = {
            symbol: '$'
        };
        var TotalModel = proxyquire('../../../../cartridges/app_ua_apac/cartridge/models/totals.js', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                isCountryEnabled: function () { return true; }
            },
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function () { return true; }
                    }
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/scripts/atome/helpers/atomeHelpers': {
                toFixed: function (installmentGrossPrice) { return installmentGrossPrice.toFixed(2) }
            },
            '*/cartridge/scripts/helpers/afterPayHelper': {
                getAfterPayInstallmentPrice: function (price) {
                    return '$' + price / 4;
                }
            },
            'app_ua_core/cartridge/scripts/util/PriceHelper':{
                getProductTotalDiscount: function () {
                    return '';
                }
            }
        });
        var total = new TotalModel(lineItemContainer);
        assert.isDefined(total.saveTotal, 'saveTotal should be defined');
        assert.isDefined(total.totalEmployeeDiscount, 'totalEmployeeDiscount should be defined');
    });

    it('Testing subTotalWithoutAdjustments with product promotions', () => {
        session.currency = {
            symbol: '$'
        };
        var TotalModel = proxyquire('../../../../cartridges/app_ua_apac/cartridge/models/totals.js', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                isCountryEnabled: function () { return true; }
            },
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function () { return true; }
                    }
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/scripts/atome/helpers/atomeHelpers': {
                toFixed: function (installmentGrossPrice) { return installmentGrossPrice.toFixed(2) }
            },
            '*/cartridge/scripts/helpers/afterPayHelper': {
                getAfterPayInstallmentPrice: function (price) {
                    return '$' + price / 4;
                }
            },
            'dw/util/StringUtils': {
                formatMoney : function (money) {
                    var currencySymbolMapping = {
                        'USD': '$'
                    }
                    return currencySymbolMapping[money.currencyCode] + money.value;
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
        var total = new TotalModel(lineItemContainer);
        assert.equal(total.subTotalWithoutAdjustments, '$9');
    });

});
