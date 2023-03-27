/* eslint-disable no-redeclare */
/* eslint-disable no-unused-vars */
'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var sinon = require('sinon');

var customerOrders = {
    edges: [{
        node: {
            rmaNumber: 1,
            exchangeOrder: '123',
            rmaStatus: 'Returned',
            returnItems: [{

            }]
        }
    }]
};

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
var returnItemsParams = [{
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
}, {
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
},
{
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
},
{
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
},
{
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
},
{
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
}];

describe('int_mao/cartridge/models/UACAPI/returns/returns.js', function () {
    const ReturnModel = proxyquire('../../../../../cartridges/int_mao/cartridge/models/UACAPI/returns/returns', {

        'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
        '*/cartridge/scripts/UACAPI/helpers/util/utilHelper': {
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
        '*/cartridge/scripts/UACAPI/helpers/order/orderItemsHelper': {
            mergeDuplicateReturnItems: function () {
                return returnItemsParams;
            }
        },
        'dw/util/Calendar': Calander,
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource')
    });

    it('should throw an error when order items is null/empty, using stub', () => {
        var stubrmaStatusModel = sinon.stub();
        var ReturnModel = proxyquire('../../../../../cartridges/int_mao/cartridge/models/UACAPI/returns/returns.js', {
            'dw/util/StringUtils': {},
            '*/cartridge/scripts/UACAPI/helpers/util/utilHelper': {
                rmaStatusModel: stubrmaStatusModel
            },
            '*/cartridge/scripts/UACAPI/helpers/order/orderItemsHelper': {},
            'dw/util/Calendar': {}
        });
        stubrmaStatusModel.throws(new Error('Custom Error'));
        assert.throws(() => { return new ReturnModel({}); }, Error, 'Custom Error');
    });


    it('should receive order details', function () {
        var result = new ReturnModel(customerOrders);
        assert.equal(result[0].orderItems[0].sku, '1355109-100-34C');
        assert.equal(result[0].orderItems[0].upc, '194511726099');
        assert.equal(result[0].orderItems[0].color.colorway, 'White / Halo Gray');
    });

    it('Testing method: with empty line item', () => {
        const ReturnModel = proxyquire('../../../../../cartridges/int_mao/cartridge/models/UACAPI/returns/returns', {

            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/UACAPI/helpers/util/utilHelper': {
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
            '*/cartridge/scripts/UACAPI/helpers/order/orderItemsHelper': {
                mergeDuplicateReturnItems: function () {
                    return '';
                }
            },
            'dw/util/Calendar': Calander,
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource')
        });
        var obj = new ReturnModel(customerOrders);
        assert.isDefined(obj, 'result is defined');
    });
});
