'use strict';

/* eslint-disable */

const {
    assert,
    expect
} = require('chai');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const sinon = require('sinon');

class Calendar {
    constructor(date) {
        this.date = date;
        this.DATE = 5;
        this.DAY_OF_WEEK = 7;
        this.SATURDAY = 7;
        this.SUNDAY = 1;
    }

    add(field, value) {
        if (field === this.DATE) {
            this.date.setDate(this.date.getDate() + value);
        }
    }

    before() {
        return false;
    }

    toTimeString() {
        return this.date;
    }

    get() {
        return 2;
    }
}

global.empty = (data) => {
    return !data;
};
var originalOrder = {};
describe('int_OIS/cartridge/models/OIS/order/exchangeDetails.js', () => {
    let ExchangeDetailsModel = proxyquire('../../../../../cartridges/int_OIS/cartridge/models/OIS/order/exchangeDetails.js', {
        'dw/util/Calendar': Calendar,
        'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
        'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
        '*/cartridge/scripts/util/utilHelper': {
            rmaStatusModel: function () {
                return {};
            },
            orderReturnReasonModel: function () {
                return {};
            },
            rmaStatusMapping: function () {
                return {};
            }
        },

        'dw/value/Money': require('../../../../mocks/dw/dw_value_Money')
    });

    beforeEach(function () {
        originalOrder = {
            orderNo: '439293',
            originalOrderNo: 38192,
            exchangeOrder: {
                orderNo: '12345',
                creationDate: '',
                shipments: [{}],
                orderItems: []
            },
            returnItems: [],
            returnOrder: {
                orderNo: '1323123'
            }

        }
    });

    it('ExchangeDetails model - Should return model data when originalOrder data passed', () => {
        originalOrder.exchangeOrder.orderItems = [{
            productItem: {
                quantity: 1,
                product: {
                    assets: {
                        images: [{
                            "url": "https://underarmour.scene7.com/is/image/Underarmour/V5-1355109-100_FC?rp=standard-0pad&scl=1&fmt=jpg&qlt=85&wid=392&hei=492&size=392,492&cache=on,off&resMode=sharp2"
                        }]
                    },
                    prices: {
                        sale: 60,
                        base: 60,
                        tax: 7.8,
                        discount: 0,
                        total: 67.8
                    },
                    upc: "194511726099",
                    sku: "1355109-100-34C",
                    copy: {
                        name: "Women's ArmourÂ® High Crossback Sports Bra"
                    },
                    color: {
                        colorway: "White / Halo Gray"
                    }
                }
            },
            shipmentId: null,
            fulfillmentStatus: "UNFULFILLED",
            storeId: null,
            gift: false,
            giftMessage: null,
            shippingMethod: "Standard"
        }];
        var returnItemsStub = sinon.stub();
        returnItemsStub.returns('return Items stub');
        originalOrder.returnItems = returnItemsStub;
        assert.throws(() => {
            return new ExchangeDetailsModel(originalOrder);
        }, Error, 'returnOrderItems.forEach is not a function');
    });

    it('originalOrder has returnItems', () => {
        originalOrder = {
            orderNo: '439293',
            originalOrderNo: 38192,
            exchangeOrder: {
                orderNo: '12345',
                creationDate: '',
                shipments: [{}],
                orderItems: [{
                    productItem: {
                        quantity: 1,
                        product: {
                            assets: {
                                images: [{
                                    "url": "https://underarmour.scene7.com/is/image/Underarmour/V5-1355109-100_FC?rp=standard-0pad&scl=1&fmt=jpg&qlt=85&wid=392&hei=492&size=392,492&cache=on,off&resMode=sharp2"
                                }]
                            },
                            prices: {
                                sale: 60,
                                base: 60,
                                tax: 7.8,
                                discount: 0,
                                total: 67.8
                            },
                            upc: "194511726099",
                            sku: "1355109-100-34C",
                            copy: {
                                name: "Women's ArmourÂ® High Crossback Sports Bra"
                            },
                            color: {
                                colorway: "White / Halo Gray"
                            }
                        }
                    },
                    shipmentId: null,
                    fulfillmentStatus: "UNFULFILLED",
                    storeId: null,
                    gift: false,
                    giftMessage: null,
                    shippingMethod: "Standard"
                }]
            },
            returnItems: [{
                orderNo: '12345',
                creationDate: '',
                shipments: [{}],
                orderItem: {
                    productItem: {
                        quantity: 1,
                        product: {
                            assets: {
                                images: [{
                                    "url": "https://underarmour.scene7.com/is/image/Underarmour/V5-1355109-100_FC?rp=standard-0pad&scl=1&fmt=jpg&qlt=85&wid=392&hei=492&size=392,492&cache=on,off&resMode=sharp2"
                                }]
                            },
                            prices: {
                                sale: 60,
                                base: 60,
                                tax: 7.8,
                                discount: 0,
                                total: 67.8
                            },
                            upc: "194511726099",
                            sku: "1355109-100-34C",
                            copy: {
                                name: "Women's ArmourÂ® High Crossback Sports Bra"
                            },
                            color: {
                                colorway: "White / Halo Gray"
                            }
                        }
                    },
                    shipmentId: null,
                    fulfillmentStatus: "UNFULFILLED",
                    storeId: null,
                    gift: false,
                    giftMessage: null,
                    shippingMethod: "Standard"
                }
            }],
            returnOrder: {
                orderNo: '1323123'
            }

        };
        var result = new ExchangeDetailsModel(originalOrder);
        assert.isNotNull(result, 'Order Model shouldnot null');
        assert.isObject(result, 'Order Model should be object');
        assert.equal(result.orderNo, '12345');
    });

});
