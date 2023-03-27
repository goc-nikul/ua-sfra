'use strict';
var Base = module.superModule;

var AddressGet = Base.extend({
    updateAddress: function () {
        var cityItem = '';
        var stateItem = '';
        var zipCodeItem = '';
        var responseAddress = this.response.result ? this.response.result.getQAAddress() : null;
        var getAddressItem = function (n) {
            return responseAddress && responseAddress.getAddressLine() && responseAddress.getAddressLine().get(n) ? responseAddress.getAddressLine().get(n).line : null;
        };
        if (responseAddress && responseAddress.getAddressLine()) {
            for (var i = 0; i < responseAddress.getAddressLine().size(); i++) {
                if (responseAddress.getAddressLine().get(i).label === 'Locality') {
                    cityItem = responseAddress.getAddressLine().get(i).line;
                } else if (responseAddress.getAddressLine().get(i).label === 'State code') {
                    stateItem = responseAddress.getAddressLine().get(i).line;
                } else if (responseAddress.getAddressLine().get(i).label === 'Postcode') {
                    zipCodeItem = responseAddress.getAddressLine().get(i).line;
                }
            }
        }
        // Mapping of fields according to https://www.edq.com/documentation/apis-r/address-validate/experian-address-validation/
        this.setResultAddress({
            address1: getAddressItem(0),
            address2: getAddressItem(1),
            city: !empty(cityItem) ? cityItem : getAddressItem(3),
            state: !empty(stateItem) ? stateItem : getAddressItem(4),
            zipCode: !empty(zipCodeItem) ? zipCodeItem : getAddressItem(5)
        });
    }
});

module.exports = AddressGet;
