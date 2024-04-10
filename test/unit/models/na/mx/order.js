'use strict';

require('dw-api-mock/demandware-globals');
var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../../mockModuleSuperModule');

var ReturnsUtils = function () {
    return {
        getPreferenceValue: () => 'abcdfg',
        getShippingTrackingLink: () => {},
        getReturnsPreferences: () => {
            return {
                isReturnsAvailable: true
            }
        },
        parseJsonSafely: (data) => {
            return JSON.parse(data);
        },
        getQTYInformation: () => {
            return {
                availableQTY: 0,
                shippedQty: 1,
                customerReturnedQTY: 1,
                shortShipReturnedQty: 1
            };
        },
        isProductReturnBlocked: () => {
            return false;
        },
        getPLIShippingDate: () => {
            return '12/12/2023'
        }
    };
};

var images = (object) => {
    Object.defineProperty(object, 'images', {
        value: {
            cartFullDesktop: [
                {
                    url: 'url',
                    title: 'title'
                }
            ]
        }
    });
};

function BaseOrder() {
    this.billing = {
        billingAddress: {
            address: {
                rfc: '',
                razonsocial: '',
                usoCFDI: '',
                regimenFiscal: '',
                codigoPostal: ''
            }
        },
        payment: {
            selectedPaymentInstruments: [
                {
                    cardType: 'Visa',
                    name: 'Visa',
                    UUID: 'some UUID'
                }
            ]
        }
    };
    this.status = 'SHIPPED';
}

let order;
let options;
let OrderModel;
let lineItemContainer;

describe('app_ua_mx/cartridge/models/order.js', () => {

    before(() => {
        mockSuperModule.create(BaseOrder);
    });

    beforeEach(() => {
        global.request = {};
        global.empty = (params) => !params;
        global.dw = {
            value: {
                Money: function (value, currencyCode) {
                    this.value = value;
                    this.currencyCode = currencyCode;
                }
            }
        };

        OrderModel = proxyquire('../../../../../cartridges/app_ua_mx/cartridge/models/order.js', {
            '*/cartridge/models/product/decorators/images': images,
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/order/Order': require('../../../../mocks/dw/dw_order_Order'),
            '*/cartridge/scripts/util/collections': require('../../../../mocks/scripts/util/collections'),
            '*/cartridge/models/address': function AddressModel() {
                return {
                    address: {
                        firstName: 'firstName',
                        address2: {
                            firstName: 'firstName'
                        }
                    }
                }
            },
            '*/cartridge/models/product/decorators/variationAttributes': (object) => {
                Object.defineProperty(object, 'variationAttributes', {
                    value: [
                        {
                            id: 'attributeId',
                            displayValue: 'displayValue'
                        }
                    ]
                });
            },
            '*/cartridge/models/totals': function TotalsModel(lineItemContainer) {
                this.lineItemContainer = lineItemContainer;
            },
            '*/cartridge/scripts/helpers/productHelpers': {
	            getNoImageURL: () => {}
        	}
        });

        lineItemContainer = new (require('../../../../mocks/dw/dw_order_Order'))();
        lineItemContainer.getShippingStatus = () => {
            return {
                value: 4
            }
        };
        lineItemContainer.paymentInstrument = {
            custom: {
                adyenPaymentMethod: null
            }
        };
        request.setLocale = () => 'es_MX';
        options = {};
    });

    it('Testing the initialization of the MX order model, containerView is not defined', () => {
        lineItemContainer.createProductLineItem('productId', lineItemContainer.defaultShipment);
        // getProduct returns product data
        lineItemContainer.productLineItems[0].getProduct = () => {
            return {
                ID: 'productId'
            }
        };
        assert.doesNotThrow(() => order = new OrderModel(lineItemContainer));
        assert.isDefined(order);
        // getProduct returns an empty object
        lineItemContainer.productLineItems[0].getProduct = () => {};
        assert.doesNotThrow(() => order = new OrderModel(lineItemContainer));
        assert.isDefined(order);
    });

    it('Testing the initialization of the MX order model, containerView is basket', () => {
        options.containerView = 'basket';
        assert.doesNotThrow(() => order = new OrderModel(lineItemContainer, options));
        assert.isDefined(order);
    });

    it('Testing the initialization of the MX order model, containerView is orderDetails', () => {
        options.containerView = 'orderDetails';
        options.pidQtyObj = [{
            pid : 'productId',
            qty :1
        }];
        lineItemContainer.getReturnCases = () => {
            return {
                size: () => 0
            };
        };
        lineItemContainer.setStatus('SHIPPED');
        lineItemContainer.custom = {
            shippingJson: '[{"date":"1/1/2022","items": {"productId": "1"}},{"date":"1/1/2022","items": {"3023761-003-7": "1"}}]',
        };
        assert.doesNotThrow(() => order = new OrderModel(lineItemContainer, options));
        assert.isDefined(order);
        
        options.handleMultipleShipments = true;
        lineItemContainer.custom.refundsJson = '[{"refundDate":"1/1/2022"},{"refundDate":"1/1/2022"}]';
        lineItemContainer.custom.oxxoDetails = '{}';

        lineItemContainer.createProductLineItem('productId', lineItemContainer.defaultShipment);
        var defaultShipment = lineItemContainer.getDefaultShipment();
        defaultShipment.getID = () => {
            return defaultShipment.ID;
        };
        defaultShipment.custom.paazlDeliveryInfo = 'paazlDeliveryInfo';
        lineItemContainer.productLineItems[0].getProduct = () => {
            return {
                isVariant: () => false,
                getUPC: () => 'upc'
            };
        };
        lineItemContainer.productLineItems[0].getShipment = () => defaultShipment;
        lineItemContainer.productLineItems[0].getQuantity = () => {
            return {
                getValue: () => {}
            };
        };
        var Money = new (require('dw/value/Money'))(9.99, 'USD');
        lineItemContainer.productLineItems[0].getProratedPrice = () => Money;
        lineItemContainer.productLineItems[0].proratedPrice = Money;
        lineItemContainer.productLineItems[0].getPrice = () => Money;
        lineItemContainer.productLineItems[0].adjustedTax = Money;
        lineItemContainer.productLineItems[0].custom.jerseyNameText = 'jerseyNameText';
        lineItemContainer.productLineItems[0].custom.jerseyNumberText = 'jerseyNumberText';
        lineItemContainer.productLineItems[0].custom.sku = 'productId';
        lineItemContainer.productLineItems[0].quantity.value = 2;
        lineItemContainer.productLineItems[0].getQuantityValue = () => 2;
        lineItemContainer.productLineItems[0].getOrderItem = () => {
            return {
                getItemID: () => {}
            };
        };
        lineItemContainer.getReturnCaseItems = () => [];
        assert.doesNotThrow(() => order = new OrderModel(lineItemContainer, options));
        assert.isDefined(order);

        // selectedPidsArray option is provided
        options.selectedPidsArray = [{
            shipmentId: defaultShipment.ID,
            pid: 'productId'
        }];
        assert.doesNotThrow(() => order = new OrderModel(lineItemContainer, options));
        assert.isDefined(order);

        // Order status is Completed
        options.pidQtyObj = [];
        lineItemContainer.productLineItems[0].custom.jerseyNameText = '';
        lineItemContainer.productLineItems[0].custom.jerseyNumberText = '';
        lineItemContainer.setStatus(5);
        lineItemContainer.productLineItems[0].getProduct = () => false;
        assert.doesNotThrow(() => order = new OrderModel(lineItemContainer, options));
        assert.isDefined(order);
    });
});
