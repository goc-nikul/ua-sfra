'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var sinon = require('sinon');

var mockSuperModule = require('../../../mockModuleSuperModule');
var baseOrderModelMock = require('./baseOrderModel');

var item = {
	lineItem : {
		getProduct: function () {
		return null;
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
	getOrderItem: function () {
	return {
		  getItemID: function () {
				 return {};
			 }
	   };
	},
	proratedPrice : {
		divide: function () {
				return {
					multiply: function () {
						return '1';
						},
						divide: function () {
							return {multiply: function () {
								return {multiply: function () {
									return '1';
							}
							};
							}
						};
						}
					};
				}
	},
	getProratedPrice: function () {
		  return {
			divide: function () {
				return '1';
				}
		   };
	},
	getTaxRate: () => 1,
	getQuantityValue: () => 1,
},
authorizedQuantity : {
	value : 2
}
}
var ReturnsUtils = function () {
    return {
        getReturnCaseItems: function () {
            return {
                isEligibleForReturn: true,
                ineligibilityReasonTxt: true
            };
        },
        getRefundInfoForOrderDetail : function () {
			return '';
		},
        getQTYInformation: function () {
            return {
                availableQTY: 4
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
        }
    };
};

var returnCase = {
	returnCaseNumber : '1111',
    getOrder: function () {
        return {
			getCurrencyCode: function () {
            		return 'USD';
        		},
        	customerLocaleID : 'aa',
        	custom: {
		 			refundsJson: "[{\"emailSent\":true,\"refundDate\":\"2021-01-07T01:01:01.000Z\",\"refundAmount\":\"126.10\",\"refundCurrency\":\"USD\",\"refundReason\":\"\",\"items\":{\"3021034-201-11\":\"1\"},\"itemAmounts\":{\"3021034-201-11\":\"108.71\"},\"returnNumber\":\"DEV00408259-R1\"}]",
			}
		}
    },
    getItems: function () {
            		return [
			            {
							lineItem : {
								custom: {
									sku: 'sku'
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
        					getOrderItem: function () {
				            return {
					              getItemID: function () {
					                     return {};
					                 }
					           };
        					},
        					proratedPrice : {
								divide: function () {
		                                return {
											multiply: function () {
		                                		return '1';
		                                		},
		                                		divide: function () {
                                					return {multiply: function () {
		                                				return {multiply: function () {
                                							return '1';
                                					}
                                					};
		                                			}
		                                		};
                                				}
											};
		                                }
							},
			        		getProratedPrice: function () {
		                          return {
		                            divide: function () {
		                                return '1';
		                                }
		                           };
                			},
                			getTaxRate: () => 1,
                			getQuantityValue: () => 1,
						},
						authorizedQuantity : {
							value : 2
						}
            },
			{
				lineItem : {
					getProduct: function () {
					return null;
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
				getOrderItem: function () {
				return {
					  getItemID: function () {
							 return {};
						 }
				   };
				},
				proratedPrice : {
					divide: function () {
							return {
								multiply: function () {
									return '1';
									},
									divide: function () {
										return {multiply: function () {
											return {multiply: function () {
												return '1';
										}
										};
										}
									};
									}
								};
							}
				},
				getProratedPrice: function () {
					  return {
						divide: function () {
							return '1';
							}
					   };
				},
				getTaxRate: () => 1,
				getQuantityValue: () => 1,
			},
			authorizedQuantity : {
				value : 2
			}
		},
		item,
		item,
        ];
     }, 
    getReturnCases: function () {
        return {
            size: function () { return 0; }
        };
    },
    getStatus: function () {
        return {
            getValue: function () { return 0; }
        };
    },
    getReturnCaseItems: function () {
        return '';
    }
};


class Test {
    constructor(product) {
        this.cartFullDesktop = [{}]
    }
}

var stubVariationAttributes = sinon.stub();
stubVariationAttributes.returns(['attribute1']);

var images = proxyquire('../../../../cartridges/app_ua_core/cartridge/models/product/decorators/images', {
    '~/cartridge/models/product/productImages': Test
});

describe('app_ua_emea/cartridge/models/returnOrder', () => {

    before(function () {
        mockSuperModule.create(baseOrderModelMock);
    });

    it('Testing if container view is not orderDetails or basket', () => {
        var ReturnOrder = proxyquire('../../../../cartridges/app_ua_emea/cartridge/models/returnOrder.js', {
            'dw/util/StringUtils': {
        		formatMoney: (price) => '$' + price.value,
				formatCalendar: function (calander) {
					return {};
			   }
    		},
            'app_ua_emea/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            '*/cartridge/models/product/decorators/images': images,
            '*/cartridge/models/product/decorators/variationAttributes': stubVariationAttributes,
    		'*/cartridge/scripts/helpers/productHelpers': {
	            getNoImageURL: function () {
	                return {};
	            }
        	},
        	'*/cartridge/scripts/order/returnHelpers': {
	            orderReturnReasonModel: function () {
	                return {};
	            }
        	},
        	'dw/util/Calendar': function () {
				return {
					formatCalendar: function (calander) {
						return calander.toTimeString();
				   }
				}
			},
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/config/preferences': {
                isPersonalizationEnable: true
            },
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            'dw/util/StringUtils': {
        		formatMoney: (price) => '$' + price.value,
				formatCalendar: function (calander) {
					return {};
			   }
    		},
			'dw/system/Site': require('../../../mocks/dw/dw_system_Site')
        });
		request.locale = 'en_US';
		request.setLocale = function() {
            return 'en_US';
        }
        var options = { containerView: 'orderDetails' };
        var returnOrder = new ReturnOrder(returnCase, options);
        assert.isDefined(returnOrder, 'line items are not defined');
    });

	it('Testing if container view is not orderDetails or basket -->  refundsJson in lineItemContainer.custom', () => {
		ReturnsUtils = function () {
			return {
				getReturnCaseItems: function () {
					return {
						isEligibleForReturn: true,
						ineligibilityReasonTxt: true
					};
				},
				getRefundInfoForOrderDetail : function () {
					return {
						itemAmounts: {
							sku: '2'
						}
					};
				},
				getQTYInformation: function () {
					return {
						availableQTY: 4
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
				}
			};
		};
        var ReturnOrder = proxyquire('../../../../cartridges/app_ua_emea/cartridge/models/returnOrder.js', {
            'dw/util/StringUtils': {
        		formatMoney: (price) => '$' + price.value,
				formatCalendar: function (calander) {
					return {};
			   }
    		},
            'app_ua_emea/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            '*/cartridge/models/product/decorators/images': images,
            '*/cartridge/models/product/decorators/variationAttributes': stubVariationAttributes,
    		'*/cartridge/scripts/helpers/productHelpers': {
	            getNoImageURL: function () {
	                return {};
	            }
        	},
        	'*/cartridge/scripts/order/returnHelpers': {
	            orderReturnReasonModel: function () {
	                return {};
	            }
        	},
        	'dw/util/Calendar': function () {
				return {
					formatCalendar: function (calander) {
						return calander.toTimeString();
				   }
				}
			},
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/config/preferences': {
                isPersonalizationEnable: true
            },
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            'dw/util/StringUtils': {
        		formatMoney: (price) => '$' + price.value,
				formatCalendar: function (calander) {
					return {};
			   }
    		},
			'dw/system/Site': require('../../../mocks/dw/dw_system_Site')
        });
		request.locale = 'en_US';
		request.setLocale = function() {
            return 'en_US';
        }
		returnCase.grandTotal = {
			tax: {}
		};
        var options = {
			containerView: 'orderDetails',
			refundInfo: {
				itemAmounts: {
					sku: '2'
				}
			}
		};
        var returnOrder = new ReturnOrder(returnCase, options);
        assert.isDefined(returnOrder, 'line items are not defined');
    });

	it('Testing if container view is not orderDetails and orderItems.length > 3', () => {
        var ReturnOrder = proxyquire('../../../../cartridges/app_ua_emea/cartridge/models/returnOrder.js', {
            'dw/util/StringUtils': {
        		formatMoney: (price) => '$' + price.value,
				formatCalendar: function (calander) {
					return {};
			   }
    		},
            'app_ua_emea/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            '*/cartridge/models/product/decorators/images': images,
            '*/cartridge/models/product/decorators/variationAttributes': stubVariationAttributes,
    		'*/cartridge/scripts/helpers/productHelpers': {
	            getNoImageURL: function () {
	                return {};
	            }
        	},
        	'*/cartridge/scripts/order/returnHelpers': {
	            orderReturnReasonModel: function () {
	                return {};
	            }
        	},
        	'dw/util/Calendar': function () {
				return {
					formatCalendar: function (calander) {
						return calander.toTimeString();
				   }
				}
			},
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/config/preferences': {
                isPersonalizationEnable: true
            },
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            'dw/util/StringUtils': {
        		formatMoney: (price) => '$' + price.value,
				formatCalendar: function (calander) {
					return {};
			   }
    		},
			'dw/system/Site': require('../../../mocks/dw/dw_system_Site')
        });
		request.locale = 'en_US';
		request.setLocale = function() {
            return 'en_US';
        }
		returnCase.grandTotal = {
			tax: {}
		};
        var options = {
			containerView: '',
			refundInfo: {
				itemAmounts: {
					sku: '2'
				}
			}
		};
        var returnOrder = new ReturnOrder(returnCase, options);
        assert.isDefined(returnOrder, 'line items are not defined');
    });

	it('Testing if container view is not orderDetails and orderItems.length > 3', () => {
		returnCase = {
			returnCaseNumber : '1111',
			getOrder: function () {
				return {
					getCurrencyCode: function () {
							return 'USD';
						},
					customerLocaleID : 'aa',
					custom: {
							 refundsJson: "[{\"emailSent\":true,\"refundDate\":\"2021-01-07T01:01:01.000Z\",\"refundAmount\":\"126.10\",\"refundCurrency\":\"USD\",\"refundReason\":\"\",\"items\":{\"3021034-201-11\":\"1\"},\"itemAmounts\":{\"3021034-201-11\":\"108.71\"},\"returnNumber\":\"DEV00408259-R1\"}]",
					}
				}
			},
			getItems: function () {
							return [
								{
									lineItem : {
										custom: {
											sku: 'sku'
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
									getOrderItem: function () {
									return {
										  getItemID: function () {
												 return {};
											 }
									   };
									},
									proratedPrice : {
										divide: function () {
												return {
													multiply: function () {
														return '1';
														},
														divide: function () {
															return {multiply: function () {
																return {multiply: function () {
																	return '1';
															}
															};
															}
														};
														}
													};
												}
									},
									getProratedPrice: function () {
										  return {
											divide: function () {
												return '1';
												}
										   };
									},
									getTaxRate: () => 1,
									getQuantityValue: () => 1,
								},
								authorizedQuantity : {
									value : 2
								}
					},
					{
						lineItem : {
							getProduct: function () {
							return null;
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
						getOrderItem: function () {
						return {
							  getItemID: function () {
									 return {};
								 }
						   };
						},
						proratedPrice : {
							divide: function () {
									return {
										multiply: function () {
											return '1';
											},
											divide: function () {
												return {multiply: function () {
													return {multiply: function () {
														return '1';
												}
												};
												}
											};
											}
										};
									}
						},
						getProratedPrice: function () {
							  return {
								divide: function () {
									return '1';
									}
							   };
						},
						getTaxRate: () => 1,
						getQuantityValue: () => 1,
					},
					authorizedQuantity : {
						value : 2
					}
				},
				item,
				item,
				item
				];
			 }, 
			getReturnCases: function () {
				return {
					size: function () { return 0; }
				};
			},
			getStatus: function () {
				return {
					getValue: function () { return 0; }
				};
			},
			getReturnCaseItems: function () {
				return '';
			}
		};
        var ReturnOrder = proxyquire('../../../../cartridges/app_ua_emea/cartridge/models/returnOrder.js', {
            'dw/util/StringUtils': {
        		formatMoney: (price) => '$' + price.value,
				formatCalendar: function (calander) {
					return {};
			   }
    		},
            'app_ua_emea/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            '*/cartridge/models/product/decorators/images': images,
            '*/cartridge/models/product/decorators/variationAttributes': stubVariationAttributes,
    		'*/cartridge/scripts/helpers/productHelpers': {
	            getNoImageURL: function () {
	                return {};
	            }
        	},
        	'*/cartridge/scripts/order/returnHelpers': {
	            orderReturnReasonModel: function () {
	                return {};
	            }
        	},
        	'dw/util/Calendar': function () {
				return {
					formatCalendar: function (calander) {
						return calander.toTimeString();
				   }
				}
			},
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/config/preferences': {
                isPersonalizationEnable: true
            },
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            'dw/util/StringUtils': {
        		formatMoney: (price) => '$' + price.value,
				formatCalendar: function (calander) {
					return {};
			   }
    		},
			'dw/system/Site': require('../../../mocks/dw/dw_system_Site')
        });
		request.locale = 'en_US';
		request.setLocale = function() {
            return 'en_US';
        }
		returnCase.grandTotal = {
			tax: {}
		};
        var options = {
			containerView: '',
			refundInfo: {
				itemAmounts: {
					sku: '2'
				}
			}
		};
        var returnOrder = new ReturnOrder(returnCase, options);
        assert.isDefined(returnOrder, 'line items are not defined');
    });

});
