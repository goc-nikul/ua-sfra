'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var sinon = require('sinon');

var mockSuperModule = require('../../../mockModuleSuperModule');
var baseOrderModelMock = require('./baseOrderModel');

var ReturnsUtils = function () {
    return {
        getReturnCaseItems: function () {
            return {
                isEligibleForReturn: true,
                ineligibilityReasonTxt: true
            };
        },
        getQTYInformation: function () {
            return {
                availableQTY: 0,
				shippedQty: 1
            };
        },
        getReturnsPreferences: function () {
            return {
                isReturnsAvailable: true
            };
        },
        getPreferenceValue: function () {
            return 'aaaaa';
        },
        getPLIShippingDate: function () {
            return {
                isEligibleForReturn: true,
                ineligibilityReasonTxt: true
            };
        },
        isProductReturnBlocked: function () {
            return true;
        },
		parseJsonSafely: (data) => {
            return JSON.parse(data);
        },
		getShippingTrackingLink: function () {
			return {};
		},
		getReturnStatus: function () {
			return 'BEING_PROCESSED';
		},
		isPartiallyShipped: function () {
			return {};
		}
    };
};

var lineItemContainer = {
	customerLocaleID : 'US',
    getProductLineItems: function () {
        return [
            {
				product: {},
				quantity: {
					value: 2
				},
				productID:'productID',
                UUID: '9876543210',
                custom : {
					sku: '9876543210',
					refundsJson: 'aa',
					shippingJson:'aa' 
				},
				cartFullDesktop: [
					{}
				],
                getProduct: function () {
		            return {
						cartFullDesktop: [
							{}
						],
		                custom: {
			                bvAverageRating: 'bvAverageRating',
			                bvReviewCount: 'bvReviewCount',
			                sku: 'sku',
			                giftCard: 'giftCard',
			                size: 'size'
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
			            variationModel: {
			                master: {
			                    ID: '1330767'
			                },
			                selectedVariant: false,
			                productVariationAttributes: [{
			                    ID: 'color'
			                }, {
			                    ID: 'size'
			                }],
			                getAllValues: function () {
			                    return [{
			                        value: 'someValue',
			                        ID: 'size'
			                    }];
			                },
			                setSelectedAttributeValue: function () {},
			                getSelectedVariant: function () {},
			                getSelectedValue: function (sizeAttr) {
			                    return sizeAttr;
			                }
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
						ID : 'aaaaa',
						custom: {
							paazlDeliveryInfo:true
						},
						shippingAddress: {
		                    firstName: 'David',
		                    lastName: 'Johnson',
		                    address1: '25 Quincy Rd.',
		                    address2: 'address2',
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
                                }
                           };
                },
                getProratedPrice: function () {
                          return {
                            divide: function () {
                                return '1';
                                }
                           };
                },
                 proratedPrice:  {
                            divide: function () {
                                return {
									multiply: function () {
										return {
											multiply: function () {
												return '1';
											}
										};
									}
								}
                                },
                },
                quantityValue : 1,
                adjustedTax:  {
                            divide: function () {
                                return {
									multiply: function () {
										return '1';
									}
								};
                                }
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
    getCurrencyCode : function(){
		return 'USD'
	},
    getReturnCases: function () {
        return {
            size: function () { return 0; }
        };
    },
    getShippingStatus: function () {
        return {
            value: 2
        };
    },
    getStatus: function () {
        return {
            value: 5 //SHIPPED
        };
    },
    getReturnCaseItems: function () {
        return '';
    },
    custom: {
		 shippingJson: '',
		 refundsJson: '[{"refundDate":"1/1/2022"},{"refundDate":"1/1/2022"}]'
	},
	orderNo: '12345',
	status: 'SHIPPED',
	creationDate: '05/05/2003'
};

class Test {
    constructor(product) {
		this.cartFullDesktop = [{}]
    }
}

class TotalsModel {
    constructor(lineItemContainer) {
        this.lineItemContainer = lineItemContainer;
    }
}

var stubVariationAttributes = sinon.stub();
stubVariationAttributes.returns(['attribute1']);

var images = proxyquire('../../../../cartridges/app_ua_core/cartridge/models/product/decorators/images', {
    '~/cartridge/models/product/productImages': Test
});

describe('app_ua_emea/cartridge/models/order', () => {

    before(function () {
        mockSuperModule.create(baseOrderModelMock);
    });

    it('Testing if container view is not orderDetails or basket', () => {
        var OrderModel = proxyquire('../../../../cartridges/app_ua_emea/cartridge/models/order.js', {
            'app_ua_emea/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            '*/cartridge/config/preferences': {
                isPersonalizationEnable: true
            },
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            'dw/util/StringUtils': {
        		formatMoney: (price) => '$' + price.value,
        		formatCalendar: () => ''
    		},
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
    		'dw/order/Shipment': require('../../../mocks/dw/dw_order_Shipment'),
    		'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
    		'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
    		'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
    		'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
    		'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
    		'*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
    		'*/cartridge/models/product/decorators/images': images,
    		'*/cartridge/models/product/decorators/variationAttributes': stubVariationAttributes,
    		'*/cartridge/scripts/helpers/productHelpers': {
	            getNoImageURL: function () {
	                return {};
	            }
        	},
        	'*/cartridge/models/totals': TotalsModel,
            'dw/util/Calendar': require('../../../mocks/dw/dw_util_Calendar'),
            '*/cartridge/scripts/helpers/holidaySeasonHelper': {
                getReturnPeriod: () => {
                    return 60;
                }
            }
        });
		
		request.locale = 'en_US';
		request.setLocale = function() {
            return 'en_US';
        }
        var options = { 
			containerView: 'orderDetails',
			selectedPidsArray: [
				{
					shipmentId: null,
					pid: 'productID'
				}
			],
			pidQtyObj: [
				{
					pid : 'productID',
					qty :1
				}
			]
			};
        var order = new OrderModel(lineItemContainer, options);
        assert.isDefined(order.orderItems, 'line items are not defined');
    });

	it('Testing if container view is orderDetails --> pidQtyObj length is 0', () => {
        var OrderModel = proxyquire('../../../../cartridges/app_ua_emea/cartridge/models/order.js', {
            'app_ua_emea/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            '*/cartridge/config/preferences': {
                isPersonalizationEnable: true
            },
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            'dw/util/StringUtils': {
        		formatMoney: (price) => '$' + price.value,
        		formatCalendar: () => ''
    		},
    		'dw/order/Shipment': require('../../../mocks/dw/dw_order_Shipment'),
    		'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
    		'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
    		'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
    		'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
    		'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
    		'*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
    		'*/cartridge/models/product/decorators/images': images,
    		'*/cartridge/models/product/decorators/variationAttributes': stubVariationAttributes,
    		'*/cartridge/scripts/helpers/productHelpers': {
	            getNoImageURL: function () {
	                return {};
	            }
        	},
        	'*/cartridge/models/totals': TotalsModel,
            'dw/util/Calendar': require('../../../mocks/dw/dw_util_Calendar'),
			'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/helpers/holidaySeasonHelper': {
                getReturnPeriod: () => {
                    return 60;
                }
            }
        });

		request.locale = 'en_US';
		request.setLocale = function() {
            return 'en_US';
        }
        var options = {
			containerView: 'orderDetails',
			selectedPidsArray: [
				{
					shipmentId: null,
					pid: 'productID'
				}
			],
			pidQtyObj: []
			};
        var order = new OrderModel(lineItemContainer, options);
        assert.isDefined(order.orderItems, 'line items are not defined');
    });

	it('Testing if container view is orderDetails --> shippingJson in lineItemContainer.custom and shippingStatus === Order.SHIPPING_STATUS_SHIPPED', () => {
        var OrderModel = proxyquire('../../../../cartridges/app_ua_emea/cartridge/models/order.js', {
            'app_ua_emea/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            '*/cartridge/config/preferences': {
                isPersonalizationEnable: true
            },
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            'dw/util/StringUtils': {
        		formatMoney: (price) => '$' + price.value,
        		formatCalendar: () => ''
    		},
    		'dw/order/Shipment': require('../../../mocks/dw/dw_order_Shipment'),
    		'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
    		'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
    		'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
    		'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
    		'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
    		'*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
    		'*/cartridge/models/product/decorators/images': images,
    		'*/cartridge/models/product/decorators/variationAttributes': stubVariationAttributes,
    		'*/cartridge/scripts/helpers/productHelpers': {
	            getNoImageURL: function () {
	                return {};
	            }
        	},
        	'*/cartridge/models/totals': TotalsModel,
            'dw/util/Calendar': require('../../../mocks/dw/dw_util_Calendar'),
			'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/helpers/holidaySeasonHelper': {
                getReturnPeriod: () => {
                    return 60;
                }
            }
        });
		request.locale = 'en_US';
		request.setLocale = function() {
            return 'en_US';
        }
        var options = { 
			containerView: 'orderDetails',
			pidQtyObj: [
				{
					pid : '9876543210',
					qty :1
				}
			]
			};
		lineItemContainer.custom.refundsJson = '';
		lineItemContainer.custom.shippingJson  = '[{"date":"1/1/2022"},{"date":"1/1/2022"}]';
        var order = new OrderModel(lineItemContainer, options);
        assert.isDefined(order.orderItems, 'line items are not defined');
    });

	it('Testing if container view is orderDetails', () => {
        var OrderModel = proxyquire('../../../../cartridges/app_ua_emea/cartridge/models/order.js', {
            'app_ua_emea/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            '*/cartridge/config/preferences': {
                isPersonalizationEnable: true
            },
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            'dw/util/StringUtils': {
        		formatMoney: (price) => '$' + price.value,
        		formatCalendar: () => ''
    		},
    		'dw/order/Shipment': require('../../../mocks/dw/dw_order_Shipment'),
    		'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
    		'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
    		'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
    		'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
    		'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
    		'*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
    		'*/cartridge/models/product/decorators/images': images,
    		'*/cartridge/models/product/decorators/variationAttributes': stubVariationAttributes,
    		'*/cartridge/scripts/helpers/productHelpers': {
	            getNoImageURL: function () {
	                return {};
	            }
        	},
        	'*/cartridge/models/totals': TotalsModel,
            'dw/util/Calendar': require('../../../mocks/dw/dw_util_Calendar'),
			'dw/system/Site': require('../../../mocks/dw/dw_system_Site')
        });
		request.locale = 'en_US';
		request.setLocale = function() {
            return 'en_US';
        }
        var options = { 
			containerView: '',
			pidQtyObj: [
				{
					pid : '9876543210',
					qty :1
				}
			]
			};
			lineItemContainer.getStatus = function () {
				return {
					value: 'BEING_PROCESSED'
				};
			},
		lineItemContainer.custom.refundsJson = '';
		lineItemContainer.custom.shippingJson  = '[{"date":"1/1/2022"},{"date":"1/1/2022"}]';
        var order = new OrderModel(lineItemContainer, options);
        assert.isDefined(order.orderItems, 'line items are not defined');
    });

	it('Testing if container view is orderDetails --> qtyInfo.availableQTY = 0', () => {
        var OrderModel = proxyquire('../../../../cartridges/app_ua_emea/cartridge/models/order.js', {
            'app_ua_emea/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            '*/cartridge/config/preferences': {
                isPersonalizationEnable: true
            },
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            'dw/util/StringUtils': {
        		formatMoney: (price) => '$' + price.value,
        		formatCalendar: () => ''
    		},
    		'dw/order/Shipment': require('../../../mocks/dw/dw_order_Shipment'),
    		'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
    		'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
    		'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
    		'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
    		'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
    		'*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
    		'*/cartridge/models/product/decorators/images': images,
    		'*/cartridge/models/product/decorators/variationAttributes': stubVariationAttributes,
    		'*/cartridge/scripts/helpers/productHelpers': {
	            getNoImageURL: function () {
	                return {};
	            }
        	},
        	'*/cartridge/models/totals': TotalsModel,
            'dw/util/Calendar': require('../../../mocks/dw/dw_util_Calendar'),
			'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/helpers/holidaySeasonHelper': {
                getReturnPeriod: () => {
                    return 60;
                }
            }
        });
		request.locale = 'en_US';
		request.setLocale = function() {
            return 'en_US';
        }
        var options = { 
			containerView: 'orderDetails',
			pidQtyObj: [
				{
					pid : '9876543210',
					qty :1
				}
			]
			};
			lineItemContainer.getProductLineItems = function () {
				return [
					{
						product: {},
						quantity: {
							value: 2
						},
						productID:'productID',
						UUID: '9876543210',
						custom : {
							sku: '9876543210',
							refundsJson: 'aa',
							shippingJson:'aa'
						},
						getProduct: function () {
							return {
								custom: {
									bvAverageRating: 'bvAverageRating',
									bvReviewCount: 'bvReviewCount',
									sku: 'sku',
									giftCard: 'giftCard',
									size: 'size'
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
								variationModel: {
									master: {
										ID: '1330767'
									},
									selectedVariant: false,
									productVariationAttributes: [{
										ID: 'color'
									}, {
										ID: 'size'
									}],
									getAllValues: function () {
										return [{
											value: 'someValue',
											ID: 'size'
										}];
									},
									setSelectedAttributeValue: function () {},
									getSelectedVariant: function () {},
									getSelectedValue: function (sizeAttr) {
										return sizeAttr;
									}
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
								shippingStatus : 'SHIPPING_STATUS_NOTSHIPPEd',
								ID : 'aaaaa',
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
										}
								   };
						},
						getProratedPrice: function () {
								  return {
									divide: function () {
										return '1';
										}
								   };
						},
						 proratedPrice:  {
									divide: function () {
										return {
											multiply: function () {
												return {
													multiply: function () {
														return '1';
													}
												};
											}
										}
										},
						},
						quantityValue : 1,
						adjustedTax:  {
									divide: function () {
										return {
											multiply: function () {
												return '1';
											}
										};
										}
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
					},
					{
						product: {},
						quantity: {
							value: 2
						},
						productID:'productID',
						UUID: '9876543210',
						custom : {
							sku: '9876543210',
							refundsJson: 'aa',
							shippingJson:'aa'
						},
						getProduct: function () {
							return null;
						},
						getShipment: function () {
							return {
								shippingStatus : 'SHIPPING_STATUS_NOTSHIPPEd',
								ID : 'aaaaa',
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
										}
								   };
						},
						getProratedPrice: function () {
								  return {
									divide: function () {
										return '1';
										}
								   };
						},
						 proratedPrice:  {
									divide: function () {
										return {
											multiply: function () {
												return {
													multiply: function () {
														return '1';
													}
												};
											}
										}
										},
						},
						quantityValue : 1,
						adjustedTax:  {
									divide: function () {
										return {
											multiply: function () {
												return '1';
											}
										};
										}
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
					},
				];
			},
		lineItemContainer.custom.refundsJson = '';
		lineItemContainer.custom.shippingJson  = '[{"date":"1/1/2022"},{"date":"1/1/2022"}]';
		lineItemContainer.getStatus = function () {
			return {
				value: 'SHIPPEDeee'
			};
		};
        var order = new OrderModel(lineItemContainer, options);
        assert.isDefined(order.orderItems, 'line items are not defined');
    });

	it('Testing if container view is orderDetails --> customerReturnedQTY + shortShipReturnedQty = product quantity', () => {
		ReturnsUtils = function () {
			return {
				getReturnCaseItems: function () {
					return {
						isEligibleForReturn: true,
						ineligibilityReasonTxt: true
					};
				},
				getQTYInformation: function () {
					return {
						availableQTY: 0,
						shippedQty: 1,
						customerReturnedQTY: 1,
						shortShipReturnedQty: 1
					};
				},
				getReturnsPreferences: function () {
					return {
						isReturnsAvailable: true
					};
				},
				getPreferenceValue: function () {
					return 'aaaaa';
				},
				getPLIShippingDate: function () {
					return {
						isEligibleForReturn: true,
						ineligibilityReasonTxt: true
					};
				},
				isProductReturnBlocked: function () {
					return true;
				},
				parseJsonSafely: (data) => {
					return JSON.parse(data);
				},
				getShippingTrackingLink: function () {
					return {};
				}
			};
		};
        var OrderModel = proxyquire('../../../../cartridges/app_ua_emea/cartridge/models/order.js', {
            'app_ua_emea/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            '*/cartridge/config/preferences': {
                isPersonalizationEnable: true
            },
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            'dw/util/StringUtils': {
        		formatMoney: (price) => '$' + price.value,
        		formatCalendar: () => ''
    		},
    		'dw/order/Shipment': require('../../../mocks/dw/dw_order_Shipment'),
    		'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
    		'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
    		'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
    		'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
    		'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
    		'*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
    		'*/cartridge/models/product/decorators/images': images,
    		'*/cartridge/models/product/decorators/variationAttributes': stubVariationAttributes,
    		'*/cartridge/scripts/helpers/productHelpers': {
	            getNoImageURL: function () {
	                return {};
	            }
        	},
        	'*/cartridge/models/totals': TotalsModel,
            'dw/util/Calendar': require('../../../mocks/dw/dw_util_Calendar'),
			'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/helpers/holidaySeasonHelper': {
                getReturnPeriod: () => {
                    return 60;
                }
            }
        });
		request.locale = 'en_US';
		request.setLocale = function() {
            return 'en_US';
        }
        var options = {
			containerView: 'orderDetails',
			pidQtyObj: [
				{
					pid : '9876543210',
					qty :1
				}
			]
			};
		lineItemContainer.custom.refundsJson = '';
		lineItemContainer.custom.shippingJson  = '[{"date":"1/1/2022"},{"date":"1/1/2022"}]';
		lineItemContainer.getStatus = function () {
			return {
				value: 'SHIPPEDeee'
			};
		};
        var order = new OrderModel(lineItemContainer, options);
        assert.isDefined(order.orderItems, 'line items are not defined');
    });

	it('Testing if container view is orderDetails --> customerReturnedQTY + shortShipReturnedQty = product quantity', () => {
		ReturnsUtils = function () {
			return {
				getReturnCaseItems: function () {
					return {
						isEligibleForReturn: true,
						ineligibilityReasonTxt: true
					};
				},
				getQTYInformation: function () {
					return {
						availableQTY: 4,
						shippedQty: 1,
						customerReturnedQTY: 1,
						shortShipReturnedQty: 1
					};
				},
				getReturnsPreferences: function () {
					return {
						isReturnsAvailable: true
					};
				},
				getPreferenceValue: function () {
					return 'aaaaa';
				},
				getPLIShippingDate: function () {
					return {
						isEligibleForReturn: true,
						ineligibilityReasonTxt: true
					};
				},
				isProductReturnBlocked: function () {
					return true;
				},
				parseJsonSafely: (data) => {
					return JSON.parse(data);
				},
				getShippingTrackingLink: function () {
					return {};
				}
			};
		};
        var OrderModel = proxyquire('../../../../cartridges/app_ua_emea/cartridge/models/order.js', {
            'app_ua_emea/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            '*/cartridge/config/preferences': {
                isPersonalizationEnable: true
            },
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            'dw/util/StringUtils': {
        		formatMoney: (price) => '$' + price.value,
        		formatCalendar: () => ''
    		},
    		'dw/order/Shipment': require('../../../mocks/dw/dw_order_Shipment'),
    		'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
    		'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
    		'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
    		'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
    		'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
    		'*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
    		'*/cartridge/models/product/decorators/images': images,
    		'*/cartridge/models/product/decorators/variationAttributes': stubVariationAttributes,
    		'*/cartridge/scripts/helpers/productHelpers': {
	            getNoImageURL: function () {
	                return {};
	            }
        	},
        	'*/cartridge/models/totals': TotalsModel,
            'dw/util/Calendar': require('../../../mocks/dw/dw_util_Calendar'),
			'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/helpers/holidaySeasonHelper': {
                getReturnPeriod: () => {
                    return 60;
                }
            }
        });
		request.locale = 'en_US';
		request.setLocale = function() {
            return 'en_US';
        }
        var options = {
			containerView: 'orderDetails',
			pidQtyObj: [
				{
					pid : '9876543210',
					qty :1
				}
			]
			};
		lineItemContainer.custom.refundsJson = '';
		lineItemContainer.custom.shippingJson  = '[{"date":"1/1/2022"},{"date":"1/1/2022"}]';
		lineItemContainer.getStatus = function () {
			return {
				value: 'SHIPPEDeee'
			};
		};
        var order = new OrderModel(lineItemContainer, options);
        assert.isDefined(order.orderItems, 'line items are not defined');
    });

	it('Testing if container view is orderDetails --> productEligibleForReturn', () => {
		ReturnsUtils = function () {
			return {
				getReturnCaseItems: function () {
					return {
						isEligibleForReturn: true,
						ineligibilityReasonTxt: true
					};
				},
				getQTYInformation: function () {
					return {
						availableQTY: 4,
						shippedQty: 1,
						customerReturnedQTY: 1,
						shortShipReturnedQty: 1
					};
				},
				getReturnsPreferences: function () {
					return {
						isReturnsAvailable: true
					};
				},
				getPreferenceValue: function () {
					return 'aaaaa';
				},
				getPLIShippingDate: function () {
					return {
						isEligibleForReturn: true,
						ineligibilityReasonTxt: true
					};
				},
				isProductReturnBlocked: function () {
					return false;
				},
				parseJsonSafely: (data) => {
					return JSON.parse(data);
				},
				getShippingTrackingLink: function () {
					return {};
				}
			};
		};
        var OrderModel = proxyquire('../../../../cartridges/app_ua_emea/cartridge/models/order.js', {
            'app_ua_emea/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            '*/cartridge/config/preferences': {
                isPersonalizationEnable: true
            },
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            'dw/util/StringUtils': {
        		formatMoney: (price) => '$' + price.value,
        		formatCalendar: () => ''
    		},
    		'dw/order/Shipment': require('../../../mocks/dw/dw_order_Shipment'),
    		'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
    		'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
    		'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
    		'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
    		'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
    		'*/cartridge/models/address': require('../../../../cartridges/storefront-reference-architecture/test/mocks/models/address'),
    		'*/cartridge/models/product/decorators/images': images,
    		'*/cartridge/models/product/decorators/variationAttributes': stubVariationAttributes,
    		'*/cartridge/scripts/helpers/productHelpers': {
	            getNoImageURL: function () {
	                return {};
	            }
        	},
        	'*/cartridge/models/totals': TotalsModel,
            'dw/util/Calendar': require('../../../mocks/dw/dw_util_Calendar'),
			'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/helpers/holidaySeasonHelper': {
                getReturnPeriod: () => {
                    return 60;
                }
            }
        });
		request.locale = 'en_US';
		request.setLocale = function() {
            return 'en_US';
        }
        var options = {
			containerView: 'orderDetails',
			pidQtyObj: [
				{
					pid : '9876543210',
					qty :1
				}
			]
			};
		lineItemContainer.getStatus = function () {
			return {
				value: 3
			};
		};
		lineItemContainer.getShippingStatus = function () {
			return {
				value: 4
			};
		};
        var order = new OrderModel(lineItemContainer, options);
        assert.isDefined(order.orderItems, 'line items are not defined');

		lineItemContainer.getShippingStatus = function () {
			return {
				value: 2
			};
		};

		lineItemContainer.getStatus = function () {
			return {
				value: 6
			};
		};
		var order = new OrderModel(lineItemContainer, options);
        assert.isDefined(order.orderItems, 'line items are not defined');

		lineItemContainer.getStatus = function () {
			return {
				value: 0
			};
		};
		var order = new OrderModel(lineItemContainer, options);
        assert.isDefined(order.orderItems, 'line items are not defined');

		lineItemContainer.getStatus = function () {
			return {
				value: 8
			};
		};
		var order = new OrderModel(lineItemContainer, options);
        assert.isDefined(order.orderItems, 'line items are not defined');

		// updateOrderStatus cases

		lineItemContainer.getShippingStatus = function () {
			return {
				value: 1
			};
		};
		var order = new OrderModel(lineItemContainer, options);
        assert.isDefined(order.orderItems, 'line items are not defined');
		lineItemContainer.getStatus = function () {
			return {
				value: 3
			};
		};
		lineItemContainer.getShippingStatus = function () {
			return {
				value: 3
			};
		};

		var order = new OrderModel(lineItemContainer, options);
        assert.isDefined(order.orderItems, 'line items are not defined');

		lineItemContainer.getStatus = function () {
			return {
				value: 6
			};
		};

		var order = new OrderModel(lineItemContainer, options);
        assert.isDefined(order.orderItems, 'line items are not defined');
    });
});
