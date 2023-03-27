'use strict';

var BaseAddressSearch = module.superModule;

var Locale = require('dw/util/Locale');
var Site = require('dw/system/Site').current;

var AddressSearch = BaseAddressSearch.extend({
    getCountry: function () {
        if (!this.country) {
            var countryCode = null;
            var locale = Locale.getLocale(request.locale);// eslint-disable-line
            try {
                var qasAddressValidateCountryMap = Site.getCustomPreferenceValue('qasAddressValidateCountryOverride');
                if (qasAddressValidateCountryMap) countryCode = JSON.parse(qasAddressValidateCountryMap)[locale.country];
            } catch (e) {
                countryCode = null;
                e.stack;// eslint-disable-line
            }
            countryCode = countryCode || locale.ISO3Country;// eslint-disable-line
            this.country = countryCode;
        }
        return this.country;
    },
    updateAddress: function () {
        var cityItem = '';
        var stateItem = '';
        var zipCodeItem = '';
        var responseAddress = this.response && this.response.result ? this.response.result.getQAAddress() : null;
        var getAddressItem = function (n) {
            return responseAddress && responseAddress.getAddressLine().get(n) ? responseAddress.getAddressLine().get(n).line : null;
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
        this.setResultAddress({
            address1: getAddressItem(0),
            address2: getAddressItem(1),
            city: !empty(cityItem) ? cityItem : getAddressItem(3),
            state: !empty(stateItem) ? stateItem : getAddressItem(4),
            zipCode: !empty(zipCodeItem) ? zipCodeItem : getAddressItem(5)
        });
    }
});

module.exports = AddressSearch;
