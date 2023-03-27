/* eslint-disable no-redeclare */
/* eslint-disable no-unused-vars */
'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var sinon = require('sinon');

class Calander {
    constructor(date) {
        this.date = date;
        return {
            toTimeString: function () {
                return date.toDateString();
            }
        };
    }
}


describe('int_OIS/cartridge/models/OIS/order/returnDetails.js', function () {
    const ReturnDetails = proxyquire('../../../../../cartridges/int_OIS/cartridge/models/OIS/order/returnDetails', {

        'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
        '*/cartridge/scripts/util/utilHelper': {
            rmaStatusModel: function () {
                return {
                    NEW: 'text'
                };
            },
            rmaStatusMapping: function () {
                return {
                    Returned: 'text'
                };
            }
        },
        '*/cartridge/scripts/order/orderItemsHelper': {
            mergeDuplicateReturnItems: function () {
                return {
                    listOfReturnItems: {
                        orderItem: {
                            productItem: {
                                product: {
                                    upc: '194511726099',
                                    sku: '1355109-100-34C',
                                    assets: {
                                        images: [
                                            {
                                                'url': 'https://underarmour.scene7.com/is/image/Underarmour/V5-1355109-100_FC?rp=standard-0pad&scl=1&fmt=jpg&qlt=85&wid=392&hei=492&size=392,492&cache=on,off&resMode=sharp2'
                                            }
                                        ]
                                    },
                                    copy: {
                                        name: "Women's ArmourÂ® High Crossback Sports Bra"
                                    },
                                    color: {
                                        colorway: 'White / Halo Gray'
                                    }
                                }
                            },
                            fulfillmentStatus: 'UNFULFILLED',
                            rmaItemStatus: 'rmaItemStatus'
                        }
                    }
                };
            }
        },
        'dw/util/Calendar': Calander,
        'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
        'dw/value/Money': require('../../../../mocks/dw/dw_value_Money'),
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource')
    });

    var node = {
        creationDate: '439293',
        rmaNumber: 38192,
        currency: 'USD',
        returnOrder: {
            orderNo: '12345',
            creationDate: '',
            shipments: [{}],
            orderItems: [
                {
                    productItem: {
                        quantity: 1,
                        product: {
                            assets: {
                                images: [
                                    {
                                        'url': 'https://underarmour.scene7.com/is/image/Underarmour/V5-1355109-100_FC?rp=standard-0pad&scl=1&fmt=jpg&qlt=85&wid=392&hei=492&size=392,492&cache=on,off&resMode=sharp2'
                                    }
                                ]
                            },
                            prices: {
                                sale: 60,
                                base: 60,
                                tax: 7.8,
                                discount: 0,
                                total: 67.8
                            },
                            upc: '194511726099',
                            sku: '1355109-100-34C',
                            copy: {
                                name: "Women's ArmourÂ® High Crossback Sports Bra"
                            },
                            color: {
                                colorway: 'White / Halo Gray'
                            }
                        }
                    },
                    shipmentId: null,
                    fulfillmentStatus: 'UNFULFILLED',
                    storeId: null,
                    gift: false,
                    giftMessage: null,
                    shippingMethod: 'Standard'
                }
            ]
        },
        refundEstimated: {
            subtotal: 67.8,
            tax: 7.8,
            total: 67.8
        },
        refundProcessed: {
            subtotal: 67.8,
            tax: 7.8,
            total: 67.8
        },
        returnShipment: [{}]
    };


    it('should receive return details', () => {
        var obj = new ReturnDetails(node);
        assert.isNotNull(obj, 'ReturnDetails is not null');
        assert.isDefined(obj, 'ReturnDetails is defined');
    });

    it('should throw an error when order items is null/empty', () => {
        var stubrmaStatusModel = sinon.stub();
        var ReturnDetails = proxyquire('../../../../../cartridges/int_OIS/cartridge/models/OIS/order/returnDetails.js', {
            'dw/util/StringUtils': {},
            '*/cartridge/scripts/util/utilHelper': {
                rmaStatusModel: stubrmaStatusModel
            },
            '*/cartridge/scripts/order/orderItemsHelper': {},
            'dw/util/Calendar': {},
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            'dw/value/Money': require('../../../../mocks/dw/dw_value_Money'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource')
        });
        stubrmaStatusModel.throws(new Error('Custom Error'));
        assert.throws(() => { return new ReturnDetails({}); }, Error, 'Custom Error');
    });

    it('should receive order details', function () {
        var result = new ReturnDetails(node);
        assert.equal(result.orderItems[0].sku, '1355109-100-34C');
        assert.equal(result.orderItems[0].upc, '194511726099');
        assert.equal(result.orderItems[0].color, 'White / Halo Gray');
    });

    it('Testing method: with empty line item', () => {
        const ReturnDetails = proxyquire('../../../../../cartridges/int_OIS/cartridge/models/OIS/order/returnDetails', {

            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/util/utilHelper': {
                rmaStatusModel: function () {
                    return {
                        NEW: 'text'
                    };
                },
                rmaStatusMapping: function () {
                    return {
                        Returned: 'text'
                    };
                }
            },
            '*/cartridge/scripts/order/orderItemsHelper': {
                mergeDuplicateReturnItems: function () {
                    return '';
                }
            },
            'dw/util/Calendar': Calander,
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            'dw/value/Money': require('../../../../mocks/dw/dw_value_Money'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource')
        });
        var obj = new ReturnDetails(node);
        assert.isDefined(obj, 'result is defined');
    });
});
