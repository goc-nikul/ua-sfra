'use strict';

var AbstractAddressTypeProvider = require('./AbstractAddressTypeProvider');
var AddressHelper = require('int_fedex/cartridge/scripts/util/AddressHelper');

var AddressTypeProvider = AbstractAddressTypeProvider.extend({
    addressType: function () {
        var resolution = AddressHelper.getAddressType(this.address);
        return resolution;
    }
});

module.exports = AddressTypeProvider;
