'use strict';

var Address = require('./Address');
var QASService = require('../../services/QASService');

var AddressSearch = Address.extend({
    allowedVerificationStatuses: [
        'Verified',
        'VerifiedStreet',
        'VerifiedPlace',
        'InteractionRequired',
        'StreetPartial',
        'PremisesPartial',
        'Multiple',
        'None',
        'Null'
    ],
    address: {
        origin: {
            address1: '',
            address2: '',
            city: '',
            state: '',
            zipCode: ''
        },
        result: {
            address1: '',
            address2: '',
            city: '',
            state: '',
            zipCode: ''
        }
    },
    verificationStatus: null,
    setOriginAddress: function (address) {
        var self = this;
        Object.keys(self.address.origin).forEach(function (key) {
            self.address.origin[key] = address[key] ? address[key] : '';
        });
    },
    setResultAddress: function (address) {
        var self = this;
        Object.keys(self.address.result).forEach(function (key) {
            self.address.result[key] = address[key] ? address[key] : self.address.origin[key];
        });
    },
    getSearchString: function () {
        var self = this;
        var values = [];
        Object.keys(this.address.origin).forEach(function (key) {
            values.push(self.address.origin[key]);
        });
        return values.join('|');
    },
    updateVerificationStatus: function () {
        this.getCountry();
        var currentCountry = this.currentCountryCode;
        var verifyLevel = this.response.result && this.response.result.getVerifyLevel();
        this.verificationStatus = verifyLevel ? verifyLevel.value() : 'None';

        if (this.allowedVerificationStatuses.indexOf(this.verificationStatus) < 0) {
            this.verificationStatus = 'Null';
        }
        if ((currentCountry === 'US' || currentCountry === 'CA') && (this.verificationStatus && this.verificationStatus === 'Verified')) {
            let verificationFlag = this.updateVerificationFlags();
            if (verificationFlag) {
                this.verificationStatus = 'InteractionRequired';
            }
        }
    },
    updateVerificationFlags: function () {
        var addressCorrectedFlag = false;
        var verificationFlagsInResponse = this.response.result && this.response.result.getVerificationFlags();
        var verificationFlagsFromExperian;
        if (verificationFlagsInResponse) {
            verificationFlagsFromExperian = {
                streetCorrected: verificationFlagsInResponse.streetCorrected,
                cityNameChanged: verificationFlagsInResponse.cityNameChanged,
                postCodeCorrected: verificationFlagsInResponse.postCodeCorrected,
                stateProvinceChanged: verificationFlagsInResponse.stateProvinceChanged
            };
        }
        var verificationFlagKeys = Object.keys(verificationFlagsFromExperian);

        this.updateAddress();
        for (var i = 0; i < verificationFlagKeys.length; i++) {
            if (verificationFlagKeys[i] === 'postCodeCorrected' && verificationFlagsFromExperian[verificationFlagKeys[i]]) {
                let updatedAddress = this.address;
                let originalZipCode = updatedAddress && updatedAddress.origin ? updatedAddress.origin.zipCode : '';
                let updatedZipCode = updatedAddress && updatedAddress.result ? updatedAddress.result.zipCode : '';
                originalZipCode = (originalZipCode.indexOf('-') !== -1) ? originalZipCode.substring(0, originalZipCode.indexOf('-')) : originalZipCode;
                updatedZipCode = (updatedZipCode.indexOf('-') !== -1) ? updatedZipCode.substring(0, updatedZipCode.indexOf('-')) : updatedZipCode;
                if (originalZipCode !== updatedZipCode) {
                    addressCorrectedFlag = true;
                }
            } else if (verificationFlagKeys[i] && verificationFlagsFromExperian[verificationFlagKeys[i]]) {
                addressCorrectedFlag = true;
            }
        }
        return addressCorrectedFlag;
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
        this.updateVerificationStatus();
        switch (this.verificationStatus) {
            case 'Verified': {
                this.updateAddress();
                break;
            }
            case 'VerifiedStreet': {
                this.updateAddress();
                break;
            }
            case 'VerifiedPlace': {
                this.updateAddress();
                break;
            }
            case 'InteractionRequired': {
                this.updateAddress();
                break;
            }
            case 'Multiple': {
                this.updateRefinedList();
                break;
            }
            case 'StreetPartial': {
                this.updateRefinedList();
                break;
            }
            case 'PremisesPartial': {
                this.updateRefinedList();
                break;
            }
            default:
                break;
        }
    },
    updateResultUsingCache: function (cachedData) {
        this.response.error = cachedData.error;
        this.verificationStatus = cachedData.verificationStatus;
        this.refinedList = cachedData.refinedList;
        this.address = cachedData.address;
    },
    clearState: function () {
        this.setOriginAddress({});
        this.setResultAddress({});
        this.clearRefinedList();
        this.clearResponse();
    },
    execute: function (address) {
        this.clearState();
        this.setOriginAddress(address);
        var response = QASService.addressSearchService.call({
            layout: this.getLayout(),
            country: this.getCountry(),
            search: this.getSearchString()
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
            verificationStatus: this.verificationStatus,
            refinedList: this.refinedList,
            address: this.address
        };
    }
});

module.exports = AddressSearch;
