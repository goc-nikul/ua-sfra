'use strict';

var Address = require('./Address');
var QASService = require('../../services/QASService');

var AddressGet = Address.extend({
    address: {
        origin: {},
        result: {
            address1: '',
            address2: '',
            city: '',
            state: '',
            zipCode: ''
        }
    },
    setResultAddress: function (address) {
        var self = this;
        Object.keys(this.address.result).forEach(function (key) {
            self.address.result[key] = address[key] ? address[key] : '';
        });
    },
    updateAddress: function () {
        var responseAddress = this.response.result ? this.response.result.getQAAddress() : [];
        var getAddressItem = function (n) {
            return responseAddress.getAddressLine().get(n) ? responseAddress.getAddressLine().get(n).line : null;
        };
        this.setResultAddress({
            address1: getAddressItem(0),
            address2: getAddressItem(1),
            city: getAddressItem(2),
            state: getAddressItem(3),
            zipCode: getAddressItem(4)
        });
    },
    updateResult: function () {
        this.updateAddress();
    },
    updateResultUsingCache: function (cachedData) {
        this.response.error = cachedData.error;
        this.address = cachedData.address;
    },
    clearState: function () {
        this.setResultAddress({});
        this.clearRefinedList();
        this.clearResponse();
    },
    execute: function (moniker) {
        this.clearState();

        var response = QASService.addressGetService.call({
            layout: this.getLayout(),
            moniker: moniker
        });

        this.response.error = response.ok ? false : response.errorMessage;
        this.response.result = response.object;

        this.updateResult();
        return this;
    },
    getResult: function () {
        return {
            error: this.response.error,
            storage: this.response.storage,
            address: this.address
        };
    }
});

module.exports = AddressGet;
