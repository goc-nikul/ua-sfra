'use strict';

require('dw-api-mock/demandware-globals');
var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var ReturnsUtils = function () {
    return {
        getRefundInfoForOrderDetail: () => {
            return {
                items: [
                    'productId'
                ],
                itemAmounts: {
                    'productId': 1
                }
            }
        }
    };
};

let returnOrder;
let returnOrderModel;
let returnCase;
let lineItemContainer;
let options;

describe('app_ua_mx/cartridge/models/returnOrder.js', () => {
    beforeEach(() => {
        returnOrderModel = proxyquire('../../../../../cartridges/app_ua_mx/cartridge/models/returnOrder.js', {
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            '*/cartridge/scripts/util/collections': require('../../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/order/returnHelpers': {
                orderReturnReasonModel: () => {
                    return {
                        resonCode: 'reason'
                    }
                }
            },
            '*/cartridge/scripts/helpers/productHelpers': {
                getNoImageURL: () => {}
            },
            '*/cartridge/models/product/decorators/images': (object) => {
                Object.defineProperty(object, 'images', {
                    value: {
                        cartFullDesktop: [
                            {
                                url: 'url'
                            }
                        ]
                    }
                });
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
            }
        });
        global.request = {};
        request.setLocale = () => 'es_MX';
        returnCase = new (require('dw/order/ReturnCase'))();

        var proratedPrice = new (require('dw/value/Money'))(9.99, 'USD');

        lineItemContainer = new (require('../../../../mocks/dw/dw_order_Order'))();
        var defaultShipment = lineItemContainer.getDefaultShipment();
        defaultShipment.getID = () => {
            return defaultShipment.ID;
        };
        lineItemContainer.createProductLineItem('productId', defaultShipment);
        lineItemContainer.productLineItems[0].custom.sku = 'productId';
        lineItemContainer.productLineItems[0].reasonCode = 'reasonCode';
        lineItemContainer.productLineItems[0].getQuantityValue = () => 1;
        lineItemContainer.productLineItems[0].getTaxRate = () => 1;
        lineItemContainer.productLineItems[0].getShipment = () => defaultShipment;
        lineItemContainer.productLineItems[0].proratedPrice = proratedPrice;
        lineItemContainer.productLineItems[0].getOrderItem = () => {
            return {
                getItemID: () => {}
            };
        };
        lineItemContainer.productLineItems[0].authorizedQuantity = {
            value: 1
        };
        lineItemContainer.productLineItems[0].getProduct = () => {
            return {
                isVariant: () => false,
                getUPC: () => 'upc'
            };
        };
        lineItemContainer.productLineItems[0].getProratedPrice = () => proratedPrice;
        lineItemContainer.productLineItems[0].lineItem = lineItemContainer.productLineItems[0];

        returnCase.getOrder = () => lineItemContainer;
        returnCase.getItems = () => lineItemContainer.getAllLineItems().toArray();
        options = {
            containerView: 'orderDetails',
            currencyCode: 'USD'
        };
    });

    it('Testing the initialization of the MX returnOrder model, with no refundInfo, containerView is undefined', () => {
        options.containerView = '';
        var productLineItem = lineItemContainer.productLineItems[0];
        // Add 4 productlineItems
        lineItemContainer.productLineItems.push(productLineItem);
        lineItemContainer.productLineItems.push(productLineItem);
        lineItemContainer.productLineItems.push(productLineItem);
        lineItemContainer.productLineItems.push(productLineItem);
        returnCase.getItems = () => lineItemContainer.getAllLineItems().toArray();
        assert.doesNotThrow(() => returnOrder = new returnOrderModel(returnCase, options));
        assert.isDefined(returnOrder);
    });

    it('Testing the initialization of the MX returnOrder model, with no refundInfo, containerView is orderDetails', () => {
        // GetProduct returns an empty object
        lineItemContainer.productLineItems[0].getProduct = () => {};
        lineItemContainer.productLineItems[0].lineItem = lineItemContainer.productLineItems[0];
        returnCase.getOrder = () => lineItemContainer;
        returnCase.getItems = () => lineItemContainer.getAllLineItems().toArray();
        returnCase.getStatus = () => {
            return {
                getValue: () => 'status'
            }
        }
        returnCase.returnCaseNumber = '11223344';
        returnCase.status = 'status';
        returnCase.creationDate = '1/1/2024';
        assert.doesNotThrow(() => returnOrder = new returnOrderModel(returnCase, options));
        assert.isDefined(returnOrder);

        // Product is a master product
        lineItemContainer.productLineItems[0].getProduct = () => {
            return {
                getMasterProduct: () => {
                    return {
                        ID: 'productId'
                    }
                },
                isVariant: () => true,
                getUPC: () => 'upc'
            };
        };
        delete lineItemContainer.productLineItems[0].custom.sku;
        returnCase.getOrder = () => lineItemContainer;
        returnCase.getItems = () => lineItemContainer.getAllLineItems().toArray();
        assert.doesNotThrow(() => returnOrder = new returnOrderModel(returnCase, options));
        assert.isDefined(returnOrder);
    });

    it('Testing the initialization of the MX returnOrder model, refundInfo is provided', () => {
        lineItemContainer.custom.refundsJson = '[{"refundDate":"1/1/2024"},{"refundDate":"1/1/2024"}]';
        returnCase.getOrder = () => lineItemContainer;
        returnCase.grandTotal = {
            tax: 1.99
        };
        assert.doesNotThrow(() => returnOrder = new returnOrderModel(returnCase, options));
        assert.isDefined(returnOrder);
    });
});
