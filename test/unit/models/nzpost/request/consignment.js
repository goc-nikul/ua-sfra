'use strict';

const {
    assert
} = require('chai');

const proxyquire = require('proxyquire').noCallThru().preserveCache();

function ReturnsUtils() {
    this.getPreferenceValue = () => '{"status": "success"}'
}

function EmptyModel() {}

describe('int_nzpost/cartridge/models/request/consignment.js', () => {

    it('Testing Model consignment without args', () => {
        const ConsignmentModel = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/models/request/consignment.js', {});
        var consignment = new ConsignmentModel();
        assert.isNotNull(consignment, 'consignment is null');
        assert.isDefined(consignment, 'consignment in not defined');
    });

    it('Testing Model consignment with args and nzConfig is null', () => {
        const ConsignmentModel = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/models/request/consignment.js', {
            '*/cartridge/config/nzConfig': {
                nzpostConfigurations: null
            }
        });
        var consignment = new ConsignmentModel('0001', 'UA@gmail.com');
        assert.isNotNull(consignment, 'consignment is null');
        assert.isDefined(consignment, 'consignment in not defined');
    });

    it('Testing Model consignment with args and nzConfig is not null', () => {
        const ConsignmentModel = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/models/request/consignment.js', {
            '*/cartridge/config/nzConfig': {
                nzpostConfigurations: '{"status": "success"}',
                carrier: 'carrier',
                orientation: 'orientation',
                paper_dimensions: 'paper_dimensions',
                parcel_details: 'parcel_details'
            },
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            '*/cartridge/models/request/receiverDetails': EmptyModel,
            '*/cartridge/models/request/deliveryAddress': EmptyModel,
            '*/cartridge/models/request/senderDetails': EmptyModel,
            '*/cartridge/models/request/pickupAddress': EmptyModel
        });
        var consignment = new ConsignmentModel('0001', 'UA@gmail.com');
        assert.isNotNull(consignment, 'consignment is null');
        assert.isDefined(consignment, 'consignment in not defined');
    });

    it('Testing Model consignment with args and nzConfig is not null and invalid JSON', () => {
        const ConsignmentModel = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/models/request/consignment.js', {
            '*/cartridge/config/nzConfig': {
                nzpostConfigurations: '{"status": "success}',
                carrier: 'carrier',
                orientation: 'orientation',
                paper_dimensions: 'paper_dimensions',
                parcel_details: 'parcel_details'
            },
            '*/cartridge/scripts/orders/ReturnsUtils': ReturnsUtils,
            '*/cartridge/models/request/receiverDetails': EmptyModel,
            '*/cartridge/models/request/deliveryAddress': EmptyModel,
            '*/cartridge/models/request/senderDetails': EmptyModel,
            '*/cartridge/models/request/pickupAddress': EmptyModel
        });
        var consignment = new ConsignmentModel('0001', 'UA@gmail.com');
        assert.isNotNull(consignment, 'consignment is null');
        assert.isDefined(consignment, 'consignment in not defined');
    });

});
