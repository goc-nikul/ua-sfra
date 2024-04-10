'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var sinon = require('sinon');

describe('int_narvar/cartridge/scripts/helpers/narvarHelper.js', () => {
    global.empty = (data) => {
        return !data;
    };
    var orderObj;
    var narvarHelper = proxyquire('../../../../../cartridges/int_narvar/cartridge/scripts/helpers/narvarHelper.js', {
        '*/cartridge/models/product/productImages': sinon.stub().returns({
            cartFullDesktop: [{
                url: 'url'
            }]
        }),
        'dw/web/URLUtils': {
            url: sinon.stub().returns({
                toString: sinon.stub().returns({})
            }),
            https: sinon.stub().returns({
                toString: sinon.stub().returns({})
            })
        }
    });
    var result;

    it('Testing method: getRequestObj :should return empty orderObj', () => {
        orderObj = {
            productLineItems: [{
                product: {
                    longDescription: '',
                    custom: {
                        colorgroup: ''
                    }
                },
                quantity: {
                    value: ''
                },
                basePrice: {
                    valueOrNull: ''
                },
                shipment: {
                    shippingStatus: {
                        displayValue: ''
                    }
                }
            }],
            billingAddress: {
                firstName: '',
                lastName: '',
                phone: '',
                countryCode: {
                    value: ''
                }
            },
            customer: {
                ID: ''
            }
        };
        result = narvarHelper.getRequestObj(orderObj);
        assert.equal(result.order_info.order_number, '');
    });
});
