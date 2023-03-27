/**
 * Provides FedEx Address functions
 */
var Logger = require('dw/system/Logger').getLogger('FedexService');

var ServiceHelper = function () {
    var self = this;

    this.createFedExAddressTypeRequest = function (svc, profile, webRef, addressFields) {
        var profileData = self.getServiceConfig(profile);
        var addressRequest = new webRef.AddressValidationRequest();
        var webAuthenticationDetail = new webRef.WebAuthenticationDetail();
        var webAuthenticationCredential = new webRef.WebAuthenticationCredential();

        webAuthenticationCredential.setKey(profileData.key);
        webAuthenticationCredential.setPassword(profileData.password);
        webAuthenticationDetail.setUserCredential(webAuthenticationCredential);
        addressRequest.setWebAuthenticationDetail(webAuthenticationDetail);

        var clientDetail = new webRef.ClientDetail();

        clientDetail.setAccountNumber(profileData.accountNumber);
        clientDetail.setMeterNumber(profileData.meterNumber);
        addressRequest.setClientDetail(clientDetail);

        var versionId = new webRef.VersionId();

        versionId.setServiceId(profileData.serviceId);
        versionId.setMajor(profileData.major);
        versionId.setIntermediate(profileData.intermediat);
        versionId.setMinor(profileData.minor);
        addressRequest.setVersion(versionId);

        var addressesToValidate = new webRef.AddressToValidate();
        var address = new webRef.Address();
        var addressArray = addressFields.address2 ? [addressFields.address1, addressFields.address2] : [addressFields.address1];

        addressArray.forEach(function (addressItem) {
            address.getStreetLines().add(addressItem);
        });
        address.setCity(addressFields.city);
        address.setStateOrProvinceCode(addressFields.stateCode);
        address.setPostalCode(addressFields.postalCode);
        address.setCountryCode(addressFields.country);

        addressesToValidate.setAddress(address);
        [addressesToValidate].forEach(function (addressToValidate) {
            addressRequest.getAddressesToValidate().add(addressToValidate);
        });

        return addressRequest;
    };

    this.parseFedExAddressResponse = function (svc, res) {
        var classification = res.getAddressResults()[0].classification.value;
        var addressTypeMapping = {
            BUSINESS: 'BUSINESS',
            MIXED: 'BUSINESS',
            RESIDENTIAL: 'RESIDENTIAL',
            UNKNOWN: 'RESIDENTIAL'
        };

        return {
            status: 'OK',
            classification: addressTypeMapping[classification]
        };
    };

    this.getMockedFedExShipmentProcessResponse = function () {
        return {
            status: 'OK',
            classification: 'RESIDENTIAL'
        };
    };

    this.getServiceConfig = function (profile) {
        var data = {};

        try {
            data = JSON.parse(profile.custom.data);
        } catch (e) {
            Logger.error('FedExHelper.ds: Can not parse JSON config from Service: ' + e.message);
        }

        return data;
    };
};

module.exports = ServiceHelper;
