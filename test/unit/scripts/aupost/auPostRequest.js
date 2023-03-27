'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

global.empty = (data) => {
    return !data;
};

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

describe('int_aupost/cartridge/scripts/auPostRequest', function() {
    var order = {
        getOrderNo : function() {
            return '12345';
        }
    }

    var returnItemsInfo = [
        {
            returnPid: '123423456789',
            returnQuantity: 10,
        },
        {
            returnPid: '123423321567456789',
            returnQuantity: 12
        },
        {
            returnPid: '1234231321567456789',
            returnQuantity: 12
        }
    ]

    let auPostRequest = proxyquire('../../../../cartridges/int_aupost/cartridge/scripts/auPostRequest.js', {
        'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
        'dw/util/Calendar': Calendar,
        'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils')
    });

    it('Testing method: getOrderIncludingShipmentRequest', () => {
        var result = auPostRequest.getOrderIncludingShipmentRequest(order, returnItemsInfo);
        assert.isNotNull(result.order_reference);
        assert.equal(result.order_reference, '12345');
        assert.isNotNull(result.shipments);
        // customer_reference_1 does not look like is actually used anymore is commented out in the code
        // assert.isDefined(result.shipments[0].customer_reference_1);
    });

    // customer_reference_1 does not look like is actually used anymore is commented out in the code
    xit('Testing method: getOrderIncludingShipmentRequest --> No Items to return', () => {
        var result = auPostRequest.getOrderIncludingShipmentRequest(order, {});
        assert.equal(result.shipments[0].customer_reference_1, '');
    });

    it('Testing method: getOrderIncludingShipmentRequest ---> customer_reference_2 undefined', () => {
        returnItemsInfo = [
            {
                returnPid: '123423456789',
                returnQuantity: 10
            }
        ]
        var result = auPostRequest.getOrderIncludingShipmentRequest(order, returnItemsInfo);
        assert.isNotNull(result.order_reference);
        assert.equal(result.order_reference, '12345');
        // customer_reference_2 does not look like is actually used anymore is commented out in the code
        // assert.isUndefined(result.shipments[0].customer_reference_2);
    });

    it('Testing method: createLabelRequest', () => {
        var result = auPostRequest.createLabelRequest('testShipmentId');
        assert.isNotNull(result.shipments[0].shipment_id);
        assert.equal(result.shipments[0].shipment_id, 'testShipmentId');
    });
});
